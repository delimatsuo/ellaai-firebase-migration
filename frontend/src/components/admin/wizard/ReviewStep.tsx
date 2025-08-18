import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  alpha,
} from '@mui/material';
import {
  Preview as ReviewIcon,
  Business as BusinessIcon,
  CreditCard as PlanIcon,
  Payment as BillingIcon,
  Person as AdminIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { CompanyWizardData } from '../../../types/admin';

interface ReviewStepProps {
  data: CompanyWizardData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Credit Card';
      case 'invoice': return 'Invoice (Net 30)';
      case 'trial': return 'Free Trial';
      default: return method;
    }
  };

  const maskCardNumber = (number?: string) => {
    if (!number) return '';
    return `**** **** **** ${number.slice(-4)}`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ 
        color: '#6B46C1', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <ReviewIcon />
        Review & Confirm
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 4, color: '#64748b' }}>
        Please review all the information below before creating the company account.
      </Typography>

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: alpha('#6B46C1', 0.02),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#6B46C1',
              }}>
                <BusinessIcon />
                Company Information
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Company Name"
                    secondary={data.companyInfo.name}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Domain"
                    secondary={data.companyInfo.domain}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Industry"
                    secondary={data.companyInfo.industry}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Company Size"
                    secondary={data.companyInfo.size}
                  />
                </ListItem>
                {data.companyInfo.description && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Description"
                      secondary={data.companyInfo.description}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: alpha('#9333EA', 0.02),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#9333EA',
              }}>
                <PlanIcon />
                Selected Plan
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Plan"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {data.planSelection.plan?.name}
                        {data.planSelection.plan?.popular && (
                          <Chip 
                            label="Popular" 
                            size="small" 
                            sx={{ 
                              bgcolor: '#6B46C1', 
                              color: '#fff',
                              fontSize: '0.7rem',
                            }} 
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Billing Interval"
                    secondary={data.planSelection.billingInterval === 'year' ? 'Yearly (20% discount)' : 'Monthly'}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Price"
                    secondary={
                      data.planSelection.plan?.price === 0 
                        ? 'Free'
                        : `$${data.planSelection.plan?.price}/${data.planSelection.billingInterval}`
                    }
                  />
                </ListItem>
                {data.planSelection.plan?.trialDays && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Trial Period"
                      secondary={`${data.planSelection.plan.trialDays} days`}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Billing Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: alpha('#4ade80', 0.02),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#059669',
              }}>
                <BillingIcon />
                Billing Information
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Payment Method"
                    secondary={formatPaymentMethod(data.billingInfo.paymentMethod)}
                  />
                </ListItem>
                
                {data.billingInfo.paymentMethod === 'credit_card' && data.billingInfo.cardDetails && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Card"
                      secondary={`${maskCardNumber(data.billingInfo.cardDetails.number)} (${data.billingInfo.cardDetails.name})`}
                    />
                  </ListItem>
                )}
                
                {data.billingInfo.paymentMethod !== 'trial' && (
                  <>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Billing Address"
                        secondary={
                          <Box>
                            <Typography variant="body2">{data.billingInfo.billingAddress.street}</Typography>
                            <Typography variant="body2">
                              {data.billingInfo.billingAddress.city}, {data.billingInfo.billingAddress.state} {data.billingInfo.billingAddress.zipCode}
                            </Typography>
                            <Typography variant="body2">{data.billingInfo.billingAddress.country}</Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    
                    {data.billingInfo.taxId && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Tax ID"
                          secondary={data.billingInfo.taxId}
                        />
                      </ListItem>
                    )}
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin User */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: alpha('#f59e0b', 0.02),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#d97706',
              }}>
                <AdminIcon />
                Administrator
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Name"
                    secondary={`${data.adminUser.firstName} ${data.adminUser.lastName}`}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Email"
                    secondary={data.adminUser.email}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Job Title"
                    secondary={data.adminUser.jobTitle}
                  />
                </ListItem>
                {data.adminUser.phone && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Phone"
                      secondary={data.adminUser.phone}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid item xs={12}>
          <Card sx={{ 
            border: '2px solid #6B46C1',
            borderRadius: 2,
            bgcolor: alpha('#6B46C1', 0.05),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                mb: 3,
                color: '#6B46C1',
                textAlign: 'center',
              }}>
                What happens next?
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckIcon sx={{ fontSize: 40, color: '#4ade80', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Company Created
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Your company account will be set up
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AdminIcon sx={{ fontSize: 40, color: '#6B46C1', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Admin Account
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Admin user will be created with full access
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <BillingIcon sx={{ fontSize: 40, color: '#9333EA', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Billing Setup
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Payment method will be configured
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 40, color: '#059669', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Ready to Use
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Company can start using the platform
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewStep;