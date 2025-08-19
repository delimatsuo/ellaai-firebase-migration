import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Timer,
  Send,
  Save,
  Warning,
  Info,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { CodeEditor, SUPPORTED_LANGUAGES } from './CodeEditor';
import { TestCaseRunner, TestCase, ExecutionResult } from './TestCaseRunner';
import { useAuth } from '../../hooks/useAuth';

const AssessmentContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
}));

const HeaderBar = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ContentArea = styled(Box)({
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

const SplitPane = styled(Grid)(({ theme }) => ({
  height: '100%',
  overflow: 'hidden',
  '& .MuiGrid-item': {
    height: '100%',
    overflow: 'auto',
  },
}));

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
  points: number;
  testCases: TestCase[];
  starterCode?: {
    [languageId: string]: string;
  };
  hints?: string[];
}

export interface AssessmentAttempt {
  id: string;
  questionId: string;
  candidateId: string;
  code: string;
  language: string;
  startedAt: Date;
  timeRemaining: number; // in seconds
  submittedAt?: Date;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'expired';
  executionResult?: ExecutionResult;
  autoSaveEnabled: boolean;
}

interface AssessmentExecutionProps {
  question: Question;
  attempt: AssessmentAttempt;
  onSave: (code: string, language: string) => Promise<void>;
  onSubmit: (code: string, language: string, executionResult?: ExecutionResult) => Promise<void>;
  onRunCode: (code: string, language: string) => Promise<ExecutionResult>;
  onExit: () => void;
}

export const AssessmentExecution: React.FC<AssessmentExecutionProps> = ({
  question,
  attempt,
  onSave,
  onSubmit,
  onRunCode,
  onExit,
}) => {
  const { user } = useAuth();
  const [code, setCode] = useState(attempt.code);
  const [language, setLanguage] = useState(attempt.language);
  const [timeRemaining, setTimeRemaining] = useState(attempt.timeRemaining);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | undefined>(attempt.executionResult);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          // Auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (attempt.autoSaveEnabled && code !== attempt.code) {
      try {
        setIsSaving(true);
        await onSave(code, language);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [code, language, attempt.code, attempt.autoSaveEnabled, onSave]);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [code, language, handleAutoSave]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): 'success' | 'warning' | 'error' => {
    const timePercentage = (timeRemaining / (question.timeLimit * 60)) * 100;
    if (timePercentage > 25) return 'success';
    if (timePercentage > 10) return 'warning';
    return 'error';
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Update code with starter template if available
    const starterCode = question.starterCode?.[newLanguage];
    if (starterCode && code.trim() === '') {
      setCode(starterCode);
    } else {
      // Use default template from language configuration
      const langConfig = SUPPORTED_LANGUAGES.find(lang => lang.id === newLanguage);
      if (langConfig && code.trim() === '') {
        setCode(langConfig.defaultCode);
      }
    }
  };

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      const result = await onRunCode(code, language);
      setExecutionResult(result);
    } catch (error) {
      console.error('Code execution failed:', error);
      setExecutionResult({
        success: false,
        testResults: [],
        totalPassed: 0,
        totalTests: question.testCases.filter(tc => tc.isVisible).length,
        score: 0,
        executionTime: 0,
        error: 'Code execution failed. Please try again.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveManually = async () => {
    try {
      setIsSaving(true);
      await onSave(code, language);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(code, language, executionResult);
      setShowSubmitDialog(false);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await onSubmit(code, language, executionResult);
    } catch (error) {
      console.error('Auto-submission failed:', error);
    }
  };

  const handleExit = () => {
    setShowExitDialog(false);
    onExit();
  };

  const isTimeRunningOut = timeRemaining <= 300; // 5 minutes
  const isTimeCritical = timeRemaining <= 60; // 1 minute

  return (
    <AssessmentContainer>
      <HeaderBar elevation={2}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {question.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {question.difficulty.toUpperCase()} • {question.points} points
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {lastSaved && (
            <Typography variant="caption" color="text.secondary">
              Last saved: {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
          
          {isSaving && (
            <Chip 
              label="Saving..." 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}

          <Chip
            icon={<Timer />}
            label={formatTime(timeRemaining)}
            color={getTimeColor()}
            variant={isTimeCritical ? 'filled' : 'outlined'}
          />

          <Button
            variant="outlined"
            onClick={() => setShowExitDialog(true)}
          >
            Exit
          </Button>

          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={handleSaveManually}
            disabled={isSaving}
          >
            Save
          </Button>

          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setShowSubmitDialog(true)}
            disabled={timeRemaining <= 0}
          >
            Submit
          </Button>
        </Stack>
      </HeaderBar>

      <ContentArea>
        {isTimeRunningOut && (
          <Alert 
            severity={isTimeCritical ? "error" : "warning"} 
            sx={{ mb: 2, mx: 2 }}
            icon={<Warning />}
          >
            {isTimeCritical 
              ? `Time is almost up! Your solution will be auto-submitted in ${formatTime(timeRemaining)}.`
              : `Time is running out. You have ${formatTime(timeRemaining)} remaining.`
            }
          </Alert>
        )}

        <SplitPane container spacing={2} sx={{ px: 2, flex: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Problem Description
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {question.description}
                </Typography>

                {question.hints && question.hints.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Hints:
                    </Typography>
                    {question.hints.map((hint, index) => (
                      <Alert 
                        key={index} 
                        severity="info" 
                        sx={{ mt: 1 }}
                        icon={<Info />}
                      >
                        {hint}
                      </Alert>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <TestCaseRunner
                  testCases={question.testCases}
                  executionResult={executionResult}
                  onRunTests={handleRunCode}
                  isRunning={isRunning}
                  language={language}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ height: '100%' }}>
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                onRun={handleRunCode}
                onSave={handleSaveManually}
                language={language}
                onLanguageChange={handleLanguageChange}
                isRunning={isRunning}
                autoSave={attempt.autoSaveEnabled}
              />
            </Paper>
          </Grid>
        </SplitPane>
      </ContentArea>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              Are you sure you want to submit your solution? You won't be able to make changes after submission.
            </Typography>
            
            {executionResult && (
              <Alert severity={executionResult.totalPassed === executionResult.totalTests ? "success" : "warning"}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Test Results:
                </Typography>
                <Typography variant="body2">
                  {executionResult.totalPassed} out of {executionResult.totalTests} visible tests passed
                  <br />
                  Score: {Math.round(executionResult.score)}%
                </Typography>
              </Alert>
            )}

            <Alert severity="info">
              Your solution will also be tested against hidden test cases after submission.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" autoFocus>
            Submit Final Answer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
        <DialogTitle>Exit Assessment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to exit? Your progress will be saved, but you'll lose time.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>
            Continue Working
          </Button>
          <Button onClick={handleExit} color="warning">
            Exit Assessment
          </Button>
        </DialogActions>
      </Dialog>
    </AssessmentContainer>
  );
};

export default AssessmentExecution;