import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as joi from 'joi';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { AppError } from '../utils/errors';

const router = Router();

const createQuestionSchema = joi.object({
  title: joi.string().required().min(1).max(500),
  description: joi.string().required().min(1),
  type: joi.string().valid('multiple_choice', 'coding', 'essay', 'true_false').required(),
  difficulty: joi.string().valid('easy', 'medium', 'hard').default('medium'),
  skills: joi.array().items(joi.string()).optional(),
  options: joi.array().items(joi.string()).when('type', {
    is: 'multiple_choice',
    then: joi.required(),
    otherwise: joi.optional(),
  }),
  correctAnswer: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string()),
    joi.number()
  ).optional(),
  timeLimit: joi.number().integer().min(1).max(180).optional(), // minutes
  testCases: joi.array().items(joi.object({
    input: joi.string().required(),
    expectedOutput: joi.string().required(),
  })).when('type', {
    is: 'coding',
    then: joi.optional(),
    otherwise: joi.forbidden(),
  }),
});

// Get questions
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      type, 
      difficulty, 
      skills, 
      limit = '20', 
      offset = '0' 
    } = req.query as any;
    
    const db = admin.firestore();
    let query = db.collection('questions') as any;
    
    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }
    
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query = query.where('skills', 'array-contains-any', skillsArray);
    }
    
    // Apply pagination
    query = query.orderBy('createdAt', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));
    
    const snapshot = await query.get();
    const questions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    res.json({
      questions,
      total: snapshot.size,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    next(error);
  }
});

// Create question (recruiter/admin only)
router.post('/',
  requireRole(['recruiter', 'hiring_manager', 'admin']),
  validateRequest(createQuestionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const questionData = req.body;
      
      const db = admin.firestore();
      const questionRef = await db.collection('questions').add({
        ...questionData,
        createdBy: req.user!.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isPublic: false, // Questions are private by default
      });
      
      const question = await questionRef.get();
      
      res.status(201).json({
        id: question.id,
        ...question.data(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get question details
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const db = admin.firestore();
    const questionDoc = await db.collection('questions').doc(id).get();
    
    if (!questionDoc.exists) {
      throw new AppError('Question not found', 404);
    }
    
    const questionData = questionDoc.data();
    
    // Check if user can access this question
    const canAccess = 
      questionData?.isPublic || 
      questionData?.createdBy === req.user?.uid ||
      req.user?.role === 'admin';
    
    if (!canAccess) {
      throw new AppError('Access denied', 403);
    }
    
    res.json({
      id: questionDoc.id,
      ...questionData,
    });
  } catch (error) {
    next(error);
  }
});

// Update question
router.put('/:id',
  requireRole(['recruiter', 'hiring_manager', 'admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const db = admin.firestore();
      const questionRef = db.collection('questions').doc(id);
      const questionDoc = await questionRef.get();
      
      if (!questionDoc.exists) {
        throw new AppError('Question not found', 404);
      }
      
      const questionData = questionDoc.data();
      
      // Check permissions
      if (req.user?.role !== 'admin' && questionData?.createdBy !== req.user?.uid) {
        throw new AppError('Access denied', 403);
      }
      
      await questionRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user!.uid,
      });
      
      const updatedQuestion = await questionRef.get();
      
      res.json({
        id: updatedQuestion.id,
        ...updatedQuestion.data(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete question
router.delete('/:id',
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const db = admin.firestore();
      const questionRef = db.collection('questions').doc(id);
      const questionDoc = await questionRef.get();
      
      if (!questionDoc.exists) {
        throw new AppError('Question not found', 404);
      }
      
      await questionRef.delete();
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as questionRoutes };