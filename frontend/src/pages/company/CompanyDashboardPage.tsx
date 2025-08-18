import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Assessment,
  People,
  TrendingUp,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  DateRange,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AssessmentSummary {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  candidatesCount: number;
  completionRate: number;
  averageScore: number;
  createdAt: Date;
  status: 'active' | 'draft' | 'archived';
}

const CompanyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app, this would be an API call
      const mockAssessments: AssessmentSummary[] = [
        {
          id: '1',
          title: 'Frontend Developer Assessment',
          language: 'JavaScript',
          difficulty: 'intermediate',
          candidatesCount: 23,
          completionRate: 87,
          averageScore: 78,
          createdAt: new Date('2024-01-10'),
          status: 'active',
        },
        {
          id: '2',
          title: 'React Developer Challenge',
          language: 'JavaScript',
          difficulty: 'advanced',
          candidatesCount: 15,
          completionRate: 73,
          averageScore: 82,
          createdAt: new Date('2024-01-08'),
          status: 'active',
        },
        {
          id: '3',
          title: 'Python Backend Skills',
          language: 'Python',
          difficulty: 'intermediate',
          candidatesCount: 31,
          completionRate: 91,
          averageScore: 75,
          createdAt: new Date('2024-01-05'),
          status: 'active',
        },
        {
          id: '4',
          title: 'Junior Developer Screening',
          language: 'JavaScript',
          difficulty: 'beginner',
          candidatesCount: 8,
          completionRate: 45,
          averageScore: 68,
          createdAt: new Date('2024-01-03'),
          status: 'draft',
        },
      ];

      setAssessments(mockAssessments);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const totalCandidates = assessments.reduce((sum, assessment) => sum + assessment.candidatesCount, 0);
  const avgCompletionRate = assessments.length > 0 
    ? Math.round(assessments.reduce((sum, assessment) => sum + assessment.completionRate, 0) / assessments.length)
    : 0;
  const avgScore = assessments.length > 0 
    ? Math.round(assessments.reduce((sum, assessment) => sum + assessment.averageScore, 0) / assessments.length)
    : 0;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Company Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/company/assessments/create')}
          >
            Create Assessment
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {assessments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Assessments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {totalCandidates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Candidates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {avgCompletionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Completion Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {avgScore}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Assessments */}
        <Paper sx={{ mb: 4 }}>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Recent Assessments
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/company/candidates')}
              endIcon={<People />}
            >
              View All Candidates
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell align="center">Candidates</TableCell>
                  <TableCell align="center">Completion</TableCell>
                  <TableCell align="center">Avg Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {assessment.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={assessment.language} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={assessment.difficulty} 
                        size="small" 
                        color={getDifficultyColor(assessment.difficulty) as any}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {assessment.candidatesCount}
                    </TableCell>
                    <TableCell align="center">
                      {assessment.completionRate}%
                    </TableCell>
                    <TableCell align="center">
                      {assessment.averageScore}%
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={assessment.status} 
                        size="small" 
                        color={getStatusColor(assessment.status) as any}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DateRange sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {assessment.createdAt.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Quick Actions */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/company/assessments/create')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Add sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Create New Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Build custom technical assessments for your candidates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/company/candidates')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <People sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Manage Candidates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review candidate submissions and scores
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ cursor: 'pointer' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <TrendingUp sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View detailed performance analytics
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <Visibility sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Edit sx={{ mr: 1 }} />
            Edit Assessment
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Container>
  );
};

export default CompanyDashboardPage;