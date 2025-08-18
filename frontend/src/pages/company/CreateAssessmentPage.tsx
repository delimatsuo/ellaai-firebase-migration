import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  styled,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { colors } from '../../theme/theme';
import AssessmentWizard, { AssessmentData } from '../../components/assessments/AssessmentWizard';

const HeroSection = styled(Box)(({ theme }) => ({
  background: colors.gradient.background,
  borderRadius: 24,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
}));

const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = async (data: AssessmentData) => {
    try {
      // Mock API call - save as draft
      console.log('Saving assessment as draft:', data);
      toast.success('Assessment saved as draft!');
    } catch (error) {
      console.error('Failed to save assessment:', error);
      toast.error('Failed to save assessment');
    }
  };

  const handlePublish = async (data: AssessmentData) => {
    try {
      // Mock API call - publish assessment
      console.log('Publishing assessment:', data);
      toast.success('Assessment published successfully!');
      navigate('/company');
    } catch (error) {
      console.error('Failed to publish assessment:', error);
      toast.error('Failed to publish assessment');
    }
  };


  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <HeroSection>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
            <Button
              onClick={() => navigate('/company')}
              sx={{
                color: 'white',
                mr: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <ArrowBack />
            </Button>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Create Assessment Wizard ✨
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
            Build comprehensive assessments with our intuitive step-by-step wizard
          </Typography>
        </motion.div>
      </HeroSection>

      {/* Assessment Wizard */}
      <AssessmentWizard
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </Container>
  );
};

export default CreateAssessmentPage;