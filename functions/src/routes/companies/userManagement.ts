import { Router, Response, NextFunction } from 'express';
import * as joi from 'joi';
import { AuthenticatedRequest, requireRole, requireCompanyAccess } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { rateLimiter } from '../../middleware/rateLimiter';
import { AppError } from '../../utils/errors';
import { userManagementService } from '../../services/userManagementService';
import { invitationService } from '../../services/invitationService';
import { processCSVForBulkImport, generateCSVTemplate } from '../../utils/csvProcessor';
import {
  InviteUserRequest,
  UserListQuery,
} from '../../types/user';

const router = Router({ mergeParams: true }); // mergeParams to access :companyId from parent route

// Validation schemas
const inviteUserSchema = joi.object({
  email: joi.string().email().required(),
  role: joi.string().valid('owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'viewer').required(),
  permissions: joi.object().optional(),
  personalMessage: joi.string().max(500).optional(),
  departmentId: joi.string().optional(),
  position: joi.string().optional(),
  manager: joi.string().optional(),
  expiresInDays: joi.number().min(1).max(30).default(7)
});

const bulkInviteSchema = joi.object({
  invitations: joi.array().items(inviteUserSchema).min(1).max(50).required(),
  sendEmails: joi.boolean().default(true)
});

const updateRoleSchema = joi.object({
  role: joi.string().valid('owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'viewer').required(),
  permissions: joi.object().optional()
});

const userQuerySchema = joi.object({
  role: joi.string().valid('owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'viewer').optional(),
  status: joi.string().valid('active', 'invited', 'suspended', 'deleted', 'pending_verification').optional(),
  departmentId: joi.string().optional(),
  search: joi.string().optional(),
  sortBy: joi.string().default('createdAt'),
  sortOrder: joi.string().valid('asc', 'desc').default('desc'),
  limit: joi.number().min(1).max(100).default(50),
  offset: joi.number().min(0).default(0)
});

/**
 * GET /api/companies/:companyId/users - List company users
 */
router.get('/',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { error, value } = userQuerySchema.validate(req.query);
      
      if (error) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.details
        });
        return;
      }

      const query: UserListQuery = {
        ...value,
        companyId
      };

      const result = await userManagementService.getUserList(query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/companies/:companyId/users/:userId - Get specific company user
 */
router.get('/:userId',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin', 'recruiter']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const user = await userManagementService.getUserById(userId);

      // Verify user belongs to this company
      if (!user.companyAccess.includes(req.params.companyId)) {
        throw new AppError('User not found in this company', 404, 'USER_NOT_IN_COMPANY');
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/invite - Invite user to company
 */
router.post('/invite',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  validateRequest(inviteUserSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const request: InviteUserRequest = req.body;
      
      const result = await invitationService.sendInvitation(
        request,
        companyId,
        req.user!.uid,
        req.user!.email || ''
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/invite/bulk - Bulk invite users
 */
router.post('/invite/bulk',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  validateRequest(bulkInviteSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { invitations } = req.body;

      const result = await invitationService.bulkSendInvitations(
        invitations,
        companyId,
        req.user!.uid,
        req.user!.email || ''
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/invite/csv - Bulk invite from CSV
 */
router.post('/invite/csv',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { csvData, validateOnly = false } = req.body;

      if (!csvData) {
        res.status(400).json({
          error: 'csvData is required'
        });
        return;
      }

      const result = await processCSVForBulkImport(csvData, companyId, validateOnly);

      if (validateOnly) {
        res.json({
          success: true,
          validation: result
        });
        return;
      }

      // Convert CSV users to invitation requests
      const invitations: InviteUserRequest[] = result.users.map(user => ({
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        departmentId: user.departmentId,
        position: user.position,
        manager: user.manager,
        expiresInDays: 7
      }));

      const bulkResult = await invitationService.bulkSendInvitations(
        invitations,
        companyId,
        req.user!.uid,
        req.user!.email || ''
      );

      res.json({
        success: true,
        data: {
          bulkOperation: bulkResult,
          validation: result
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/companies/:companyId/users/:userId/role - Change user role
 */
router.put('/:userId/role',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  validateRequest(updateRoleSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, userId } = req.params;
      const { role } = req.body;

      // Check if user is trying to change their own role to a lower level
      if (userId === req.user!.uid) {
        const currentUser = await userManagementService.getUserById(req.user!.uid);
        const roleHierarchy = ['viewer', 'interviewer', 'hiring_manager', 'recruiter', 'admin', 'owner'];
        const currentRoleLevel = roleHierarchy.indexOf(currentUser.companyRole);
        const newRoleLevel = roleHierarchy.indexOf(role);
        
        if (newRoleLevel < currentRoleLevel) {
          throw new AppError('Cannot downgrade your own role', 403, 'CANNOT_DOWNGRADE_OWN_ROLE');
        }
      }

      const result = await userManagementService.updateUserRole(
        userId,
        companyId,
        role,
        req.user!.uid
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/companies/:companyId/users/:userId - Update user details
 */
router.put('/:userId',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      
      // Validate update data
      const updateSchema = joi.object({
        firstName: joi.string().min(1).max(50).optional(),
        lastName: joi.string().min(1).max(50).optional(),
        phone: joi.string().allow('').optional(),
        departmentId: joi.string().allow('').optional(),
        position: joi.string().allow('').optional(),
        manager: joi.string().allow('').optional(),
        permissions: joi.object().optional()
      });

      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Invalid update data',
          details: error.details
        });
        return;
      }

      const result = await userManagementService.updateUser(userId, value, req.user!.uid);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/companies/:companyId/users/:userId - Remove user from company
 */
router.delete('/:userId',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, userId } = req.params;

      // Prevent users from removing themselves
      if (userId === req.user!.uid) {
        throw new AppError('Cannot remove yourself from the company', 403, 'CANNOT_REMOVE_SELF');
      }

      const result = await userManagementService.removeUserFromCompany(
        userId,
        companyId,
        req.user!.uid
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/:userId/suspend - Suspend user
 */
router.post('/:userId/suspend',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (userId === req.user!.uid) {
        throw new AppError('Cannot suspend yourself', 403, 'CANNOT_SUSPEND_SELF');
      }

      const result = await userManagementService.suspendUser(userId, req.user!.uid, reason);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/:userId/reactivate - Reactivate user
 */
router.post('/:userId/reactivate',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await userManagementService.reactivateUser(userId, req.user!.uid);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/companies/:companyId/users/invitations - Get company invitations
 */
router.get('/invitations',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      const result = await invitationService.getCompanyInvitations(
        companyId,
        status as any,
        Number(limit),
        Number(offset)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/invitations/:invitationId/cancel - Cancel invitation
 */
router.post('/invitations/:invitationId/cancel',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { invitationId } = req.params;
      const result = await invitationService.cancelInvitation(invitationId, req.user!.uid);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/invitations/:invitationId/resend - Resend invitation
 */
router.post('/invitations/:invitationId/resend',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { invitationId } = req.params;
      const result = await invitationService.resendInvitation(invitationId, req.user!.uid);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/companies/:companyId/users/template/csv - Download CSV template
 */
router.get('/template/csv',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { includePermissions = false } = req.query;
      const template = generateCSVTemplate(includePermissions === 'true');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user_invite_template.csv"');
      res.send(template);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/companies/:companyId/users/stats - Get company user statistics
 */
router.get('/stats',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin', 'recruiter']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      
      // Get user list for stats calculation
      const userList = await userManagementService.getUserList({
        companyId,
        limit: 1000 // Get all users for stats
      });

      const stats = {
        totalUsers: userList.total,
        activeUsers: userList.users.filter(u => u.status === 'active').length,
        invitedUsers: userList.users.filter(u => u.status === 'invited').length,
        suspendedUsers: userList.users.filter(u => u.status === 'suspended').length,
        usersByRole: userList.users.reduce((acc, user) => {
          acc[user.companyRole] = (acc[user.companyRole] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        usersByDepartment: userList.users.reduce((acc, user) => {
          const dept = user.departmentId || 'Unassigned';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentJoins: userList.users.filter(u => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return u.joinedCompanyAt && u.joinedCompanyAt.toDate() > thirtyDaysAgo;
        }).length
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/companies/:companyId/users/export - Export company users
 */
router.post('/export',
  requireCompanyAccess,
  requireRole(['admin', 'owner', 'company_admin']),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const {
        format = 'csv',
        includeFields = ['email', 'firstName', 'lastName', 'role', 'status', 'departmentId', 'position'],
        filters = {},
        includePersonalData = true,
        reason
      } = req.body;

      if (!reason) {
        res.status(400).json({
          error: 'Export reason is required for audit purposes'
        });
        return;
      }

      // Get users for export
      const userList = await userManagementService.getUserList({
        companyId,
        ...filters,
        limit: 10000 // Large limit for export
      });

      if (format === 'csv') {
        const { CSVProcessor } = await import('../../utils/csvProcessor');
        const csvData = await CSVProcessor.exportUsersToCSV(userList.users, {
          companyId,
          format: 'csv',
          includeFields,
          includePersonalData,
          reason
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="company_users_${companyId}_${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        res.json({
          success: true,
          data: {
            users: userList.users,
            total: userList.total,
            companyId,
            exportedAt: new Date().toISOString(),
            exportedBy: req.user!.uid,
            includePersonalData,
            reason
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export { router as companyUserManagementRoutes };