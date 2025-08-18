import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as functionsV1 from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import route handlers
import { authRoutes } from './routes/auth';
import { assessmentRoutes } from './routes/assessments';
import { candidateRoutes } from './routes/candidates';
import { companyRoutes } from './routes/companies';
import { questionRoutes } from './routes/questions';
import { skillsRoutes } from './routes/skills';
import { supportRoutes } from './routes/support';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { supportContextMiddleware } from './middleware/supportMode';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://identitytoolkit.googleapis.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ellaai.com', 'https://www.ellaai.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global middleware
app.use(rateLimiter);
app.use(auditMiddleware);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', authMiddleware, supportContextMiddleware, assessmentRoutes);
app.use('/api/candidates', authMiddleware, supportContextMiddleware, candidateRoutes);
app.use('/api/companies', authMiddleware, supportContextMiddleware, companyRoutes);
app.use('/api/questions', authMiddleware, supportContextMiddleware, questionRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/support', authMiddleware, supportContextMiddleware, supportRoutes);
app.use('/api/admin', authMiddleware, supportContextMiddleware, adminRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Export the Express app as a Firebase Cloud Function (v2)
export const api = onRequest(
  { 
    region: 'us-central1',
    cors: true,
    maxInstances: 100
  },
  app
);

// Firestore triggers
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    role: 'candidate', // default role
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
  });
});

export const onUserDelete = functionsV1.auth.user().onDelete(async (user) => {
  const db = admin.firestore();
  
  // Delete user document
  await db.collection('users').doc(user.uid).delete();
  
  // Clean up user-related data
  const batch = db.batch();
  
  // Delete user's assessments
  const assessments = await db.collection('assessments')
    .where('candidateId', '==', user.uid)
    .get();
  
  assessments.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // Delete user's assessment attempts
  const attempts = await db.collection('assessment-attempts')
    .where('candidateId', '==', user.uid)
    .get();
  
  attempts.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
});

// Scheduled functions
export const dailyCleanup = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'America/New_York',
    region: 'us-central1'
  },
  async (event) => {
    const db = admin.firestore();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 days ago
    
    // Clean up expired assessment attempts
    const expiredAttempts = await db.collection('assessment-attempts')
      .where('createdAt', '<', cutoff)
      .where('status', '==', 'abandoned')
      .limit(100)
      .get();
    
    const batch = db.batch();
    expiredAttempts.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`Cleaned up ${expiredAttempts.size} expired assessment attempts`);
  });