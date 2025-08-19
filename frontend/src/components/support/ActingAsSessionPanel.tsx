import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  styled,
  alpha,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  AccessTime,
  ExitToApp,
  ExpandMore,
  ExpandLess,
  Person,
  History,
  Analytics,
  Description,
  Visibility,
  Edit,
  Delete,
  Add,
  Download,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useActingAs } from '../../hooks/useActingAs';
import { colors, glassStyles } from '../../theme/theme';

const SessionPanel = styled(Paper)(({ theme }) => ({
  ...glassStyles.light,
  padding: theme.spacing(3),
  borderRadius: 16,
  border: `1px solid ${alpha('#FF8C00', 0.2)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #FF8C00 0%, #FF6347 100%)',
  },
}));

const ActionTypeIcon = styled(Box)<{ actionType: string }>(({ theme, actionType }) => {
  const getColor = () => {
    switch (actionType) {
      case 'page_view': return '#3B82F6';
      case 'create': return '#10B981';
      case 'update': return '#F59E0B';
      case 'delete': return '#EF4444';
      case 'view': return '#6366F1';
      default: return '#6B7280';
    }
  };

  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: getColor(),
    marginRight: theme.spacing(1),
  };
});

const StatsCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: alpha('#F8FAFC', 0.8),
  border: `1px solid ${alpha('#E2E8F0', 0.6)}`,
  textAlign: 'center',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ActingAsSessionPanel: React.FC = () => {
  const {
    isActingAs,
    currentSession,
    sessionDuration,
    formatSessionDuration,
    getSessionSummary,
    endActingAsSession,
    loading,
  } = useActingAs();

  const [expandedSections, setExpandedSections] = useState({
    details: true,
    actions: false,
    analytics: false,
  });
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [sessionSummary, setSessionSummary] = useState('');

  if (!isActingAs || !currentSession) {
    return null;
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEndSession = async () => {
    await endActingAsSession(sessionSummary);
    setEndDialogOpen(false);
    setSessionSummary('');
  };

  const sessionStats = getSessionSummary();
  const recentActions = currentSession.actions.slice(-10).reverse();

  const exportSessionData = () => {
    const sessionData = {
      session: currentSession,
      duration: formatSessionDuration(sessionDuration),
      summary: sessionStats,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acting-as-session-${currentSession.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SessionPanel>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #FF8C00 0%, #FF6347 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Person />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Active Session
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentSession.targetCompanyName}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                onClick={exportSessionData}
                title="Export session data"
              >
                <Download />
              </IconButton>
              <Button
                startIcon={<ExitToApp />}
                onClick={() => setEndDialogOpen(true)}
                variant="outlined"
                color="primary"
                disabled={loading}
              >
                End Session
              </Button>
            </Box>
          </Box>

          {/* Session Details */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              onClick={() => toggleSection('details')}
              sx={{ justifyContent: 'space-between', textTransform: 'none', p: 0 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Session Details
              </Typography>
              {expandedSections.details ? <ExpandLess /> : <ExpandMore />}
            </Button>
            
            <Collapse in={expandedSections.details}>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                  <StatsCard>
                    <AccessTime sx={{ fontSize: 24, color: '#FF8C00', mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      {formatSessionDuration(sessionDuration)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                  </StatsCard>
                  
                  <StatsCard>
                    <Analytics sx={{ fontSize: 24, color: colors.primary[500], mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      {sessionStats.totalActions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Actions Taken
                    </Typography>
                  </StatsCard>
                  
                  <StatsCard>
                    <History sx={{ fontSize: 24, color: '#10B981', mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      {format(currentSession.startedAt, 'HH:mm')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Started At
                    </Typography>
                  </StatsCard>
                </Box>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ella Recruiter"
                      secondary={currentSession.ellaRecruiterEmail}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Description />
                    </ListItemIcon>
                    <ListItemText
                      primary="Session Reason"
                      secondary={currentSession.reason}
                    />
                  </ListItem>
                  
                  {currentSession.estimatedDuration && (
                    <ListItem>
                      <ListItemIcon>
                        <AccessTime />
                      </ListItemIcon>
                      <ListItemText
                        primary="Estimated Duration"
                        secondary={`${currentSession.estimatedDuration} minutes`}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Recent Actions */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              onClick={() => toggleSection('actions')}
              sx={{ justifyContent: 'space-between', textTransform: 'none', p: 0 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Recent Actions ({sessionStats.totalActions})
              </Typography>
              {expandedSections.actions ? <ExpandLess /> : <ExpandMore />}
            </Button>
            
            <Collapse in={expandedSections.actions}>
              <Box sx={{ mt: 2 }}>
                {recentActions.length > 0 ? (
                  <Timeline>
                    {recentActions.map((action, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent sx={{ flex: 0.2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {format(action.timestamp, 'HH:mm:ss')}
                          </Typography>
                        </TimelineOppositeContent>
                        
                        <TimelineSeparator>
                          <TimelineDot
                            sx={{
                              backgroundColor: (() => {
                                switch (action.action) {
                                  case 'page_view': return '#3B82F6';
                                  case 'create': return '#10B981';
                                  case 'update': return '#F59E0B';
                                  case 'delete': return '#EF4444';
                                  default: return '#6B7280';
                                }
                              })(),
                            }}
                          />
                          {index < recentActions.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        
                        <TimelineContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {action.action.replace('_', ' ')}
                            </Typography>
                            <Chip
                              label={action.resource}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {action.path}
                          </Typography>
                          {action.details && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {JSON.stringify(action.details, null, 2).slice(0, 50)}...
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <History sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No actions recorded yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Analytics */}
          <Box>
            <Button
              fullWidth
              onClick={() => toggleSection('analytics')}
              sx={{ justifyContent: 'space-between', textTransform: 'none', p: 0 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Session Analytics
              </Typography>
              {expandedSections.analytics ? <ExpandLess /> : <ExpandMore />}
            </Button>
            
            <Collapse in={expandedSections.analytics}>
              <Box sx={{ mt: 2 }}>
                {Object.entries(sessionStats.actionsByType).length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(sessionStats.actionsByType).map(([action, count]) => (
                      <Chip
                        key={action}
                        label={`${action}: ${count}`}
                        size="small"
                        sx={{
                          backgroundColor: alpha(colors.primary[500], 0.1),
                          color: colors.primary[700],
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No analytics data available yet
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>
        </SessionPanel>
      </motion.div>

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
            Session Duration: {formatSessionDuration(sessionDuration)}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Actions Taken: {sessionStats.totalActions}
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Session Summary"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={sessionSummary}
            onChange={(e) => setSessionSummary(e.target.value)}
            placeholder="Describe what was accomplished during this session..."
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
    </>
  );
};

export default ActingAsSessionPanel;