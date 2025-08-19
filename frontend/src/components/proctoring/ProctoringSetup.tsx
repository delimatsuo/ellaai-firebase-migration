import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Stack,
  Paper,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  CheckCircle,
  Warning,
  ArrowForward,
  Security,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const VideoPreview = styled('video')({
  width: '100%',
  maxWidth: '480px',
  height: 'auto',
  borderRadius: '8px',
  background: '#000',
  transform: 'scaleX(-1)', // Mirror the video
});

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
}));

interface ProctoringSetupProps {
  onComplete: (sessionData: {
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenShareEnabled: boolean;
    consent: boolean;
  }) => void;
  assessmentTitle: string;
  requiredFeatures: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  };
}

export const ProctoringSetup: React.FC<ProctoringSetupProps> = ({
  onComplete,
  assessmentTitle,
  requiredFeatures,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    screenShare: false,
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const steps = [
    'System Check',
    'Camera Setup',
    'Microphone Setup',
    'Screen Share',
    'Review & Consent',
  ];

  // Filter steps based on required features
  const getActiveSteps = () => {
    const activeSteps = ['System Check'];
    if (requiredFeatures.camera) activeSteps.push('Camera Setup');
    if (requiredFeatures.microphone) activeSteps.push('Microphone Setup');
    if (requiredFeatures.screenShare) activeSteps.push('Screen Share');
    activeSteps.push('Review & Consent');
    return activeSteps;
  };

  const activeSteps = getActiveSteps();

  useEffect(() => {
    return () => {
      // Cleanup streams on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream, microphoneStream, screenStream]);

  const testCamera = async () => {
    setLoading(true);
    setErrors({});
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissions(prev => ({ ...prev, camera: true }));
    } catch (error: any) {
      setErrors({ camera: 'Camera access denied. Please allow camera access to continue.' });
    } finally {
      setLoading(false);
    }
  };

  const testMicrophone = async () => {
    setLoading(true);
    setErrors({});
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneStream(stream);
      setPermissions(prev => ({ ...prev, microphone: true }));
    } catch (error: any) {
      setErrors({ microphone: 'Microphone access denied. Please allow microphone access to continue.' });
    } finally {
      setLoading(false);
    }
  };

  const testScreenShare = async () => {
    setLoading(true);
    setErrors({});
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      setScreenStream(stream);
      setPermissions(prev => ({ ...prev, screenShare: true }));
      // Stop screen share after test
      setTimeout(() => {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }, 3000);
    } catch (error: any) {
      setErrors({ screenShare: 'Screen share access denied. Please allow screen sharing to continue.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === activeSteps.length - 1) {
      // Final step - complete setup
      onComplete({
        cameraEnabled: permissions.camera,
        microphoneEnabled: permissions.microphone,
        screenShareEnabled: permissions.screenShare,
        consent,
      });
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const canProceed = () => {
    const currentStepName = activeSteps[activeStep];
    switch (currentStepName) {
      case 'System Check':
        return true;
      case 'Camera Setup':
        return permissions.camera;
      case 'Microphone Setup':
        return permissions.microphone;
      case 'Screen Share':
        return permissions.screenShare;
      case 'Review & Consent':
        return consent;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    const currentStepName = activeSteps[activeStep];
    
    switch (currentStepName) {
      case 'System Check':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">System Requirements Check</Typography>
            <Typography variant="body2" color="text.secondary">
              We need to verify your system meets the requirements for proctored assessment.
            </Typography>
            <Stack spacing={2}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Required for this assessment:
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {requiredFeatures.camera && (
                    <Chip icon={<Videocam />} label="Webcam" size="small" />
                  )}
                  {requiredFeatures.microphone && (
                    <Chip icon={<Mic />} label="Microphone" size="small" />
                  )}
                  {requiredFeatures.screenShare && (
                    <Chip icon={<ScreenShare />} label="Screen Sharing" size="small" />
                  )}
                </Stack>
              </Alert>
              <Alert severity="warning">
                Please ensure you are in a quiet, well-lit environment with a stable internet connection.
              </Alert>
            </Stack>
          </Stack>
        );

      case 'Camera Setup':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Camera Setup</Typography>
            <Typography variant="body2" color="text.secondary">
              We need to access your camera to monitor the assessment session.
            </Typography>
            {!permissions.camera ? (
              <Stack spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<Videocam />}
                  onClick={testCamera}
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : 'Enable Camera'}
                </Button>
                {errors.camera && (
                  <Alert severity="error">{errors.camera}</Alert>
                )}
              </Stack>
            ) : (
              <Stack spacing={2} alignItems="center">
                <VideoPreview ref={videoRef} autoPlay muted />
                <Alert severity="success" icon={<CheckCircle />}>
                  Camera enabled successfully
                </Alert>
              </Stack>
            )}
          </Stack>
        );

      case 'Microphone Setup':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Microphone Setup</Typography>
            <Typography variant="body2" color="text.secondary">
              We need to access your microphone to record audio during the assessment.
            </Typography>
            {!permissions.microphone ? (
              <Stack spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<Mic />}
                  onClick={testMicrophone}
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : 'Enable Microphone'}
                </Button>
                {errors.microphone && (
                  <Alert severity="error">{errors.microphone}</Alert>
                )}
              </Stack>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>
                Microphone enabled successfully
              </Alert>
            )}
          </Stack>
        );

      case 'Screen Share':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Screen Sharing Setup</Typography>
            <Typography variant="body2" color="text.secondary">
              We need to record your screen during the assessment to ensure integrity.
            </Typography>
            {!permissions.screenShare ? (
              <Stack spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<ScreenShare />}
                  onClick={testScreenShare}
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : 'Test Screen Share'}
                </Button>
                {errors.screenShare && (
                  <Alert severity="error">{errors.screenShare}</Alert>
                )}
              </Stack>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>
                Screen sharing tested successfully
              </Alert>
            )}
          </Stack>
        );

      case 'Review & Consent':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Review & Consent</Typography>
            <Alert severity="info" icon={<Security />}>
              <Typography variant="subtitle2" gutterBottom>
                Proctoring Summary for: {assessmentTitle}
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Typography variant="body2">
                  • Your session will be recorded for review
                </Typography>
                <Typography variant="body2">
                  • AI will monitor for suspicious behavior
                </Typography>
                <Typography variant="body2">
                  • Recording will be deleted after 30 days
                </Typography>
                <Typography variant="body2">
                  • Only authorized personnel can review recordings
                </Typography>
              </Stack>
            </Alert>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I understand and consent to the proctoring terms. I agree to be recorded
                    during this assessment and understand that the recording will be used
                    solely for assessment integrity purposes.
                  </Typography>
                }
              />
            </Paper>

            {consent && (
              <Alert severity="success" icon={<CheckCircle />}>
                Setup complete! You're ready to begin the assessment.
              </Alert>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard elevation={3}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Proctoring Setup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete the setup to begin your proctored assessment
          </Typography>
        </Box>

        <Stepper activeStep={activeStep}>
          {activeSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300 }}>
          {renderStepContent()}
        </Box>

        <Stack direction="row" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!canProceed()}
            endIcon={activeStep === activeSteps.length - 1 ? <CheckCircle /> : <ArrowForward />}
          >
            {activeStep === activeSteps.length - 1 ? 'Start Assessment' : 'Next'}
          </Button>
        </Stack>
      </Stack>
    </GlassCard>
  );
};

export default ProctoringSetup;