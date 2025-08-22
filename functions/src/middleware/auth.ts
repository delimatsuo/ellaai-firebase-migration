import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AppError } from '../utils/errors';

interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken & {
    role?: string;
    companyId?: string;
    companyAccess?: string[];
    supportPermissions?: {
      canActAs: boolean;
      canModifyRecords: boolean;
      allowedCompanies?: string[];
      restrictions?: string[];
    };
    supportContext?: {
      isActingAs: boolean;
      originalUserId?: string;
      supportSessionId?: string;
      targetCompanyId?: string;
      sessionStartTime?: admin.firestore.Timestamp;
    };
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authorization token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      throw new AppError('Invalid authorization header format', 401);
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token, true);

    // The user's role and other authorization data are stored as custom claims in the token.
    // This is the single source of truth for authorization, consistent with Storage security rules.
    // This avoids an extra Firestore read on every authenticated request.
    const role = decodedToken.role || 'candidate';
    
    // Attach user information to request
    req.user = {
      ...decodedToken,
      role: role,
      companyId: decodedToken.companyId,
      companyAccess: decodedToken.companyAccess || [],
      supportPermissions: { // Re-create permissions based on the role from the token
        canActAs: role === 'admin' || role === 'ella_recruiter',
        canModifyRecords: role === 'admin',
        allowedCompanies: role === 'admin' ? undefined : decodedToken.allowedSupportCompanies,
        restrictions: decodedToken.supportRestrictions || []
      },
      supportContext: {
        isActingAs: false, // Will be set by supportContextMiddleware
      }
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    if (error.code === 'auth/id-token-revoked') {
      res.status(401).json({
        error: 'Token revoked',
        code: 'TOKEN_REVOKED'
      });
      return;
    }
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
      return;
    }
    
    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

export const requireRole = (requiredRoles: string | string[]) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }
    
    if (!roles.includes(req.user.role || '')) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
      return;
    }
    
    next();
  };
};

export const requireCompanyAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }
  
  const companyId = req.params.companyId || req.query.companyId as string;
  
  if (!companyId) {
    res.status(400).json({
      error: 'Company ID required',
      code: 'COMPANY_ID_REQUIRED'
    });
    return;
  }
  
  // Admin users have access to all companies
  if (req.user.role === 'admin') {
    next();
    return;
  }
  
  // Support mode: If user is acting as another company, check support context
  if (req.user.supportContext?.isActingAs && req.user.supportContext.targetCompanyId === companyId) {
    next();
    return;
  }
  
  // Check if user has access to this company
  if (req.user.companyId === companyId || 
      req.user.companyAccess?.includes(companyId)) {
    next();
    return;
  }
  
  res.status(403).json({
    error: 'Access to company denied',
    code: 'COMPANY_ACCESS_DENIED',
    companyId
  });
};

export type { AuthenticatedRequest };