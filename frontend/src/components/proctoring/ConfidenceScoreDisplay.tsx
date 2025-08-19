import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Stack,
  Tooltip,
  Paper,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RetakeIcon,
  Visibility as ReviewIcon,
  Security as SecurityIcon,
  VideocamOff,
  ScreenShare,
  ContentCopy,
  TabUnselected,
  Group,
} from '@mui/icons-material';

interface ConfidenceScoreDisplayProps {
  assessmentScore: number;
  confidenceScore: number;
  proctoringFlags?: string[];
  onOfferRetake?: () => void;
  onReviewRecording?: () => void;
  showActions?: boolean;
  sessionId?: string;
}

export const ConfidenceScoreDisplay: React.FC<ConfidenceScoreDisplayProps> = ({
  assessmentScore,
  confidenceScore,
  proctoringFlags = [],
  onOfferRetake,
  onReviewRecording,
  showActions = true,
  sessionId,
}) => {
  const getConfidenceLevel = () => {
    if (confidenceScore >= 90) return { level: 'high', color: 'success', icon: <CheckIcon /> };
    if (confidenceScore >= 75) return { level: 'medium', color: 'warning', icon: <WarningIcon /> };
    return { level: 'low', color: 'error', icon: <ErrorIcon /> };
  };

  const confidence = getConfidenceLevel();

  const getFlagIcon = (flag: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'face_not_visible': <VideocamOff />,
      'multiple_people': <Group />,
      'screen_recording': <ScreenShare />,
      'copy_paste': <ContentCopy />,
      'tab_blur': <TabUnselected />,
      'multiple_tabs': <TabUnselected />,
    };
    return iconMap[flag] || <WarningIcon />;
  };

  const formatFlag = (flag: string): string => {
    const flagMap: Record<string, string> = {
      multiple_tabs: 'Multiple browser tabs detected',
      tab_blur: 'Tab switch detected',
      face_not_visible: 'Face not visible during assessment',
      background_noise: 'Excessive background noise',
      multiple_people: 'Multiple people detected',
      screen_recording: 'Screen recording software detected',
      copy_paste: 'Copy-paste activity detected',
    };
    return flagMap[flag] || flag.replace(/_/g, ' ');
  };

  const getSeverityColor = (flag: string): 'error' | 'warning' | 'info' => {
    const highSeverity = ['multiple_people', 'screen_recording'];
    const mediumSeverity = ['copy_paste', 'multiple_tabs'];
    
    if (highSeverity.includes(flag)) return 'error';
    if (mediumSeverity.includes(flag)) return 'warning';
    return 'info';
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 2,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(24, 26, 32, 0.95) 0%, rgba(17, 18, 22, 0.95) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Proctoring Results
          </Typography>
          {sessionId && (
            <Chip 
              label={`Session: ${sessionId.slice(0, 8)}...`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Assessment Score */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assessment Score
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h3" fontWeight="bold">
                  {assessmentScore}
                  <Typography component="span" variant="h5" color="text.secondary">
                    /100
                  </Typography>
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={assessmentScore}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: (theme) => theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #6B46C1 0%, #9333EA 100%)',
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* Confidence Score */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Trust Score
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {confidence.icon}
                  <Typography variant="h3" fontWeight="bold" color={`${confidence.color}.main`}>
                    {confidenceScore}%
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={confidenceScore}
                    color={confidence.color as any}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: (theme) => theme.palette.grey[200],
                    }}
                  />
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Confidence Level: {confidence.level.charAt(0).toUpperCase() + confidence.level.slice(1)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Proctoring Flags */}
        {proctoringFlags.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Proctoring Incidents Detected
            </Typography>
            <Stack spacing={1}>
              {proctoringFlags.map((flag, index) => (
                <Alert
                  key={index}
                  severity={getSeverityColor(flag)}
                  icon={getFlagIcon(flag)}
                  sx={{
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem',
                    },
                  }}
                >
                  {formatFlag(flag)}
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {/* No Issues */}
        {proctoringFlags.length === 0 && confidenceScore >= 90 && (
          <Alert severity="success" icon={<CheckIcon />}>
            No proctoring issues detected. The assessment was completed with high integrity.
          </Alert>
        )}

        {/* Action Buttons */}
        {showActions && (
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onReviewRecording && (
              <Tooltip title="Review the proctoring session recording">
                <Button
                  variant="outlined"
                  startIcon={<ReviewIcon />}
                  onClick={onReviewRecording}
                >
                  Review Recording
                </Button>
              </Tooltip>
            )}
            {onOfferRetake && confidenceScore < 75 && (
              <Tooltip title="Offer the candidate a chance to retake the assessment">
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<RetakeIcon />}
                  onClick={onOfferRetake}
                >
                  Offer Retake
                </Button>
              </Tooltip>
            )}
          </Stack>
        )}

        {/* Summary Recommendation */}
        {confidenceScore < 75 && (
          <Alert severity="warning">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Recommendation
            </Typography>
            <Typography variant="body2">
              The trust score indicates potential integrity concerns. We recommend reviewing the 
              session recording and considering a follow-up interview or retake of the assessment.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default ConfidenceScoreDisplay;