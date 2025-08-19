import { Router, Request, Response, NextFunction } from 'express';
import * as joi from 'joi';
import { validateRequest } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../utils/errors';
import { invitationService } from '../services/invitationService';

const router = Router();

// Validation schemas
const acceptInvitationSchema = joi.object({
  token: joi.string().required(),
  firstName: joi.string().min(1).max(50).required(),
  lastName: joi.string().min(1).max(50).required(),
  password: joi.string().min(8).required()
});

const rejectInvitationSchema = joi.object({
  token: joi.string().required()
});

/**
 * GET /api/invitations/:token - Get invitation details
 */
router.get('/:token',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        throw new AppError('Invitation token is required', 400, 'TOKEN_REQUIRED');
      }

      const invitation = await invitationService.getInvitationByToken(token);

      // Don't expose sensitive data
      const publicInvitation = {
        id: invitation.id,
        email: invitation.email,
        companyId: invitation.companyId,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        inviterEmail: invitation.inviterEmail,
        metadata: {
          personalMessage: invitation.metadata.personalMessage,
          position: invitation.metadata.position,
          departmentId: invitation.metadata.departmentId
        }
      };

      // Check if invitation is expired
      if (invitation.expiresAt.toMillis() < Date.now()) {
        res.status(410).json({
          success: false,
          error: 'Invitation has expired',
          code: 'INVITATION_EXPIRED',
          invitation: publicInvitation
        });
        return;
      }

      // Check if invitation is not pending
      if (invitation.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: `Invitation has already been ${invitation.status}`,
          code: `INVITATION_${invitation.status.toUpperCase()}`,
          invitation: publicInvitation
        });
        return;
      }

      res.json({
        success: true,
        invitation: publicInvitation
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/invitations/accept - Accept invitation
 */
router.post('/accept',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  validateRequest(acceptInvitationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, firstName, lastName, password } = req.body;

      const result = await invitationService.acceptInvitation(token, {
        firstName,
        lastName,
        password
      });

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/invitations/reject - Reject invitation
 */
router.post('/reject',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  validateRequest(rejectInvitationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      const result = await invitationService.rejectInvitation(token);

      res.json({
        success: true,
        message: 'Invitation rejected',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/invitations/validate - Validate invitation token
 */
router.post('/validate',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Token is required', 400, 'TOKEN_REQUIRED');
      }

      try {
        const invitation = await invitationService.getInvitationByToken(token);
        
        const isValid = invitation.status === 'pending' && 
                       invitation.expiresAt.toMillis() > Date.now();

        res.json({
          success: true,
          valid: isValid,
          status: invitation.status,
          expired: invitation.expiresAt.toMillis() < Date.now(),
          invitation: {
            email: invitation.email,
            role: invitation.role,
            companyId: invitation.companyId,
            expiresAt: invitation.expiresAt
          }
        });
      } catch (error: any) {
        if (error.code === 'INVITATION_NOT_FOUND') {
          res.json({
            success: true,
            valid: false,
            error: 'Invalid token'
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

export { router as invitationRoutes };