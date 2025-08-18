import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Timer,
  CheckCircle,
  Warning,
  Code,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  type: 'multiple_choice' | 'coding' | 'short_answer';
  question: string;
  options?: string[];
  code?: string;
  language?: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  estimatedTime: number;
  questions: Question[];
}

const AssessmentTakePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssessment(id);
    }
  }, [id]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadAssessment = async (assessmentId: string) => {
    try {
      setLoading(true);
      
      // Mock data - in real app, this would be an API call
      const mockAssessment: Assessment = {
        id: assessmentId,
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of JavaScript basics',
        language: 'JavaScript',
        difficulty: 'beginner',
        estimatedTime: 30,
        questions: [
          {
            id: '1',
            type: 'multiple_choice',
            question: 'What is the correct way to declare a variable in JavaScript?',
            options: [
              'var myVariable = 5;',
              'variable myVariable = 5;',
              'v myVariable = 5;',
              'declare myVariable = 5;'
            ]
          },
          {
            id: '2',
            type: 'coding',
            question: 'Write a function that returns the sum of two numbers:',
            code: `function addNumbers(a, b) {
  // Your code here
}`,
            language: 'javascript'
          },
          {
            id: '3',
            type: 'short_answer',
            question: 'Explain the difference between let, const, and var in JavaScript:'
          }
        ]
      };

      setAssessment(mockAssessment);
      setTimeRemaining(mockAssessment.estimatedTime * 60); // Convert minutes to seconds
      setError(null);
    } catch (err) {
      setError('Failed to load assessment. Please try again.');
      console.error('Error loading assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    
    try {
      // Mock submission - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      navigate(`/assessments/${id}/results`, { 
        state: { 
          answers, 
          assessment,
          submittedAt: new Date()
        } 
      });
    } catch (err) {
      setError('Failed to submit assessment. Please try again.');
      console.error('Error submitting assessment:', err);
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!assessment) return 0;
    return ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  };

  const getAnsweredCount = () => {
    if (!assessment) return 0;
    return assessment.questions.filter(q => answers[q.id]).length;
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !assessment) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            {error || 'Assessment not found'}
          </Alert>
          <Button onClick={() => navigate('/assessments')} sx={{ mt: 2 }}>
            Back to Assessments
          </Button>
        </Box>
      </Container>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              {assessment.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={timeRemaining < 300 ? 'error' : 'primary'}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {getAnsweredCount()} of {assessment.questions.length} answered
              </Typography>
            </Box>
          </Box>

          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </Typography>
        </Paper>

        {/* Question */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <Box sx={{ mt: 2 }}>
              {currentQuestion.options.map((option, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Button
                    variant={answers[currentQuestion.id] === option ? 'contained' : 'outlined'}
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => handleAnswerChange(currentQuestion.id, option)}
                  >
                    {option}
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {currentQuestion.type === 'coding' && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code />
                <Typography variant="body2" color="text.secondary">
                  {currentQuestion.language}
                </Typography>
              </Box>
              <Box
                component="textarea"
                sx={{
                  width: '100%',
                  minHeight: 200,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  '&:focus': {
                    outline: 'none',
                    borderColor: 'primary.main',
                  }
                }}
                defaultValue={currentQuestion.code}
                placeholder="Write your code here..."
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              />
            </Box>
          )}

          {currentQuestion.type === 'short_answer' && (
            <Box sx={{ mt: 2 }}>
              <Box
                component="textarea"
                sx={{
                  width: '100%',
                  minHeight: 100,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  fontFamily: 'inherit',
                  '&:focus': {
                    outline: 'none',
                    borderColor: 'primary.main',
                  }
                }}
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              />
            </Box>
          )}
        </Paper>

        {/* Navigation */}
        <Box display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box>
            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowSubmitDialog(true)}
                startIcon={<CheckCircle />}
              >
                Submit Assessment
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>

        {/* Submit Confirmation Dialog */}
        <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
          <DialogTitle>Submit Assessment</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit your assessment? You have answered{' '}
              {getAnsweredCount()} out of {assessment.questions.length} questions.
            </Typography>
            {getAnsweredCount() < assessment.questions.length && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Warning />
                  You have unanswered questions. They will be marked as incorrect.
                </Box>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSubmitDialog(false)}>
              Continue Working
            </Button>
            <Button 
              onClick={handleSubmitAssessment} 
              variant="contained" 
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} /> : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AssessmentTakePage;