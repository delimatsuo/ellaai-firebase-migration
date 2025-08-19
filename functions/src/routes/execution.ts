/**
 * Code Execution API Routes
 * Handles code execution requests for assessments
 */

import { Router, Response } from 'express';
import * as joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { codeExecutionService } from '../services/codeExecutionService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const executeCodeSchema = joi.object({
  code: joi.string().required().max(50000), // 50KB max
  language: joi.string().valid('javascript', 'python', 'java', 'go').required(),
  testCases: joi.array().items(
    joi.object({
      id: joi.string().required(),
      name: joi.string().required(),
      input: joi.any().required(),
      expectedOutput: joi.any().required(),
      isVisible: joi.boolean().required(),
      weight: joi.number().min(0).max(100).required(),
      timeLimit: joi.number().min(1000).max(30000).optional(),
    })
  ).min(1).max(20).required(),
  timeLimit: joi.number().min(1000).max(60000).optional(),
  memoryLimit: joi.number().min(64).max(1024).optional(),
});

const attemptParamSchema = joi.object({
  attemptId: joi.string().required(),
});

// All routes require authentication
router.use(requireRole('candidate', 'system_admin', 'ella_recruiter', 'company_admin', 'recruiter', 'hiring_manager'));

/**
 * Execute code against test cases
 * POST /api/execution/run
 */
router.post('/run',
  validateRequest(executeCodeSchema, 'body'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code, language, testCases, timeLimit, memoryLimit } = req.body;

      logger.info('Code execution requested', {
        userId: req.user?.uid,
        language,
        testCaseCount: testCases.length,
        codeLength: code.length,
      });

      // Rate limiting check - prevent abuse
      const userExecutions = await checkExecutionRateLimit(req.user!.uid);
      if (userExecutions >= 50) { // 50 executions per hour
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please wait before running more code.',
        });
      }

      const result = await codeExecutionService.executeCode({
        code,
        language,
        testCases,
        timeLimit,
        memoryLimit,
      });

      // Track execution for rate limiting
      await trackExecution(req.user!.uid);

      return res.json({
        success: true,
        result,
      });

    } catch (error: any) {
      logger.error('Code execution failed', {
        error: error.message,
        userId: req.user?.uid,
      });

      return res.status(500).json({
        success: false,
        error: 'Code execution failed',
        details: error.message,
      });
    }
  }
);

/**
 * Save assessment attempt progress
 * POST /api/execution/attempts/:attemptId/save
 */
router.post('/attempts/:attemptId/save',
  validateRequest(attemptParamSchema, 'params'),
  validateRequest(joi.object({
    code: joi.string().required().max(50000),
    language: joi.string().valid('javascript', 'python', 'java', 'go').required(),
  }), 'body'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { attemptId } = req.params;
      const { code, language } = req.body;

      logger.info('Saving assessment attempt', {
        attemptId,
        userId: req.user?.uid,
        codeLength: code.length,
      });

      // Save to database
      const db = req.app.locals.db || require('firebase-admin').firestore();
      await db.collection('assessment-attempts').doc(attemptId).update({
        code,
        language,
        lastSaved: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        message: 'Progress saved successfully',
      });

    } catch (error: any) {
      logger.error('Failed to save assessment attempt', {
        error: error.message,
        attemptId: req.params.attemptId,
        userId: req.user?.uid,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to save progress',
        details: error.message,
      });
    }
  }
);

/**
 * Submit assessment attempt
 * POST /api/execution/attempts/:attemptId/submit
 */
router.post('/attempts/:attemptId/submit',
  validateRequest(attemptParamSchema, 'params'),
  validateRequest(joi.object({
    code: joi.string().required().max(50000),
    language: joi.string().valid('javascript', 'python', 'java', 'go').required(),
    executionResult: joi.object({
      success: joi.boolean().required(),
      testResults: joi.array().items(joi.object({
        testCaseId: joi.string().required(),
        passed: joi.boolean().required(),
        actualOutput: joi.any(),
        executionTime: joi.number().required(),
        memoryUsed: joi.number().optional(),
        error: joi.string().optional(),
      })).required(),
      totalPassed: joi.number().required(),
      totalTests: joi.number().required(),
      score: joi.number().required(),
      executionTime: joi.number().required(),
      error: joi.string().optional(),
      consoleOutput: joi.string().optional(),
      compilationError: joi.string().optional(),
    }).optional(),
  }), 'body'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { attemptId } = req.params;
      const { code, language, executionResult } = req.body;

      logger.info('Submitting assessment attempt', {
        attemptId,
        userId: req.user?.uid,
        hasResult: !!executionResult,
      });

      const db = req.app.locals.db || require('firebase-admin').firestore();
      const now = new Date();

      // Update attempt with submission
      await db.collection('assessment-attempts').doc(attemptId).update({
        code,
        language,
        executionResult,
        submittedAt: now,
        status: 'submitted',
        updatedAt: now,
      });

      // Store execution result for analysis if provided
      if (executionResult) {
        await codeExecutionService.storeExecutionResult(attemptId, executionResult);
      }

      // TODO: Run against hidden test cases for final scoring
      // This would be done asynchronously for better performance

      res.json({
        success: true,
        message: 'Assessment submitted successfully',
        submittedAt: now,
      });

    } catch (error: any) {
      logger.error('Failed to submit assessment attempt', {
        error: error.message,
        attemptId: req.params.attemptId,
        userId: req.user?.uid,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to submit assessment',
        details: error.message,
      });
    }
  }
);

/**
 * Get supported programming languages
 * GET /api/execution/languages
 */
router.get('/languages', async (req: AuthenticatedRequest, res: Response) => {
  const languages = [
    {
      id: 'javascript',
      name: 'JavaScript',
      extension: 'js',
      version: 'Node.js 18',
      popular: true,
    },
    {
      id: 'python',
      name: 'Python',
      extension: 'py',
      version: '3.11',
      popular: true,
    },
    {
      id: 'java',
      name: 'Java',
      extension: 'java',
      version: '17',
      popular: true,
    },
    {
      id: 'go',
      name: 'Go',
      extension: 'go',
      version: '1.21',
      popular: false,
    },
  ];

  res.json({
    success: true,
    languages,
  });
});

/**
 * Check execution rate limit for user
 */
async function checkExecutionRateLimit(userId: string): Promise<number> {
  try {
    const db = require('firebase-admin').firestore();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const executions = await db
      .collection('execution-tracking')
      .where('userId', '==', userId)
      .where('timestamp', '>=', hourAgo)
      .get();

    return executions.size;
  } catch (error) {
    logger.error('Failed to check rate limit', { userId, error });
    return 0; // Allow on error
  }
}

/**
 * Track execution for rate limiting
 */
async function trackExecution(userId: string): Promise<void> {
  try {
    const db = require('firebase-admin').firestore();
    await db.collection('execution-tracking').add({
      userId,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to track execution', { userId, error });
    // Non-critical error
  }
}

export { router as executionRoutes };