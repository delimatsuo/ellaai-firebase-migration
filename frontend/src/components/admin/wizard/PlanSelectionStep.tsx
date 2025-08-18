import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  CreditCard as PlanIcon,
  Schedule as TrialIcon,
} from '@mui/icons-material';
import { CompanyPlan } from '../../../types/admin';
import { adminService } from '../../../services/admin/adminService';
import { glassStyles } from '../../../theme/theme';

interface PlanSelectionStepProps {
  data: {
    planId: string;
    plan?: CompanyPlan;
    billingInterval: 'month' | 'year';
  };
  onChange: (data: any) => void;
}

const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({ data, onChange }) => {
  const theme = useTheme();
  const [plans, setPlans] = useState<CompanyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await adminService.getCompanyPlans();
      setPlans(plansData);
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
      // Fallback to default plans
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPlans = (): CompanyPlan[] => [
    {
      id: 'trial',
      name: 'Free Trial',
      description: 'Perfect for getting started and evaluating the platform',
      price: 0,
      interval: 'month',
      features: [
        'Up to 10 users',
        'Basic assessments',
        'Standard support',
        'Basic reporting',
        '30-day trial period',
      ],
      maxUsers: 10,
      maxAssessments: 50,
      trialDays: 30,
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for small teams',
      price: 49,
      interval: 'month',
      features: [
        'Up to 25 users',
        'All assessment types',
        'Email support',
        'Advanced reporting',
        'API access',
      ],
      maxUsers: 25,
      maxAssessments: 200,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Advanced features for growing organizations',
      price: 99,
      interval: 'month',
      features: [
        'Up to 100 users',
        'Custom assessments',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'White-label options',
      ],
      maxUsers: 100,
      maxAssessments: 1000,
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete solution for large organizations',
      price: 199,
      interval: 'month',
      features: [
        'Unlimited users',
        'Custom development',
        'Dedicated support',
        'On-premise deployment',
        'SLA guarantees',
        'Advanced security',
        'Custom training',
      ],
      maxUsers: -1,
      maxAssessments: -1,
    },
  ];

  const handlePlanSelect = (plan: CompanyPlan) => {
    onChange({
      ...data,
      planId: plan.id,
      plan,
    });
  };

  const handleBillingIntervalChange = (interval: 'month' | 'year') => {
    onChange({
      ...data,
      billingInterval: interval,
    });
  };

  const getDiscountedPrice = (price: number, interval: 'month' | 'year') => {
    if (interval === 'year') {
      return Math.round(price * 12 * 0.8); // 20% discount for annual billing
    }
    return price;
  };

  const formatPrice = (price: number, interval: 'month' | 'year') => {
    if (price === 0) return 'Free';
    const discountedPrice = getDiscountedPrice(price, interval);
    if (interval === 'year') {
      return `$${discountedPrice}/year`;
    }
    return `$${price}/month`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress sx={{ color: '#6B46C1' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ 
        color: '#6B46C1', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <PlanIcon />
        Choose Your Plan
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 4, color: '#64748b' }}>
        Select the plan that best fits your organization's needs. You can always upgrade or downgrade later.
      </Typography>

      {/* Billing Interval Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={data.billingInterval}
          exclusive
          onChange={(_, value) => value && handleBillingIntervalChange(value)}
          sx={{
            bgcolor: alpha('#6B46C1', 0.1),
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: '8px !important',
              px: 3,
              py: 1,
              '&.Mui-selected': {
                bgcolor: '#6B46C1',
                color: '#fff',
                '&:hover': {
                  bgcolor: '#5b39a8',
                },
              },
            },
          }}
        >
          <ToggleButton value="month">Monthly</ToggleButton>
          <ToggleButton value="year">
            Yearly
            <Chip 
              label="20% off" 
              size="small" 
              sx={{ 
                ml: 1, 
                bgcolor: '#4ade80', 
                color: '#fff',
                fontSize: '0.7rem',
              }} 
            />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Plans Grid */}
      <Grid container spacing={3}>
        {plans.map((plan) => {
          const isSelected = data.planId === plan.id;
          const discountedPrice = getDiscountedPrice(plan.price, data.billingInterval);
          const hasDiscount = data.billingInterval === 'year' && plan.price > 0;

          return (
            <Grid item xs={12} md={6} lg={3} key={plan.id}>
              <Card
                sx={{
                  ...glassStyles.light,
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isSelected ? '2px solid #6B46C1' : '1px solid #e2e8f0',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 8px 32px rgba(107, 70, 193, 0.2)',
                  },
                }}
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.popular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: '#6B46C1',
                      color: '#fff',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <StarIcon sx={{ fontSize: 14 }} />
                    Most Popular
                  </Box>
                )}

                <CardContent sx={{ flex: 1, pt: plan.popular ? 3 : 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {plan.name}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#6B46C1' }}>
                        {plan.price === 0 ? 'Free' : `$${discountedPrice}`}
                      </Typography>
                      {plan.price > 0 && (
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          /{data.billingInterval}
                        </Typography>
                      )}
                    </Box>
                    
                    {hasDiscount && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#64748b', 
                          textDecoration: 'line-through',
                          fontSize: '0.8rem',
                        }}
                      >
                        ${plan.price * (data.billingInterval === 'year' ? 12 : 1)}/{data.billingInterval}
                      </Typography>
                    )}

                    {plan.trialDays && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TrialIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                        <Typography variant="caption" sx={{ color: '#4ade80' }}>
                          {plan.trialDays}-day trial included
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <List dense sx={{ p: 0 }}>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: { fontSize: '0.85rem' },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={isSelected ? 'contained' : 'outlined'}
                    sx={{
                      bgcolor: isSelected ? '#6B46C1' : 'transparent',
                      borderColor: '#6B46C1',
                      color: isSelected ? '#fff' : '#6B46C1',
                      '&:hover': {
                        bgcolor: isSelected ? '#5b39a8' : alpha('#6B46C1', 0.1),
                      },
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {error && (
        <Typography variant="body2" sx={{ color: '#ef4444', mt: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default PlanSelectionStep;