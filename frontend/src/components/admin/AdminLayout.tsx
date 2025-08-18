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
    <Box sx={{ height: '100%', bgcolor: '#1a1a1a', color: '#fff' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AdminIcon sx={{ color: '#ff4444' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            System Admin
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon sx={{ fontSize: 16, color: '#ff4444' }} />
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Privileged Access Mode
          </Typography>
        </Box>
      </Box>

      <List sx={{ pt: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isPrimary = (item as any).primary;
          const activeColor = isPrimary ? '#4ade80' : '#ff4444';
          
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive ? alpha(activeColor, 0.15) : (isPrimary ? alpha('#4ade80', 0.05) : 'transparent'),
                  borderRight: isActive ? `3px solid ${activeColor}` : (isPrimary ? '3px solid transparent' : 'none'),
                  border: isPrimary ? '1px solid rgba(74, 222, 128, 0.3)' : 'none',
                  borderRadius: isPrimary ? '8px' : '0',
                  mx: isPrimary ? 1 : 0,
                  my: isPrimary ? 0.5 : 0,
                  '&:hover': {
                    bgcolor: alpha(activeColor, 0.1),
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? activeColor : (isPrimary ? '#4ade80' : '#ccc'), minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{ 
                    '& .MuiTypography-root': { 
                      color: isActive ? activeColor : (isPrimary ? '#4ade80' : '#fff'),
                      fontWeight: isActive || isPrimary ? 600 : 400,
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: '#333', mt: 2 }} />
      
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            bgcolor: alpha('#ff9800', 0.1),
            border: '1px solid #ff9800',
            '& .MuiAlert-icon': { color: '#ff9800' },
            '& .MuiTypography-root': { color: '#fff' }
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#121212' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: '#1e1e1e',
          borderBottom: '1px solid #333',
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

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            EllaAI Admin Console
          </Typography>

          {/* System alerts badge */}
          <Badge badgeContent={0} color="error" sx={{ mr: 2 }}>
            <WarningIcon />
          </Badge>

          {/* User menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              {userProfile?.displayName || user?.email}
            </Typography>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                cursor: 'pointer',
                border: '2px solid #ff4444'
              }}
              src={userProfile?.photoURL || user?.photoURL || undefined}
              onClick={handleMenuOpen}
            >
              {(userProfile?.displayName || user?.email || 'A')[0].toUpperCase()}
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
                bgcolor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
              }
            }}
          >
            <MenuItem onClick={handleExitAdmin} sx={{ gap: 1 }}>
              <ExitIcon fontSize="small" />
              Exit Admin Mode
            </MenuItem>
            <Divider sx={{ bgcolor: '#444' }} />
            <MenuItem onClick={handleLogout} sx={{ gap: 1, color: '#ff4444' }}>
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
          bgcolor: '#121212',
          color: '#fff',
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