import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

// Get all candidates (recruiter/admin only)
router.get('/',
  requireRole(['recruiter', 'hiring_manager', 'admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = '20', offset = '0' } = req.query as any;
      
      const db = admin.firestore();
      let query = db.collection('users').where('role', '==', 'candidate') as any;
      
      // Apply pagination
      query = query.orderBy('createdAt', 'desc')
                   .limit(parseInt(limit))
                   .offset(parseInt(offset));
      
      const snapshot = await query.get();
      const candidates = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      res.json({
        candidates,
        total: snapshot.size,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get candidate profile
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const db = admin.firestore();
    const candidateDoc = await db.collection('users').doc(id).get();
    
    if (!candidateDoc.exists) {
      throw new AppError('Candidate not found', 404);
    }
    
    const candidateData = candidateDoc.data();
    
    // Check access permissions
    if (req.user?.role === 'candidate' && req.user.uid !== id) {
      throw new AppError('Access denied', 403);
    }
    
    res.json({
      id: candidateDoc.id,
      ...candidateData,
    });
  } catch (error) {
    next(error);
  }
});

export { router as candidateRoutes };