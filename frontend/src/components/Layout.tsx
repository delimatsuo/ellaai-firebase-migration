import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
  IconButton,
  Badge,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Link,
  styled,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Assessment,
  People,
  Business,
  AdminPanelSettings,
  Search,
  Notifications,
  Settings,
  Menu as MenuIcon,
  ChevronRight,
  Support,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useActingAs } from '../hooks/useActingAs';
import ActingAsBanner from './support/ActingAsBanner';
import ActingAsContextSwitcher from './support/ActingAsContextSwitcher';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { colors, glassStyles } from '../theme/theme';

const drawerWidth = 280;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha('#ffffff', 0.2)}`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  color: theme.palette.text.primary,
  zIndex: theme.zIndex.drawer + 1,
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: `1px solid ${alpha('#ffffff', 0.2)}`,
    marginTop: 64, // Height of AppBar
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
  marginBottom: theme.spacing(2),
}));

const NavItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: 12,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  ...(isActive && {
    background: colors.gradient.primary,
    color: theme.palette.primary.contrastText,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  }),
  '&:hover': {
    backgroundColor: isActive 
      ? colors.gradient.primary
      : alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(4px)',
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha('#ffffff', 0.8),
    borderRadius: 25,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: alpha('#ffffff', 0.9),
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
}));

const Layout: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const { isActingAs, isEllaRecruiter } = useActingAs();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

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

  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const getNavigation = () => {
    const baseNav = [
      { label: 'Dashboard', path: '/', icon: <Dashboard /> },
    ];

    if (userProfile?.role === 'candidate') {
      baseNav.push({ label: 'Assessments', path: '/assessments', icon: <Assessment /> });
    }

    if (['recruiter', 'hiring_manager', 'admin'].includes(userProfile?.role || '')) {
      baseNav.push(
        { label: 'Company', path: '/company', icon: <Business /> },
        { label: 'Candidates', path: '/company/candidates', icon: <People /> }
      );
    }

    if (['admin', 'system_admin'].includes(userProfile?.role || '')) {
      baseNav.push(
        { label: 'Admin', path: '/admin', icon: <AdminPanelSettings /> }
      );
    }

    // Add Support Dashboard for Ella Recruiters
    if (isEllaRecruiter) {
      baseNav.push(
        { label: 'Support Dashboard', path: '/support/dashboard', icon: <Support /> }
      );
    }

    return baseNav;
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/' }];
    
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      breadcrumbs.push({ label, path: currentPath });
    });
    
    return breadcrumbs;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <LogoContainer>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: colors.gradient.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          E
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          EllaAI
        </Typography>
      </LogoContainer>

      <List>
        {getNavigation().map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <NavItem
                isActive={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                  }}
                />
              </NavItem>
            </motion.div>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Acting As Banner - always on top */}
      <ActingAsBanner />
      
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        paddingTop: isActingAs ? '56px' : 0, // Account for banner height
      }}>
      <StyledAppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              background: colors.gradient.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              cursor: 'pointer',
              flexGrow: isMobile ? 1 : 0,
              mr: 3,
            }}
            onClick={() => navigate('/')}
          >
            EllaAI
          </Typography>

          {!isMobile && (
            <SearchField
              size="small"
              placeholder="Search assessments, candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 320, mr: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Acting As Context Switcher */}
          {isActingAs && (
            <Box sx={{ mr: 2 }}>
              <ActingAsContextSwitcher compact />
            </Box>
          )}

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton color="inherit">
              <Settings />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <Box sx={{ textAlign: 'right', mr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {userProfile?.displayName || user?.email?.split('@')[0]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {userProfile?.role?.replace('_', ' ')}
                </Typography>
              </Box>
              <Avatar
                sx={{ 
                  width: 40, 
                  height: 40, 
                  cursor: 'pointer',
                  border: `2px solid ${alpha(colors.primary[500], 0.2)}`,
                }}
                src={userProfile?.photoURL || user?.photoURL || undefined}
                onClick={handleMenuOpen}
              >
                {(userProfile?.displayName || user?.email || 'U')[0].toUpperCase()}
              </Avatar>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                ...glassStyles.light,
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      {/* Desktop Drawer */}
      {!isMobile && (
        <StyledDrawer variant="permanent" open>
          {drawer}
        </StyledDrawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // AppBar height
          pl: isMobile ? 0 : 0,
          backgroundColor: '#fafbfc',
          minHeight: '100vh',
        }}
      >
        {/* Breadcrumb */}
        <Box sx={{ p: 3, pb: 1 }}>
          <Breadcrumbs
            separator={<ChevronRight fontSize="small" />}
            sx={{
              '& .MuiBreadcrumbs-separator': {
                color: 'text.secondary',
              },
            }}
          >
            {getBreadcrumbs().map((crumb, index) => {
              const isLast = index === getBreadcrumbs().length - 1;
              return isLast ? (
                <Typography key={crumb.path} color="text.primary" sx={{ fontWeight: 600 }}>
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={crumb.path}
                  underline="hover"
                  color="text.secondary"
                  onClick={() => navigate(crumb.path)}
                  sx={{ cursor: 'pointer', fontWeight: 500 }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>

        <Box sx={{ p: 3, pt: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default Layout;