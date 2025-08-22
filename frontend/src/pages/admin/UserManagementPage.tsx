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
  FormControl,
  InputLabel,
  Select,
  Grid,
  InputAdornment,
  Tooltip,
  Alert,
  TablePagination,
  Checkbox,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Badge,
  LinearProgress,
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
  Email as EmailIcon,
  CloudUpload as UploadIcon,
  GroupWork as BulkIcon,
  Dashboard as StatsIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { UserProfile } from '../../types/admin';
import ImpersonationModal from '../../components/admin/ImpersonationModal';
import {
  UserInvitationDialog,
  BulkUserOperations,
  UserProfileDialog,
  CSVImportDialog,
} from '../../components/users';
import userService, {
  UserFilters,
  PaginationParams,
  BulkUserOperation,
  UpdateUserRequest,
} from '../../services/users/userService';
import toast from 'react-hot-toast';

const UserManagementPage: React.FC = () => {
  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 0,
    limit: 25,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  
  // Dialog states
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [showBulkOperationsDialog, setShowBulkOperationsDialog] = useState(false);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  // Stats
  const [userStats, setUserStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    byRole: Record<string, number>;
    byCompany: Record<string, number>;
    recentSignUps: number;
    recentActivity: number;
  }>({
    total: 0,
    active: 0,
    suspended: 0,
    byRole: {},
    byCompany: {},
    recentSignUps: 0,
    recentActivity: 0,
  });
  
  // Mock companies data - replace with actual API call
  const [companies] = useState([
    { id: 'company_1', name: 'TechCorp Inc.' },
    { id: 'company_2', name: 'StartupXYZ' },
    { id: 'company_3', name: 'Enterprise Solutions' },
  ]);

  const roles = [
    { value: 'candidate', label: 'Candidate', color: '#4caf50' },
    { value: 'recruiter', label: 'Recruiter', color: '#2196f3' },
    { value: 'hiring_manager', label: 'Hiring Manager', color: '#ff9800' },
    { value: 'admin', label: 'Company Admin', color: '#f44336' },
    { value: 'system_admin', label: 'System Admin', color: '#9c27b0' },
  ];
  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'inactive', label: 'Inactive' },
  ];

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [filters, pagination]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers(filters, pagination);
      setUsers(response.users);
      setTotalUsers(response.pagination.total);
      
      // Clear selection when data changes
      setSelectedUsers(new Set());
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error(error.message || 'Failed to load users');
      
      // Fallback to mock data for demo
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
      setTotalUsers(mockUsers.length);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await userService.getUserStats(filters);
      setUserStats(stats);
    } catch (error: any) {
      console.error('Failed to load user stats:', error);
      // Use mock stats for demo
      setUserStats({
        total: users.length,
        active: users.filter(u => u.isActive).length,
        suspended: users.filter(u => !u.isActive && u.suspendedAt).length,
        byRole: {
          candidate: users.filter(u => u.role === 'candidate').length,
          recruiter: users.filter(u => u.role === 'recruiter').length,
          hiring_manager: users.filter(u => u.role === 'hiring_manager').length,
          admin: users.filter(u => u.role === 'admin').length,
          system_admin: users.filter(u => u.role === 'system_admin').length,
        },
        byCompany: {
          company_1: users.filter(u => u.companyId === 'company_1').length,
          company_2: users.filter(u => u.companyId === 'company_2').length,
          company_3: users.filter(u => u.companyId === 'company_3').length,
        },
        recentSignUps: 5,
        recentActivity: 12,
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadUsers(), loadUserStats()]);
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleFilterChange = (field: keyof UserFilters, value: any) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handlePaginationChange = (field: keyof PaginationParams, value: any) => {
    setPagination(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectUser = (userId: string, selected: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (selected) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.uid)));
    }
  };

  const getSelectedUserProfiles = (): UserProfile[] => {
    return users.filter(user => selectedUsers.has(user.uid));
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

  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'suspended' && !user.isActive && user.suspendedAt) ||
      (statusFilter === 'inactive' && !user.isActive && !user.suspendedAt);
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
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
                    <MenuItem key={role.value} value={role.value}>
                      {role.label.toUpperCase()}
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
                    <MenuItem key={status.value} value={status.value}>
                      {status.label.toUpperCase()}
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
                        {((user.displayName || user.email || 'U')[0] || 'U').toUpperCase()}
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
        <MenuItem onClick={() => handleViewUser(selectedUser!)}>
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
            Reactivate User
          </MenuItem>
        )}
      </Menu>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="User Management Actions"
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          '& .MuiFab-primary': {
            background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
            },
          },
        }}
        icon={<SpeedDialIcon />}
      >
        {([{name: 'Create User', icon: <PersonAddIcon />, onClick: () => setShowInvitationDialog(true)}] as any[]).map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: '#2a2a2a',
                color: '#9333EA',
                '&:hover': {
                  bgcolor: '#333',
                },
              },
            }}
          />
        ))}
      </SpeedDial>

      {/* User Profile Dialog */}
      <UserProfileDialog
        open={showUserProfileDialog}
        onClose={() => {
          setShowUserProfileDialog(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUpdate={(userId: string, data: any) => Promise.resolve({} as UserProfile)}
        onSuspend={(userId: string, reason: string) => Promise.resolve()}
        onReactivate={(userId: string) => Promise.resolve()}
        companies={companies}
      />

      {/* User Invitation Dialog */}
      <UserInvitationDialog
        open={showInvitationDialog}
        onClose={() => setShowInvitationDialog(false)}
        onInvite={(invitations: any) => Promise.resolve()}
        companies={companies}
      />

      {/* Bulk Operations Dialog */}
      <BulkUserOperations
        open={showBulkOperationsDialog}
        onClose={() => setShowBulkOperationsDialog(false)}
        onExecute={(operation: BulkUserOperation) => Promise.resolve({successful: [], failed: []})}
        selectedUsers={getSelectedUserProfiles()}
        companies={companies}
      />

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={showCSVImportDialog}
        onClose={() => setShowCSVImportDialog(false)}
        onImport={(csvData: string, options: any) => Promise.resolve({successful: 0, failed: 0, errors: [], created: []})}
        companies={companies}
      />

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