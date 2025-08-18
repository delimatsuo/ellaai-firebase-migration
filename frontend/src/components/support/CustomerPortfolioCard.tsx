import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Badge,
  Tooltip,
  styled,
  alpha,
} from '@mui/material';
import {
  MoreVert,
  TrendingUp,
  TrendingDown,
  People,
  Assessment,
  Warning,
  CheckCircle,
  Business,
  CalendarToday,
  Refresh,
  Visibility,
  Support,
  Settings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { CustomerCompany } from '../../contexts/ActingAsContext';
import { useActingAs } from '../../hooks/useActingAs';
import { colors, glassStyles } from '../../theme/theme';

const StyledCard = styled(Card)(({ theme }) => ({
  ...glassStyles.light,
  borderRadius: 16,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
}));

const HealthBar = styled(LinearProgress)<{ score: number }>(({ theme, score }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: alpha('#E5E7EB', 0.3),
  '& .MuiLinearProgress-bar': {
    backgroundColor: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444',
    borderRadius: 3,
  },
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderRadius: 12,
  backgroundColor: alpha('#F8FAFC', 0.8),
  border: `1px solid ${alpha('#E2E8F0', 0.6)}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha('#F1F5F9', 0.9),
    transform: 'translateY(-2px)',
  },
}));

const StatusBadge = styled(Box)<{ status: string }>(({ theme, status }) => {
  const getColor = () => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: getColor(),
    border: `2px solid ${alpha('#ffffff', 0.8)}`,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };
});

interface CustomerPortfolioCardProps {
  customer: CustomerCompany;
  onActAs?: (customerId: string) => void;
  onRefresh?: (customerId: string) => void;
  compact?: boolean;
}

const CustomerPortfolioCard: React.FC<CustomerPortfolioCardProps> = ({
  customer,
  onActAs,
  onRefresh,
  compact = false,
}) => {
  const {
    startActingAsSession,
    refreshCustomerData,
    getHealthScoreColor,
    getHealthScoreLabel,
    isActingAs,
    currentSession,
    loading,
  } = useActingAs();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActAs = async () => {
    handleMenuClose();
    if (onActAs) {
      onActAs(customer.id);
    } else {
      await startActingAsSession(
        customer.id,
        'Support session started from portfolio dashboard'
      );
    }
  };

  const handleRefresh = async () => {
    handleMenuClose();
    if (onRefresh) {
      onRefresh(customer.id);
    } else {
      await refreshCustomerData(customer.id);
    }
  };

  const isCurrentlyActingAs = isActingAs && currentSession?.targetCompanyId === customer.id;
  
  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'past_due': return '#F59E0B';
      case 'canceled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getIssueCount = () => customer.metrics?.issueCount || 0;
  const hasIssues = getIssueCount() > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <StyledCard
        sx={{
          height: compact ? 280 : 340,
          border: isCurrentlyActingAs 
            ? `2px solid #FF8C00` 
            : `1px solid ${alpha(colors.neutral[200], 0.6)}`,
          backgroundColor: isCurrentlyActingAs 
            ? alpha('#FF8C00', 0.05) 
            : undefined,
        }}
      >
        <StatusBadge status={customer.status} />
        
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Badge
              badgeContent={hasIssues ? getIssueCount() : null}
              color="error"
              variant="dot"
            >
              <Avatar
                sx={{
                  width: compact ? 40 : 48,
                  height: compact ? 40 : 48,
                  backgroundColor: isCurrentlyActingAs 
                    ? '#FF8C00' 
                    : getHealthScoreColor(customer.healthScore),
                  fontWeight: 700,
                  fontSize: compact ? '1rem' : '1.2rem',
                }}
              >
                {customer.name.charAt(0)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant={compact ? 'body1' : 'h6'}
                fontWeight={700}
                noWrap
                sx={{
                  color: isCurrentlyActingAs ? '#FF8C00' : 'text.primary',
                }}
              >
                {customer.name}
                {isCurrentlyActingAs && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      ml: 1,
                      backgroundColor: '#FF8C00',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Typography>
              
              {customer.domain && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {customer.domain}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={customer.industry}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                <Chip
                  label={customer.size}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>

          {/* Health Score */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {customer.healthScore >= 80 ? (
                  <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} />
                ) : customer.healthScore >= 60 ? (
                  <CheckCircle sx={{ fontSize: 16, color: '#F59E0B' }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: '#EF4444' }} />
                )}
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: getHealthScoreColor(customer.healthScore) }}
                >
                  {customer.healthScore}%
                </Typography>
              </Box>
            </Box>
            <HealthBar variant="determinate" value={customer.healthScore} score={customer.healthScore} />
            <Typography variant="caption" color="text.secondary">
              {getHealthScoreLabel(customer.healthScore)}
            </Typography>
          </Box>

          {/* Metrics */}
          {!compact && customer.metrics && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
              <MetricBox>
                <People sx={{ fontSize: 20, color: colors.primary[500], mb: 0.5 }} />
                <Typography variant="h6" fontWeight={700}>
                  {customer.metrics.totalCandidates}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Candidates
                </Typography>
              </MetricBox>
              
              <MetricBox>
                <Assessment sx={{ fontSize: 20, color: '#10B981', mb: 0.5 }} />
                <Typography variant="h6" fontWeight={700}>
                  {customer.metrics.activeAssessments}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assessments
                </Typography>
              </MetricBox>
            </Box>
          )}

          {/* Last Activity */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Last activity: {customer.lastActivity ? formatDistanceToNow(customer.lastActivity, { addSuffix: true }) : 'Never'}
            </Typography>
          </Box>

          {/* Subscription Status */}
          {customer.subscription && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getSubscriptionStatusColor(customer.subscription.status),
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {customer.subscription.plan} ({customer.subscription.status})
              </Typography>
            </Box>
          )}

          {/* Issues Warning */}
          {hasIssues && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mt: 1, 
              p: 1, 
              backgroundColor: alpha('#EF4444', 0.1),
              borderRadius: 1,
            }}>
              <Warning sx={{ fontSize: 16, color: '#EF4444' }} />
              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                {getIssueCount()} issue{getIssueCount() !== 1 ? 's' : ''} require{getIssueCount() === 1 ? 's' : ''} attention
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant={isCurrentlyActingAs ? 'outlined' : 'contained'}
            onClick={handleActAs}
            disabled={loading || isCurrentlyActingAs}
            startIcon={<Support />}
            sx={{
              backgroundColor: isCurrentlyActingAs ? undefined : '#FF8C00',
              borderColor: isCurrentlyActingAs ? '#FF8C00' : undefined,
              color: isCurrentlyActingAs ? '#FF8C00' : 'white',
              '&:hover': {
                backgroundColor: isCurrentlyActingAs ? alpha('#FF8C00', 0.1) : '#FF7700',
              },
            }}
          >
            {isCurrentlyActingAs ? 'Currently Acting As' : 'Act As Customer'}
          </Button>
        </CardActions>
      </StyledCard>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleActAs} disabled={isCurrentlyActingAs}>
          <Support sx={{ mr: 1 }} />
          Act As Customer
        </MenuItem>
        
        <MenuItem onClick={handleRefresh}>
          <Refresh sx={{ mr: 1 }} />
          Refresh Data
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <Settings sx={{ mr: 1 }} />
          Manage Account
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default CustomerPortfolioCard;