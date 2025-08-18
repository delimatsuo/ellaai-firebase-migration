import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Code,
  Timer,
  Star,
  PlayArrow,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Assessment {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  totalQuestions: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  completedAt?: Date;
}

const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || '');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, this would be an API call
      const mockAssessments: Assessment[] = [
        {
          id: '1',
          title: 'JavaScript Fundamentals',
          description: 'Test your knowledge of JavaScript basics, including variables, functions, and control flow.',
          language: 'JavaScript',
          difficulty: 'beginner',
          estimatedTime: 30,
          totalQuestions: 15,
          status: 'completed',
          score: 85,
          completedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          title: 'React Component Development',
          description: 'Build interactive React components and demonstrate your understanding of hooks and state management.',
          language: 'JavaScript',
          difficulty: 'intermediate',
          estimatedTime: 45,
          totalQuestions: 12,
          status: 'in_progress',
        },
        {
          id: '3',
          title: 'Python Data Structures',
          description: 'Implement and manipulate various data structures using Python.',
          language: 'Python',
          difficulty: 'intermediate',
          estimatedTime: 40,
          totalQuestions: 18,
          status: 'not_started',
        },
        {
          id: '4',
          title: 'Advanced TypeScript',
          description: 'Master advanced TypeScript concepts including generics, decorators, and type manipulation.',
          language: 'TypeScript',
          difficulty: 'advanced',
          estimatedTime: 60,
          totalQuestions: 20,
          status: 'not_started',
        },
      ];

      setAssessments(mockAssessments);
      setError(null);
    } catch (err) {
      setError('Failed to load assessments. Please try again.');
      console.error('Error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = !languageFilter || assessment.language === languageFilter;
    const matchesDifficulty = !difficultyFilter || assessment.difficulty === difficultyFilter;
    const matchesStatus = !statusFilter || assessment.status === statusFilter;
    
    return matchesSearch && matchesLanguage && matchesDifficulty && matchesStatus;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'not_started': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return 'Available';
    }
  };

  const handleStartAssessment = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  const handleViewResults = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}/results`);
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Technical Assessments
        </Typography>
        
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Test your skills with our comprehensive technical assessments
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  label="Language"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="JavaScript">JavaScript</MenuItem>
                  <MenuItem value="Python">Python</MenuItem>
                  <MenuItem value="TypeScript">TypeScript</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  label="Difficulty"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="not_started">Available</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Assessment Cards */}
        <Grid container spacing={3}>
          {filteredAssessments.map((assessment) => (
            <Grid item xs={12} md={6} key={assessment.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
                      {assessment.title}
                    </Typography>
                    <Chip
                      label={getStatusText(assessment.status)}
                      color={getStatusColor(assessment.status) as any}
                      size="small"
                      icon={assessment.status === 'completed' ? <CheckCircle /> : undefined}
                    />
                  </Box>

                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {assessment.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={assessment.language}
                      color="primary"
                      variant="outlined"
                      size="small"
                      icon={<Code />}
                    />
                    <Chip
                      label={assessment.difficulty}
                      color={getDifficultyColor(assessment.difficulty) as any}
                      variant="outlined"
                      size="small"
                      icon={<Star />}
                    />
                    <Chip
                      label={`${assessment.estimatedTime} min`}
                      variant="outlined"
                      size="small"
                      icon={<Timer />}
                    />
                    <Chip
                      label={`${assessment.totalQuestions} questions`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {assessment.status === 'completed' && assessment.score && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Score: <strong>{assessment.score}%</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completed on {assessment.completedAt?.toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  {assessment.status === 'completed' ? (
                    <Button
                      size="small"
                      onClick={() => handleViewResults(assessment.id)}
                      variant="outlined"
                    >
                      View Results
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      onClick={() => handleStartAssessment(assessment.id)}
                      variant="contained"
                      startIcon={<PlayArrow />}
                    >
                      {assessment.status === 'in_progress' ? 'Continue' : 'Start Assessment'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredAssessments.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No assessments found matching your criteria
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default AssessmentsPage;