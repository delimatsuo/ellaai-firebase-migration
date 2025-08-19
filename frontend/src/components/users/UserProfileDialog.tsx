import React, { useState, useEffect } from 'react';
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
  Grid,
  Avatar,
  Chip,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { UserProfile } from '../../types/admin';
import { UpdateUserRequest } from '../../services/users/userService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdate?: (userId: string, data: UpdateUserRequest) => Promise<UserProfile>;
  onSuspend?: (userId: string, reason: string) => Promise<void>;
  onReactivate?: (userId: string) => Promise<void>;
  companies?: Array<{ id: string; name: string }>;
  isReadOnly?: boolean;
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
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onClose,
  user,
  onUpdate,
  onSuspend,
  onReactivate,
  companies = [],
  isReadOnly = false,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<UpdateUserRequest>({});
  
  // Suspension state
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspensionDialog, setShowSuspensionDialog] = useState(false);

  const roles = [
    { value: 'candidate', label: 'Candidate', color: '#4caf50' },
    { value: 'recruiter', label: 'Recruiter', color: '#2196f3' },
    { value: 'hiring_manager', label: 'Hiring Manager', color: '#ff9800' },
    { value: 'admin', label: 'Company Admin', color: '#f44336' },
    { value: 'system_admin', label: 'System Admin', color: '#9c27b0' },
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        role: user.role,
        companyId: user.companyId || '',
        isActive: user.isActive,
      });
      
      // Load user activity (mock data for now)
      setUserActivity([
        { action: 'Login', timestamp: new Date(), details: 'User logged in successfully' },
        { action: 'Profile Update', timestamp: new Date(Date.now() - 86400000), details: 'Updated display name' },
        { action: 'Assessment Taken', timestamp: new Date(Date.now() - 172800000), details: 'Completed JavaScript Developer assessment' },
      ]);
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Reset form data if canceling
      setFormData({
        displayName: user?.displayName || '',
        role: user?.role || '',
        companyId: user?.companyId || '',
        isActive: user?.isActive || false,
      });
    }
    setEditMode(!editMode);
  };

  const handleFormChange = (field: keyof UpdateUserRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !onUpdate) return;

    setLoading(true);
    try {
      await onUpdate(user.uid, formData);
      setEditMode(false);
      toast.success('User profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!user || !onSuspend || !suspensionReason.trim()) return;

    setLoading(true);
    try {
      await onSuspend(user.uid, suspensionReason);
      setShowSuspensionDialog(false);
      setSuspensionReason('');
      toast.success('User suspended successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!user || !onReactivate) return;

    setLoading(true);
    try {
      await onReactivate(user.uid);
      toast.success('User reactivated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    return roles.find(r => r.value === role)?.color || '#666';
  };

  const getCompanyName = (companyId?: string) => {
    return companies.find(c => c.id === companyId)?.name || companyId || 'N/A';
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e1e1e',
          backgroundImage: 'linear-gradient(135deg, rgba(107, 70, 193, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          border: '1px solid #333',
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #333', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: getRoleColor(user.role),
                fontSize: '1.5rem',
              }}
            >
              {user.displayName?.[0] || user.email[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {user.displayName || 'Unnamed User'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={user.role.replace('_', ' ')} 
                  size="small"
                  sx={{ 
                    bgcolor: getRoleColor(user.role), 
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                />
                <Chip 
                  label={user.isActive ? 'Active' : 'Suspended'} 
                  size="small"
                  color={user.isActive ? 'success' : 'error'}
                />
                {!user.emailVerified && (
                  <Chip 
                    label="Email Unverified" 
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isReadOnly && (
              <>
                {editMode ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleEditToggle}
                      sx={{ borderColor: '#666', color: '#ccc' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
                        },
                      }}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditToggle}
                    sx={{ borderColor: '#9333EA', color: '#9333EA' }}
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
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
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<HistoryIcon />} label="Activity" />
            <Tab icon={<SettingsIcon />} label="Settings" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #444' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon /> Basic Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Display Name"
                          value={editMode ? formData.displayName : user.displayName || ''}
                          onChange={(e) => handleFormChange('displayName', e.target.value)}
                          disabled={!editMode}
                          InputProps={{
                            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                          }}
                          InputLabelProps={{ sx: { color: '#ccc' } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          value={user.email}
                          disabled
                          InputProps={{
                            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                          }}
                          InputLabelProps={{ sx: { color: '#ccc' } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth disabled={!editMode}>
                          <InputLabel sx={{ color: '#ccc' }}>Role</InputLabel>
                          <Select
                            value={editMode ? formData.role : user.role}
                            onChange={(e) => handleFormChange('role', e.target.value)}
                            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                          >
                            {roles.map((role) => (
                              <MenuItem key={role.value} value={role.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 12, height: 12, bgcolor: role.color, borderRadius: '50%' }} />
                                  {role.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      {companies.length > 0 && (
                        <Grid item xs={12}>
                          <FormControl fullWidth disabled={!editMode}>
                            <InputLabel sx={{ color: '#ccc' }}>Company</InputLabel>
                            <Select
                              value={editMode ? formData.companyId : user.companyId || ''}
                              onChange={(e) => handleFormChange('companyId', e.target.value)}
                              sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                            >
                              <MenuItem value="">
                                <em>No Company</em>
                              </MenuItem>
                              {companies.map((company) => (
                                <MenuItem key={company.id} value={company.id}>
                                  {company.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #444' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon /> Account Information
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon sx={{ color: '#9333EA' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Email Verified"
                          secondary={user.emailVerified ? 'Yes' : 'No'}
                          primaryTypographyProps={{ color: '#fff' }}
                          secondaryTypographyProps={{ color: user.emailVerified ? '#4caf50' : '#f44336' }}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon sx={{ color: '#9333EA' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Account Created"
                          secondary={user.createdAt.toLocaleDateString()}
                          primaryTypographyProps={{ color: '#fff' }}
                          secondaryTypographyProps={{ color: '#ccc' }}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <TimeIcon sx={{ color: '#9333EA' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Sign In"
                          secondary={user.lastSignIn ? formatDistanceToNow(user.lastSignIn, { addSuffix: true }) : 'Never'}
                          primaryTypographyProps={{ color: '#fff' }}
                          secondaryTypographyProps={{ color: '#ccc' }}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon sx={{ color: '#9333EA' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Company"
                          secondary={getCompanyName(user.companyId)}
                          primaryTypographyProps={{ color: '#fff' }}
                          secondaryTypographyProps={{ color: '#ccc' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {user.suspendedAt && (
                <Grid item xs={12}>
                  <Alert 
                    severity="warning" 
                    sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ffb74d' }}
                  >
                    <Typography variant="h6" sx={{ mb: 1 }}>Account Suspended</Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {user.suspendedAt.toLocaleString()}<br />
                      <strong>Reason:</strong> {user.suspensionReason}<br />
                      <strong>By:</strong> {user.suspendedBy}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #444' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon /> Account Security
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Account Status"
                          secondary={
                            <Chip 
                              label={user.isActive ? 'Active' : 'Suspended'}
                              color={user.isActive ? 'success' : 'error'}
                              size="small"
                            />
                          }
                          primaryTypographyProps={{ color: '#fff' }}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText
                          primary="Email Verification"
                          secondary={
                            <Chip 
                              label={user.emailVerified ? 'Verified' : 'Unverified'}
                              color={user.emailVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          }
                          primaryTypographyProps={{ color: '#fff' }}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText
                          primary="Two-Factor Authentication"
                          secondary={
                            <Chip 
                              label="Disabled"
                              color="default"
                              size="small"
                            />
                          }
                          primaryTypographyProps={{ color: '#fff' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #444' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                      Account Actions
                    </Typography>
                    
                    {!isReadOnly && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {user.isActive ? (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<BlockIcon />}
                            onClick={() => setShowSuspensionDialog(true)}
                            sx={{ justifyContent: 'flex-start' }}
                          >
                            Suspend Account
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={handleReactivate}
                            disabled={loading}
                            sx={{ justifyContent: 'flex-start' }}
                          >
                            Reactivate Account
                          </Button>
                        )}
                        
                        <Button
                          variant="outlined"
                          startIcon={<EmailIcon />}
                          sx={{ justifyContent: 'flex-start', borderColor: '#9333EA', color: '#9333EA' }}
                        >
                          Send Password Reset
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={tabValue} index={2}>
            <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #444' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon /> Recent Activity
                </Typography>
                
                <TableContainer component={Paper} sx={{ bgcolor: '#333' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Action</TableCell>
                        <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Time</TableCell>
                        <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userActivity.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                            {activity.action}
                          </TableCell>
                          <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </TableCell>
                          <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>
                            {activity.details}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel value={tabValue} index={3}>
            <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #444' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon /> User Settings
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editMode ? formData.isActive : user.isActive}
                          onChange={(e) => handleFormChange('isActive', e.target.checked)}
                          disabled={!editMode}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#9333EA' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#9333EA' },
                          }}
                        />
                      }
                      label="Account Active"
                      sx={{ color: '#fff' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.emailVerified}
                          disabled
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4caf50' },
                          }}
                        />
                      }
                      label="Email Verified"
                      sx={{ color: '#fff' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #333' }}>
        <Button onClick={onClose} sx={{ color: '#ccc' }}>
          Close
        </Button>
      </DialogActions>

      {/* Suspension Dialog */}
      <Dialog
        open={showSuspensionDialog}
        onClose={() => setShowSuspensionDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            border: '1px solid #333',
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Suspend User Account
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Suspension Reason"
            multiline
            rows={3}
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            placeholder="Enter the reason for suspending this account..."
            sx={{ mt: 2 }}
            InputProps={{
              sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
            }}
            InputLabelProps={{ sx: { color: '#ccc' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuspensionDialog(false)} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSuspend}
            variant="contained"
            color="error"
            disabled={!suspensionReason.trim() || loading}
          >
            Suspend Account
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default UserProfileDialog;