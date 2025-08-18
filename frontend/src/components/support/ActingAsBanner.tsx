import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Tooltip,
  styled,
  alpha,
} from '@mui/material';
import {
  ExitToApp,
  Timer,
  Warning,
  Person,
  ExpandMore,
  Emergency,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useActingAs } from '../../hooks/useActingAs';
import { colors } from '../../theme/theme';

const ActingAsBanner = styled(AppBar)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar + 100,
  backgroundColor: '#FF8C00', // Orange background for visibility
  background: 'linear-gradient(135deg, #FF8C00 0%, #FF6347 100%)',
  boxShadow: '0 4px 20px rgba(255, 140, 0, 0.3)',
  borderBottom: `2px solid ${alpha('#FF4500', 0.3)}`,
}));

const SessionTimer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  backgroundColor: alpha('#ffffff', 0.2),
  borderRadius: 20,
  backdropFilter: 'blur(10px)',
}));

const EmergencyButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#DC2626',
  color: 'white',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: 20,
  padding: theme.spacing(0.5, 1.5),
  minWidth: 'auto',
  '&:hover': {
    backgroundColor: '#B91C1C',
    transform: 'scale(1.05)',
  },
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(220, 38, 38, 0)',
    },
  },
}));

const ActingAsBanner: React.FC = () => {
  const {
    isActingAs,
    currentSession,
    sessionDuration,
    formatSessionDuration,
    endActingAsSession,
    emergencyExit,
    loading,
  } = useActingAs();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [sessionSummary, setSessionSummary] = useState('');

  if (!isActingAs || !currentSession) {
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEndSession = async () => {
    await endActingAsSession(sessionSummary);
    setEndDialogOpen(false);
    setSessionSummary('');
  };

  const handleEmergencyExit = async () => {
    await emergencyExit();
    setEmergencyDialogOpen(false);
  };

  const getSessionWarningLevel = () => {
    const estimatedDuration = currentSession.estimatedDuration || 60; // Default 60 minutes
    const estimatedSeconds = estimatedDuration * 60;
    
    if (sessionDuration > estimatedSeconds * 0.95) return 'critical';
    if (sessionDuration > estimatedSeconds * 0.8) return 'warning';
    return 'normal';
  };

  const warningLevel = getSessionWarningLevel();

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ActingAsBanner position="fixed">
            <Toolbar sx={{ minHeight: 56, px: 2 }}>
              {/* Left side - Acting As info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Person fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        lineHeight: 1.2,
                      }}
                    >
                      Acting As
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {currentSession.targetCompanyName}
                    </Typography>
                  </Box>
                </Box>

                {/* Session reason chip */}
                <Chip
                  label={currentSession.reason}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    maxWidth: 200,
                  }}
                />
              </Box>

              {/* Center - Session timer */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SessionTimer>
                  <Timer fontSize="small" sx={{ color: 'white' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatSessionDuration(sessionDuration)}
                  </Typography>
                  {warningLevel !== 'normal' && (
                    <Warning
                      fontSize="small"
                      sx={{
                        color: warningLevel === 'critical' ? '#FEE2E2' : '#FEF3C7',
                        animation: warningLevel === 'critical' ? 'pulse 1s infinite' : 'none',
                      }}
                    />
                  )}
                </SessionTimer>

                {/* Progress bar for estimated duration */}
                {currentSession.estimatedDuration && (
                  <Box sx={{ width: 100, mr: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((sessionDuration / (currentSession.estimatedDuration * 60)) * 100, 100)}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: warningLevel === 'critical' ? '#FEE2E2' : warningLevel === 'warning' ? '#FEF3C7' : 'white',
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Right side - Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Session info dropdown */}
                <Tooltip title="Session details">
                  <IconButton
                    color="inherit"
                    onClick={handleMenuOpen}
                    sx={{ color: 'white' }}
                  >
                    <Info />
                    <ExpandMore fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Emergency exit button */}
                <Tooltip title="Emergency exit - end session immediately">
                  <EmergencyButton
                    startIcon={<Emergency />}
                    onClick={() => setEmergencyDialogOpen(true)}
                    disabled={loading}
                  >
                    Emergency Exit
                  </EmergencyButton>
                </Tooltip>

                {/* Normal end session button */}
                <Button
                  startIcon={<ExitToApp />}
                  onClick={() => setEndDialogOpen(true)}
                  disabled={loading}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 20,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  End Session
                </Button>
              </Box>
            </Toolbar>
          </ActingAsBanner>
        </motion.div>
      </AnimatePresence>

      {/* Session info menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 300,
            maxWidth: 400,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Session Details
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Started: {currentSession.startedAt.toLocaleTimeString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Ella Recruiter: {currentSession.ellaRecruiterEmail}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Session ID: {currentSession.id}
          </Typography>
          {currentSession.estimatedDuration && (
            <Typography variant="body2" color="text.secondary">
              Estimated Duration: {currentSession.estimatedDuration} minutes
            </Typography>
          )}
        </Box>
      </Menu>

      {/* End session dialog */}
      <Dialog
        open={endDialogOpen}
        onClose={() => setEndDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>End Acting As Session</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            You are about to end your acting as session for {currentSession.targetCompanyName}.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Session Summary (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={sessionSummary}
            onChange={(e) => setSessionSummary(e.target.value)}
            placeholder="Briefly describe what was accomplished during this session..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEndSession}
            variant="contained"
            disabled={loading}
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency exit dialog */}
      <Dialog
        open={emergencyDialogOpen}
        onClose={() => setEmergencyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#DC2626' }}>
          Emergency Exit
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will immediately end your acting as session without saving any session summary.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to perform an emergency exit from the {currentSession.targetCompanyName} session?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEmergencyExit}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Emergency Exit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ActingAsBanner;