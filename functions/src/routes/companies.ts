import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as joi from 'joi';
import { AuthenticatedRequest, requireRole, requireCompanyAccess } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { AppError } from '../utils/errors';

const router = Router();

const createCompanySchema = joi.object({
  name: joi.string().required().min(1).max(200),
  description: joi.string().optional().max(1000),
  website: joi.string().uri().optional(),
  industry: joi.string().optional(),
  size: joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').optional(),
  logo: joi.string().uri().optional(),
});

// Get companies (admin only)
router.get('/',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = '20', offset = '0' } = req.query as any;
      
      const db = admin.firestore();
      const query = db.collection('companies')
                     .orderBy('createdAt', 'desc')
                     .limit(parseInt(limit))
                     .offset(parseInt(offset));
      
      const snapshot = await query.get();
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      res.json({
        companies,
        total: snapshot.size,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create company
router.post('/',
  requireRole(['admin', 'recruiter', 'hiring_manager']),
  validateRequest(createCompanySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyData = req.body;
      
      const db = admin.firestore();
      const companyRef = await db.collection('companies').add({
        ...companyData,
        createdBy: req.user!.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        members: {
          [req.user!.uid]: 'admin',
        },
        admins: {
          [req.user!.uid]: true,
        },
      });
      
      const company = await companyRef.get();
      
      res.status(201).json({
        id: company.id,
        ...company.data(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get company details
router.get('/:id',
  requireCompanyAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const db = admin.firestore();
      const companyDoc = await db.collection('companies').doc(id).get();
      
      if (!companyDoc.exists) {
        throw new AppError('Company not found', 404);
      }
      
      res.json({
        id: companyDoc.id,
        ...companyDoc.data(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as companyRoutes };