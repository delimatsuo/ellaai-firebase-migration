import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { UserProfile } from '../../types/admin';

interface ImpersonationModalProps {
  open: boolean;
  onClose: () => void;
  onImpersonate: (userId: string, reason: string, duration: number) => void;
}

const ImpersonationModal: React.FC<ImpersonationModalProps> = ({
  open,
  onClose,
  onImpersonate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [durationType, setDurationType] = useState<'preset' | 'custom'>('preset');
  const [customDuration, setCustomDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const presetDurations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
  ];

  const reasonOptions = [
    'Customer Support',
    'Technical Investigation',
    'Data Migration',
    'Security Investigation',
    'User Assistance',
    'System Testing',
    'Other',
  ];

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUsers: UserProfile[] = [
        {
          uid: 'user_1',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          role: 'candidate',
          companyId: 'company_1',
          emailVerified: true,
          createdAt: new Date('2024-01-15'),
          lastSignIn: new Date('2024-01-18'),
          isActive: true,
        },
        {
          uid: 'user_2',
          email: 'jane.smith@techcorp.com',
          displayName: 'Jane Smith',
          role: 'recruiter',
          companyId: 'company_2',
          emailVerified: true,
          createdAt: new Date('2024-01-10'),
          lastSignIn: new Date('2024-01-17'),
          isActive: true,
        },
        {
          uid: 'user_3',
          email: 'bob.wilson@startup.io',
          displayName: 'Bob Wilson',
          role: 'hiring_manager',
          companyId: 'company_3',
          emailVerified: false,
          createdAt: new Date('2024-01-05'),
          isActive: false,
          suspendedAt: new Date('2024-01-16'),
        },
      ];

      const filtered = mockUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const handleImpersonate = () => {
    if (!selectedUser || !reason) return;

    const finalDuration = durationType === 'preset' ? duration : parseInt(customDuration);
    onImpersonate(selectedUser.uid, reason, finalDuration);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
    setReason('');
    setDuration(60);
    setDurationType('preset');
    setCustomDuration('');
    onClose();
  };

  const canImpersonate = selectedUser && reason && 
    (durationType === 'preset' || (durationType === 'custom' && customDuration));

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { bgcolor: '#2a2a2a', color: '#fff' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <SecurityIcon sx={{ color: '#ff4444' }} />
        User Impersonation
      </DialogTitle>

      <DialogContent>
        <Alert 
          severity="error" 
          sx={{ mb: 3, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336' }}
        >
          <Typography variant="body2">
            <strong>SECURITY WARNING:</strong> User impersonation grants full access to the target user's account. 
            This action is logged and monitored. Only use for legitimate business purposes.
          </Typography>
        </Alert>

        {/* User Search */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            1. Select User to Impersonate
          </Typography>
          <TextField
            fullWidth
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#ccc' }} />
                </InputAdornment>
              ),
              sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
            }}
            sx={{ mb: 2 }}
          />

          {searchResults.length > 0 && (
            <TableContainer sx={{ maxHeight: 300, border: '1px solid #444', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ccc', bgcolor: '#333' }}>User</TableCell>
                    <TableCell sx={{ color: '#ccc', bgcolor: '#333' }}>Role</TableCell>
                    <TableCell sx={{ color: '#ccc', bgcolor: '#333' }}>Status</TableCell>
                    <TableCell sx={{ color: '#ccc', bgcolor: '#333' }}>Last Sign In</TableCell>
                    <TableCell sx={{ color: '#ccc', bgcolor: '#333' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((user) => (
                    <TableRow 
                      key={user.uid}
                      sx={{ 
                        bgcolor: selectedUser?.uid === user.uid ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                      }}
                    >
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{user.displayName || 'N/A'}</Typography>
                            <Typography variant="caption" sx={{ color: '#ccc' }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        <Chip label={user.role} size="small" sx={{ bgcolor: '#444', color: '#fff' }} />
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Suspended'} 
                          size="small"
                          color={user.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {user.lastSignIn?.toLocaleDateString() || 'Never'}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        <Button
                          size="small"
                          onClick={() => handleUserSelect(user)}
                          disabled={!user.isActive}
                          sx={{ color: '#ff4444' }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Selected User */}
        {selectedUser && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#333', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>Selected User:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar>{selectedUser.displayName?.[0] || selectedUser.email?.[0]?.toUpperCase() || 'U'}</Avatar>
              <Box>
                <Typography variant="body1">{selectedUser.displayName}</Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>{selectedUser.email}</Typography>
                <Typography variant="caption" sx={{ color: '#ccc' }}>
                  {selectedUser.role} • Company: {selectedUser.companyId}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Reason */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            2. Specify Reason
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#ccc' }}>Reason for Impersonation</InputLabel>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
            >
              {reasonOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Duration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            3. Set Session Duration
          </Typography>
          <RadioGroup
            value={durationType}
            onChange={(e) => setDurationType(e.target.value as 'preset' | 'custom')}
          >
            <FormControlLabel 
              value="preset" 
              control={<Radio sx={{ color: '#ccc' }} />} 
              label="Preset Duration"
              sx={{ color: '#ccc' }}
            />
            {durationType === 'preset' && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <FormControl>
                  <Select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    size="small"
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                  >
                    {presetDurations.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <FormControlLabel 
              value="custom" 
              control={<Radio sx={{ color: '#ccc' }} />} 
              label="Custom Duration"
              sx={{ color: '#ccc' }}
            />
            {durationType === 'custom' && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Minutes"
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                    sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                  }}
                />
              </Box>
            )}
          </RadioGroup>
        </Box>

        {/* Session Info */}
        <Alert 
          severity="info" 
          sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3' }}
        >
          <Typography variant="body2">
            The impersonation session will automatically expire after the specified duration. 
            You can end the session early at any time.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ color: '#ccc' }}>
          Cancel
        </Button>
        <Button 
          onClick={handleImpersonate}
          disabled={!canImpersonate}
          variant="contained"
          sx={{ 
            bgcolor: '#ff4444', 
            '&:hover': { bgcolor: '#cc3333' },
            '&:disabled': { bgcolor: '#666' }
          }}
        >
          Start Impersonation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImpersonationModal;