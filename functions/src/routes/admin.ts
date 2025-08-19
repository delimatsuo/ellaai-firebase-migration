import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { 
  SupportAuthenticatedRequest, 
  requireSupportPermissions 
} from '../middleware/supportMode';
import { 
  AdminAction, 
  AdminModifyRecordRequest, 
  AdminActionResponse,
  EnhancedAuditLogEntry
} from '../types/support';
import { AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { companyWizardRoutes } from './admin/companyWizard';
import { companyLifecycleRoutes } from './admin/companyLifecycle';
import { adminUserManagementRoutes } from './admin/userManagement';

const router = Router();
const db = admin.firestore();

// Mount company wizard routes
router.use('/companies/wizard', companyWizardRoutes);

// Mount company lifecycle management routes
router.use('/companies', companyLifecycleRoutes);

// Mount user management routes
router.use('/users', adminUserManagementRoutes);

/**
 * POST /api/admin/modify-record
 * System admin database modifications with audit trails
 */
router.post('/modify-record',
  requireRole('admin'),
  requireSupportPermissions('canModifyRecords'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        collection,
        documentId,
        action,
        data,
        reason,
        validateOnly = false
      }: AdminModifyRecordRequest = req.body;

      if (!collection || !documentId || !action || !reason) {
        res.status(400).json({
          error: 'Collection, document ID, action, and reason are required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      if (!['create', 'update', 'delete'].includes(action)) {
        res.status(400).json({
          error: 'Action must be one of: create, update, delete',
          code: 'INVALID_ACTION'
        });
        return;
      }

      // Validate collection access
      const allowedCollections = [
        'users', 'companies', 'assessments', 'assessment-attempts',
        'questions', 'skills', 'positions', 'support-sessions'
      ];

      if (!allowedCollections.includes(collection)) {
        res.status(403).json({
          error: 'Access to this collection is not allowed',
          code: 'COLLECTION_ACCESS_DENIED',
          collection
        });
        return;
      }

      // Prevent modification of critical system collections
      const restrictedCollections = ['audit-logs', 'admin-actions'];
      if (restrictedCollections.includes(collection)) {
        res.status(403).json({
          error: 'Modification of system collections is not allowed',
          code: 'SYSTEM_COLLECTION_PROTECTED',
          collection
        });
        return;
      }

      const docRef = db.collection(collection).doc(documentId);
      const docSnapshot = await docRef.get();

      let oldData: any = null;
      let newData: any = null;
      let affectedDocuments = 0;

      // Prepare the operation
      if (action === 'create') {
        if (docSnapshot.exists) {
          res.status(409).json({
            error: 'Document already exists',
            code: 'DOCUMENT_EXISTS'
          });
          return;
        }

        if (!data) {
          res.status(400).json({
            error: 'Data is required for create operation',
            code: 'DATA_REQUIRED'
          });
          return;
        }

        newData = {
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: req.user!.uid,
          createdByAdmin: true
        };
        affectedDocuments = 1;

      } else if (action === 'update') {
        if (!docSnapshot.exists) {
          res.status(404).json({
            error: 'Document not found',
            code: 'DOCUMENT_NOT_FOUND'
          });
          return;
        }

        if (!data) {
          res.status(400).json({
            error: 'Data is required for update operation',
            code: 'DATA_REQUIRED'
          });
          return;
        }

        oldData = docSnapshot.data();
        newData = {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: req.user!.uid,
          updatedByAdmin: true
        };
        affectedDocuments = 1;

      } else if (action === 'delete') {
        if (!docSnapshot.exists) {
          res.status(404).json({
            error: 'Document not found',
            code: 'DOCUMENT_NOT_FOUND'
          });
          return;
        }

        oldData = docSnapshot.data();
        affectedDocuments = 1;
      }

      // If validate only, return the planned changes without executing
      if (validateOnly) {
        const response: AdminActionResponse = {
          success: true,
          affectedDocuments,
          changes: {
            before: oldData,
            after: newData
          },
          message: `Validation successful for ${action} operation on ${collection}/${documentId}`
        };

        res.json(response);
        return;
      }

      // Create admin action record first
      const adminAction: Omit<AdminAction, 'id'> = {
        adminUserId: req.user!.uid,
        adminEmail: req.user!.email || '',
        action,
        collection,
        documentId,
        oldData,
        newData,
        timestamp: admin.firestore.Timestamp.now(),
        reason,
        metadata: {
          affectedCount: affectedDocuments,
          batchOperation: false,
          originalRequest: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
          }
        }
      };

      const adminActionRef = await db.collection('admin-actions').add(adminAction);

      // Execute the operation
      try {
        if (action === 'create') {
          await docRef.set(newData);
        } else if (action === 'update') {
          await docRef.update(newData);
        } else if (action === 'delete') {
          await docRef.delete();
        }

        const response: AdminActionResponse = {
          success: true,
          actionId: adminActionRef.id,
          affectedDocuments,
          changes: {
            before: oldData,
            after: action === 'delete' ? null : newData
          },
          message: `Successfully ${action}d document ${collection}/${documentId}`
        };

        res.json(response);

      } catch (operationError: any) {
        // If the operation fails, mark the admin action as failed
        await adminActionRef.update({
          'metadata.failed': true,
          'metadata.error': operationError.message
        });

        throw operationError;
      }

    } catch (error: any) {
      console.error('Error in admin modify record:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to modify record',
        code: 'ADMIN_MODIFY_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/audit-logs
 * View all audit logs with filtering
 */
router.get('/audit-logs',
  requireRole('admin'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        startDate,
        endDate,
        userId,
        action,
        resource,
        companyId,
        supportSessionId,
        limit = 100,
        offset = 0
      } = req.query as any;

      let query = db.collection('audit-logs').orderBy('timestamp', 'desc');

      // Apply filters
      if (startDate) {
        const start = admin.firestore.Timestamp.fromDate(new Date(startDate));
        query = query.where('timestamp', '>=', start);
      }

      if (endDate) {
        const end = admin.firestore.Timestamp.fromDate(new Date(endDate));
        query = query.where('timestamp', '<=', end);
      }

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      if (action) {
        query = query.where('action', '==', action.toUpperCase());
      }

      if (resource) {
        query = query.where('resource', '==', resource.toUpperCase());
      }

      // Apply pagination
      const paginatedQuery = query.limit(Number(limit)).offset(Number(offset));
      const auditLogsSnapshot = await paginatedQuery.get();

      const auditLogs = await Promise.all(
        auditLogsSnapshot.docs.map(async (doc) => {
          const logData = doc.data();
          const enhancedLog: EnhancedAuditLogEntry = {
            id: doc.id,
            ...logData,
            supportContext: await getSupportContext(logData),
            adminContext: await getAdminContext(logData)
          } as EnhancedAuditLogEntry;

          return enhancedLog;
        })
      );

      // Filter by support session if specified
      let filteredLogs = auditLogs;
      if (supportSessionId) {
        filteredLogs = auditLogs.filter(log => 
          log.supportContext?.supportSessionId === supportSessionId
        );
      }

      // Filter by company if specified
      if (companyId) {
        filteredLogs = filteredLogs.filter(log => 
          log.supportContext?.targetCompanyId === companyId ||
          log.details?.companyId === companyId
        );
      }

      // Get total count for pagination
      const totalQuery = await db.collection('audit-logs').get();

      res.json({
        logs: filteredLogs,
        pagination: {
          total: totalQuery.size,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: totalQuery.size > Number(offset) + filteredLogs.length
        }
      });

    } catch (error: any) {
      console.error('Error fetching audit logs:', error);

      res.status(500).json({
        error: 'Failed to fetch audit logs',
        code: 'FETCH_AUDIT_LOGS_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/actions
 * View admin action history
 */
router.get('/actions',
  requireRole('admin'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { limit = 50, offset = 0, adminUserId } = req.query;

      let query = db.collection('admin-actions')
        .orderBy('timestamp', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      if (adminUserId) {
        query = query.where('adminUserId', '==', adminUserId);
      }

      const actionsSnapshot = await query.get();

      const actions = actionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count
      const totalQuery = await db.collection('admin-actions').get();

      res.json({
        actions,
        pagination: {
          total: totalQuery.size,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: totalQuery.size > Number(offset) + actions.length
        }
      });

    } catch (error: any) {
      console.error('Error fetching admin actions:', error);

      res.status(500).json({
        error: 'Failed to fetch admin actions',
        code: 'FETCH_ADMIN_ACTIONS_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/stats
 * Get administrative statistics
 */
router.get('/stats',
  requireRole('admin'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        activeSupportSessions,
        recentAdminActions,
        recentAuditLogs,
        totalUsers,
        totalCompanies
      ] = await Promise.all([
        db.collection('support-sessions').where('status', '==', 'active').get(),
        db.collection('admin-actions').where('timestamp', '>=', admin.firestore.Timestamp.fromDate(last24Hours)).get(),
        db.collection('audit-logs').where('timestamp', '>=', admin.firestore.Timestamp.fromDate(last7Days)).get(),
        db.collection('users').get(),
        db.collection('companies').get()
      ]);

      res.json({
        activeSupportSessions: activeSupportSessions.size,
        adminActionsLast24h: recentAdminActions.size,
        auditLogsLast7Days: recentAuditLogs.size,
        totalUsers: totalUsers.size,
        totalCompanies: totalCompanies.size,
        generatedAt: admin.firestore.Timestamp.now()
      });

    } catch (error: any) {
      console.error('Error fetching admin stats:', error);

      res.status(500).json({
        error: 'Failed to fetch admin statistics',
        code: 'FETCH_ADMIN_STATS_FAILED'
      });
    }
  }
);

/**
 * Helper function to get support context for audit logs
 */
async function getSupportContext(logData: any): Promise<any> {
  if (!logData.userId) return { isSupportAction: false };

  try {
    // Check if this log entry was made during a support session
    const supportSessionQuery = await db.collection('support-sessions')
      .where('ellaRecruiterId', '==', logData.userId)
      .where('status', '==', 'active')
      .where('startedAt', '<=', logData.timestamp)
      .orderBy('startedAt', 'desc')
      .limit(1)
      .get();

    if (supportSessionQuery.empty) {
      return { isSupportAction: false };
    }

    const session = supportSessionQuery.docs[0];
    const sessionData = session.data();

    return {
      isSupportAction: true,
      supportSessionId: session.id,
      ellaRecruiterId: sessionData.ellaRecruiterId,
      targetCompanyId: sessionData.targetCompanyId
    };
  } catch (error) {
    console.error('Error getting support context:', error);
    return { isSupportAction: false };
  }
}

/**
 * Helper function to get admin context for audit logs
 */
async function getAdminContext(logData: any): Promise<any> {
  if (!logData.path?.includes('/admin/')) {
    return { isAdminAction: false };
  }

  try {
    // Check if this corresponds to an admin action
    const adminActionQuery = await db.collection('admin-actions')
      .where('adminUserId', '==', logData.userId)
      .where('timestamp', '>=', logData.timestamp)
      .where('timestamp', '<=', admin.firestore.Timestamp.fromMillis(logData.timestamp.toMillis() + 5000)) // 5 second window
      .limit(1)
      .get();

    if (adminActionQuery.empty) {
      return { isAdminAction: true };
    }

    const adminAction = adminActionQuery.docs[0];
    const actionData = adminAction.data();

    return {
      isAdminAction: true,
      adminActionId: adminAction.id,
      reason: actionData.reason
    };
  } catch (error) {
    console.error('Error getting admin context:', error);
    return { isAdminAction: false };
  }
}

export { router as adminRoutes };