import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Domain as DomainIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { adminService } from '../../../services/admin/adminService';
import { DomainAvailabilityResult } from '../../../types/admin';

interface CompanyInfoStepProps {
  data: {
    name: string;
    domain: string;
    industry: string;
    size: string;
    description?: string;
  };
  onChange: (data: any) => void;
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Transportation',
  'Energy',
  'Government',
  'Non-profit',
  'Other',
];

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({ data, onChange }) => {
  const [domainStatus, setDomainStatus] = useState<{
    loading: boolean;
    available?: boolean;
    suggestions?: string[];
    error?: string;
  }>({ loading: false });

  const [domainCheckTimeout, setDomainCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check domain availability when domain changes
    if (data.domain && data.domain.length > 2) {
      if (domainCheckTimeout) {
        clearTimeout(domainCheckTimeout);
      }
      
      const timeout = setTimeout(() => {
        checkDomainAvailability(data.domain);
      }, 500);
      
      setDomainCheckTimeout(timeout);
    } else {
      setDomainStatus({ loading: false });
    }

    return () => {
      if (domainCheckTimeout) {
        clearTimeout(domainCheckTimeout);
      }
    };
  }, [data.domain]);

  const checkDomainAvailability = async (domain: string) => {
    setDomainStatus({ loading: true });
    
    try {
      const result: DomainAvailabilityResult = await adminService.checkDomainAvailability(domain);
      setDomainStatus({
        loading: false,
        available: result.available,
        suggestions: result.suggestions,
        error: result.available ? undefined : result.reason,
      });
    } catch (error: any) {
      setDomainStatus({
        loading: false,
        available: false,
        error: error.message || 'Failed to check domain availability',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const getDomainStatusIcon = () => {
    if (domainStatus.loading) {
      return <CircularProgress size={20} sx={{ color: '#6B46C1' }} />;
    }
    if (domainStatus.available === true) {
      return <CheckIcon sx={{ color: '#4ade80' }} />;
    }
    if (domainStatus.available === false) {
      return <ErrorIcon sx={{ color: '#ef4444' }} />;
    }
    return <DomainIcon sx={{ color: '#6B46C1' }} />;
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
        <BusinessIcon />
        Company Information
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 4, color: '#64748b' }}>
        Tell us about the company you're setting up. This information will be used to configure the account.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Name"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="e.g., TechCorp Inc."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon sx={{ color: '#6B46C1' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#6B46C1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6B46C1',
                },
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Domain"
            value={data.domain}
            onChange={(e) => handleChange('domain', e.target.value.toLowerCase())}
            required
            placeholder="e.g., techcorp"
            helperText="This will be used as your company's unique identifier and subdomain"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DomainIcon sx={{ color: '#6B46C1' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {getDomainStatusIcon()}
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#6B46C1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6B46C1',
                },
              },
            }}
          />
          
          {/* Domain Status */}
          {domainStatus.available === true && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Domain is available!
            </Alert>
          )}
          
          {domainStatus.available === false && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {domainStatus.error || 'Domain is not available'}
              {domainStatus.suggestions && domainStatus.suggestions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    Try these alternatives:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {domainStatus.suggestions.map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        size="small"
                        clickable
                        onClick={() => handleChange('domain', suggestion)}
                        sx={{ 
                          bgcolor: alpha('#6B46C1', 0.1),
                          color: '#6B46C1',
                          '&:hover': {
                            bgcolor: alpha('#6B46C1', 0.2),
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Industry</InputLabel>
            <Select
              value={data.industry}
              label="Industry"
              onChange={(e) => handleChange('industry', e.target.value)}
              sx={{
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6B46C1',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6B46C1',
                },
              }}
            >
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Company Size</InputLabel>
            <Select
              value={data.size}
              label="Company Size"
              onChange={(e) => handleChange('size', e.target.value)}
              sx={{
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6B46C1',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6B46C1',
                },
              }}
            >
              {companySizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Description"
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={3}
            placeholder="Optional: Brief description of the company and its business..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#6B46C1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6B46C1',
                },
              },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyInfoStep;