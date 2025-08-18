import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CreditCard as PlanIcon,
  Payment as BillingIcon,
  Person as AdminIcon,
  Preview as ReviewIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { CompanyWizardData, CompanyCreationResult } from '../../types/admin';
import { adminService } from '../../services/admin/adminService';
import { glassStyles } from '../../theme/theme';
import CompanyInfoStep from './wizard/CompanyInfoStep';
import PlanSelectionStep from './wizard/PlanSelectionStep';
import BillingInfoStep from './wizard/BillingInfoStep';
import AdminUserStep from './wizard/AdminUserStep';
import ReviewStep from './wizard/ReviewStep';
import toast from 'react-hot-toast';

interface CompanyCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: CompanyCreationResult) => void;
}

const steps = [
  { label: 'Company Information', icon: <BusinessIcon /> },
  { label: 'Plan Selection', icon: <PlanIcon /> },
  { label: 'Billing Information', icon: <BillingIcon /> },
  { label: 'Admin User Setup', icon: <AdminIcon /> },
  { label: 'Review & Confirm', icon: <ReviewIcon /> },
];

const CompanyCreationWizard: React.FC<CompanyCreationWizardProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [creationResult, setCreationResult] = useState<CompanyCreationResult | null>(null);

  const [wizardData, setWizardData] = useState<CompanyWizardData>({
    companyInfo: {
      name: '',
      domain: '',
      industry: '',
      size: '',
      description: '',
    },
    planSelection: {
      planId: '',
      billingInterval: 'month',
    },
    billingInfo: {
      paymentMethod: 'trial',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      },
    },
    adminUser: {
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (open) {
      // Reset wizard state when opened
      setActiveStep(0);
      setLoading(false);
      setError(null);
      setSuccess(false);
      setCreationResult(null);
    }
  }, [open]);

  const handleNext = async () => {
    setError(null);

    // Validate current step
    try {
      setLoading(true);
      const stepData = getStepData(activeStep);
      const validation = await adminService.validateWizardData(stepData);
      
      if (!validation.isValid) {
        setError(Object.values(validation.errors).join(', '));
        return;
      }

      if (activeStep === steps.length - 1) {
        // Final step - create company
        await handleCreateCompany();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleCreateCompany = async () => {
    try {
      setLoading(true);
      const result = await adminService.createCompanyWizard(wizardData);
      setCreationResult(result);
      setSuccess(true);
      toast.success('Company created successfully!');
      onSuccess?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
      toast.error('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const getStepData = (step: number) => {
    switch (step) {
      case 0: return wizardData.companyInfo;
      case 1: return wizardData.planSelection;
      case 2: return wizardData.billingInfo;
      case 3: return wizardData.adminUser;
      case 4: return wizardData;
      default: return {};
    }
  };

  const getStepName = (step: number) => {
    switch (step) {
      case 0: return 'company-info';
      case 1: return 'plan-selection';
      case 2: return 'billing-info';
      case 3: return 'admin-user';
      case 4: return 'review';
      default: return 'unknown';
    }
  };

  const updateWizardData = (stepData: any) => {
    setWizardData(prev => ({
      ...prev,
      ...stepData,
    }));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CompanyInfoStep
            data={wizardData.companyInfo}
            onChange={(data) => updateWizardData({ companyInfo: data })}
          />
        );
      case 1:
        return (
          <PlanSelectionStep
            data={wizardData.planSelection}
            onChange={(data) => updateWizardData({ planSelection: data })}
          />
        );
      case 2:
        return (
          <BillingInfoStep
            data={wizardData.billingInfo}
            planData={wizardData.planSelection}
            onChange={(data) => updateWizardData({ billingInfo: data })}
          />
        );
      case 3:
        return (
          <AdminUserStep
            data={wizardData.adminUser}
            onChange={(data) => updateWizardData({ adminUser: data })}
          />
        );
      case 4:
        return <ReviewStep data={wizardData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return wizardData.companyInfo.name && wizardData.companyInfo.domain && 
               wizardData.companyInfo.industry && wizardData.companyInfo.size;
      case 1:
        return wizardData.planSelection.planId;
      case 2:
        return wizardData.billingInfo.paymentMethod === 'trial' || 
               (wizardData.billingInfo.billingAddress.street && 
                wizardData.billingInfo.billingAddress.city &&
                wizardData.billingInfo.billingAddress.state &&
                wizardData.billingInfo.billingAddress.zipCode);
      case 3:
        return wizardData.adminUser.firstName && wizardData.adminUser.lastName && 
               wizardData.adminUser.email && wizardData.adminUser.jobTitle;
      default:
        return true;
    }
  };

  if (success && creationResult) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
            color: '#fff',
            borderRadius: 3,
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <SuccessIcon sx={{ fontSize: 80, color: '#4ade80', mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Company Created Successfully!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            {wizardData.companyInfo.name} has been set up and is ready to use.
          </Typography>
          <Box sx={{ bgcolor: alpha('#fff', 0.1), p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Company ID: {creationResult.companyId}</Typography>
            <Typography variant="body2">Admin User ID: {creationResult.adminUserId}</Typography>
            <Typography variant="body2">Login URL: {creationResult.loginUrl}</Typography>
            <Typography variant="body2">Temporary Password: {creationResult.tempPassword}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            onClick={onClose}
            sx={{ 
              bgcolor: '#fff', 
              color: '#6B46C1',
              '&:hover': { bgcolor: alpha('#fff', 0.9) }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          ...glassStyles.light,
          minHeight: '80vh',
          background: 'linear-gradient(135deg, rgba(107, 70, 193, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
        color: '#fff',
        textAlign: 'center',
        py: 3,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Create New Company
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
          Set up a new company account with admin access
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {/* Progress Stepper */}
        <Paper sx={{ ...glassStyles.medium, p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  icon={step.icon}
                  sx={{
                    '& .MuiStepIcon-root': {
                      color: index <= activeStep ? '#6B46C1' : '#e2e8f0',
                      '&.Mui-active': {
                        color: '#6B46C1',
                      },
                      '&.Mui-completed': {
                        color: '#4ade80',
                      },
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Paper sx={{ ...glassStyles.light, p: 4, minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          variant="outlined"
          sx={{ borderColor: '#6B46C1', color: '#6B46C1' }}
        >
          Back
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!canProceed() || loading}
          sx={{ 
            background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
            minWidth: 120,
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : activeStep === steps.length - 1 ? (
            'Create Company'
          ) : (
            'Next'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyCreationWizard;