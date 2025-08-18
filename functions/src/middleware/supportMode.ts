import { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from './auth';
import { SupportSession, SupportUser } from '../types/support';
import { AppError } from '../utils/errors';

/**
 * Extended request interface with support context
 */
interface SupportAuthenticatedRequest extends AuthenticatedRequest {
  user?: SupportUser;
  supportContext?: {
    isActingAs: boolean;
    supportSession?: SupportSession;
    originalUser?: SupportUser;
  };
}

/**
 * Middleware to handle support session context and inject support information
 */
export const supportContextMiddleware = async (
  req: SupportAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const db = admin.firestore();
    
    // Check if user has active support session
    const activeSupportSession = await getActiveSupportSession(req.user.uid);
    
    if (activeSupportSession) {
      // User is acting as another company
      const targetCompanyDoc = await db.collection('companies').doc(activeSupportSession.targetCompanyId).get();
      
      if (!targetCompanyDoc.exists) {
        throw new AppError('Target company not found for active support session', 404);
      }

      // Store original user context
      const originalUser = { ...req.user };
      
      // Modify user context to reflect acting-as state
      req.user.supportContext = {
        isActingAs: true,
        originalUserId: req.user.uid,
        supportSessionId: activeSupportSession.id,
        targetCompanyId: activeSupportSession.targetCompanyId,
        sessionStartTime: activeSupportSession.startedAt,
      };

      // Override company access for support context
      req.user.companyAccess = [activeSupportSession.targetCompanyId];
      req.user.companyId = activeSupportSession.targetCompanyId;

      // Add support context to request
      req.supportContext = {
        isActingAs: true,
        supportSession: activeSupportSession,
        originalUser,
      };

      // Add support context to response headers for frontend awareness
      res.setHeader('X-Support-Mode', 'true');
      res.setHeader('X-Support-Company', activeSupportSession.targetCompanyId);
      res.setHeader('X-Support-Session', activeSupportSession.id);
    } else {
      // User is not in support mode
      req.user.supportContext = {
        isActingAs: false,
      };

      req.supportContext = {
        isActingAs: false,
      };
    }

    next();
  } catch (error: any) {
    console.error('Support context middleware error:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
      return;
    }
    
    res.status(500).json({
      error: 'Failed to process support context',
      code: 'SUPPORT_CONTEXT_ERROR'
    });
  }
};

/**
 * Middleware to restrict access to support operations
 */
export const requireSupportPermissions = (permission: 'canActAs' | 'canModifyRecords') => {
  return (req: SupportAuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Check if user has the required support permission
    const hasPermission = req.user.supportPermissions?.[permission] || 
                         req.user.role === 'admin' || 
                         req.user.role === 'ella_recruiter';

    if (!hasPermission) {
      res.status(403).json({
        error: 'Insufficient support permissions',
        code: 'INSUFFICIENT_SUPPORT_PERMISSIONS',
        requiredPermission: permission,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to prevent support users from performing restricted actions
 */
export const restrictSupportActions = (restrictedActions: string[]) => {
  return (req: SupportAuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.supportContext?.isActingAs) {
      // Not in support mode, allow all actions
      next();
      return;
    }

    const currentAction = getActionFromRequest(req);
    
    if (restrictedActions.includes(currentAction)) {
      res.status(403).json({
        error: 'Action not allowed in support mode',
        code: 'SUPPORT_ACTION_RESTRICTED',
        action: currentAction,
        supportSessionId: req.user?.supportContext?.supportSessionId
      });
      return;
    }

    next();
  };
};

/**
 * Get active support session for a user
 */
async function getActiveSupportSession(userId: string): Promise<SupportSession | null> {
  const db = admin.firestore();
  
  const activeSessions = await db.collection('support-sessions')
    .where('ellaRecruiterId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('startedAt', 'desc')
    .limit(1)
    .get();

  if (activeSessions.empty) {
    return null;
  }

  const sessionDoc = activeSessions.docs[0];
  return {
    id: sessionDoc.id,
    ...sessionDoc.data()
  } as SupportSession;
}

/**
 * Extract action type from request for restriction checking
 */
function getActionFromRequest(req: SupportAuthenticatedRequest): string {
  const method = req.method;
  const path = req.path;

  // Define specific restricted actions
  if (path.includes('/companies/') && path.includes('/close')) return 'CLOSE_COMPANY';
  if (path.includes('/companies/') && path.includes('/delete')) return 'DELETE_COMPANY';
  if (path.includes('/users/') && path.includes('/delete')) return 'DELETE_USER';
  if (path.includes('/billing/') && method === 'POST') return 'PROCESS_PAYMENT';
  if (path.includes('/admin/')) return 'ADMIN_ACTION';

  // General action mapping
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
      return 'READ';
    default:
      return method;
  }
}

/**
 * Log support action to the active session
 */
export async function logSupportAction(
  sessionId: string,
  action: string,
  resource: string,
  method: string,
  path: string,
  resourceId?: string,
  details?: any,
  statusCode?: number
): Promise<void> {
  try {
    const db = admin.firestore();
    
    const supportAction = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action,
      resource,
      resourceId,
      method,
      path,
      details,
      statusCode,
    };

    // Add action to the support session's actions array
    await db.collection('support-sessions').doc(sessionId).update({
      actions: admin.firestore.FieldValue.arrayUnion(supportAction)
    });
  } catch (error) {
    console.error('Failed to log support action:', error);
    // Don't throw error to avoid breaking the main request flow
  }
}

export type { SupportAuthenticatedRequest };