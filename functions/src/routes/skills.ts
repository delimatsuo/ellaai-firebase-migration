import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AppError } from '../utils/errors';

const router = Router();

// Get all skills (public endpoint)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit = '100', offset = '0' } = req.query as any;
    
    const db = admin.firestore();
    let query = db.collection('skills') as any;
    
    // Apply category filter if provided
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Apply pagination
    query = query.orderBy('name')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));
    
    const snapshot = await query.get();
    const skills = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    res.json({
      skills,
      total: snapshot.size,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    next(error);
  }
});

// Get skill categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('skills').get();
    
    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    res.json({
      categories: Array.from(categories).sort(),
    });
  } catch (error) {
    next(error);
  }
});

// Get skill details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const db = admin.firestore();
    const skillDoc = await db.collection('skills').doc(id).get();
    
    if (!skillDoc.exists) {
      throw new AppError('Skill not found', 404);
    }
    
    res.json({
      id: skillDoc.id,
      ...skillDoc.data(),
    });
  } catch (error) {
    next(error);
  }
});

export { router as skillsRoutes };