import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Alert,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import { ArrowBack, Security } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { ProctoringSetup } from '../components/proctoring/ProctoringSetup';
import { proctoringService } from '../services/proctoring/proctoringService';
import { AssessmentData } from '../components/assessments/AssessmentWizard';

interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  candidateId: string;
  companyId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  startedAt?: Date;
  completedAt?: Date;
  proctoringSession?: {
    sessionId: string;
    status: string;
    trustScore?: number;
  };
}

const TakeAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'proctoring_setup' | 'assessment' | 'completed'>('loading');
  const [proctoringRequired, setProctoringRequired] = useState(false);

  useEffect(() => {
    if (assessmentId && user) {
      loadAssessment();
    }
  }, [assessmentId, user]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!assessmentId) {
        throw new Error('Assessment ID is required');
      }
      
      if (!user) {
        throw new Error('User authentication required');
      }
      
      // Load assessment data
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Assessment not found or access denied');
      }
      
      const assessmentData = await response.json();
      setAssessment(assessmentData.assessment);
      
      // Check if proctoring is required
      const proctoring = await proctoringService.isProctoringRequired(assessmentId);
      setProctoringRequired(proctoring);
      
      // Load or create assessment attempt
      const attemptResponse = await fetch(`/api/assessments/${assessmentId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          candidateId: user.uid,
        }),
      });
      
      if (!attemptResponse.ok) {
        throw new Error('Failed to create assessment attempt');
      }
      
      const attemptData = await attemptResponse.json();
      setAttempt(attemptData.attempt);
      
      // Determine next step
      if (proctoring && !attemptData.attempt.proctoringSession) {
        setStep('proctoring_setup');
      } else {
        setStep('assessment');
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProctoringSetupComplete = async (sessionData: {
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenShareEnabled: boolean;
    consent: boolean;
  }) => {
    try {
      if (!sessionData.consent) {
        setError('Consent is required to proceed with the assessment');
        return;
      }

      setLoading(true);
      
      // Create proctoring session
      const session = await proctoringService.createSession(
        assessmentId!,
        user!.uid,
        user!.companyId || 'default'
      );
      
      // Update attempt with proctoring session
      setAttempt(prev => prev ? {
        ...prev,
        proctoringSession: {
          sessionId: session.sessionId,
          status: 'pending',
        }
      } : null);
      
      // Start the proctoring session
      proctoringService.startProctoringSession(session.initUrl, {
        mode: 'redirect'
      });
      
    } catch (err: any) {
      setError(`Failed to setup proctoring: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    if (!attempt) return;
    
    try {
      setLoading(true);
      
      // Start the assessment attempt
      const response = await fetch(`/api/assessments/${assessmentId}/attempt/${attempt.id}/start`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start assessment');
      }
      
      // Navigate to assessment interface
      navigate(`/assessment/${assessmentId}/take/${attempt.id}`);
      
    } catch (err: any) {
      setError(`Failed to start assessment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading && step === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={48} />
            <Typography variant="h6" color="text.secondary">
              Loading Assessment...
            </Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            variant="outlined"
          >
            Go Back
          </Button>
          
          <Alert severity="error">
            <Typography variant="subtitle2" gutterBottom>
              Error Loading Assessment
            </Typography>
            {error}
          </Alert>
        </Stack>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Assessment not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            Back to Assessments
          </Button>
          
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {assessment.basic.title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {assessment.basic.description}
          </Typography>
        </Box>

        {step === 'proctoring_setup' && proctoringRequired && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }} icon={<Security />}>
              <Typography variant="subtitle2" gutterBottom>
                Proctoring Required
              </Typography>
              This assessment requires proctoring to ensure integrity. You'll need to complete a quick setup process before beginning.
            </Alert>
            
            <ProctoringSetup
              onComplete={handleProctoringSetupComplete}
              assessmentTitle={assessment.basic.title}
              requiredFeatures={{
                camera: assessment.settings.requireWebcam,
                microphone: assessment.settings.requireWebcam, // Usually go together
                screenShare: assessment.settings.recordScreen,
              }}
            />
          </Box>
        )}

        {step === 'assessment' && (
          <Box>
            <Stack spacing={3}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Assessment Instructions
                </Typography>
                <Typography variant="body2" dangerouslySetInnerHTML={{
                  __html: assessment.basic.instructions || 'Please read each question carefully and select the best answer.'
                }} />
              </Alert>

              <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Assessment Details
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Duration:</strong> {assessment.basic.duration} minutes
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Questions:</strong> {assessment.questions.length}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Passing Score:</strong> {assessment.basic.passingScore}%
                </Typography>
                <Typography variant="body2">
                  <strong>Difficulty:</strong> {assessment.basic.difficulty}
                </Typography>
              </Box>

              {proctoringRequired && attempt?.proctoringSession && (
                <Alert severity="success" icon={<Security />}>
                  <Typography variant="subtitle2" gutterBottom>
                    Proctoring Enabled
                  </Typography>
                  Your session will be monitored for integrity. Session ID: {attempt.proctoringSession.sessionId.slice(0, 8)}...
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartAssessment}
                  disabled={loading}
                  sx={{ px: 6, py: 2 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Starting...
                    </>
                  ) : (
                    'Start Assessment'
                  )}
                </Button>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default TakeAssessment;