/**
 * Quadradan Proctoring Service Integration
 * Production deployment: Brazil (https://ingress-api-brazil-prod-xzobp4gtbq-rj.a.run.app)
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

// Types
export interface CreateSessionInput {
  candidateId: string;
  assessmentId: string;
  companyId: string;
}

export interface CreateSessionOutput {
  sessionId: string;
  initUrl: string;
  vendorSessionId: string;
}

export interface IssueTokenInput {
  sessionId: string;
}

export interface IssueTokenOutput {
  token: string;
  expiresAt: string;
}

export interface GetSessionInput {
  sessionId: string;
}

export interface GetSessionOutput {
  status: 'pending' | 'started' | 'completed' | 'scored' | 'error';
  trustScore?: number;
  evidence?: ProctoringEvidence[];
}

export interface ProctoringEvidence {
  type: 'tab_blur' | 'multiple_tabs' | 'face_not_visible' | 'multiple_people' | 'screen_recording' | 'copy_paste';
  count: number;
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface ProctoringSettings {
  videoRecording: boolean;
  screenRecording: boolean;
  behaviorAnalysis: boolean;
  autoScoring: boolean;
  strictness: 'low' | 'standard' | 'high';
}

// Configuration
const QUADRADAN_API_BASE = process.env.QUADRADAN_API_URL || 'https://ingress-api-brazil-prod-xzobp4gtbq-rj.a.run.app';
const QUADRADAN_API_KEY = process.env.QUADRADAN_API_KEY || '';
const PROCTORING_ENABLED = process.env.PROCTORING_STANDARD_ENABLED === 'true';

/**
 * Make API call to Quadradan service
 */
async function quadradanApiCall(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: any
): Promise<any> {
  const url = `${QUADRADAN_API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': QUADRADAN_API_KEY ? `Bearer ${QUADRADAN_API_KEY}` : '',
        'User-Agent': 'EllaAI/1.0.0'
      },
      ...(data && { body: JSON.stringify(data) })
    });

    if (!response.ok) {
      throw new Error(`Quadradan API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Quadradan API call failed', { endpoint, error });
    throw error;
  }
}

/**
 * Proctoring Service Class
 */
export class ProctoringService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Create a new proctoring session
   */
  async createSession(input: CreateSessionInput): Promise<CreateSessionOutput> {
    if (!PROCTORING_ENABLED) {
      throw new Error('Proctoring is not enabled');
    }

    try {
      // Call Quadradan to create session
      const response = await quadradanApiCall('/api/v1/sessions/create', 'POST', {
        candidate_id: input.candidateId,
        assessment_id: input.assessmentId,
        region: 'brazil',
        mode: 'standard',
        settings: {
          video_recording: true,
          screen_recording: true,
          behavior_analysis: true,
          auto_scoring: true
        }
      });

      // Store session in Firestore
      const sessionDoc = await this.db.collection('proctoring_sessions').add({
        candidateId: input.candidateId,
        assessmentId: input.assessmentId,
        companyId: input.companyId,
        vendorSessionId: response.session_id,
        status: 'pending',
        mode: 'standard',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Proctoring session created', {
        sessionId: sessionDoc.id,
        vendorSessionId: response.session_id,
        candidateId: input.candidateId,
        assessmentId: input.assessmentId
      });

      return {
        sessionId: sessionDoc.id,
        initUrl: response.session_url || `${QUADRADAN_API_BASE}/session/${response.session_id}/init`,
        vendorSessionId: response.session_id
      };
    } catch (error: any) {
      logger.error('Failed to create proctoring session', { error, input });
      
      // Fallback for development/testing
      if (process.env.NODE_ENV !== 'production') {
        const fallbackSessionId = `dev_session_${Date.now()}`;
        const sessionDoc = await this.db.collection('proctoring_sessions').add({
          candidateId: input.candidateId,
          assessmentId: input.assessmentId,
          companyId: input.companyId,
          vendorSessionId: fallbackSessionId,
          status: 'pending',
          mode: 'development',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          sessionId: sessionDoc.id,
          initUrl: `/assessment/${input.assessmentId}/take?dev_mode=true`,
          vendorSessionId: fallbackSessionId
        };
      }
      
      throw error;
    }
  }

  /**
   * Issue access token for a session
   */
  async issueToken(input: IssueTokenInput): Promise<IssueTokenOutput> {
    try {
      // Get session from Firestore
      const sessionDoc = await this.db.collection('proctoring_sessions').doc(input.sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const session = sessionDoc.data()!;
      
      // Call Quadradan to get token
      const response = await quadradanApiCall(
        `/api/v1/sessions/${session.vendorSessionId}/token`,
        'POST'
      );
      
      // Update session with token info
      await sessionDoc.ref.update({
        lastTokenIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        token: response.access_token,
        expiresAt: response.expires_at
      };
    } catch (error: any) {
      logger.error('Failed to issue token', { error, sessionId: input.sessionId });
      
      // Fallback for development
      if (process.env.NODE_ENV !== 'production') {
        return {
          token: `dev_token_${input.sessionId}_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        };
      }
      
      throw error;
    }
  }

  /**
   * Get session status and results
   */
  async getSession(input: GetSessionInput): Promise<GetSessionOutput> {
    try {
      // Get session from Firestore
      const sessionDoc = await this.db.collection('proctoring_sessions').doc(input.sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const session = sessionDoc.data()!;
      
      // If already scored, return cached results
      if (session.status === 'scored' && session.trustScore !== undefined) {
        return {
          status: session.status,
          trustScore: session.trustScore,
          evidence: session.evidence || []
        };
      }

      // Call Quadradan to get status
      const response = await quadradanApiCall(
        `/api/v1/sessions/${session.vendorSessionId}/status`,
        'GET'
      );
      
      // Update session with latest status
      const updateData: any = {
        status: response.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (response.trust_score !== undefined) {
        updateData.trustScore = response.trust_score;
        updateData.evidence = response.incidents || response.evidence || [];
        updateData.scoredAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await sessionDoc.ref.update(updateData);

      return {
        status: response.status as GetSessionOutput['status'],
        trustScore: response.trust_score,
        evidence: this.mapEvidence(response.incidents || response.evidence || [])
      };
    } catch (error: any) {
      logger.error('Failed to get session status', { error, sessionId: input.sessionId });
      
      // Fallback for development
      if (process.env.NODE_ENV !== 'production') {
        return {
          status: 'scored',
          trustScore: 95,
          evidence: []
        };
      }
      
      throw error;
    }
  }

  /**
   * Complete a proctoring session
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      const sessionDoc = await this.db.collection('proctoring_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const session = sessionDoc.data()!;
      
      // Notify Quadradan that session is complete
      await quadradanApiCall(
        `/api/v1/sessions/${session.vendorSessionId}/complete`,
        'POST'
      );

      // Update session status
      await sessionDoc.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Proctoring session completed', { sessionId });
    } catch (error) {
      logger.error('Failed to complete session', { error, sessionId });
      throw error;
    }
  }

  /**
   * Check if proctoring is required for an assessment
   */
  async isProctoringRequired(assessmentId: string): Promise<boolean> {
    try {
      const assessmentDoc = await this.db.collection('assessments').doc(assessmentId).get();
      if (!assessmentDoc.exists) {
        return false;
      }

      const assessment = assessmentDoc.data()!;
      return assessment.settings?.requireWebcam || assessment.settings?.recordScreen || false;
    } catch (error) {
      logger.error('Failed to check proctoring requirement', { error, assessmentId });
      return false;
    }
  }

  /**
   * Map Quadradan evidence to our format
   */
  private mapEvidence(incidents: any[]): ProctoringEvidence[] {
    return incidents.map(incident => ({
      type: this.mapIncidentType(incident.type || incident.name),
      count: incident.count || 1,
      timestamp: incident.timestamp,
      severity: this.mapSeverity(incident.severity || incident.level)
    }));
  }

  private mapIncidentType(type: string): ProctoringEvidence['type'] {
    const typeMap: Record<string, ProctoringEvidence['type']> = {
      'tab_switch': 'tab_blur',
      'window_blur': 'tab_blur',
      'multiple_tabs_open': 'multiple_tabs',
      'face_missing': 'face_not_visible',
      'no_face': 'face_not_visible',
      'multiple_faces': 'multiple_people',
      'screen_capture': 'screen_recording',
      'clipboard': 'copy_paste'
    };
    return typeMap[type.toLowerCase()] || 'tab_blur';
  }

  private mapSeverity(level: string | number): 'low' | 'medium' | 'high' {
    if (typeof level === 'number') {
      if (level <= 3) return 'low';
      if (level <= 7) return 'medium';
      return 'high';
    }
    return level as 'low' | 'medium' | 'high' || 'medium';
  }
}

// Export singleton instance
export const proctoringService = new ProctoringService();