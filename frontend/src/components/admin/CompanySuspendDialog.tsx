import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
} from '@mui/material';
import {
  Block as BlockIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { CompanyAccount, CompanySuspensionRequest } from '../../types/admin';
import { adminService } from '../../services/admin/adminService';
import toast from 'react-hot-toast';

interface CompanySuspendDialogProps {
  open: boolean;
  company: CompanyAccount | null;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'suspend' | 'reactivate';
}

const CompanySuspendDialog: React.FC<CompanySuspendDialogProps> = ({
  open,
  company,
  onClose,
  onSuccess,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanySuspensionRequest>>({
    reason: '',
    duration: undefined,
    pauseBilling: true,
    notifyUsers: true,
    restrictAccess: true,
    customMessage: '',
  });
  const [reactivationReason, setReactivationReason] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        reason: '',
        duration: undefined,
        pauseBilling: true,
        notifyUsers: true,
        restrictAccess: true,
        customMessage: '',
      });
      setReactivationReason('');
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!company) return;

    if (mode === 'suspend' && !formData.reason) {
      toast.error('Please provide a suspension reason');
      return;
    }

    if (mode === 'reactivate' && !reactivationReason) {
      toast.error('Please provide a reactivation reason');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'suspend') {
        await adminService.suspendCompanyWithDetails(company.id, formData as CompanySuspensionRequest);
        toast.success('Company suspended successfully');
      } else {
        await adminService.reactivateCompany(company.id, reactivationReason);
        toast.success('Company reactivated successfully');
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(`Failed to ${mode} company:`, error);
      toast.error(`Failed to ${mode} company`);
    } finally {
      setLoading(false);
    }
  };

  const getDurationLabel = (days: number | undefined) => {
    if (!days) return 'Indefinite';
    if (days === 1) return '1 day';
    if (days === 7) return '1 week';
    if (days === 14) return '2 weeks';
    if (days === 30) return '1 month';
    if (days === 90) return '3 months';
    return `${days} days`;
  };

  const canSubmit = () => {
    if (mode === 'suspend') {
      return formData.reason?.trim() !== '';
    } else {
      return reactivationReason.trim() !== '';
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
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mode === 'suspend' ? (
            <BlockIcon color="warning" />
          ) : (
            <PlayIcon color="success" />
          )}
          <Typography variant="h6">
            {mode === 'suspend' ? 'Suspend' : 'Reactivate'} Company: {company?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {mode === 'suspend' ? (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> Suspending a company will immediately restrict access for all users 
                and may pause billing depending on your configuration.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Suspension Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={3}
              required
              sx={{ mb: 3 }}
              helperText="Provide a clear reason for the suspension that will be visible to administrators"
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Suspension Duration</InputLabel>
              <Select
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value ? Number(e.target.value) : undefined })}
                label="Suspension Duration"
              >
                <MenuItem value="">Indefinite (Manual reactivation required)</MenuItem>
                <MenuItem value={1}>1 Day</MenuItem>
                <MenuItem value={7}>1 Week</MenuItem>
                <MenuItem value={14}>2 Weeks</MenuItem>
                <MenuItem value={30}>1 Month</MenuItem>
                <MenuItem value={90}>3 Months</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Suspension Configuration
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <PaymentIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Pause Billing"
                  secondary="Stop billing charges during suspension period"
                />
                <Switch
                  checked={formData.pauseBilling}
                  onChange={(e) => setFormData({ ...formData, pauseBilling: e.target.checked })}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Restrict Access"
                  secondary="Block all user login attempts"
                />
                <Switch
                  checked={formData.restrictAccess}
                  onChange={(e) => setFormData({ ...formData, restrictAccess: e.target.checked })}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <NotificationIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Notify Users"
                  secondary="Send suspension notification to all company users"
                />
                <Switch
                  checked={formData.notifyUsers}
                  onChange={(e) => setFormData({ ...formData, notifyUsers: e.target.checked })}
                />
              </ListItem>
            </List>

            {formData.notifyUsers && (
              <TextField
                fullWidth
                label="Custom Message (Optional)"
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                multiline
                rows={2}
                sx={{ mt: 2 }}
                helperText="Additional message to include in the suspension notification"
              />
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suspension Summary:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={`Duration: ${getDurationLabel(formData.duration)}`}
                  size="small"
                  icon={<ScheduleIcon />}
                />
                {formData.pauseBilling && (
                  <Chip 
                    label="Billing Paused"
                    size="small"
                    color="warning"
                    icon={<PaymentIcon />}
                  />
                )}
                {formData.restrictAccess && (
                  <Chip 
                    label="Access Blocked"
                    size="small"
                    color="error"
                    icon={<SecurityIcon />}
                  />
                )}
                {formData.notifyUsers && (
                  <Chip 
                    label="Users Notified"
                    size="small"
                    color="info"
                    icon={<NotificationIcon />}
                  />
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Reactivation:</strong> This will restore full access to the company account 
                and resume normal operations.
              </Typography>
            </Alert>

            <Typography variant="body1" sx={{ mb: 2 }}>
              You are about to reactivate the company account for <strong>{company?.name}</strong>.
            </Typography>

            {company?.notes && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Previous Suspension Reason:</strong> {company.notes}
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              label="Reactivation Reason"
              value={reactivationReason}
              onChange={(e) => setReactivationReason(e.target.value)}
              multiline
              rows={3}
              required
              sx={{ mb: 3 }}
              helperText="Provide a reason for reactivating this company account"
            />

            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
              <Typography variant="subtitle2" gutterBottom>
                Upon reactivation:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• All users will regain access to their accounts" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Billing will resume according to their current plan" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• All company data and settings will be restored" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Users will receive a reactivation notification" />
                </ListItem>
              </List>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={mode === 'suspend' ? 'warning' : 'success'}
          onClick={handleSubmit}
          disabled={!canSubmit() || loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} />
            ) : mode === 'suspend' ? (
              <BlockIcon />
            ) : (
              <PlayIcon />
            )
          }
        >
          {loading ? 'Processing...' : mode === 'suspend' ? 'Suspend Company' : 'Reactivate Company'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanySuspendDialog;