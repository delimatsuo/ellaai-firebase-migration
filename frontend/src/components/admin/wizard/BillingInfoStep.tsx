import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  alpha,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CreditCard as CardIcon,
  Receipt as InvoiceIcon,
  Schedule as TrialIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

interface BillingInfoStepProps {
  data: {
    paymentMethod: 'credit_card' | 'invoice' | 'trial';
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    taxId?: string;
    cardDetails?: {
      number: string;
      expiryMonth: string;
      expiryYear: string;
      cvc: string;
      name: string;
    };
  };
  planData: {
    planId: string;
    plan?: any;
    billingInterval: 'month' | 'year';
  };
  onChange: (data: any) => void;
}

const BillingInfoStep: React.FC<BillingInfoStepProps> = ({ data, planData, onChange }) => {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleAddressChange = (field: string, value: string) => {
    onChange({
      ...data,
      billingAddress: {
        ...data.billingAddress,
        [field]: value,
      },
    });
  };

  const handleCardChange = (field: string, value: string) => {
    onChange({
      ...data,
      cardDetails: {
        ...data.cardDetails,
        [field]: value,
      },
    });
  };

  const isTrialPlan = planData.planId === 'trial';
  const showBillingDetails = data.paymentMethod !== 'trial';

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ 
        color: '#6B46C1', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <PaymentIcon />
        Billing Information
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 4, color: '#64748b' }}>
        Configure billing settings for your company account.
      </Typography>

      {/* Plan Summary */}
      {planData.plan && (
        <Card sx={{ mb: 4, bgcolor: alpha('#6B46C1', 0.05), border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Selected Plan: {planData.plan.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {planData.plan.description}
            </Typography>
            <Typography variant="h6" sx={{ color: '#6B46C1', mt: 2 }}>
              {planData.plan.price === 0 ? 'Free' : `$${planData.plan.price}/${planData.billingInterval}`}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Payment Method Selection */}
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#374151', fontWeight: 'bold', mb: 2 }}>
              Payment Method
            </FormLabel>
            <RadioGroup
              value={data.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            >
              {isTrialPlan && (
                <FormControlLabel
                  value="trial"
                  control={<Radio sx={{ color: '#6B46C1', '&.Mui-checked': { color: '#6B46C1' } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrialIcon sx={{ color: '#4ade80' }} />
                      Start with Free Trial (30 days)
                    </Box>
                  }
                />
              )}
              
              <FormControlLabel
                value="credit_card"
                control={<Radio sx={{ color: '#6B46C1', '&.Mui-checked': { color: '#6B46C1' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardIcon sx={{ color: '#6B46C1' }} />
                    Credit Card
                  </Box>
                }
              />
              
              <FormControlLabel
                value="invoice"
                control={<Radio sx={{ color: '#6B46C1', '&.Mui-checked': { color: '#6B46C1' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InvoiceIcon sx={{ color: '#6B46C1' }} />
                    Invoice (Net 30)
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Credit Card Details */}
        {data.paymentMethod === 'credit_card' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Credit Card Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={data.cardDetails?.name || ''}
                onChange={(e) => handleCardChange('name', e.target.value)}
                required
                placeholder="John Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={data.cardDetails?.number || ''}
                onChange={(e) => handleCardChange('number', e.target.value.replace(/\D/g, '').slice(0, 16))}
                required
                placeholder="1234 5678 9012 3456"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CardIcon sx={{ color: '#6B46C1' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Month"
                value={data.cardDetails?.expiryMonth || ''}
                onChange={(e) => handleCardChange('expiryMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                required
                placeholder="MM"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Year"
                value={data.cardDetails?.expiryYear || ''}
                onChange={(e) => handleCardChange('expiryYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                placeholder="YYYY"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CVC"
                value={data.cardDetails?.cvc || ''}
                onChange={(e) => handleCardChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                placeholder="123"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
          </>
        )}

        {/* Billing Address */}
        {showBillingDetails && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon sx={{ color: '#6B46C1' }} />
                Billing Address
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={data.billingAddress.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                required={showBillingDetails}
                placeholder="123 Main Street"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={data.billingAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                required={showBillingDetails}
                placeholder="San Francisco"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="State"
                value={data.billingAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                required={showBillingDetails}
                placeholder="CA"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={data.billingAddress.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                required={showBillingDetails}
                placeholder="94105"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tax ID (Optional)"
                value={data.taxId || ''}
                onChange={(e) => handleChange('taxId', e.target.value)}
                placeholder="Company Tax ID or VAT Number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#6B46C1' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#6B46C1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B46C1' },
                  },
                }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default BillingInfoStep;