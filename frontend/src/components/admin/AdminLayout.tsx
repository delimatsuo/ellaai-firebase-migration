import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Badge,
  Alert,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Storage as StorageIcon,
  Assessment as AssessmentIcon,
  MonitorHeart as MonitorIcon,
  ExitToApp as ExitIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  Warning as WarningIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { createAdminGradient, adminColors } from '../../theme/unifiedTheme';

const DRAWER_WIDTH = 280;

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if user is system admin
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'system_admin') {
    navigate('/');
    return null;
  }

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
    { label: 'Create Company', path: '/admin/create-company', icon: <BusinessIcon />, primary: true },
    { label: 'Database Query', path: '/admin/database', icon: <StorageIcon /> },
    { label: 'User Management', path: '/admin/users', icon: <PeopleIcon /> },
    { label: 'Account Management', path: '/admin/accounts', icon: <BusinessIcon /> },
    { label: 'Audit Logs', path: '/admin/audit', icon: <AssessmentIcon /> },
    { label: 'System Health', path: '/admin/health', icon: <MonitorIcon /> },
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
    handleMenuClose();
  };

  const handleExitAdmin = () => {
    navigate('/');
    toast.success('Exited admin mode');
    handleMenuClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${adminColors.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AdminIcon sx={{ color: adminColors.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            System Admin
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon sx={{ fontSize: 16, color: adminColors.secondary }} />
          <Typography variant="caption" sx={{ color: adminColors.textSecondary }}>
            Privileged Access Mode
          </Typography>
        </Box>
      </Box>

      <List sx={{ pt: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isPrimary = (item as any).primary;
          const activeColor = isPrimary ? adminColors.success : adminColors.primary;
          
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive ? alpha(activeColor, 0.15) : (isPrimary ? alpha(adminColors.success, 0.05) : 'transparent'),
                  borderRight: isActive ? `3px solid ${activeColor}` : (isPrimary ? '3px solid transparent' : 'none'),
                  border: isPrimary ? `1px solid ${alpha(adminColors.success, 0.3)}` : 'none',
                  borderRadius: isPrimary ? '8px' : '0',
                  mx: isPrimary ? 1 : 0,
                  my: isPrimary ? 0.5 : 0,
                  '&:hover': {
                    bgcolor: alpha(activeColor, 0.1),
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? activeColor : (isPrimary ? adminColors.success : adminColors.textSecondary), minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{ 
                    '& .MuiTypography-root': { 
                      color: isActive ? activeColor : (isPrimary ? adminColors.success : theme.palette.text.primary),
                      fontWeight: isActive || isPrimary ? 600 : 400,
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: adminColors.border, mt: 2 }} />
      
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            bgcolor: alpha(adminColors.warning, 0.1),
            border: `1px solid ${adminColors.warning}`,
            '& .MuiAlert-icon': { color: adminColors.warning },
            '& .MuiTypography-root': { color: theme.palette.text.primary }
          }}
        >
          <Typography variant="caption">
            All admin actions are logged and monitored
          </Typography>
        </Alert>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${adminColors.border}`,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
            EllaAI Admin Console
          </Typography>

          {/* System alerts badge */}
          <Badge badgeContent={0} color="error" sx={{ mr: 2 }}>
            <WarningIcon />
          </Badge>

          {/* User menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: adminColors.textSecondary }}>
              {userProfile?.displayName || user?.email}
            </Typography>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                cursor: 'pointer',
                border: `2px solid ${adminColors.primary}`
              }}
              src={userProfile?.photoURL || user?.photoURL || undefined}
              onClick={handleMenuOpen}
            >
              {((userProfile?.displayName || user?.email || 'A')[0] || 'A').toUpperCase()}
            </Avatar>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${adminColors.border}`,
              }
            }}
          >
            <MenuItem onClick={handleExitAdmin} sx={{ gap: 1 }}>
              <ExitIcon fontSize="small" />
              Exit Admin Mode
            </MenuItem>
            <Divider sx={{ bgcolor: adminColors.border }} />
            <MenuItem onClick={handleLogout} sx={{ gap: 1, color: adminColors.error }}>
              <ExitIcon fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;