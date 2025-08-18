import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { 
  SupportAuthenticatedRequest, 
  requireSupportPermissions,
  logSupportAction
} from '../middleware/supportMode';
import { 
  SupportSession, 
  ActAsRequest, 
  EndSupportSessionRequest, 
  SupportSessionResponse 
} from '../types/support';
import { AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';

const router = Router();
const db = admin.firestore();

/**
 * POST /api/support/act-as
 * Start acting as a customer company
 */
router.post('/act-as', 
  requireRole(['admin', 'ella_recruiter']),
  requireSupportPermissions('canActAs'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { targetCompanyId, reason, estimatedDuration }: ActAsRequest = req.body;

      if (!targetCompanyId || !reason) {
        res.status(400).json({
          error: 'Target company ID and reason are required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Check if user already has an active support session
      const existingSession = await db.collection('support-sessions')
        .where('ellaRecruiterId', '==', req.user!.uid)
        .where('status', '==', 'active')
        .get();

      if (!existingSession.empty) {
        res.status(409).json({
          error: 'User already has an active support session',
          code: 'ACTIVE_SESSION_EXISTS',
          existingSessionId: existingSession.docs[0].id
        });
        return;
      }

      // Verify target company exists
      const companyDoc = await db.collection('companies').doc(targetCompanyId).get();
      if (!companyDoc.exists) {
        res.status(404).json({
          error: 'Target company not found',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      const companyData = companyDoc.data();

      // Create support session
      const supportSession: Omit<SupportSession, 'id'> = {
        ellaRecruiterId: req.user!.uid,
        ellaRecruiterEmail: req.user!.email || '',
        targetCompanyId,
        targetCompanyName: companyData?.name || 'Unknown Company',
        startedAt: admin.firestore.Timestamp.now(),
        reason,
        actions: [],
        status: 'active',
        metadata: {
          originalCompanyId: req.user!.companyId,
          originalRole: req.user!.role,
          estimatedDuration
        }
      };

      const sessionRef = await db.collection('support-sessions').add(supportSession);

      // Log the support session start
      await logSupportAction(
        sessionRef.id,
        'START_SUPPORT_SESSION',
        'COMPANY',
        'POST',
        req.path,
        targetCompanyId,
        { reason, estimatedDuration }
      );

      const response: SupportSessionResponse = {
        success: true,
        sessionId: sessionRef.id,
        supportContext: {
          isActingAs: true,
          targetCompanyId,
          sessionStartTime: supportSession.startedAt
        },
        message: `Started acting as company: ${companyData?.name}`
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error starting support session:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to start support session',
        code: 'SUPPORT_SESSION_START_FAILED'
      });
    }
  }
);

/**
 * POST /api/support/end-session
 * End current support session
 */
router.post('/end-session',
  requireRole(['admin', 'ella_recruiter']),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { sessionId, summary }: EndSupportSessionRequest = req.body;

      let targetSessionId = sessionId;

      // If no sessionId provided, find the user's active session
      if (!targetSessionId) {
        const activeSession = await db.collection('support-sessions')
          .where('ellaRecruiterId', '==', req.user!.uid)
          .where('status', '==', 'active')
          .limit(1)
          .get();

        if (activeSession.empty) {
          res.status(404).json({
            error: 'No active support session found',
            code: 'NO_ACTIVE_SESSION'
          });
          return;
        }

        targetSessionId = activeSession.docs[0].id;
      }

      // Verify session exists and belongs to user
      const sessionDoc = await db.collection('support-sessions').doc(targetSessionId).get();
      
      if (!sessionDoc.exists) {
        res.status(404).json({
          error: 'Support session not found',
          code: 'SESSION_NOT_FOUND'
        });
        return;
      }

      const sessionData = sessionDoc.data() as SupportSession;

      if (sessionData.ellaRecruiterId !== req.user!.uid && req.user!.role !== 'admin') {
        res.status(403).json({
          error: 'Not authorized to end this session',
          code: 'SESSION_ACCESS_DENIED'
        });
        return;
      }

      // Calculate session duration
      const endTime = admin.firestore.Timestamp.now();
      const duration = endTime.toMillis() - sessionData.startedAt.toMillis();

      // Update session
      await db.collection('support-sessions').doc(targetSessionId).update({
        status: 'ended',
        endedAt: endTime,
        'metadata.sessionDuration': Math.floor(duration / 1000), // duration in seconds
        'metadata.summary': summary
      });

      // Log session end
      await logSupportAction(
        targetSessionId,
        'END_SUPPORT_SESSION',
        'COMPANY',
        'POST',
        req.path,
        sessionData.targetCompanyId,
        { summary, duration: Math.floor(duration / 1000) }
      );

      const response: SupportSessionResponse = {
        success: true,
        sessionId: targetSessionId,
        message: `Ended support session for company: ${sessionData.targetCompanyName}`
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error ending support session:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to end support session',
        code: 'SUPPORT_SESSION_END_FAILED'
      });
    }
  }
);

/**
 * GET /api/support/active-sessions
 * List active support sessions (admin only)
 */
router.get('/active-sessions',
  requireRole('admin'),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const sessionsQuery = db.collection('support-sessions')
        .where('status', '==', 'active')
        .orderBy('startedAt', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      const sessionsSnapshot = await sessionsQuery.get();

      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count for pagination
      const totalActiveQuery = await db.collection('support-sessions')
        .where('status', '==', 'active')
        .get();

      res.json({
        sessions,
        pagination: {
          total: totalActiveQuery.size,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: totalActiveQuery.size > Number(offset) + sessions.length
        }
      });
    } catch (error: any) {
      console.error('Error fetching active sessions:', error);

      res.status(500).json({
        error: 'Failed to fetch active support sessions',
        code: 'FETCH_SESSIONS_FAILED'
      });
    }
  }
);

/**
 * GET /api/support/my-sessions
 * Get current user's support session history
 */
router.get('/my-sessions',
  requireRole(['admin', 'ella_recruiter']),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { limit = 20, status } = req.query;

      let query = db.collection('support-sessions')
        .where('ellaRecruiterId', '==', req.user!.uid)
        .orderBy('startedAt', 'desc')
        .limit(Number(limit));

      if (status && ['active', 'ended'].includes(status as string)) {
        query = query.where('status', '==', status);
      }

      const sessionsSnapshot = await query.get();

      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        sessions,
        total: sessions.length
      });
    } catch (error: any) {
      console.error('Error fetching user sessions:', error);

      res.status(500).json({
        error: 'Failed to fetch user support sessions',
        code: 'FETCH_USER_SESSIONS_FAILED'
      });
    }
  }
);

/**
 * GET /api/support/current-session
 * Get current active support session details
 */
router.get('/current-session',
  requireRole(['admin', 'ella_recruiter']),
  async (req: SupportAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.supportContext?.isActingAs) {
        res.json({
          isActingAs: false,
          session: null
        });
        return;
      }

      const sessionDoc = await db.collection('support-sessions')
        .doc(req.user!.supportContext!.supportSessionId!)
        .get();

      if (!sessionDoc.exists) {
        res.status(404).json({
          error: 'Support session not found',
          code: 'SESSION_NOT_FOUND'
        });
        return;
      }

      res.json({
        isActingAs: true,
        session: {
          id: sessionDoc.id,
          ...sessionDoc.data()
        }
      });
    } catch (error: any) {
      console.error('Error fetching current session:', error);

      res.status(500).json({
        error: 'Failed to fetch current support session',
        code: 'FETCH_CURRENT_SESSION_FAILED'
      });
    }
  }
);

export { router as supportRoutes };