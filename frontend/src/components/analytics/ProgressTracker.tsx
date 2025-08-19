import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Timeline,
  Speed,
  Assessment,
  Person,
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  Info,
  Visibility,
  Close
} from '@mui/icons-material';

import { ProgressTracking, RealTimeUpdate } from '@/types/analytics';
import { resultsService } from '@/services/analytics/resultsService';

interface ProgressTrackerProps {
  entityId: string;
  entityType: 'assessment' | 'candidate';
  title?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onStatusChange?: (progress: ProgressTracking) => void;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
  details?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  entityId,
  entityType,
  title,
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5,
  onStatusChange
}) => {
  const [progress, setProgress] = useState<ProgressTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [realTimeConnected, setRealTimeConnected] = useState(false);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadProgress();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [entityId, entityType, autoRefresh, refreshInterval]);

  // Real-time updates
  useEffect(() => {
    if (!entityId) return;

    const cleanup = resultsService.subscribeToRealTimeUpdates(
      [entityId],
      handleRealTimeUpdate,
      handleRealTimeError
    );

    setRealTimeConnected(true);

    return () => {
      cleanup();
      setRealTimeConnected(false);
    };
  }, [entityId]);

  // Initial load
  useEffect(() => {
    loadProgress();
  }, [entityId, entityType]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const progressData = await resultsService.getProgressTracking(entityId, entityType);
      setProgress(progressData);
      
      if (onStatusChange) {
        onStatusChange(progressData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
      console.error('Progress tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = (update: RealTimeUpdate) => {
    if (!update.affectedEntities.includes(entityId)) return;

    // Update progress based on real-time data
    if (update.type === 'assessment_completed' || 
        update.type === 'assessment_started' || 
        update.type === 'score_calculated') {
      loadProgress(); // Refresh progress data
    }
  };

  const handleRealTimeError = (error: Event) => {
    console.error('Real-time connection error:', error);
    setRealTimeConnected(false);
    
    // Try to reconnect after a delay
    setTimeout(() => {
      setRealTimeConnected(true);
    }, 5000);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getProgressSteps = (): ProgressStep[] => {
    if (!progress) return [];

    const baseSteps: ProgressStep[] = [
      {
        id: 'start',
        label: 'Assessment Started',
        status: progress.progress > 0 ? 'completed' : 'pending'
      },
      {
        id: 'questions',
        label: `Questions (${progress.realTimeStats.questionsAnswered}/${progress.realTimeStats.totalQuestions})`,
        status: progress.realTimeStats.questionsAnswered > 0 ? 
                progress.realTimeStats.questionsAnswered === progress.realTimeStats.totalQuestions ? 'completed' : 'in_progress'
                : 'pending'
      },
      {
        id: 'submission',
        label: 'Submission & Evaluation',
        status: progress.progress === 100 ? 'completed' : 
                progress.progress > 90 ? 'in_progress' : 'pending'
      },
      {
        id: 'completion',
        label: 'Results Available',
        status: progress.progress === 100 ? 'completed' : 'pending'
      }
    ];

    return baseSteps;
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'in_progress': return <CircularProgress size={20} />;
      case 'failed': return <Warning color="error" />;
      default: return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={loadProgress} startIcon={<Refresh />}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No progress data available for this {entityType}.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {entityType === 'assessment' ? <Assessment /> : <Person />}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {title || `${entityType === 'assessment' ? 'Assessment' : 'Candidate'} Progress`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.currentStage}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title={realTimeConnected ? "Real-time updates active" : "Connecting..."}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: realTimeConnected ? 'success.main' : 'warning.main' 
                  }} 
                />
              </Tooltip>
              
              <IconButton size="small" onClick={loadProgress}>
                <Refresh />
              </IconButton>
              
              {showDetails && (
                <IconButton size="small" onClick={() => setDetailsOpen(true)}>
                  <Visibility />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {progress.progress}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              color={progress.progress === 100 ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Stats Grid */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6">
                  {progress.realTimeStats.questionsAnswered}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Questions Answered
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6">
                  {formatTime(progress.realTimeStats.timeElapsed)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Time Elapsed
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6">
                  {formatTime(progress.realTimeStats.averageTimePerQuestion)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg per Question
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6">
                  {progress.estimatedCompletion ? 
                    formatTime(Math.max(0, Math.floor((new Date(progress.estimatedCompletion).getTime() - Date.now()) / 1000))) :
                    '—'
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Est. Remaining
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Current Status */}
          <Box mt={2}>
            <Chip
              label={progress.currentStage}
              color={getStatusColor(progress.progress === 100 ? 'completed' : 'in_progress') as any}
              icon={progress.progress === 100 ? <CheckCircle /> : <CircularProgress size={16} />}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Progress Details</Typography>
            <IconButton onClick={() => setDetailsOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Progress Timeline
          </Typography>
          
          <List>
            {getProgressSteps().map((step, index) => (
              <React.Fragment key={step.id}>
                <ListItem>
                  <ListItemIcon>
                    {getStepIcon(step.status)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={step.label}
                    secondary={step.details || 
                      (step.timestamp ? 
                        `Completed at ${step.timestamp.toLocaleTimeString()}` : 
                        null)
                    }
                  />
                  
                  {step.duration && (
                    <ListItemSecondaryAction>
                      <Chip
                        label={formatTime(step.duration)}
                        size="small"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                
                {index < getProgressSteps().length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Real-time Statistics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Questions Progress:
                </Typography>
                <Typography variant="body1">
                  {progress.realTimeStats.questionsAnswered} / {progress.realTimeStats.totalQuestions}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Time:
                </Typography>
                <Typography variant="body1">
                  {formatTime(progress.realTimeStats.timeElapsed)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Average Time/Question:
                </Typography>
                <Typography variant="body1">
                  {formatTime(progress.realTimeStats.averageTimePerQuestion)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Completion:
                </Typography>
                <Typography variant="body1">
                  {progress.estimatedCompletion ? 
                    new Date(progress.estimatedCompletion).toLocaleTimeString() : 
                    'Not available'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProgressTracker;