import React, { useState, useEffect } from 'react';
import {
  CompanyClosureDialog,
  CompanySuspendDialog,
  DataExportDialog,
  CompanyLifecycleHistory,
} from '../../components/admin';
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
  Chip,
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
  LinearProgress,
  Alert,
  TablePagination,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Block as SuspendIcon,
  PlayArrow as ActivateIcon,
  Close as CloseIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { CompanyAccount } from '../../types/admin';
import toast from 'react-hot-toast';

const AccountManagementPage: React.FC = () => {
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<CompanyAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<CompanyAccount | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [suspendMode, setSuspendMode] = useState<'suspend' | 'reactivate'>('suspend');
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const plans = ['trial', 'basic', 'professional', 'enterprise'];
  const statuses = ['active', 'suspended', 'closed'];

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, planFilter, statusFilter]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAccounts: CompanyAccount[] = [
        {
          id: 'company_1',
          name: 'TechCorp Solutions',
          domain: 'techcorp.com',
          industry: 'Technology',
          size: '100-500',
          plan: 'professional',
          status: 'active',
          createdAt: new Date('2024-01-10'),
          lastActivity: new Date('2024-01-18'),
          userCount: 45,
          assessmentCount: 156,
          billingStatus: 'current',
          healthScore: 85,
        },
        {
          id: 'company_2',
          name: 'StartupCo Inc',
          domain: 'startup.io',
          industry: 'FinTech',
          size: '10-50',
          plan: 'basic',
          status: 'active',
          createdAt: new Date('2024-01-15'),
          lastActivity: new Date('2024-01-17'),
          userCount: 12,
          assessmentCount: 34,
          billingStatus: 'current',
          healthScore: 92,
        },
        {
          id: 'company_3',
          name: 'Enterprise Corp',
          domain: 'enterprise.com',
          industry: 'Manufacturing',
          size: '1000+',
          plan: 'enterprise',
          status: 'active',
          createdAt: new Date('2023-12-01'),
          lastActivity: new Date('2024-01-18'),
          userCount: 234,
          assessmentCount: 1247,
          billingStatus: 'current',
          healthScore: 78,
        },
        {
          id: 'company_4',
          name: 'Suspended Company',
          domain: 'suspended.com',
          industry: 'Retail',
          size: '50-100',
          plan: 'trial',
          status: 'suspended',
          createdAt: new Date('2024-01-08'),
          lastActivity: new Date('2024-01-12'),
          userCount: 5,
          assessmentCount: 2,
          billingStatus: 'overdue',
          healthScore: 25,
          notes: 'Suspended due to policy violation',
        },
      ];

      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(account => account.plan === planFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(account => account.status === statusFilter);
    }

    setFilteredAccounts(filtered);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, account: CompanyAccount) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAccount(null);
  };

  const handleSuspendAccount = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setSuspendMode('suspend');
    setShowSuspendDialog(true);
    handleMenuClose();
  };

  const handleActivateAccount = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setSuspendMode('reactivate');
    setShowSuspendDialog(true);
    handleMenuClose();
  };

  const handleExportData = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setShowExportDialog(true);
    handleMenuClose();
  };

  const handleViewHistory = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setShowHistoryDialog(true);
    handleMenuClose();
  };

  const handleCloseAccount = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setShowCloseDialog(true);
    handleMenuClose();
  };

  const handleAccountActionSuccess = () => {
    // Reload accounts after successful action
    loadAccounts();
  };

  const handleViewAccount = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setDialogMode('view');
    setShowAccountDialog(true);
    handleMenuClose();
  };

  const handleEditAccount = (account: CompanyAccount) => {
    setSelectedAccount(account);
    setDialogMode('edit');
    setShowAccountDialog(true);
    handleMenuClose();
  };

  const exportAccounts = () => {
    const dataStr = JSON.stringify(filteredAccounts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `accounts_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'default';
      case 'basic': return 'primary';
      case 'professional': return 'secondary';
      case 'enterprise': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const paginatedAccounts = filteredAccounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          Account Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportAccounts}
            sx={{ borderColor: '#444', color: '#fff' }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            sx={{ borderColor: '#444', color: '#fff' }}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {accounts.filter(a => a.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Active Accounts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#2196f3' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {accounts.reduce((sum, a) => sum + a.userCount, 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#ff9800' }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {accounts.filter(a => a.billingStatus === 'overdue').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Overdue Billing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#9c27b0' }}>
                  <HealthyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {Math.round(accounts.reduce((sum, a) => sum + a.healthScore, 0) / accounts.length)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Avg Health Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search accounts..."
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
                <InputLabel sx={{ color: '#ccc' }}>Plan</InputLabel>
                <Select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                >
                  <MenuItem value="all">All Plans</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan} value={plan}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
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
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                {filteredAccounts.length} accounts found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Company</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Plan</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Status</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Health Score</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Users</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Assessments</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Last Activity</TableCell>
                <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {account.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        {account.domain}
                      </Typography>
                      {account.industry && (
                        <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                          {account.industry} • {account.size}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <Chip 
                      label={account.plan} 
                      size="small"
                      color={getPlanColor(account.plan) as any}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <Box>
                      <Chip 
                        label={account.status} 
                        size="small"
                        color={getStatusColor(account.status) as any}
                      />
                      {account.billingStatus === 'overdue' && (
                        <Chip 
                          label="Billing Overdue" 
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={account.healthScore}
                        sx={{
                          width: 60,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#444',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getHealthScoreColor(account.healthScore),
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ color: getHealthScoreColor(account.healthScore) }}>
                        {account.healthScore}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    {account.userCount}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    {account.assessmentCount}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                    {account.lastActivity?.toLocaleDateString() || 'Never'}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#444' }}>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, account)}
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
          count={filteredAccounts.length}
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

      {/* Account Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { bgcolor: '#2a2a2a', color: '#fff', border: '1px solid #444' }
        }}
      >
        <MenuItem onClick={() => handleViewAccount(selectedAccount!)}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditAccount(selectedAccount!)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Account
        </MenuItem>
        <MenuItem onClick={() => handleViewHistory(selectedAccount!)}>
          <HistoryIcon sx={{ mr: 1 }} />
          View History
        </MenuItem>
        <MenuItem onClick={() => handleExportData(selectedAccount!)}>
          <ExportIcon sx={{ mr: 1 }} />
          Export Data
        </MenuItem>
        {selectedAccount?.status === 'active' ? (
          <MenuItem 
            onClick={() => handleSuspendAccount(selectedAccount!)}
            sx={{ color: '#ff9800' }}
          >
            <SuspendIcon sx={{ mr: 1 }} />
            Suspend Account
          </MenuItem>
        ) : selectedAccount?.status === 'suspended' ? (
          <MenuItem 
            onClick={() => handleActivateAccount(selectedAccount!)}
            sx={{ color: '#4caf50' }}
          >
            <ActivateIcon sx={{ mr: 1 }} />
            Activate Account
          </MenuItem>
        ) : null}
        {selectedAccount?.status !== 'closed' && (
          <MenuItem 
            onClick={() => handleCloseAccount(selectedAccount!)}
            sx={{ color: '#f44336' }}
          >
            <CloseIcon sx={{ mr: 1 }} />
            Close Account
          </MenuItem>
        )}
      </Menu>

      {/* Account Details/Edit Dialog */}
      <Dialog 
        open={showAccountDialog} 
        onClose={() => setShowAccountDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#2a2a2a', color: '#fff' } }}
      >
        <DialogTitle>
          {dialogMode === 'edit' ? 'Edit Account' : 'Account Details'}
        </DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={selectedAccount.name}
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
                    label="Domain"
                    value={selectedAccount.domain}
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
                    label="Industry"
                    value={selectedAccount.industry || ''}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                    }}
                    InputLabelProps={{ sx: { color: '#ccc' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={dialogMode === 'view'}>
                    <InputLabel sx={{ color: '#ccc' }}>Plan</InputLabel>
                    <Select
                      value={selectedAccount.plan}
                      sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                    >
                      {plans.map((plan) => (
                        <MenuItem key={plan} value={plan}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={selectedAccount.notes || ''}
                    multiline
                    rows={3}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                    }}
                    InputLabelProps={{ sx: { color: '#ccc' } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Account Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#333', textAlign: 'center', p: 1 }}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {selectedAccount.userCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        Users
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#333', textAlign: 'center', p: 1 }}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {selectedAccount.assessmentCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        Assessments
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#333', textAlign: 'center', p: 1 }}>
                      <Typography variant="h6" sx={{ color: getHealthScoreColor(selectedAccount.healthScore) }}>
                        {selectedAccount.healthScore}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        Health Score
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#333', textAlign: 'center', p: 1 }}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {selectedAccount.createdAt.toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        Created
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAccountDialog(false)} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
          {dialogMode === 'edit' && (
            <Button 
              variant="contained"
              sx={{ bgcolor: '#ff4444', '&:hover': { bgcolor: '#cc3333' } }}
            >
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Company Closure Dialog */}
      <CompanyClosureDialog
        open={showCloseDialog}
        company={selectedAccount}
        onClose={() => setShowCloseDialog(false)}
        onSuccess={handleAccountActionSuccess}
      />

      {/* Company Suspension Dialog */}
      <CompanySuspendDialog
        open={showSuspendDialog}
        company={selectedAccount}
        mode={suspendMode}
        onClose={() => setShowSuspendDialog(false)}
        onSuccess={handleAccountActionSuccess}
      />

      {/* Data Export Dialog */}
      <DataExportDialog
        open={showExportDialog}
        company={selectedAccount}
        onClose={() => setShowExportDialog(false)}
      />

      {/* Company Lifecycle History Dialog */}
      <CompanyLifecycleHistory
        open={showHistoryDialog}
        company={selectedAccount}
        onClose={() => setShowHistoryDialog(false)}
      />
    </Box>
  );
};

export default AccountManagementPage;