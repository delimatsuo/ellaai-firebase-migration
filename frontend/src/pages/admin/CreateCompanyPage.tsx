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
import { glassStyles } from '../../theme/theme';
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
            background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Create New Company
          </Typography>
          <Typography variant="h6" sx={{ color: '#64748b', mb: 4 }}>
            Set up a new company account with complete onboarding and configuration
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setWizardOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(107, 70, 193, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(107, 70, 193, 0.4)',
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
                ...glassStyles.light,
                height: '100%',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(107, 70, 193, 0.15)',
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
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
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
            ...glassStyles.medium,
            border: '2px solid #4ade80',
            bgcolor: alpha('#4ade80', 0.05),
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <BusinessIcon />
                Last Created Company
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Company ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {lastCreatedCompany.companyId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Admin User ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {lastCreatedCompany.adminUserId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Login URL</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
                    {lastCreatedCompany.loginUrl}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Temp Password</Typography>
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