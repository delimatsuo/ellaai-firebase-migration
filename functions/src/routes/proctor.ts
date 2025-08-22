/**
 * Proctoring API Routes
 * Handles proctoring sessions for assessments using Quadradan service
 */

import { Router, Request, Response } from 'express';
import * as joi from 'joi';
import { proctoringService } from '../services/proctorService';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createSessionSchema = joi.object({
  assessmentId: joi.string().required(),
  candidateId: joi.string().required(), 
  companyId: joi.string().required(),
});

const sessionParamSchema = joi.object({
  sessionId: joi.string().required(),
});

const tokenRequestSchema = joi.object({
  sessionId: joi.string().required(),
});

const checkAssessmentSchema = joi.object({
  assessmentId: joi.string().required(),
});

// All proctoring routes require authentication
router.use(authMiddleware);

/**
 * Create a new proctoring session
 * POST /api/proctor/sessions
 */
router.post('/sessions', 
  requireRole(['system_admin', 'ella_recruiter', 'company_admin', 'recruiter', 'hiring_manager']),
  validateRequest(createSessionSchema, 'body'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assessmentId, candidateId, companyId } = req.body;

      logger.info('Creating proctoring session', {
        assessmentId,
        candidateId,
        companyId,
        userId: req.user?.uid
      });

      const session = await proctoringService.createSession({
        assessmentId,
        candidateId,
        companyId,
      });

      res.json({
        success: true,
        session,
      });
    } catch (error: any) {
      logger.error('Failed to create proctoring session', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to create proctoring session',
        details: error.message,
      });
    }
  }
);

/**
 * Get proctoring session status
 * GET /api/proctor/sessions/:sessionId
 */
router.get('/sessions/:sessionId',
  requireRole(['system_admin', 'ella_recruiter', 'company_admin', 'recruiter', 'hiring_manager']),
  validateRequest(sessionParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;

      logger.info('Getting proctoring session status', { sessionId });

      const session = await proctoringService.getSession({
        sessionId,
      });

      res.json({
        success: true,
        session,
      });
    } catch (error: any) {
      logger.error('Failed to get session status', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to get session status',
        details: error.message,
      });
    }
  }
);

/**
 * Complete proctoring session
 * POST /api/proctor/sessions/:sessionId/complete
 */
router.post('/sessions/:sessionId/complete',
  requireRole(['system_admin', 'ella_recruiter', 'company_admin', 'recruiter', 'hiring_manager', 'candidate']),
  validateRequest(sessionParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;

      logger.info('Completing proctoring session', { sessionId });

      // In a real implementation, you would call proctoringService.completeSession
      // For now, we'll just return success
      res.json({
        success: true,
        message: 'Session completed',
      });
    } catch (error: any) {
      logger.error('Failed to complete session', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to complete session',
        details: error.message,
      });
    }
  }
);

/**
 * Issue proctoring token
 * POST /api/proctor/tokens
 */
router.post('/tokens',
  requireRole(['system_admin', 'ella_recruiter', 'company_admin', 'recruiter', 'hiring_manager', 'candidate']),
  validateRequest(tokenRequestSchema, 'body'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.body;

      logger.info('Issuing proctoring token', { sessionId });

      const token = await proctoringService.issueToken({
        sessionId,
      });

      res.json({
        success: true,
        token,
      });
    } catch (error: any) {
      logger.error('Failed to issue token', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to issue token',
        details: error.message,
      });
    }
  }
);

/**
 * Check if proctoring is required for assessment
 * GET /api/proctor/check/:assessmentId
 */
router.get('/check/:assessmentId',
  validateRequest(checkAssessmentSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { assessmentId } = req.params;

      logger.info('Checking proctoring requirements', { assessmentId });

      // Check assessment settings to determine if proctoring is required
      // This would typically query the assessment from Firestore
      // For now, we'll return a default response
      const proctoringRequired = true; // This should be determined from assessment settings

      res.json({
        success: true,
        proctoringRequired,
        assessmentId,
      });
    } catch (error: any) {
      logger.error('Failed to check proctoring requirements', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to check proctoring requirements',
        details: error.message,
      });
    }
  }
);

/**
 * Webhook endpoint for proctoring status updates
 * POST /api/proctor/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    logger.info('Received proctoring webhook', { body: req.body });

    // Verify webhook signature and process the update
    // This would typically update the session status in Firestore
    
    res.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error: any) {
    logger.error('Failed to process webhook', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message,
    });
  }
});

export { router as proctorRoutes };