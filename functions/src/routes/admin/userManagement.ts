import { Router, Response, NextFunction } from 'express';
import * as joi from 'joi';
import { AuthenticatedRequest, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { rateLimiter } from '../../middleware/rateLimiter';
import { userManagementService } from '../../services/userManagementService';
import { CSVProcessor, processCSVForBulkImport, generateCSVTemplate } from '../../utils/csvProcessor';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
  PasswordResetRequest,
  ForceLogoutRequest,
} from '../../types/user';

const router = Router();

// Validation schemas
const createUserSchema = joi.object({
  email: joi.string().email().required(),
  firstName: joi.string().min(1).max(50).required(),
  lastName: joi.string().min(1).max(50).required(),
  role: joi.string().valid('owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'viewer').required(),
  companyId: joi.string().required(),
  phone: joi.string().optional(),
  departmentId: joi.string().optional(),
  position: joi.string().optional(),
  manager: joi.string().optional(),
  permissions: joi.object().optional(),
  sendInviteEmail: joi.boolean().optional(),
  customData: joi.object().optional()
});

const updateUserSchema = joi.object({
  firstName: joi.string().min(1).max(50).optional(),
  lastName: joi.string().min(1).max(50).optional(),
  phone: joi.string().allow('').optional(),
  departmentId: joi.string().allow('').optional(),
  position: joi.string().allow('').optional(),
  manager: joi.string().allow('').optional(),
  permissions: joi.object().optional(),
  preferences: joi.object().optional(),
  metadata: joi.object().optional()
});

const bulkCreateUsersSchema = joi.object({
  companyId: joi.string().required(),
  users: joi.array().items(createUserSchema).min(1).max(100).required(),
  sendInviteEmails: joi.boolean().default(true),
  dryRun: joi.boolean().default(false)
});

const passwordResetSchema = joi.object({
  userId: joi.string().required(),
  reason: joi.string().required(),
  sendEmail: joi.boolean().default(true),
  temporaryPassword: joi.boolean().default(false),
  expiresInHours: joi.number().min(1).max(168).default(24)
});

const forceLogoutSchema = joi.object({
  userId: joi.string().required(),
  reason: joi.string().required(),
  excludeCurrentSession: joi.boolean().default(true),
  notifyUser: joi.boolean().default(true)
});

const userListQuerySchema = joi.object({
  companyId: joi.string().optional(),
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
 * GET /api/admin/users - List all users with filtering and pagination
 */
router.get('/',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = userListQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.details
        });
        return;
      }

      const query: UserListQuery = value;
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
 * GET /api/admin/users/:id - Get user by ID
 */
router.get('/:id',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userManagementService.getUserById(id);

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
 * POST /api/admin/users - Create single user
 */
router.post('/',
  requireRole('admin'),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validateRequest(createUserSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const request: CreateUserRequest = req.body;
      const result = await userManagementService.createUser(request, req.user!.uid);

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
 * POST /api/admin/users/bulk - Bulk user creation from CSV/JSON
 */
router.post('/bulk',
  requireRole('admin'),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { csvData, jsonData, validateOnly = false } = req.body;

      if (!csvData && !jsonData) {
        res.status(400).json({
          error: 'Either csvData or jsonData is required'
        });
        return;
      }

      let users: CreateUserRequest[] = [];
      let errors: any[] = [];
      let warnings: any[] = [];
      let stats = { total: 0, valid: 0, invalid: 0, duplicates: 0 };

      if (csvData) {
        // Process CSV data
        const result = await processCSVForBulkImport(csvData, req.body.companyId, validateOnly);
        users = result.users;
        errors = result.errors;
        warnings = result.warnings;
        stats = result.stats;
      } else if (jsonData) {
        // Process JSON data
        const { error, value } = bulkCreateUsersSchema.validate(req.body);
        if (error) {
          res.status(400).json({
            error: 'Invalid bulk create request',
            details: error.details
          });
          return;
        }
        users = value.users;
        stats = { total: users.length, valid: users.length, invalid: 0, duplicates: 0 };
      }

      if (validateOnly) {
        res.json({
          success: true,
          validation: {
            stats,
            errors,
            warnings,
            preview: users.slice(0, 10)
          }
        });
        return;
      }

      // Process users if not validation only
      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const userData of users) {
        try {
          const result = await userManagementService.createUser(userData, req.user!.uid);
          results.push({
            email: userData.email,
            status: 'success',
            userId: result.userId,
            message: result.message
          });
          successCount++;
        } catch (error: any) {
          results.push({
            email: userData.email,
            status: 'failed',
            error: error.message
          });
          failureCount++;
        }
      }

      res.json({
        success: true,
        data: {
          stats: {
            ...stats,
            processed: users.length,
            successful: successCount,
            failed: failureCount
          },
          results,
          errors,
          warnings
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/users/:id - Update user details
 */
router.put('/:id',
  requireRole('admin'),
  validateRequest(updateUserSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const request: UpdateUserRequest = req.body;
      const result = await userManagementService.updateUser(id, request, req.user!.uid);

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
 * DELETE /api/admin/users/:id - Soft delete user
 */
router.delete('/:id',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await userManagementService.deleteUser(id, req.user!.uid, reason);

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
 * POST /api/admin/users/:id/suspend - Suspend user
 */
router.post('/:id/suspend',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await userManagementService.suspendUser(id, req.user!.uid, reason);

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
 * POST /api/admin/users/:id/reactivate - Reactivate user
 */
router.post('/:id/reactivate',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await userManagementService.reactivateUser(id, req.user!.uid);

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
 * POST /api/admin/users/:id/reset-password - Force password reset
 */
router.post('/:id/reset-password',
  requireRole('admin'),
  validateRequest(passwordResetSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const request: PasswordResetRequest = {
        ...req.body,
        userId: id
      };
      const result = await userManagementService.forcePasswordReset(request, req.user!.uid);

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
 * POST /api/admin/users/:id/force-logout - Force logout all sessions
 */
router.post('/:id/force-logout',
  requireRole('admin'),
  validateRequest(forceLogoutSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const request: ForceLogoutRequest = {
        ...req.body,
        userId: id
      };
      const result = await userManagementService.forceLogout(request, req.user!.uid);

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
 * GET /api/admin/users/template/csv - Download CSV template for bulk import
 */
router.get('/template/csv',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { includePermissions = false } = req.query;
      const template = generateCSVTemplate(includePermissions === 'true');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user_import_template.csv"');
      res.send(template);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users/validate-csv - Validate CSV before import
 */
router.post('/validate-csv',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { csvData, companyId } = req.body;

      if (!csvData || !companyId) {
        res.status(400).json({
          error: 'csvData and companyId are required'
        });
        return;
      }

      const result = await processCSVForBulkImport(csvData, companyId, true);

      res.json({
        success: true,
        validation: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/users/stats - Get user statistics
 */
router.get('/stats',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // This would be implemented in userManagementService
      // For now, return a placeholder
      const stats = {
        totalUsers: 0,
        activeUsers: 0,
        invitedUsers: 0,
        suspendedUsers: 0,
        usersByRole: {},
        recentSignups: 0,
        userGrowthRate: 0
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
 * POST /api/admin/users/export - Export users data
 */
router.post('/export',
  requireRole('admin'),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        companyId,
        format = 'csv',
        includeFields = ['email', 'firstName', 'lastName', 'role', 'status'],
        filters = {},
        includePersonalData = false,
        reason
      } = req.body;

      if (!reason) {
        res.status(400).json({
          error: 'Export reason is required for audit purposes'
        });
        return;
      }

      // Get users based on filters
      const userList = await userManagementService.getUserList({
        companyId,
        ...filters,
        limit: 10000 // Large limit for export
      });

      if (format === 'csv') {
        const csvData = await CSVProcessor.exportUsersToCSV(userList.users, {
          companyId,
          format: 'csv',
          includeFields,
          includePersonalData,
          reason
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users_export_${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        res.json({
          success: true,
          data: {
            users: userList.users,
            total: userList.total,
            exportedAt: new Date().toISOString(),
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

export { router as adminUserManagementRoutes };