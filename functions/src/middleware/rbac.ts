import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export type Role = 'system_admin' | 'ella_recruiter' | 'company_admin' | 'recruiter' | 'hiring_manager' | 'candidate';

export interface RBACRequest extends AuthenticatedRequest {
  userRole?: Role;
}

export const requireRole = (...allowedRoles: Role[]) => {
  return async (req: RBACRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user role from token claims
      const userRole = req.user?.role as Role || 'candidate';
      req.userRole = userRole;

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR',
      });
    }
  };
};

export const requireAnyRole = requireRole;