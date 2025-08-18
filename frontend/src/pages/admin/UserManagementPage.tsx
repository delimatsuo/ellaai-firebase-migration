import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  InputAdornment,
  Tooltip,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { UserProfile } from '../../types/admin';
import ImpersonationModal from '../../components/admin/ImpersonationModal';
import toast from 'react-hot-toast';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const roles = ['candidate', 'recruiter', 'hiring_manager', 'admin', 'system_admin'];
  const statuses = ['active', 'suspended', 'inactive'];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
          suspendedBy: 'admin@ellaai.com',
          suspensionReason: 'Policy violation',
        },
        {
          uid: 'user_4',
          email: 'admin@ellaai.com',
          displayName: 'System Admin',
          role: 'system_admin',
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
          lastSignIn: new Date('2024-01-18'),
          isActive: true,
        },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.isActive;
        if (statusFilter === 'suspended') return !user.isActive && user.suspendedAt;
        if (statusFilter === 'inactive') return !user.isActive && !user.suspendedAt;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserProfile) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleImpersonate = (userId: string, reason: string, duration: number) => {
    // Log the impersonation attempt
    console.log('Impersonation started:', { userId, reason, duration });
    
    // In a real app, this would switch the user context
    toast.success(`Impersonation session started for ${duration} minutes`);
    
    // Here you would typically:
    // 1. Create an impersonation session in the backend
    // 2. Update the auth context to reflect the impersonated user
    // 3. Redirect to the main app as the impersonated user
  };

  const handleSuspendUser = async (user: UserProfile) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUsers = users.map(u => 
        u.uid === user.uid 
          ? { ...u, isActive: false, suspendedAt: new Date(), suspensionReason: reason }
          : u
      );
      setUsers(updatedUsers);
      toast.success('User suspended successfully');
    } catch (error) {
      toast.error('Failed to suspend user');
    }
    handleMenuClose();
  };

  const handleUnsuspendUser = async (user: UserProfile) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUsers = users.map(u => 
        u.uid === user.uid 
          ? { ...u, isActive: true, suspendedAt: undefined, suspensionReason: undefined }
          : u
      );
      setUsers(updatedUsers);
      toast.success('User unsuspended successfully');
    } catch (error) {
      toast.error('Failed to unsuspend user');
    }
    handleMenuClose();
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogMode('view');
    setShowUserDialog(true);
    handleMenuClose();
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogMode('edit');
    setShowUserDialog(true);
    handleMenuClose();
  };

  const exportUsers = () => {
    const dataStr = JSON.stringify(filteredUsers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return 'error';
      case 'admin': return 'warning';
      case 'hiring_manager': return 'info';
      case 'recruiter': return 'primary';
      case 'candidate': return 'success';
      default: return 'default';
    }
  };

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportUsers}
            sx={{ borderColor: '#444', color: '#fff' }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setSelectedUser(null);
              setDialogMode('create');
              setShowUserDialog(true);
            }}
            sx={{ bgcolor: '#ff4444', '&:hover': { bgcolor: '#cc3333' } }}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
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
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#ccc' }}>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#ccc' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                {filteredUsers.length} users found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>User</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Role</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Company</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Status</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Last Sign In</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Created</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.displayName?.[0] || user.email[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {user.displayName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          {user.email}
                        </Typography>
                        {!user.emailVerified && (
                          <Chip 
                            label="Unverified" 
                            size="small" 
                            color="warning"
                            sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <Chip 
                      label={user.role.replace('_', ' ')} 
                      size="small"
                      color={getRoleColor(user.role) as any}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    {user.companyId || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Suspended'} 
                        size="small"
                        color={user.isActive ? 'success' : 'error'}
                      />
                      {user.suspendedAt && (
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          Suspended: {user.suspendedAt.toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    {user.lastSignIn?.toLocaleDateString() || 'Never'}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    {user.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, user)}
                      sx={{ color: '#ccc' }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ color: '#fff', borderTop: '1px solid #444' }}
        />
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { bgcolor: '#2a2a2a', color: '#fff', border: '1px solid #444' }
        }}
      >
        <MenuItem onClick={() => handleViewUser(selectedUser!)}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditUser(selectedUser!)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem 
          onClick={() => setShowImpersonationModal(true)}
          sx={{ color: '#ff9800' }}
        >
          <SecurityIcon sx={{ mr: 1 }} />
          Impersonate User
        </MenuItem>
        {selectedUser?.isActive ? (
          <MenuItem 
            onClick={() => handleSuspendUser(selectedUser!)}
            sx={{ color: '#f44336' }}
          >
            <BlockIcon sx={{ mr: 1 }} />
            Suspend User
          </MenuItem>
        ) : (
          <MenuItem 
            onClick={() => handleUnsuspendUser(selectedUser!)}
            sx={{ color: '#4caf50' }}
          >
            <UnblockIcon sx={{ mr: 1 }} />
            Unsuspend User
          </MenuItem>
        )}
      </Menu>

      {/* User Details/Edit Dialog */}
      <Dialog 
        open={showUserDialog} 
        onClose={() => setShowUserDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#2a2a2a', color: '#fff' } }}
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New User' : 
           dialogMode === 'edit' ? 'Edit User' : 'User Details'}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={selectedUser.email}
                    disabled={dialogMode === 'view'}
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
                    value={selectedUser.displayName || ''}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                    }}
                    InputLabelProps={{ sx: { color: '#ccc' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={dialogMode === 'view'}>
                    <InputLabel sx={{ color: '#ccc' }}>Role</InputLabel>
                    <Select
                      value={selectedUser.role}
                      sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company ID"
                    value={selectedUser.companyId || ''}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                    }}
                    InputLabelProps={{ sx: { color: '#ccc' } }}
                  />
                </Grid>
              </Grid>

              {selectedUser.suspendedAt && (
                <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                  <Typography variant="body2">
                    <strong>Suspended:</strong> {selectedUser.suspendedAt.toLocaleString()}
                    <br />
                    <strong>Reason:</strong> {selectedUser.suspensionReason}
                    <br />
                    <strong>By:</strong> {selectedUser.suspendedBy}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserDialog(false)} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
          {dialogMode !== 'view' && (
            <Button 
              variant="contained"
              sx={{ bgcolor: '#ff4444', '&:hover': { bgcolor: '#cc3333' } }}
            >
              {dialogMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Impersonation Modal */}
      <ImpersonationModal
        open={showImpersonationModal}
        onClose={() => setShowImpersonationModal(false)}
        onImpersonate={handleImpersonate}
      />
    </Box>
  );
};

export default UserManagementPage;