import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HelpOutline,
  TrendingUp,
  Code,
  Share,
  Download,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

interface QuestionResult {
  id: string;
  question: string;
  type: string;
  userAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  feedback?: string;
}

interface AssessmentResult {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number;
  completedAt: Date;
  questions: QuestionResult[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
}

const AssessmentResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadResults(id);
    }
  }, [id]);

  const loadResults = async (assessmentId: string) => {
    try {
      setLoading(true);

      // Mock data - in real app, this would be an API call
      const mockResults: AssessmentResult = {
        id: assessmentId,
        title: 'JavaScript Fundamentals',
        language: 'JavaScript',
        difficulty: 'beginner',
        score: 28,
        totalPoints: 35,
        percentage: 80,
        timeSpent: 25,
        completedAt: new Date(),
        questions: [
          {
            id: '1',
            question: 'What is the correct way to declare a variable in JavaScript?',
            type: 'multiple_choice',
            userAnswer: 'var myVariable = 5;',
            correctAnswer: 'var myVariable = 5;',
            isCorrect: true,
            points: 10,
            maxPoints: 10,
            feedback: 'Correct! var is one of the ways to declare variables in JavaScript.'
          },
          {
            id: '2',
            question: 'Write a function that returns the sum of two numbers',
            type: 'coding',
            userAnswer: `function addNumbers(a, b) {
  return a + b;
}`,
            correctAnswer: `function addNumbers(a, b) {
  return a + b;
}`,
            isCorrect: true,
            points: 15,
            maxPoints: 15,
            feedback: 'Excellent! Your solution correctly implements the function.'
          },
          {
            id: '3',
            question: 'Explain the difference between let, const, and var',
            type: 'short_answer',
            userAnswer: 'var is function scoped, let and const are block scoped',
            correctAnswer: 'var is function-scoped and can be redeclared. let is block-scoped and can be reassigned. const is block-scoped and cannot be reassigned.',
            isCorrect: false,
            points: 3,
            maxPoints: 10,
            feedback: 'Partially correct. You mentioned scoping correctly, but missed details about redeclaration and reassignment.'
          }
        ],
        overallFeedback: 'Great job! You have a solid understanding of JavaScript fundamentals. Focus on diving deeper into variable declarations and scoping.',
        strengths: [
          'Strong understanding of basic syntax',
          'Good problem-solving approach',
          'Clean and readable code'
        ],
        improvements: [
          'Study variable declarations in more detail',
          'Practice explaining concepts more thoroughly',
          'Explore advanced JavaScript features'
        ]
      };

      setResults(mockResults);
      setError(null);
    } catch (err) {
      setError('Failed to load results. Please try again.');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
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

  if (error || !results) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            {error || 'Results not found'}
          </Alert>
          <Button onClick={() => navigate('/assessments')} sx={{ mt: 2 }}>
            Back to Assessments
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>
                Assessment Results
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {results.title}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={results.language} color="primary" icon={<Code />} />
                <Chip 
                  label={results.difficulty} 
                  color={getDifficultyColor(results.difficulty) as any}
                />
                <Chip label={`${results.timeSpent} minutes`} variant="outlined" />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box textAlign="center">
                <Typography variant="h2" color={getScoreColor(results.percentage)}>
                  {results.percentage}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {results.score} / {results.totalPoints} points
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed on {results.completedAt.toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Overall Performance */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Strengths
                </Typography>
                {results.strengths.map((strength, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">{strength}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Areas for Improvement
                </Typography>
                {results.improvements.map((improvement, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="warning" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">{improvement}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Feedback */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overall Feedback
          </Typography>
          <Typography variant="body1" paragraph>
            {results.overallFeedback}
          </Typography>
        </Paper>

        {/* Question by Question */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Question Details
          </Typography>

          {results.questions.map((question, index) => (
            <Box key={question.id} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  Question {index + 1}: {question.question}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {question.points}/{question.maxPoints} pts
                  </Typography>
                  {question.isCorrect ? (
                    <CheckCircle color="success" />
                  ) : question.points > 0 ? (
                    <HelpOutline color="warning" />
                  ) : (
                    <Cancel color="error" />
                  )}
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(question.points / question.maxPoints) * 100}
                color={question.isCorrect ? 'success' : question.points > 0 ? 'warning' : 'error'}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your Answer:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: question.type === 'coding' ? 'monospace' : 'inherit',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {question.userAnswer || 'No answer provided'}
                  </Typography>
                </Paper>
              </Box>

              {question.feedback && (
                <Alert 
                  severity={question.isCorrect ? 'success' : question.points > 0 ? 'warning' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {question.feedback}
                </Alert>
              )}

              {index < results.questions.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/assessments')}
          >
            Back to Assessments
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Share />}
            onClick={() => {
              // Mock share functionality
              navigator.clipboard?.writeText(window.location.href);
            }}
          >
            Share Results
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={() => {
              // Mock download functionality
              console.log('Download results');
            }}
          >
            Download PDF
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate('/assessments')}
          >
            Take Another Assessment
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AssessmentResultsPage;