import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Report as ReportIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { CompanyAccount, CompanyClosureRequest } from '../../types/admin';
import { adminService } from '../../services/admin/adminService';
import toast from 'react-hot-toast';

interface CompanyClosureDialogProps {
  open: boolean;
  company: CompanyAccount | null;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  'Closure Reason',
  'Data Export',
  'Closure Type',
  'Confirmation'
];

const CONFIRMATION_PHRASE = 'DELETE COMPANY DATA';

const CompanyClosureDialog: React.FC<CompanyClosureDialogProps> = ({
  open,
  company,
  onClose,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyClosureRequest>>({
    reason: 'payment_issues',
    type: 'archive',
    gracePeriodDays: 30,
    exportData: true,
    exportFormats: ['json'],
    exportScopes: ['users', 'assessments'],
    notifyUsers: true,
    confirmationPhrase: '',
  });

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setFormData({
        reason: 'payment_issues',
        type: 'archive',
        gracePeriodDays: 30,
        exportData: true,
        exportFormats: ['json'],
        exportScopes: ['users', 'assessments'],
        notifyUsers: true,
        confirmationPhrase: '',
      });
    }
  }, [open]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  const handleSubmit = async () => {
    if (!company || !formData.confirmationPhrase || formData.confirmationPhrase !== CONFIRMATION_PHRASE) {
      toast.error('Please enter the correct confirmation phrase');
      return;
    }

    setLoading(true);
    try {
      await adminService.closeCompanyWithDetails(company.id, formData as CompanyClosureRequest);
      toast.success('Company closure initiated successfully');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to close company:', error);
      toast.error('Failed to initiate company closure');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return formData.reason && (formData.reason !== 'other' || formData.customReason);
      case 1:
        return !formData.exportData || (formData.exportFormats?.length && formData.exportScopes?.length);
      case 2:
        return formData.type && formData.gracePeriodDays;
      case 3:
        return formData.confirmationPhrase === CONFIRMATION_PHRASE;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Why are you closing this company account?
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Closure Reason</InputLabel>
              <Select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                label="Closure Reason"
              >
                <MenuItem value="payment_issues">Payment Issues</MenuItem>
                <MenuItem value="violation">Policy Violation</MenuItem>
                <MenuItem value="requested">Customer Requested</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {formData.reason === 'other' && (
              <TextField
                fullWidth
                label="Custom Reason"
                value={formData.customReason || ''}
                onChange={(e) => setFormData({ ...formData, customReason: e.target.value })}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> Company closure is a serious action that will affect all users and data associated with this account.
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Data Export Configuration
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.exportData}
                  onChange={(e) => setFormData({ ...formData, exportData: e.target.checked })}
                />
              }
              label="Export company data before closure"
              sx={{ mb: 3 }}
            />

            {formData.exportData && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Export Formats
                </Typography>
                <FormGroup row sx={{ mb: 3 }}>
                  {['json', 'csv', 'excel'].map((format) => (
                    <FormControlLabel
                      key={format}
                      control={
                        <Checkbox
                          checked={formData.exportFormats?.includes(format as any) || false}
                          onChange={(e) => {
                            const formats = formData.exportFormats || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, exportFormats: [...formats, format as any] });
                            } else {
                              setFormData({ ...formData, exportFormats: formats.filter(f => f !== format) });
                            }
                          }}
                        />
                      }
                      label={format.toUpperCase()}
                    />
                  ))}
                </FormGroup>

                <Typography variant="subtitle2" gutterBottom>
                  Data Scope
                </Typography>
                <FormGroup row sx={{ mb: 2 }}>
                  {[
                    { key: 'users', label: 'Users & Profiles', icon: <PeopleIcon /> },
                    { key: 'assessments', label: 'Assessments', icon: <AssessmentIcon /> },
                    { key: 'candidates', label: 'Candidates', icon: <PeopleIcon /> },
                    { key: 'reports', label: 'Reports & Analytics', icon: <ReportIcon /> }
                  ].map((scope) => (
                    <FormControlLabel
                      key={scope.key}
                      control={
                        <Checkbox
                          checked={formData.exportScopes?.includes(scope.key as any) || false}
                          onChange={(e) => {
                            const scopes = formData.exportScopes || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, exportScopes: [...scopes, scope.key as any] });
                            } else {
                              setFormData({ ...formData, exportScopes: scopes.filter(s => s !== scope.key) });
                            }
                          }}
                        />
                      }
                      label={scope.label}
                    />
                  ))}
                </FormGroup>

                <Alert severity="info">
                  <Typography variant="body2">
                    Data export will be generated before closure and made available for download. 
                    Exported data will be encrypted and available for 30 days.
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Closure Configuration
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Closure Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label="Closure Type"
              >
                <MenuItem value="archive">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArchiveIcon />
                    Archive (Recoverable)
                  </Box>
                </MenuItem>
                <MenuItem value="permanent_delete">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon />
                    Permanent Delete
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Grace Period</InputLabel>
              <Select
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value as any })}
                label="Grace Period"
              >
                <MenuItem value={7}>7 Days</MenuItem>
                <MenuItem value={14}>14 Days</MenuItem>
                <MenuItem value={30}>30 Days</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notifyUsers}
                  onChange={(e) => setFormData({ ...formData, notifyUsers: e.target.checked })}
                />
              }
              label="Send closure notification to all company users"
              sx={{ mb: 2 }}
            />

            {formData.type === 'archive' ? (
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Archive Mode:</strong> Data will be archived and account suspended. 
                  Company can be reactivated within the grace period. After {formData.gracePeriodDays} days, 
                  data will be permanently deleted.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Permanent Delete:</strong> All company data will be irreversibly deleted 
                  after the {formData.gracePeriodDays}-day grace period. This action cannot be undone.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
              Final Confirmation
            </Typography>

            <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.main', color: 'error.contrastText' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningIcon />
                <Typography variant="h6">DANGER ZONE</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You are about to {formData.type === 'archive' ? 'archive' : 'permanently delete'} the 
                company account for <strong>{company?.name}</strong>.
              </Typography>
              <Typography variant="body2">
                This will affect <strong>{company?.userCount}</strong> users and 
                <strong> {company?.assessmentCount}</strong> assessments.
              </Typography>
            </Paper>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Closure Summary:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><WarningIcon color="error" /></ListItemIcon>
                  <ListItemText 
                    primary={`Reason: ${formData.reason === 'other' ? formData.customReason : formData.reason?.replace('_', ' ')}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {formData.type === 'archive' ? <ArchiveIcon /> : <DeleteIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Type: ${formData.type === 'archive' ? 'Archive' : 'Permanent Delete'}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ScheduleIcon /></ListItemIcon>
                  <ListItemText 
                    primary={`Grace Period: ${formData.gracePeriodDays} days`}
                  />
                </ListItem>
                {formData.exportData && (
                  <ListItem>
                    <ListItemIcon><DownloadIcon /></ListItemIcon>
                    <ListItemText 
                      primary={`Data Export: ${formData.exportFormats?.join(', ')} formats`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" gutterBottom>
              To confirm this action, please type the following phrase exactly:
            </Typography>
            <Chip 
              label={CONFIRMATION_PHRASE}
              color="error"
              sx={{ mb: 2, fontFamily: 'monospace' }}
            />
            <TextField
              fullWidth
              label="Confirmation Phrase"
              value={formData.confirmationPhrase}
              onChange={(e) => setFormData({ ...formData, confirmationPhrase: e.target.value })}
              error={formData.confirmationPhrase !== '' && formData.confirmationPhrase !== CONFIRMATION_PHRASE}
              helperText={
                formData.confirmationPhrase !== '' && formData.confirmationPhrase !== CONFIRMATION_PHRASE
                  ? 'Confirmation phrase does not match'
                  : ''
              }
              sx={{ mb: 2 }}
            />

            <Alert severity="error">
              <Typography variant="body2">
                <strong>This action cannot be undone.</strong> Please ensure you have exported any 
                necessary data and notified all stakeholders before proceeding.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          minHeight: '600px',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6">
            Close Company Account: {company?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Processing...' : 'Close Company'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CompanyClosureDialog;