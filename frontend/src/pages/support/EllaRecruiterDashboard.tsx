import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Alert,
  styled,
  alpha,
} from '@mui/material';
import {
  Search,
  FilterList,
  ViewModule,
  ViewList,
  Refresh,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Business,
  People,
  Assessment,
  Support,
  Analytics,
  Notifications,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useActingAs } from '../../hooks/useActingAs';
import CustomerPortfolioCard from '../../components/support/CustomerPortfolioCard';
import ActingAsSessionPanel from '../../components/support/ActingAsSessionPanel';
import { colors, glassStyles } from '../../theme/theme';

const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#F8FAFC',
  padding: theme.spacing(3),
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  ...glassStyles.light,
  padding: theme.spacing(3),
  borderRadius: 16,
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    transform: 'translate(50%, -50%)',
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  ...glassStyles.light,
  borderRadius: 16,
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
}));

const FilterBar = styled(Paper)(({ theme }) => ({
  ...glassStyles.light,
  padding: theme.spacing(2),
  borderRadius: 12,
  marginBottom: theme.spacing(3),
}));

const EllaRecruiterDashboard: React.FC = () => {
  const {
    customerPortfolio,
    recentCustomers,
    isActingAs,
    loadCustomerPortfolio,
    portfolioLoading,
    canActAs,
  } = useActingAs();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'health' | 'activity' | 'issues'>('health');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [filterHealth, setFilterHealth] = useState<'all' | 'excellent' | 'good' | 'fair' | 'poor'>('all');

  // Portfolio analytics
  const portfolioStats = useMemo(() => {
    const total = customerPortfolio.length;
    const active = customerPortfolio.filter(c => c.status === 'active').length;
    const avgHealth = Math.round(
      customerPortfolio.reduce((sum, c) => sum + c.healthScore, 0) / total || 0
    );
    const withIssues = customerPortfolio.filter(c => (c.metrics?.issueCount || 0) > 0).length;
    
    return { total, active, avgHealth, withIssues };
  }, [customerPortfolio]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let filtered = customerPortfolio.filter(customer => {
      const matchesSearch = !searchQuery || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.industry?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
      
      const matchesHealth = filterHealth === 'all' || (() => {
        if (filterHealth === 'excellent') return customer.healthScore >= 80;
        if (filterHealth === 'good') return customer.healthScore >= 60 && customer.healthScore < 80;
        if (filterHealth === 'fair') return customer.healthScore >= 40 && customer.healthScore < 60;
        if (filterHealth === 'poor') return customer.healthScore < 40;
        return true;
      })();
      
      return matchesSearch && matchesStatus && matchesHealth;
    });

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'health':
          return b.healthScore - a.healthScore;
        case 'activity':
          const aActivity = a.lastActivity?.getTime() || 0;
          const bActivity = b.lastActivity?.getTime() || 0;
          return bActivity - aActivity;
        case 'issues':
          const aIssues = a.metrics?.issueCount || 0;
          const bIssues = b.metrics?.issueCount || 0;
          return bIssues - aIssues;
        default:
          return 0;
      }
    });

    return filtered;
  }, [customerPortfolio, searchQuery, sortBy, filterStatus, filterHealth]);

  if (!canActAs) {
    return (
      <DashboardContainer>
        <Alert severity="error">
          You do not have permission to access the Ella Recruiter Dashboard.
        </Alert>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Header */}
      <HeaderCard>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <DashboardIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Ella Recruiter Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage your customer portfolio and support sessions
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadCustomerPortfolio}
              disabled={portfolioLoading}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Refresh Portfolio
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Analytics />}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              View Analytics
            </Button>
          </Box>
        </Box>
      </HeaderCard>

      {/* Portfolio Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {portfolioStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
                <Business sx={{ fontSize: 40, color: colors.primary[300] }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#10B981' }}>
                    {portfolioStats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Customers
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: '#10B981' }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#F59E0B' }}>
                    {portfolioStats.avgHealth}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Health Score
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: '#F59E0B' }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={portfolioStats.avgHealth}
                sx={{
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha('#F59E0B', 0.2),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#F59E0B',
                  },
                }}
              />
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#EF4444' }}>
                    {portfolioStats.withIssues}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Need Attention
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: '#EF4444' }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Active Session Panel */}
      {isActingAs && (
        <Box sx={{ mb: 3 }}>
          <ActingAsSessionPanel />
        </Box>
      )}

      {/* Filters and Search */}
      <FilterBar>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="health">Health Score</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="activity">Last Activity</MenuItem>
                <MenuItem value="issues">Issues</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Health</InputLabel>
              <Select
                value={filterHealth}
                label="Health"
                onChange={(e) => setFilterHealth(e.target.value as any)}
              >
                <MenuItem value="all">All Health</MenuItem>
                <MenuItem value="excellent">Excellent (80%+)</MenuItem>
                <MenuItem value="good">Good (60-79%)</MenuItem>
                <MenuItem value="fair">Fair (40-59%)</MenuItem>
                <MenuItem value="poor">Poor (&lt;40%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Grid view">
                <IconButton
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <ViewModule />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="List view">
                <IconButton
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ViewList />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        
        {/* Active filters */}
        {(searchQuery || filterStatus !== 'all' || filterHealth !== 'all') && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {searchQuery && (
              <Chip
                label={`Search: ${searchQuery}`}
                onDelete={() => setSearchQuery('')}
                size="small"
              />
            )}
            {filterStatus !== 'all' && (
              <Chip
                label={`Status: ${filterStatus}`}
                onDelete={() => setFilterStatus('all')}
                size="small"
              />
            )}
            {filterHealth !== 'all' && (
              <Chip
                label={`Health: ${filterHealth}`}
                onDelete={() => setFilterHealth('all')}
                size="small"
              />
            )}
          </Box>
        )}
      </FilterBar>

      {/* Customer Portfolio */}
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Customer Portfolio
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({filteredCustomers.length} of {customerPortfolio.length})
          </Typography>
        </Typography>
        
        {portfolioLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
          </Box>
        ) : filteredCustomers.length > 0 ? (
          <Grid container spacing={3}>
            <AnimatePresence>
              {filteredCustomers.map((customer, index) => (
                <Grid
                  key={customer.id}
                  item
                  xs={12}
                  sm={viewMode === 'grid' ? 6 : 12}
                  md={viewMode === 'grid' ? 4 : 12}
                  lg={viewMode === 'grid' ? 3 : 12}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CustomerPortfolioCard
                      customer={customer}
                      compact={viewMode === 'list'}
                    />
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Business sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No customers found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search criteria
            </Typography>
          </Box>
        )}
      </Box>
    </DashboardContainer>
  );
};

export default EllaRecruiterDashboard;