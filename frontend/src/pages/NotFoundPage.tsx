import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  SearchOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'transparent',
          }}
        >
          {/* 404 Icon */}
          <SearchOff 
            sx={{ 
              fontSize: 120, 
              color: 'text.secondary',
              mb: 2,
              opacity: 0.5
            }} 
          />

          {/* Main Message */}
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '4rem', md: '6rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2,
            }}
          >
            404
          </Typography>

          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              mb: 2,
            }}
          >
            Page Not Found
          </Typography>

          <Typography 
            variant="body1" 
            color="text.secondary"
            paragraph
            sx={{
              maxWidth: 600,
              mb: 4,
              fontSize: '1.1rem',
            }}
          >
            Sorry, the page you are looking for doesn't exist or has been moved. 
            It might have been removed, renamed, or you entered the wrong URL.
          </Typography>

          {/* Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: { xs: 'column', sm: 'row' },
              mt: 3,
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{ 
                px: 4, 
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              sx={{ 
                px: 4, 
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              Go Back
            </Button>
          </Box>

          {/* Helpful Links */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              You might be looking for:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
              <Button 
                size="small" 
                onClick={() => navigate('/assessments')}
                sx={{ textTransform: 'none' }}
              >
                Assessments
              </Button>
              <Button 
                size="small" 
                onClick={() => navigate('/profile')}
                sx={{ textTransform: 'none' }}
              >
                Profile
              </Button>
              {['recruiter', 'hiring_manager', 'admin'].includes(userProfile?.role || '') && (
                <>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/company')}
                    sx={{ textTransform: 'none' }}
                  >
                    Company Dashboard
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/company/candidates')}
                    sx={{ textTransform: 'none' }}
                  >
                    Candidates
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;