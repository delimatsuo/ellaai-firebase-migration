import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  styled,
  alpha,
  Fab,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  School,
  Work,
  People,
  Speed,
  CheckCircle,
  Add,
  Analytics,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/theme';
import StatsCard from '../components/ui/StatsCard';
import ActivityFeed, { sampleActivities } from '../components/dashboard/ActivityFeed';
import PerformanceChart from '../components/charts/PerformanceChart';
import GlassCard from '../components/ui/GlassCard';
import AssessmentCard, { sampleAssessments } from '../components/assessments/AssessmentCard';
import CandidateCard, { sampleCandidates } from '../components/candidates/CandidateCard';

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

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  background: colors.gradient.primary,
  color: 'white',
  zIndex: theme.zIndex.fab,
  '&:hover': {
    background: colors.gradient.primary,
    transform: 'scale(1.1)',
  },
}));

const QuickActionCard = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const isCandidate = userProfile?.role === 'candidate';
  const userName = userProfile?.displayName?.split(' ')[0] || 'User';

  const candidateStats = [
    {
      title: 'Available Assessments',
      value: '12',
      subtitle: 'Ready to take',
      icon: <Assessment sx={{ fontSize: 28, color: colors.primary[500] }} />,
      trend: { value: 3, isPositive: true },
      gradient: colors.gradient.primary,
    },
    {
      title: 'Completed',
      value: '8',
      subtitle: 'This month',
      icon: <CheckCircle sx={{ fontSize: 28, color: colors.secondary[500] }} />,
      trend: { value: 12, isPositive: true },
      gradient: colors.gradient.secondary,
    },
    {
      title: 'Average Score',
      value: '87%',
      subtitle: 'All assessments',
      icon: <TrendingUp sx={{ fontSize: 28, color: '#10B981' }} />,
      trend: { value: 5, isPositive: true },
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    },
    {
      title: 'Time Saved',
      value: '24h',
      subtitle: 'This month',
      icon: <Speed sx={{ fontSize: 28, color: '#F59E0B' }} />,
      trend: { value: 8, isPositive: true },
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
  ];

  const companyStats = [
    {
      title: 'Total Assessments',
      value: '45',
      subtitle: 'Active assessments',
      icon: <Assessment sx={{ fontSize: 28, color: colors.primary[500] }} />,
      trend: { value: 8, isPositive: true },
      gradient: colors.gradient.primary,
    },
    {
      title: 'Candidates',
      value: '238',
      subtitle: 'This month',
      icon: <People sx={{ fontSize: 28, color: colors.secondary[500] }} />,
      trend: { value: 15, isPositive: true },
      gradient: colors.gradient.secondary,
    },
    {
      title: 'Completion Rate',
      value: '92%',
      subtitle: 'Average rate',
      icon: <TrendingUp sx={{ fontSize: 28, color: '#10B981' }} />,
      trend: { value: 3, isPositive: true },
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    },
    {
      title: 'Time Efficiency',
      value: '67%',
      subtitle: 'Faster hiring',
      icon: <Speed sx={{ fontSize: 28, color: '#F59E0B' }} />,
      trend: { value: 12, isPositive: true },
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
  ];

  const stats = isCandidate ? candidateStats : companyStats;

  const quickActions = isCandidate
    ? [
        {
          title: 'Take Assessment',
          icon: <Assessment />,
          action: () => navigate('/assessments'),
          color: colors.primary[500],
        },
        {
          title: 'View Results',
          icon: <Analytics />,
          action: () => navigate('/assessments?filter=completed'),
          color: colors.secondary[500],
        },
      ]
    : [
        {
          title: 'Create Assessment',
          icon: <Add />,
          action: () => navigate('/company/assessments/create'),
          color: colors.primary[500],
        },
        {
          title: 'View Candidates',
          icon: <People />,
          action: () => navigate('/company/candidates'),
          color: colors.secondary[500],
        },
      ];

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <HeroSection>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, position: 'relative', zIndex: 1 }}>
            Welcome back, {userName}! 👋
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, position: 'relative', zIndex: 1 }}>
            {isCandidate 
              ? 'Ready to showcase your skills with our next-generation assessments?' 
              : 'Streamline your hiring process with intelligent assessments'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, position: 'relative', zIndex: 1 }}>
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <Button
                  variant="contained"
                  startIcon={action.icon}
                  onClick={action.action}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {action.title}
                </Button>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </HeroSection>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              trend={stat.trend}
              gradient={stat.gradient}
              delay={index * 0.1}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <PerformanceChart
            title={isCandidate ? 'Your Performance Trends' : 'Assessment Analytics'}
            height={320}
            data={[]}
          />
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12} lg={4}>
          <ActivityFeed activities={sampleActivities} maxItems={8} />
        </Grid>

        {/* Recent Assessments or Candidates */}
        <Grid item xs={12}>
          <GlassCard variant="light" animate={false}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                {isCandidate ? 'Available Assessments' : 'Recent Candidates'}
              </Typography>
              
              <Grid container spacing={3}>
                {isCandidate ? (
                  sampleAssessments.slice(0, 3).map((assessment, index) => (
                    <Grid item xs={12} md={4} key={assessment.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <AssessmentCard
                          assessment={assessment}
                          variant="candidate"
                          onStart={(assessment) => {
                            console.log('Starting assessment:', assessment.title);
                            navigate('/assessments');
                          }}
                        />
                      </motion.div>
                    </Grid>
                  ))
                ) : (
                  sampleCandidates.slice(0, 3).map((candidate, index) => (
                    <Grid item xs={12} md={4} key={candidate.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <CandidateCard
                          candidate={candidate}
                          variant="compact"
                          onViewProfile={(candidate) => {
                            console.log('Viewing profile:', candidate.name);
                            navigate('/company/candidates');
                          }}
                          onSendEmail={(candidate) => {
                            console.log('Sending email to:', candidate.email);
                          }}
                          onScheduleInterview={(candidate) => {
                            console.log('Scheduling interview with:', candidate.name);
                          }}
                        />
                      </motion.div>
                    </Grid>
                  ))
                )}
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(isCandidate ? '/assessments' : '/company/candidates')}
                  sx={{ borderRadius: 3 }}
                >
                  {isCandidate ? 'View All Assessments' : 'View All Candidates'}
                </Button>
              </Box>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => navigate(isCandidate ? '/assessments' : '/company/assessments/create')}
      >
        <Add />
      </FloatingActionButton>
    </Container>
  );
};

export default DashboardPage;