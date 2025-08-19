import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Tab,
  Tabs,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Group as GroupIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { UserInvitation, BulkInvitationRequest } from '../../services/users/userService';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface UserInvitationDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (invitations: BulkInvitationRequest) => Promise<void>;
  companies?: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`invitation-tabpanel-${index}`}
    aria-labelledby={`invitation-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const UserInvitationDialog: React.FC<UserInvitationDialogProps> = ({
  open,
  onClose,
  onInvite,
  companies = [],
  defaultCompanyId,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Single invitation form
  const [singleInvitation, setSingleInvitation] = useState<UserInvitation>({
    email: '',
    role: 'candidate',
    companyId: defaultCompanyId || '',
    displayName: '',
    customMessage: '',
  });

  // Bulk invitations
  const [bulkInvitations, setBulkInvitations] = useState<UserInvitation[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string>('');

  // Settings
  const [sendImmediately, setSendImmediately] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState(7);

  const roles = [
    { value: 'candidate', label: 'Candidate' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'admin', label: 'Company Admin' },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSingleInvitationChange = (field: keyof UserInvitation, value: string) => {
    setSingleInvitation(prev => ({ ...prev, [field]: value }));
  };

  const addBulkInvitation = () => {
    setBulkInvitations(prev => [...prev, {
      email: '',
      role: 'candidate',
      companyId: defaultCompanyId || '',
      displayName: '',
    }]);
  };

  const updateBulkInvitation = (index: number, field: keyof UserInvitation, value: string) => {
    setBulkInvitations(prev => prev.map((inv, i) => 
      i === index ? { ...inv, [field]: value } : inv
    ));
  };

  const removeBulkInvitation = (index: number) => {
    setBulkInvitations(prev => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setCsvError(`CSV parsing error: ${results.errors[0].message}`);
            return;
          }

          const validData = results.data.filter((row: any) => row.email);
          setCsvPreview(validData);
          setCsvError('');

          // Convert to invitations
          const invitations: UserInvitation[] = validData.map((row: any) => ({
            email: row.email || '',
            role: row.role || 'candidate',
            companyId: row.companyId || defaultCompanyId || '',
            displayName: row.displayName || row.name || '',
            customMessage: row.customMessage || '',
          }));

          setBulkInvitations(invitations);
          setTabValue(1); // Switch to bulk tab
        },
        error: (error) => {
          setCsvError(`CSV parsing error: ${error.message}`);
        },
      });
    };

    reader.readAsText(file);
  }, [defaultCompanyId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const downloadTemplate = () => {
    const template = [
      ['email', 'displayName', 'role', 'companyId', 'customMessage'],
      ['john.doe@example.com', 'John Doe', 'candidate', defaultCompanyId || '', 'Welcome to our platform!'],
      ['jane.smith@example.com', 'Jane Smith', 'recruiter', defaultCompanyId || '', ''],
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_invitation_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const validateInvitations = (invitations: UserInvitation[]): string[] => {
    const errors: string[] = [];
    const emails = new Set<string>();

    invitations.forEach((inv, index) => {
      if (!inv.email) {
        errors.push(`Row ${index + 1}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
      } else if (emails.has(inv.email)) {
        errors.push(`Row ${index + 1}: Duplicate email ${inv.email}`);
      } else {
        emails.add(inv.email);
      }

      if (!inv.role) {
        errors.push(`Row ${index + 1}: Role is required`);
      }

      if (companies.length > 0 && !inv.companyId) {
        errors.push(`Row ${index + 1}: Company is required`);
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    let invitations: UserInvitation[] = [];

    if (tabValue === 0) {
      // Single invitation
      if (!singleInvitation.email || !singleInvitation.role) {
        toast.error('Please fill in all required fields');
        return;
      }
      invitations = [singleInvitation];
    } else {
      // Bulk invitations
      if (bulkInvitations.length === 0) {
        toast.error('Please add at least one invitation');
        return;
      }
      invitations = bulkInvitations;
    }

    const validationErrors = validateInvitations(invitations);
    if (validationErrors.length > 0) {
      toast.error(`Validation errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress for bulk operations
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onInvite({
        invitations,
        sendImmediately,
        expiresInDays,
      });

      clearInterval(progressInterval);
      setProgress(100);

      toast.success(`Successfully sent ${invitations.length} invitation(s)`);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setSingleInvitation({
      email: '',
      role: 'candidate',
      companyId: defaultCompanyId || '',
      displayName: '',
      customMessage: '',
    });
    setBulkInvitations([]);
    setCsvPreview([]);
    setCsvError('');
    setTabValue(0);
    setProgress(0);
    onClose();
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ color: '#9333EA' }} />
          <Typography variant="h6">Send User Invitations</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                height: 4,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #6B46C1, #9333EA)',
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: '#ccc' },
              '& .Mui-selected': { color: '#9333EA' },
              '& .MuiTabs-indicator': { bgcolor: '#9333EA' },
            }}
          >
            <Tab label="Single Invitation" />
            <Tab label="Bulk Invitations" />
            <Tab label="CSV Upload" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Single Invitation Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={singleInvitation.email}
                  onChange={(e) => handleSingleInvitationChange('email', e.target.value)}
                  required
                  InputProps={{
                    sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                  }}
                  InputLabelProps={{ sx: { color: '#ccc' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={singleInvitation.displayName}
                  onChange={(e) => handleSingleInvitationChange('displayName', e.target.value)}
                  InputProps={{
                    sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                  }}
                  InputLabelProps={{ sx: { color: '#ccc' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#ccc' }}>Role</InputLabel>
                  <Select
                    value={singleInvitation.role}
                    onChange={(e) => handleSingleInvitationChange('role', e.target.value)}
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {companies.length > 0 && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ccc' }}>Company</InputLabel>
                    <Select
                      value={singleInvitation.companyId}
                      onChange={(e) => handleSingleInvitationChange('companyId', e.target.value)}
                      sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Custom Message (Optional)"
                  multiline
                  rows={3}
                  value={singleInvitation.customMessage}
                  onChange={(e) => handleSingleInvitationChange('customMessage', e.target.value)}
                  placeholder="Add a personal welcome message..."
                  InputProps={{
                    sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                  }}
                  InputLabelProps={{ sx: { color: '#ccc' } }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Bulk Invitations Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon /> Bulk Invitations ({bulkInvitations.length})
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addBulkInvitation}
                variant="outlined"
                sx={{ borderColor: '#9333EA', color: '#9333EA' }}
              >
                Add Invitation
              </Button>
            </Box>

            {bulkInvitations.length === 0 ? (
              <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#90caf9' }}>
                No invitations added yet. Click "Add Invitation" or upload a CSV file.
              </Alert>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {bulkInvitations.map((invitation, index) => (
                  <ListItem key={index} sx={{ bgcolor: '#2a2a2a', mb: 1, borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Email"
                          type="email"
                          value={invitation.email}
                          onChange={(e) => updateBulkInvitation(index, 'email', e.target.value)}
                          InputProps={{
                            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                          }}
                          InputLabelProps={{ sx: { color: '#ccc' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={invitation.displayName}
                          onChange={(e) => updateBulkInvitation(index, 'displayName', e.target.value)}
                          InputProps={{
                            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                          }}
                          InputLabelProps={{ sx: { color: '#ccc' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ color: '#ccc' }}>Role</InputLabel>
                          <Select
                            value={invitation.role}
                            onChange={(e) => updateBulkInvitation(index, 'role', e.target.value)}
                            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                          >
                            {roles.map((role) => (
                              <MenuItem key={role.value} value={role.value}>
                                {role.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      {companies.length > 0 && (
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: '#ccc' }}>Company</InputLabel>
                            <Select
                              value={invitation.companyId}
                              onChange={(e) => updateBulkInvitation(index, 'companyId', e.target.value)}
                              sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                            >
                              {companies.map((company) => (
                                <MenuItem key={company.id} value={company.id}>
                                  {company.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                      <Grid item xs={12} md={1}>
                        <IconButton
                          onClick={() => removeBulkInvitation(index)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* CSV Upload Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                CSV Upload
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                variant="outlined"
                sx={{ borderColor: '#9333EA', color: '#9333EA' }}
              >
                Download Template
              </Button>
            </Box>

            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: isDragActive ? 'rgba(147, 51, 234, 0.1)' : '#2a2a2a',
                border: `2px dashed ${isDragActive ? '#9333EA' : '#444'}`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                mb: 2,
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: '#9333EA', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                or click to select file
              </Typography>
            </Paper>

            {csvError && (
              <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f48fb1' }}>
                {csvError}
              </Alert>
            )}

            {csvPreview.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PreviewIcon /> CSV Preview ({csvPreview.length} rows)
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#2a2a2a', p: 2, borderRadius: 1 }}>
                  {csvPreview.slice(0, 10).map((row, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: '#333', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        <strong>Email:</strong> {row.email} | 
                        <strong> Name:</strong> {row.displayName || row.name || 'N/A'} | 
                        <strong> Role:</strong> {row.role || 'candidate'}
                        {row.companyId && <> | <strong>Company:</strong> {row.companyId}</>}
                      </Typography>
                    </Box>
                  ))}
                  {csvPreview.length > 10 && (
                    <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center', mt: 2 }}>
                      ... and {csvPreview.length - 10} more rows
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </TabPanel>

          {/* Settings */}
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #333' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Invitation Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sendImmediately}
                      onChange={(e) => setSendImmediately(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#9333EA' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#9333EA' },
                      }}
                    />
                  }
                  label="Send invitations immediately"
                  sx={{ color: '#fff' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invitation expires in (days)"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  InputProps={{
                    sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                  }}
                  InputLabelProps={{ sx: { color: '#ccc' } }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #333' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ color: '#ccc' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
            },
          }}
        >
          {loading ? 'Sending...' : `Send ${
            tabValue === 0 ? '1 Invitation' : 
            tabValue === 1 ? `${bulkInvitations.length} Invitations` :
            `${csvPreview.length} Invitations`
          }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserInvitationDialog;