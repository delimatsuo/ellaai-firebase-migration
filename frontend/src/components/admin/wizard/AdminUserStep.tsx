import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Alert,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  AccountCircle as AdminIcon,
} from '@mui/icons-material';

interface AdminUserStepProps {
  data: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    phone?: string;
  };
  onChange: (data: any) => void;
}

const AdminUserStep: React.FC<AdminUserStepProps> = ({ data, onChange }) => {
  const handleChange = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
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
        <AdminIcon />
        Admin User Setup
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 4, color: '#64748b' }}>
        Create the initial administrator account for this company. This user will have full access to manage the company's account and users.
      </Typography>

      <Alert 
        severity="info" 
        sx={{ 
          mb: 4, 
          bgcolor: alpha('#6B46C1', 0.1),
          border: '1px solid #6B46C1',
          '& .MuiAlert-icon': { color: '#6B46C1' },
        }}
      >
        <Typography variant="body2">
          <strong>Important:</strong> This user will be created with administrator privileges and will receive login credentials via email. 
          Make sure the email address is correct and accessible.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="First Name"
            value={data.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
            placeholder="John"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#6B46C1' }} />
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

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
            placeholder="Smith"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#6B46C1' }} />
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
            label="Email Address"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value.toLowerCase())}
            required
            placeholder="john.smith@company.com"
            helperText="This will be the login email for the admin account"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#6B46C1' }} />
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

        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Job Title"
            value={data.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            required
            placeholder="e.g., HR Director, Talent Acquisition Manager"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WorkIcon sx={{ color: '#6B46C1' }} />
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

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Phone Number"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            helperText="Optional"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: '#6B46C1' }} />
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
      </Grid>

      <Alert 
        severity="warning" 
        sx={{ 
          mt: 4, 
          bgcolor: alpha('#ff9800', 0.1),
          border: '1px solid #ff9800',
          '& .MuiAlert-icon': { color: '#ff9800' },
        }}
      >
        <Typography variant="body2">
          <strong>Security Note:</strong> A temporary password will be generated and sent to the admin user's email. 
          They will be required to change this password on their first login for security purposes.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AdminUserStep;