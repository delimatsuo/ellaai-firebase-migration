import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Typography,
  Avatar,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Badge,
  styled,
  alpha,
} from '@mui/material';
import {
  SwapHoriz,
  Search,
  Business,
  ArrowDropDown,
  Refresh,
  FiberManualRecord,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useActingAs } from '../../hooks/useActingAs';
import { CustomerCompany } from '../../contexts/ActingAsContext';
import { colors } from '../../theme/theme';

const SwitcherButton = styled(Button)(({ theme }) => ({
  backgroundColor: alpha('#FF8C00', 0.1),
  border: `1px solid ${alpha('#FF8C00', 0.3)}`,
  color: '#FF8C00',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: 20,
  padding: theme.spacing(0.5, 1.5),
  '&:hover': {
    backgroundColor: alpha('#FF8C00', 0.2),
    border: `1px solid ${alpha('#FF8C00', 0.5)}`,
  },
}));

const CustomerMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(colors.primary[500], 0.08),
    transform: 'translateX(4px)',
  },
}));

const HealthIndicator = styled(Box)<{ score: number }>(({ theme, score }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444',
  marginRight: theme.spacing(1),
}));

interface ActingAsContextSwitcherProps {
  compact?: boolean;
  showRecent?: boolean;
}

const ActingAsContextSwitcher: React.FC<ActingAsContextSwitcherProps> = ({
  compact = false,
  showRecent = true,
}) => {
  const {
    isActingAs,
    currentSession,
    customerPortfolio,
    recentCustomers,
    switchCustomer,
    refreshCustomerData,
    getHealthScoreColor,
    getHealthScoreLabel,
    loading,
  } = useActingAs();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customerPortfolio;
    }
    
    const query = searchQuery.toLowerCase();
    return customerPortfolio.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.domain?.toLowerCase().includes(query) ||
      customer.industry?.toLowerCase().includes(query)
    );
  }, [customerPortfolio, searchQuery]);

  // Recent customers excluding current
  const availableRecentCustomers = useMemo(() => {
    return recentCustomers.filter(customer => 
      customer.id !== currentSession?.targetCompanyId
    );
  }, [recentCustomers, currentSession?.targetCompanyId]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  const handleSwitchCustomer = async (companyId: string) => {
    handleClose();
    await switchCustomer(companyId);
  };

  const handleRefreshCustomer = async (companyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await refreshCustomerData(companyId);
  };

  const getStatusIcon = (status: string, healthScore: number) => {
    if (status !== 'active') {
      return <Warning fontSize="small" sx={{ color: '#F59E0B' }} />;
    }
    if (healthScore >= 80) {
      return <CheckCircle fontSize="small" sx={{ color: '#10B981' }} />;
    }
    if (healthScore >= 60) {
      return <TrendingUp fontSize="small" sx={{ color: '#F59E0B' }} />;
    }
    return <TrendingDown fontSize="small" sx={{ color: '#EF4444' }} />;
  };

  if (!isActingAs) {
    return null;
  }

  return (
    <>
      <SwitcherButton
        startIcon={<SwapHoriz />}
        endIcon={<ArrowDropDown />}
        onClick={handleOpen}
        disabled={loading}
        size={compact ? 'small' : 'medium'}
      >
        {compact ? 'Switch' : 'Switch Customer'}
      </SwitcherButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 380,
            maxWidth: 480,
            maxHeight: 600,
            '& .MuiList-root': {
              padding: 1,
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" gutterBottom>
            Switch Customer
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current: {currentSession?.targetCompanyName}
          </Typography>
          
          {/* Search field */}
          <TextField
            size="small"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        {/* Recent customers section */}
        {showRecent && availableRecentCustomers.length > 0 && (
          <>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Recent Customers
              </Typography>
            </Box>
            
            {availableRecentCustomers.slice(0, 3).map((customer) => (
              <CustomerMenuItem
                key={`recent-${customer.id}`}
                onClick={() => handleSwitchCustomer(customer.id)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Badge
                    badgeContent={
                      customer.metrics?.issueCount || 0 > 0 ? customer.metrics?.issueCount : null
                    }
                    color="error"
                    variant="dot"
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: getHealthScoreColor(customer.healthScore),
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {customer.name.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {customer.name}
                      </Typography>
                      <HealthIndicator score={customer.healthScore} />
                      {getStatusIcon(customer.status, customer.healthScore)}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={customer.size}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Health: {customer.healthScore}%
                      </Typography>
                    </Box>
                  }
                />
                
                <Tooltip title="Refresh customer data">
                  <IconButton
                    size="small"
                    onClick={(e) => handleRefreshCustomer(customer.id, e)}
                    sx={{ ml: 1 }}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CustomerMenuItem>
            ))}
            
            <Divider sx={{ my: 1 }} />
          </>
        )}

        {/* All customers section */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {searchQuery ? 'Search Results' : 'All Customers'}
            {!searchQuery && (
              <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                ({customerPortfolio.length})
              </Typography>
            )}
          </Typography>
        </Box>

        {/* Customer list */}
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <AnimatePresence>
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <CustomerMenuItem
                  onClick={() => handleSwitchCustomer(customer.id)}
                  disabled={customer.id === currentSession?.targetCompanyId}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Badge
                      badgeContent={
                        customer.metrics?.issueCount || 0 > 0 ? customer.metrics?.issueCount : null
                      }
                      color="error"
                      variant="dot"
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: customer.id === currentSession?.targetCompanyId 
                            ? '#FF8C00' 
                            : getHealthScoreColor(customer.healthScore),
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {customer.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={customer.id === currentSession?.targetCompanyId ? 700 : 600}
                          sx={{
                            color: customer.id === currentSession?.targetCompanyId 
                              ? '#FF8C00' 
                              : 'text.primary'
                          }}
                        >
                          {customer.name}
                          {customer.id === currentSession?.targetCompanyId && ' (Current)'}
                        </Typography>
                        <HealthIndicator score={customer.healthScore} />
                        {getStatusIcon(customer.status, customer.healthScore)}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={customer.size}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Chip
                          label={getHealthScoreLabel(customer.healthScore)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: alpha(getHealthScoreColor(customer.healthScore), 0.1),
                            color: getHealthScoreColor(customer.healthScore),
                          }}
                        />
                        {customer.domain && (
                          <Typography variant="caption" color="text.secondary">
                            {customer.domain}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  {customer.id !== currentSession?.targetCompanyId && (
                    <Tooltip title="Refresh customer data">
                      <IconButton
                        size="small"
                        onClick={(e) => handleRefreshCustomer(customer.id, e)}
                        sx={{ ml: 1 }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CustomerMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {filteredCustomers.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No customers found matching your search' : 'No customers available'}
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default ActingAsContextSwitcher;