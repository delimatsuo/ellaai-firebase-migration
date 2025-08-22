import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  TrendingUp as GrowthIcon,
  Security as SecurityIcon,
  Speed as FastIcon,
} from '@mui/icons-material';
import CompanyCreationWizard from '../../components/admin/CompanyCreationWizard';
import { CompanyCreationResult } from '../../types/admin';
import { createAdminGradient, adminColors } from '../../theme/unifiedTheme';
import toast from 'react-hot-toast';

const CreateCompanyPage: React.FC = () => {
  const theme = useTheme();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [lastCreatedCompany, setLastCreatedCompany] = useState<CompanyCreationResult | null>(null);

  const handleWizardSuccess = (result: CompanyCreationResult) => {
    setLastCreatedCompany(result);
    setWizardOpen(false);
    toast.success('Company created successfully!');
  };

  const features = [
    {
      icon: <BusinessIcon sx={{ fontSize: 40, color: '#6B46C1' }} />,
      title: 'Complete Setup',
      description: 'Automated company setup with all necessary configurations and default settings.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#9333EA' }} />,
      title: 'Secure by Default',
      description: 'Enterprise-grade security with role-based access controls and audit logging.',
    },
    {
      icon: <FastIcon sx={{ fontSize: 40, color: '#4ade80' }} />,
      title: 'Quick Deployment',
      description: 'Get companies up and running in minutes with our streamlined wizard process.',
    },
    {
      icon: <GrowthIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
      title: 'Scalable Plans',
      description: 'Flexible pricing plans that grow with the company from startup to enterprise.',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            background: createAdminGradient('header'),
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Create New Company
          </Typography>
          <Typography variant="h6" sx={{ color: adminColors.textSecondary, mb: 4 }}>
            Set up a new company account with complete onboarding and configuration
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setWizardOpen(true)}
            sx={{
              background: createAdminGradient('button'),
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Start Company Creation Wizard
          </Button>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{
                backgroundColor: theme.palette.background.paper,
                height: '100%',
                border: `1px solid ${adminColors.border}`,
                borderRadius: 3,
                boxShadow: theme.shadows[2],
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  backgroundColor: theme.palette.admin.cardHover,
                },
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }}>
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: adminColors.textSecondary }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Last Created Company */}
        {lastCreatedCompany && (
          <Card sx={{
            backgroundColor: theme.palette.background.paper,
            border: `2px solid ${adminColors.success}`,
            bgcolor: alpha(adminColors.success, 0.05),
            borderRadius: 3,
            boxShadow: theme.shadows[2],
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                color: adminColors.success,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <BusinessIcon />
                Last Created Company
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: adminColors.textSecondary }}>Company ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {lastCreatedCompany.companyId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: adminColors.textSecondary }}>Admin User ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {lastCreatedCompany.adminUserId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: adminColors.textSecondary }}>Login URL</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
                    {lastCreatedCompany.loginUrl}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: adminColors.textSecondary }}>Temp Password</Typography>
                  <Typography variant="body1" sx={{ 
                    fontFamily: 'monospace',
                    bgcolor: alpha('#000', 0.1),
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.9rem',
                  }}>
                    {lastCreatedCompany.tempPassword}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Wizard Component */}
        <CompanyCreationWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSuccess={handleWizardSuccess}
        />
      </Box>
    </Container>
  );
};

export default CreateCompanyPage;