import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ProctoringSession {
  sessionId: string;
  initUrl: string;
  vendorSessionId: string;
}

export interface ProctoringToken {
  token: string;
  expiresAt: string;
}

export interface ProctoringStatus {
  status: 'pending' | 'started' | 'completed' | 'scored' | 'error';
  trustScore?: number;
  evidence?: ProctoringEvidence[];
}

export interface ProctoringEvidence {
  type: string;
  count: number;
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high';
}

class ProctoringService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  /**
   * Create a new proctoring session for an assessment
   */
  async createSession(
    assessmentId: string,
    candidateId: string,
    companyId: string
  ): Promise<ProctoringSession> {
    try {
      const response = await this.axios.post('/proctor/sessions', {
        assessmentId,
        candidateId,
        companyId,
      });
      return response.data.session;
    } catch (error: any) {
      console.error('Failed to create proctoring session:', error);
      throw new Error(error.response?.data?.error || 'Failed to create proctoring session');
    }
  }

  /**
   * Get the status of a proctoring session
   */
  async getSessionStatus(sessionId: string): Promise<ProctoringStatus> {
    try {
      const response = await this.axios.get(`/proctor/sessions/${sessionId}`);
      return response.data.session;
    } catch (error: any) {
      console.error('Failed to get session status:', error);
      throw new Error(error.response?.data?.error || 'Failed to get session status');
    }
  }

  /**
   * Complete a proctoring session
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      await this.axios.post(`/proctor/sessions/${sessionId}/complete`);
    } catch (error: any) {
      console.error('Failed to complete session:', error);
      throw new Error(error.response?.data?.error || 'Failed to complete session');
    }
  }

  /**
   * Issue an access token for a proctoring session
   */
  async issueToken(sessionId: string): Promise<ProctoringToken> {
    try {
      const response = await this.axios.post('/proctor/tokens', {
        sessionId,
      });
      return response.data.token;
    } catch (error: any) {
      console.error('Failed to issue token:', error);
      throw new Error(error.response?.data?.error || 'Failed to issue token');
    }
  }

  /**
   * Check if proctoring is required for an assessment
   */
  async isProctoringRequired(assessmentId: string): Promise<boolean> {
    try {
      const response = await this.axios.get(`/proctor/check/${assessmentId}`);
      return response.data.proctoringRequired;
    } catch (error: any) {
      console.error('Failed to check proctoring requirement:', error);
      return false; // Default to not required if check fails
    }
  }

  /**
   * Start proctoring session in iframe or new window
   */
  startProctoringSession(initUrl: string, options?: {
    mode?: 'iframe' | 'window' | 'redirect';
    containerId?: string;
  }): void {
    const mode = options?.mode || 'redirect';

    switch (mode) {
      case 'iframe':
        if (options?.containerId) {
          const container = document.getElementById(options.containerId);
          if (container) {
            const iframe = document.createElement('iframe');
            iframe.src = initUrl;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.setAttribute('allow', 'camera; microphone; display-capture');
            container.appendChild(iframe);
          }
        }
        break;

      case 'window':
        window.open(
          initUrl,
          'proctoring_session',
          'width=1200,height=800,toolbar=no,menubar=no,location=no'
        );
        break;

      case 'redirect':
      default:
        window.location.href = initUrl;
        break;
    }
  }

  /**
   * Calculate overall integrity score based on trust score and evidence
   */
  calculateIntegrityScore(trustScore: number, evidence: ProctoringEvidence[]): {
    score: number;
    level: 'high' | 'medium' | 'low';
    recommendation: string;
  } {
    // Adjust trust score based on evidence severity
    let adjustedScore = trustScore;
    let highSeverityCount = 0;
    let mediumSeverityCount = 0;

    evidence.forEach(e => {
      if (e.severity === 'high') {
        adjustedScore -= 10;
        highSeverityCount++;
      } else if (e.severity === 'medium') {
        adjustedScore -= 5;
        mediumSeverityCount++;
      } else {
        adjustedScore -= 2;
      }
    });

    // Ensure score stays within bounds
    adjustedScore = Math.max(0, Math.min(100, adjustedScore));

    // Determine level and recommendation
    let level: 'high' | 'medium' | 'low';
    let recommendation: string;

    if (adjustedScore >= 85 && highSeverityCount === 0) {
      level = 'high';
      recommendation = 'Assessment completed with high integrity. No concerns detected.';
    } else if (adjustedScore >= 70 && highSeverityCount <= 1) {
      level = 'medium';
      recommendation = 'Minor integrity concerns detected. Review recording for context.';
    } else {
      level = 'low';
      recommendation = 'Significant integrity concerns. Manual review required. Consider retake.';
    }

    return {
      score: adjustedScore,
      level,
      recommendation,
    };
  }

  /**
   * Format proctoring evidence for display
   */
  formatEvidence(evidence: ProctoringEvidence[]): {
    summary: string;
    details: string[];
    flagCount: number;
  } {
    const flagDescriptions: Record<string, string> = {
      tab_blur: 'Tab switching detected',
      multiple_tabs: 'Multiple browser tabs open',
      face_not_visible: 'Face not visible',
      multiple_people: 'Multiple people detected',
      screen_recording: 'Screen recording software detected',
      copy_paste: 'Copy-paste activity',
    };

    const details = evidence.map(e => {
      const description = flagDescriptions[e.type] || e.type;
      const countText = e.count > 1 ? ` (${e.count} times)` : '';
      return `${description}${countText}`;
    });

    const summary = evidence.length === 0
      ? 'No integrity issues detected'
      : `${evidence.length} potential issue${evidence.length > 1 ? 's' : ''} detected`;

    return {
      summary,
      details,
      flagCount: evidence.length,
    };
  }
}

export const proctoringService = new ProctoringService();
export default proctoringService;