import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as joi from 'joi';
import { AuthenticatedRequest, requireCompanyAccess } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { AppError } from '../utils/errors';
import { AssessmentService } from '../services/AssessmentService';

const router = Router();
const assessmentService = new AssessmentService();

// Validation schemas
const createAssessmentSchema = joi.object({
  title: joi.string().required().min(1).max(200),
  description: joi.string().optional().max(1000),
  positionId: joi.string().required(),
  companyId: joi.string().required(),
  questions: joi.array().items(joi.string()).min(1).required(),
  timeLimit: joi.number().integer().min(1).max(180).default(60), // minutes
  difficulty: joi.string().valid('easy', 'medium', 'hard').default('medium'),
  skills: joi.array().items(joi.string()).optional(),
});

const startAssessmentAttemptSchema = joi.object({
  assessmentId: joi.string().required(),
});

const submitAnswerSchema = joi.object({
  questionId: joi.string().required(),
  answer: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string()),
    joi.object()
  ).required(),
  timeSpent: joi.number().integer().min(0).optional(),
});

const completeAssessmentSchema = joi.object({
  answers: joi.array().items(joi.object({
    questionId: joi.string().required(),
    answer: joi.alternatives().try(
      joi.string(),
      joi.array().items(joi.string()),
      joi.object()
    ).required(),
    timeSpent: joi.number().integer().min(0).optional(),
  })).required(),
});

// GET /api/assessments - List assessments
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { companyId, candidateId, status, limit = '20', offset = '0' } = req.query as any;
    
    const db = admin.firestore();
    let query = db.collection('assessments') as any;
    
    // Apply filters based on user role and query parameters
    if (req.user?.role === 'candidate') {
      // Candidates can only see their own assessments
      if (candidateId && candidateId !== req.user.uid) {
        throw new AppError('Access denied', 403);
      }
      query = query.where('candidateId', '==', req.user.uid);
    } else {
      // Company users can see company assessments
      if (companyId) {
        // Check company access
        if (req.user?.role !== 'admin' && 
            !req.user?.companyAccess?.includes(companyId) && 
            req.user?.companyId !== companyId) {
          throw new AppError('Access to company denied', 403);
        }
        query = query.where('companyId', '==', companyId);
      }
      
      if (candidateId) {
        query = query.where('candidateId', '==', candidateId);
      }
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Apply pagination
    query = query.orderBy('createdAt', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));
    
    const snapshot = await query.get();
    const assessments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    res.json({
      assessments,
      total: snapshot.size,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/assessments - Create new assessment
router.post('/',
  validateRequest(createAssessmentSchema),
  requireCompanyAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const assessmentData = req.body;
      
      // Verify user has permission to create assessments for this company
      if (req.user?.role !== 'admin' && 
          !['recruiter', 'hiring_manager'].includes(req.user?.role || '')) {
        throw new AppError('Insufficient permissions to create assessments', 403);
      }
      
      const assessment = await assessmentService.createAssessment({
        ...assessmentData,
        createdBy: req.user!.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'draft',
      });
      
      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/assessments/:id - Get assessment details
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const assessment = await assessmentService.getAssessment(id);
    
    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }
    
    // Check access permissions
    if (req.user?.role === 'candidate') {
      if (assessment.candidateId !== req.user.uid) {
        throw new AppError('Access denied', 403);
      }
    } else {
      if (req.user?.role !== 'admin' && 
          !req.user?.companyAccess?.includes(assessment.companyId) && 
          req.user?.companyId !== assessment.companyId) {
        throw new AppError('Access denied', 403);
      }
    }
    
    res.json(assessment);
  } catch (error) {
    next(error);
  }
});

// POST /api/assessments/:id/start - Start assessment attempt
router.post('/:id/start',
  validateRequest(startAssessmentAttemptSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id: assessmentId } = req.params;
      
      const assessment = await assessmentService.getAssessment(assessmentId);
      
      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }
      
      // Check if candidate can start this assessment
      if (assessment.candidateId !== req.user!.uid) {
        throw new AppError('Access denied', 403);
      }
      
      const attempt = await assessmentService.startAssessmentAttempt({
        assessmentId,
        candidateId: req.user!.uid,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'in_progress',
        answers: [],
        timeRemaining: assessment.timeLimit * 60, // Convert to seconds
      });
      
      res.status(201).json(attempt);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/assessments/:id/submit-answer - Submit individual answer
router.post('/:id/submit-answer',
  validateRequest(submitAnswerSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id: assessmentId } = req.params;
      const { questionId, answer, timeSpent } = req.body;
      
      const result = await assessmentService.submitAnswer(
        assessmentId,
        req.user!.uid,
        questionId,
        answer,
        timeSpent
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/assessments/:id/complete - Complete assessment
router.post('/:id/complete',
  validateRequest(completeAssessmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id: assessmentId } = req.params;
      const { answers } = req.body;
      
      const result = await assessmentService.completeAssessment(
        assessmentId,
        req.user!.uid,
        answers
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/assessments/:id/results - Get assessment results
router.get('/:id/results', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: assessmentId } = req.params;
    
    const results = await assessmentService.getAssessmentResults(
      assessmentId,
      req.user!.uid,
      req.user!.role || 'candidate'
    );
    
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// PUT /api/assessments/:id - Update assessment (company users only)
router.put('/:id',
  requireCompanyAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (req.user?.role !== 'admin' && 
          !['recruiter', 'hiring_manager'].includes(req.user?.role || '')) {
        throw new AppError('Insufficient permissions', 403);
      }
      
      const assessment = await assessmentService.updateAssessment(id, {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user!.uid,
      });
      
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/assessments/:id - Delete assessment (admin only)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (req.user?.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }
    
    await assessmentService.deleteAssessment(id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as assessmentRoutes };