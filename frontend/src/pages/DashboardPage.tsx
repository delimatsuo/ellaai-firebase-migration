import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  School,
  Work,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const isCandidate = userProfile?.role === 'candidate';

  const candidateCards = [
    {
      title: 'Available Assessments',
      description: 'Browse and take technical assessments',
      icon: <Assessment />,
      action: () => navigate('/assessments'),
      buttonText: 'View Assessments',
    },
    {
      title: 'My Results',
      description: 'View your assessment results and performance',
      icon: <TrendingUp />,
      action: () => navigate('/assessments?filter=completed'),
      buttonText: 'View Results',
    },
    {
      title: 'Profile',
      description: 'Update your profile and preferences',
      icon: <School />,
      action: () => navigate('/profile'),
      buttonText: 'Edit Profile',
    },
  ];

  const companyCards = [
    {
      title: 'Company Dashboard',
      description: 'View company overview and metrics',
      icon: <Work />,
      action: () => navigate('/company'),
      buttonText: 'Go to Dashboard',
    },
    {
      title: 'Create Assessment',
      description: 'Create new technical assessments',
      icon: <Assessment />,
      action: () => navigate('/company/assessments/create'),
      buttonText: 'Create Assessment',
    },
    {
      title: 'Manage Candidates',
      description: 'View and manage candidate applications',
      icon: <School />,
      action: () => navigate('/company/candidates'),
      buttonText: 'View Candidates',
    },
  ];

  const cards = isCandidate ? candidateCards : companyCards;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {userProfile?.displayName || 'User'}!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {isCandidate 
            ? 'Ready to take on your next technical challenge?' 
            : 'Manage your assessments and candidates'}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          {cards.map((card, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: 'primary.main', mr: 1 }}>
                      {card.icon}
                    </Box>
                    <Typography variant="h6" component="h2">
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={card.action} variant="contained">
                    {card.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Quick Stats
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {isCandidate ? '12' : '45'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCandidate ? 'Assessments Available' : 'Total Assessments'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {isCandidate ? '3' : '128'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCandidate ? 'Completed' : 'Total Candidates'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {isCandidate ? '85%' : '92%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCandidate ? 'Average Score' : 'Completion Rate'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {isCandidate ? '7' : '23'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCandidate ? 'Days Active' : 'Active This Month'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;