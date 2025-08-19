import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Security as RoleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  PlayArrow as ExecuteIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import { UserProfile } from '../../types/admin';
import { BulkUserOperation } from '../../services/users/userService';
import toast from 'react-hot-toast';

interface BulkUserOperationsProps {
  open: boolean;
  onClose: () => void;
  onExecute: (operation: BulkUserOperation) => Promise<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
  }>;
  selectedUsers: UserProfile[];
  companies?: Array<{ id: string; name: string }>;
}

type OperationType = 'suspend' | 'activate' | 'delete' | 'update_role' | 'change_company';

interface OperationConfig {
  type: OperationType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'error' | 'success' | 'warning' | 'info' | 'primary';
  confirmationRequired: boolean;
  requiresReason?: boolean;
  requiresRole?: boolean;
  requiresCompany?: boolean;
}

const operations: OperationConfig[] = [
  {
    type: 'suspend',
    title: 'Suspend Users',
    description: 'Temporarily disable user accounts',
    icon: <SuspendIcon />,
    color: 'error',
    confirmationRequired: true,
    requiresReason: true,
  },
  {
    type: 'activate',
    title: 'Activate Users',
    description: 'Re-enable suspended user accounts',
    icon: <ActivateIcon />,
    color: 'success',
    confirmationRequired: true,
  },
  {
    type: 'delete',
    title: 'Delete Users',
    description: 'Permanently remove user accounts (irreversible)',
    icon: <DeleteIcon />,
    color: 'error',
    confirmationRequired: true,
    requiresReason: true,
  },
  {
    type: 'update_role',
    title: 'Update Roles',
    description: 'Change user roles in bulk',
    icon: <RoleIcon />,
    color: 'info',
    confirmationRequired: true,
    requiresRole: true,
  },
  {
    type: 'change_company',
    title: 'Transfer to Company',
    description: 'Move users to a different company',
    icon: <AssignIcon />,
    color: 'primary',
    confirmationRequired: true,
    requiresCompany: true,
    requiresReason: true,
  },
];

const roles = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'hiring_manager', label: 'Hiring Manager' },
  { value: 'admin', label: 'Company Admin' },
];

const BulkUserOperations: React.FC<BulkUserOperationsProps> = ({
  open,
  onClose,
  onExecute,
  selectedUsers,
  companies = [],
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOperation, setSelectedOperation] = useState<OperationType | ''>('');
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
  } | null>(null);

  const steps = ['Select Operation', 'Configure', 'Confirm', 'Execute'];

  const selectedOperationConfig = operations.find(op => op.type === selectedOperation);

  const handleOperationSelect = (operationType: OperationType) => {
    setSelectedOperation(operationType);
    setCurrentStep(1);
  };

  const canProceedToConfirm = () => {
    if (!selectedOperationConfig) return false;
    
    if (selectedOperationConfig.requiresReason && !reason.trim()) return false;
    if (selectedOperationConfig.requiresRole && !newRole) return false;
    if (selectedOperationConfig.requiresCompany && !newCompanyId) return false;
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && canProceedToConfirm()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExecute = async () => {
    if (!selectedOperation || !confirmed) return;

    setLoading(true);
    setProgress(0);
    setCurrentStep(3);

    const operation: BulkUserOperation = {
      userIds: selectedUsers.map(user => user.uid),
      operation: selectedOperation as any,
      data: {
        ...(reason && { reason }),
        ...(newRole && { role: newRole }),
        ...(newCompanyId && { companyId: newCompanyId }),
      },
    };

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await onExecute(operation);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(result);

      if (result.failed.length === 0) {
        toast.success(`Successfully ${selectedOperation}ed ${result.successful.length} user(s)`);
      } else if (result.successful.length === 0) {
        toast.error(`Failed to ${selectedOperation} all users`);
      } else {
        toast.warning(`Partially completed: ${result.successful.length} successful, ${result.failed.length} failed`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute bulk operation');
      setResults({
        successful: [],
        failed: selectedUsers.map(user => ({ userId: user.uid, error: error.message })),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedOperation('');
    setReason('');
    setNewRole('');
    setNewCompanyId('');
    setConfirmed(false);
    setLoading(false);
    setProgress(0);
    setResults(null);
    onClose();
  };

  const getOperationSummary = () => {
    if (!selectedOperationConfig) return '';
    
    let summary = `${selectedOperationConfig.title} for ${selectedUsers.length} user(s)`;
    if (reason) summary += `\nReason: ${reason}`;
    if (newRole) summary += `\nNew Role: ${roles.find(r => r.value === newRole)?.label}`;
    if (newCompanyId) summary += `\nTarget Company: ${companies.find(c => c.id === newCompanyId)?.name}`;
    
    return summary;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Select Bulk Operation
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
              Choose the operation to perform on {selectedUsers.length} selected user(s)
            </Typography>
            
            <Grid container spacing={2}>
              {operations.map((operation) => (
                <Grid item xs={12} md={6} key={operation.type}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#2a2a2a',
                      border: `1px solid #444`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: operation.color === 'error' ? '#f44336' : 
                                   operation.color === 'success' ? '#4caf50' :
                                   operation.color === 'warning' ? '#ff9800' :
                                   operation.color === 'info' ? '#2196f3' : '#9333EA',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => handleOperationSelect(operation.type)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        color: operation.color === 'error' ? '#f44336' : 
                               operation.color === 'success' ? '#4caf50' :
                               operation.color === 'warning' ? '#ff9800' :
                               operation.color === 'info' ? '#2196f3' : '#9333EA',
                      }}>
                        {operation.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff' }}>
                          {operation.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          {operation.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Configure Operation: {selectedOperationConfig?.title}
            </Typography>
            
            {selectedOperationConfig?.requiresReason && (
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for this operation..."
                required
                sx={{ mb: 3 }}
                InputProps={{
                  sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                }}
                InputLabelProps={{ sx: { color: '#ccc' } }}
              />
            )}

            {selectedOperationConfig?.requiresRole && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#ccc' }}>New Role</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedOperationConfig?.requiresCompany && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#ccc' }}>Target Company</InputLabel>
                <Select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Alert 
              severity={selectedOperationConfig?.color === 'error' ? 'error' : 'info'}
              sx={{ 
                bgcolor: selectedOperationConfig?.color === 'error' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                color: selectedOperationConfig?.color === 'error' ? '#f48fb1' : '#90caf9',
              }}
            >
              {selectedOperationConfig?.description}
              {selectedOperationConfig?.type === 'delete' && (
                <><br /><strong>Warning:</strong> This action cannot be undone.</>
              )}
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Confirm Operation
            </Typography>
            
            <Alert 
              severity="warning" 
              sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ffb74d' }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {getOperationSummary()}
              </Typography>
            </Alert>

            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>
              Affected Users ({selectedUsers.length}):
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 3 }}>
              <List>
                {selectedUsers.map((user) => (
                  <ListItem key={user.uid} sx={{ bgcolor: '#2a2a2a', mb: 1, borderRadius: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#9333EA' }}>
                        {user.displayName?.[0] || user.email[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff' }}>
                          {user.displayName || 'N/A'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {user.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip 
                              label={user.role.replace('_', ' ')} 
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Chip 
                              label={user.isActive ? 'Active' : 'Suspended'} 
                              size="small"
                              color={user.isActive ? 'success' : 'error'}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  sx={{
                    color: '#9333EA',
                    '&.Mui-checked': { color: '#9333EA' },
                  }}
                />
              }
              label={
                <Typography sx={{ color: '#fff' }}>
                  I understand this action will affect {selectedUsers.length} user(s) and confirm I want to proceed
                  {selectedOperationConfig?.type === 'delete' && ' (this action cannot be undone)'}
                </Typography>
              }
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              {loading ? 'Executing Operation...' : 'Operation Complete'}
            </Typography>
            
            {loading && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{
                    height: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #6B46C1, #9333EA)',
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: '#ccc', mt: 1, textAlign: 'center' }}>
                  Processing {selectedUsers.length} user(s)... {progress}%
                </Typography>
              </Box>
            )}

            {results && (
              <Box>
                {results.successful.length > 0 && (
                  <Alert 
                    severity="success" 
                    sx={{ mb: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#a5d6a7' }}
                  >
                    Successfully processed {results.successful.length} user(s)
                  </Alert>
                )}

                {results.failed.length > 0 && (
                  <Box>
                    <Alert 
                      severity="error" 
                      sx={{ mb: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f48fb1' }}
                    >
                      Failed to process {results.failed.length} user(s)
                    </Alert>
                    
                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                      Failed Operations:
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#2a2a2a', p: 2, borderRadius: 1 }}>
                      {results.failed.map((failure, index) => (
                        <Typography key={index} variant="body2" sx={{ color: '#f48fb1', mb: 1 }}>
                          • {selectedUsers.find(u => u.uid === failure.userId)?.email}: {failure.error}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
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
          bgcolor: '#1e1e1e',
          backgroundImage: 'linear-gradient(135deg, rgba(107, 70, 193, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          border: '1px solid #333',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExecuteIcon sx={{ color: '#9333EA' }} />
            <Typography variant="h6">Bulk User Operations</Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: '#ccc' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper 
          activeStep={currentStep} 
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-label': { color: '#ccc' },
            '& .MuiStepLabel-label.Mui-active': { color: '#9333EA' },
            '& .MuiStepLabel-label.Mui-completed': { color: '#4caf50' },
            '& .MuiStepIcon-root': { color: '#444' },
            '& .MuiStepIcon-root.Mui-active': { color: '#9333EA' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #333' }}>
        {currentStep > 0 && currentStep < 3 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            sx={{ color: '#ccc' }}
          >
            Back
          </Button>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        {currentStep === 0 && (
          <Button onClick={handleClose} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
        )}
        
        {currentStep === 1 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!canProceedToConfirm()}
            sx={{
              background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
              },
            }}
          >
            Continue
          </Button>
        )}
        
        {currentStep === 2 && (
          <Button
            onClick={handleExecute}
            variant="contained"
            disabled={!confirmed || loading}
            sx={{
              background: selectedOperationConfig?.color === 'error' 
                ? 'linear-gradient(135deg, #f44336, #d32f2f)'
                : 'linear-gradient(135deg, #6B46C1, #9333EA)',
              '&:hover': {
                background: selectedOperationConfig?.color === 'error' 
                  ? 'linear-gradient(135deg, #d32f2f, #c62828)'
                  : 'linear-gradient(135deg, #5b39a8, #7c3aed)',
              },
            }}
          >
            Execute Operation
          </Button>
        )}
        
        {currentStep === 3 && !loading && (
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
              },
            }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkUserOperations;