import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { 
  AuthenticatedRequest,
  requireRole
} from '../../middleware/auth';
import {
  requireSupportPermissions,
  SupportAuthenticatedRequest
} from '../../middleware/supportMode';
import { CompanyClosureService } from '../../services/companyClosureService';
import { DataExportService } from '../../services/dataExportService';
import {
  CompanyClosureRequest,
  CompanySuspensionRequest,
  CompanyDataExportRequest,
  ExportFormat
} from '../../types/closure';
import { AppError } from '../../utils/errors';

const router = Router();
const closureService = new CompanyClosureService();
const exportService = new DataExportService();

/**
 * POST /api/admin/companies/:id/close
 * Initiate company closure process
 */
router.post('/:id/close',
  requireRole('admin'),
  requireSupportPermissions('canModifyRecords'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;
      const request: CompanyClosureRequest = req.body;

      // Validate request body
      if (!request.reason || !request.deleteType || !request.confirmationPhrase) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: reason, deleteType, confirmationPhrase',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Validate delete type
      if (!['archive', 'permanent'].includes(request.deleteType)) {
        res.status(400).json({
          success: false,
          error: 'Delete type must be either "archive" or "permanent"',
          code: 'INVALID_DELETE_TYPE'
        });
        return;
      }

      // Validate grace period
      if (request.gracePeriodDays && (request.gracePeriodDays < 0 || request.gracePeriodDays > 365)) {
        res.status(400).json({
          success: false,
          error: 'Grace period must be between 0 and 365 days',
          code: 'INVALID_GRACE_PERIOD'
        });
        return;
      }

      const result = await closureService.initiateCompanyClosure(
        companyId,
        request,
        req.user!.uid
      );

      if (result.success) {
        // Create audit log
        await createAuditLog(req.user!.uid, 'INITIATE_COMPANY_CLOSURE', {
          companyId,
          closureId: result.closureId,
          reason: request.reason,
          deleteType: request.deleteType,
          gracePeriodDays: request.gracePeriodDays
        });

        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error: any) {
      console.error('Error initiating company closure:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to initiate company closure',
        code: 'CLOSURE_INITIATION_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/companies/:id/closure-status
 * Get company closure status
 */
router.get('/:id/closure-status',
  requireRole(['admin', 'ella_recruiter']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;

      const result = await closureService.getClosureStatus(companyId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }

    } catch (error: any) {
      console.error('Error getting closure status:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get closure status',
        code: 'GET_CLOSURE_STATUS_FAILED'
      });
    }
  }
);

/**
 * POST /api/admin/companies/:id/export
 * Export company data
 */
router.post('/:id/export',
  requireRole(['admin', 'ella_recruiter']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;
      const {
        format = 'json',
        includeUserData = true,
        includeAssessmentData = true,
        includeCandidateData = true,
        includeSystemLogs = false,
        dateRange,
        purpose = 'backup'
      } = req.body;

      // Validate format
      const validFormats: ExportFormat[] = ['json', 'csv', 'xlsx', 'sql'];
      if (!validFormats.includes(format)) {
        res.status(400).json({
          success: false,
          error: `Invalid format. Must be one of: ${validFormats.join(', ')}`,
          code: 'INVALID_FORMAT'
        });
        return;
      }

      // Validate date range if provided
      if (dateRange) {
        if (!dateRange.startDate || !dateRange.endDate) {
          res.status(400).json({
            success: false,
            error: 'Date range must include both startDate and endDate',
            code: 'INVALID_DATE_RANGE'
          });
          return;
        }

        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        
        if (startDate >= endDate) {
          res.status(400).json({
            success: false,
            error: 'Start date must be before end date',
            code: 'INVALID_DATE_RANGE'
          });
          return;
        }
      }

      const exportRequest: CompanyDataExportRequest = {
        companyId,
        format,
        includeUserData,
        includeAssessmentData,
        includeCandidateData,
        includeSystemLogs,
        dateRange: dateRange ? {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        } : undefined,
        requestedBy: req.user!.uid,
        purpose
      };

      const result = await exportService.initiateDataExport(exportRequest);

      if (result.success) {
        // Create audit log
        await createAuditLog(req.user!.uid, 'INITIATE_DATA_EXPORT', {
          companyId,
          exportId: result.exportId,
          format,
          purpose,
          includeUserData,
          includeAssessmentData,
          includeCandidateData,
          includeSystemLogs
        });

        res.json({
          success: true,
          exportId: result.exportId,
          message: 'Data export initiated successfully'
        });
      } else {
        res.status(400).json(result);
      }

    } catch (error: any) {
      console.error('Error initiating data export:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to initiate data export',
        code: 'EXPORT_INITIATION_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/companies/:id/export/:exportId/status
 * Get data export status
 */
router.get('/:id/export/:exportId/status',
  requireRole(['admin', 'ella_recruiter']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;

      const result = await exportService.getExportStatus(exportId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }

    } catch (error: any) {
      console.error('Error getting export status:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get export status',
        code: 'GET_EXPORT_STATUS_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/companies/:id/export/:exportId/download
 * Get download link for completed export
 */
router.get('/:id/export/:exportId/download',
  requireRole(['admin', 'ella_recruiter']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;

      const result = await exportService.getDownloadLink(exportId, req.user!.uid);

      if (result.success) {
        // Create audit log for download access
        await createAuditLog(req.user!.uid, 'ACCESS_DATA_EXPORT', {
          exportId,
          companyId: req.params.id
        });

        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error: any) {
      console.error('Error getting download link:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate download link',
        code: 'DOWNLOAD_LINK_FAILED'
      });
    }
  }
);

/**
 * POST /api/admin/companies/:id/suspend
 * Suspend company temporarily
 */
router.post('/:id/suspend',
  requireRole('admin'),
  requireSupportPermissions('canModifyRecords'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;
      const request: CompanySuspensionRequest = req.body;

      // Validate request body
      if (!request.reason) {
        res.status(400).json({
          success: false,
          error: 'Reason is required for suspension',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      // Validate duration if provided
      if (request.duration && (request.duration < 1 || request.duration > 365)) {
        res.status(400).json({
          success: false,
          error: 'Suspension duration must be between 1 and 365 days',
          code: 'INVALID_DURATION'
        });
        return;
      }

      const result = await closureService.suspendCompany(
        companyId,
        request,
        req.user!.uid
      );

      if (result.success) {
        // Create audit log
        await createAuditLog(req.user!.uid, 'SUSPEND_COMPANY', {
          companyId,
          suspensionId: result.suspensionId,
          reason: request.reason,
          duration: request.duration,
          restrictAccess: request.restrictAccess,
          suspendBilling: request.suspendBilling
        });

        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error: any) {
      console.error('Error suspending company:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to suspend company',
        code: 'SUSPENSION_FAILED'
      });
    }
  }
);

/**
 * POST /api/admin/companies/:id/reactivate
 * Reactivate suspended company
 */
router.post('/:id/reactivate',
  requireRole('admin'),
  requireSupportPermissions('canModifyRecords'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;

      const result = await closureService.reactivateCompany(
        companyId,
        req.user!.uid
      );

      if (result.success) {
        // Create audit log
        await createAuditLog(req.user!.uid, 'REACTIVATE_COMPANY', {
          companyId
        });

        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error: any) {
      console.error('Error reactivating company:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate company',
        code: 'REACTIVATION_FAILED'
      });
    }
  }
);

/**
 * POST /api/admin/companies/:id/cancel-closure
 * Cancel pending company closure
 */
router.post('/:id/cancel-closure',
  requireRole('admin'),
  requireSupportPermissions('canModifyRecords'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Cancellation reason is required',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      // Get current closure status
      const closureResult = await closureService.getClosureStatus(companyId);
      
      if (!closureResult.success || !closureResult.status) {
        res.status(404).json({
          success: false,
          error: 'No closure process found for this company',
          code: 'CLOSURE_NOT_FOUND'
        });
        return;
      }

      const closureStatus = closureResult.status;

      // Check if closure can be cancelled
      if (!['pending_validation', 'scheduled', 'grace_period'].includes(closureStatus.status)) {
        res.status(400).json({
          success: false,
          error: 'Closure cannot be cancelled at this stage',
          code: 'CANCELLATION_NOT_ALLOWED'
        });
        return;
      }

      const db = admin.firestore();
      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();

      // Update closure status
      const closureRef = db.collection('company-closures')
        .where('companyId', '==', companyId)
        .where('status', 'in', ['pending_validation', 'scheduled', 'grace_period'])
        .limit(1);
      
      const closureQuery = await closureRef.get();
      if (!closureQuery.empty) {
        const closureDoc = closureQuery.docs[0];
        batch.update(closureDoc.ref, {
          status: 'cancelled',
          cancelledAt: now,
          cancelledBy: req.user!.uid,
          cancellationReason: reason,
          'auditTrail': admin.firestore.FieldValue.arrayUnion({
            id: db.collection('temp').doc().id,
            timestamp: now,
            action: 'closure_cancelled',
            performedBy: req.user!.uid,
            details: { reason },
            outcome: 'success'
          })
        });
      }

      // Restore company status
      const companyRef = db.collection('companies').doc(companyId);
      batch.update(companyRef, {
        status: 'active',
        'metadata.closureInitiated': false,
        'metadata.closureId': admin.firestore.FieldValue.delete(),
        updatedAt: now
      });

      await batch.commit();

      // Create audit log
      await createAuditLog(req.user!.uid, 'CANCEL_COMPANY_CLOSURE', {
        companyId,
        reason,
        originalClosureId: closureQuery.docs[0]?.id
      });

      res.json({
        success: true,
        message: 'Company closure cancelled successfully'
      });

    } catch (error: any) {
      console.error('Error cancelling company closure:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to cancel company closure',
        code: 'CANCELLATION_FAILED'
      });
    }
  }
);

/**
 * GET /api/admin/companies/:id/lifecycle-history
 * Get complete lifecycle history for a company
 */
router.get('/:id/lifecycle-history',
  requireRole(['admin', 'ella_recruiter']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.params.id;
      const db = admin.firestore();

      const [
        closureHistory,
        suspensionHistory,
        exportHistory,
        auditLogs
      ] = await Promise.all([
        db.collection('company-closures')
          .where('companyId', '==', companyId)
          .orderBy('initiatedAt', 'desc')
          .get(),
        
        db.collection('company-suspensions')
          .where('companyId', '==', companyId)
          .orderBy('suspendedAt', 'desc')
          .get(),
        
        db.collection('data-exports')
          .where('companyId', '==', companyId)
          .orderBy('requestedAt', 'desc')
          .get(),
        
        db.collection('audit-logs')
          .where('resource', '==', 'COMPANY')
          .where('resourceId', '==', companyId)
          .where('action', 'in', [
            'INITIATE_COMPANY_CLOSURE',
            'CANCEL_COMPANY_CLOSURE',
            'SUSPEND_COMPANY',
            'REACTIVATE_COMPANY',
            'INITIATE_DATA_EXPORT'
          ])
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get()
      ]);

      const history = {
        closures: closureHistory.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        suspensions: suspensionHistory.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        exports: exportHistory.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        auditLogs: auditLogs.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };

      res.json({
        success: true,
        history
      });

    } catch (error: any) {
      console.error('Error getting lifecycle history:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get lifecycle history',
        code: 'HISTORY_FETCH_FAILED'
      });
    }
  }
);

/**
 * Helper function to create audit log entries
 */
async function createAuditLog(
  userId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  const db = admin.firestore();
  
  const auditEntry = {
    userId,
    action,
    resource: 'COMPANY',
    resourceId: details.companyId,
    timestamp: admin.firestore.Timestamp.now(),
    details,
    userAgent: 'admin-api',
    ipAddress: '127.0.0.1'
  };

  await db.collection('audit-logs').add(auditEntry);
}

export { router as companyLifecycleRoutes };