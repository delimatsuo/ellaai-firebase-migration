import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as joi from 'joi';
import { AppError } from '../utils/errors';
import { validateRequest } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation schemas
const loginSchema = joi.object({
  idToken: joi.string().required(),
});

const createCustomTokenSchema = joi.object({
  uid: joi.string().required(),
  claims: joi.object().optional(),
});

const updateUserClaimsSchema = joi.object({
  uid: joi.string().required(),
  customClaims: joi.object().required(),
});

// POST /api/auth/login - Create session cookie from ID token
router.post('/login', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body as { idToken: string };

      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);
      
      // Set session cookie expiration (7 days)
      const expiresIn = 60 * 60 * 24 * 7 * 1000;
      
      // Create session cookie
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
      
      // Get user record
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      
      // Update user document in Firestore
      const db = admin.firestore();
      await db.collection('users').doc(decodedToken.uid).set({
        uid: decodedToken.uid,
        email: decodedToken.email || userRecord.email,
        displayName: decodedToken.name || userRecord.displayName,
        photoURL: decodedToken.picture || userRecord.photoURL,
        emailVerified: decodedToken.email_verified || userRecord.emailVerified,
        role: decodedToken.role || userRecord.customClaims?.role || 'candidate',
        companyId: decodedToken.companyId || userRecord.customClaims?.companyId,
        companyAccess: decodedToken.companyAccess || userRecord.customClaims?.companyAccess || [],
        lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Set secure cookie
      res.cookie('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          role: decodedToken.role || userRecord.customClaims?.role || 'candidate',
          photoURL: decodedToken.picture,
        },
        sessionExpires: new Date(Date.now() + expiresIn).toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/logout - Clear session cookie
router.post('/logout', async (req, res, next) => {
  try {
    const sessionCookie = req.cookies.session || '';
    
    if (sessionCookie) {
      try {
        const decodedCookie = await admin.auth().verifySessionCookie(sessionCookie);
        await admin.auth().revokeRefreshTokens(decodedCookie.uid);
      } catch (error) {
        console.warn('Failed to revoke session:', error);
      }
    }

    res.clearCookie('session');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/verify - Verify session cookie
router.get('/verify', async (req, res, next) => {
  try {
    const sessionCookie = req.cookies.session || '';
    
    if (!sessionCookie) {
      throw new AppError('No session cookie', 401);
    }

    const decodedCookie = await admin.auth().verifySessionCookie(sessionCookie, true);
    
    // Get user data from Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decodedCookie.uid).get();
    
    if (!userDoc.exists) {
      throw new AppError('User not found', 404);
    }
    
    const userData = userDoc.data();

    res.json({
      valid: true,
      user: {
        uid: decodedCookie.uid,
        email: decodedCookie.email,
        displayName: userData?.displayName,
        role: userData?.role || 'candidate',
        companyId: userData?.companyId,
        companyAccess: userData?.companyAccess || [],
      },
    });
  } catch (error) {
    if ((error as any).code === 'auth/session-cookie-expired' || 
        (error as any).code === 'auth/session-cookie-revoked') {
      res.clearCookie('session');
      res.status(401).json({
        valid: false,
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
      return;
    }
    next(error);
  }
});

// POST /api/auth/custom-token - Create custom token (admin only)
router.post('/custom-token',
  validateRequest(createCustomTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This endpoint should be protected by admin authentication
      const { uid, claims } = req.body as { uid: string; claims?: any };
      
      const customToken = await admin.auth().createCustomToken(uid, claims);
      
      res.json({
        customToken,
        uid,
        claims,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/set-claims - Set custom claims (admin only)
router.post('/set-claims',
  validateRequest(updateUserClaimsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, customClaims } = req.body as { uid: string; customClaims: any };
      
      await admin.auth().setCustomUserClaims(uid, customClaims);
      
      // Update Firestore user document
      const db = admin.firestore();
      await db.collection('users').doc(uid).update({
        role: customClaims.role,
        companyId: customClaims.companyId,
        companyAccess: customClaims.companyAccess,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      res.json({
        success: true,
        uid,
        claims: customClaims,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/user/:uid - Get user data (admin only)
router.get('/user/:uid', async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const userRecord = await admin.auth().getUser(uid);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    const userData = userDoc.exists ? userDoc.data() : {};
    
    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      customClaims: userRecord.customClaims,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      ...userData,
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };