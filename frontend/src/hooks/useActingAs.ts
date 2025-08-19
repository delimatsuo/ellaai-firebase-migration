import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActingAsContextType, SessionAction, useActingAs as useActingAsContext } from '../contexts/ActingAsContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Enhanced hook for Acting As functionality with navigation tracking and session management
 */
export const useActingAs = (): ActingAsContextType & {
  // Enhanced functionality
  isEllaRecruiter: boolean;
  canActAs: boolean;
  emergencyExit: () => Promise<void>;
  formatSessionDuration: (seconds: number) => string;
  getHealthScoreColor: (score: number) => string;
  getHealthScoreLabel: (score: number) => string;
  trackPageView: (pageName: string) => void;
  trackAction: (action: string, resource: string, details?: any) => void;
} => {
  const context = useActingAsContext();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!context) {
    throw new Error('useActingAs must be used within an ActingAsProvider');
  }

  // Check if user is an Ella Recruiter with acting as permissions
  const isEllaRecruiter = userProfile?.role === 'admin' || userProfile?.role === 'system_admin';
  const canActAs = isEllaRecruiter && userProfile?.companyId === undefined; // Ella Recruiters don't have companyId

  // Emergency exit function
  const emergencyExit = useCallback(async (): Promise<void> => {
    try {
      await context.endActingAsSession('Emergency exit - immediate session termination');
      navigate('/support/dashboard');
      toast.success('Emergency exit completed');
    } catch (error) {
      console.error('Emergency exit failed:', error);
      toast.error('Emergency exit failed');
    }
  }, [context, navigate]);

  // Format session duration
  const formatSessionDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // Get health score color
  const getHealthScoreColor = useCallback((score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }, []);

  // Get health score label
  const getHealthScoreLabel = useCallback((score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  }, []);

  // Track page views in acting as sessions
  const trackPageView = useCallback((pageName: string): void => {
    if (context.isActingAs) {
      context.addSessionAction({
        action: 'page_view',
        resource: 'navigation',
        method: 'GET',
        path: location.pathname,
        details: {
          pageName,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [context, location.pathname]);

  // Track actions in acting as sessions
  const trackAction = useCallback((action: string, resource: string, details?: any): void => {
    if (context.isActingAs) {
      context.addSessionAction({
        action,
        resource,
        method: 'POST', // Default method for actions
        path: location.pathname,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [context, location.pathname]);

  // Auto-track page views
  useEffect(() => {
    if (context.isActingAs) {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const pageName = pathSegments.join(' > ') || 'Dashboard';
      trackPageView(pageName);
    }
  }, [location.pathname, context.isActingAs, trackPageView]);

  // Session timeout warning
  useEffect(() => {
    if (context.currentSession && context.sessionDuration > 0) {
      const estimatedDuration = context.currentSession.estimatedDuration || 60;
      const warningTime = estimatedDuration * 60 * 0.8;
      const criticalTime = estimatedDuration * 60 * 0.95;

      if (context.sessionDuration === Math.floor(warningTime)) {
        const companyName = context.currentSession.targetCompanyName;
        const duration = formatSessionDuration(context.sessionDuration);
        toast('Session Warning: You have been acting as ' + companyName + ' for ' + duration + '. Consider ending the session soon.', {
          icon: '⚠️',
          duration: 10000,
        });
      }

      if (context.sessionDuration === Math.floor(criticalTime)) {
        toast('Session Critical: You have exceeded the estimated session time! Please end the session immediately.', {
          icon: '🚨',
          duration: 15000,
        });
      }
    }
  }, [context.sessionDuration, context.currentSession, formatSessionDuration]);

  // Prevent accidental navigation away during active sessions
  useEffect(() => {
    if (context.isActingAs) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'You have an active Acting As session. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [context.isActingAs]);

  return {
    ...context,
    
    // Enhanced functionality
    isEllaRecruiter,
    canActAs,
    emergencyExit,
    formatSessionDuration,
    getHealthScoreColor,
    getHealthScoreLabel,
    trackPageView,
    trackAction,
  };
};

/**
 * Hook for tracking specific actions in Acting As sessions
 */
export const useActingAsActions = () => {
  const { trackAction, isActingAs } = useActingAs();

  const trackCandidateAction = useCallback((action: string, candidateId: string, details?: any) => {
    if (isActingAs) {
      trackAction(action, 'candidate', { candidateId, ...details });
    }
  }, [trackAction, isActingAs]);

  const trackAssessmentAction = useCallback((action: string, assessmentId: string, details?: any) => {
    if (isActingAs) {
      trackAction(action, 'assessment', { assessmentId, ...details });
    }
  }, [trackAction, isActingAs]);

  const trackCompanyAction = useCallback((action: string, details?: any) => {
    if (isActingAs) {
      trackAction(action, 'company', details);
    }
  }, [trackAction, isActingAs]);

  const trackUserAction = useCallback((action: string, userId: string, details?: any) => {
    if (isActingAs) {
      trackAction(action, 'user', { userId, ...details });
    }
  }, [trackAction, isActingAs]);

  return {
    trackCandidateAction,
    trackAssessmentAction,
    trackCompanyAction,
    trackUserAction,
  };
};

export default useActingAs;