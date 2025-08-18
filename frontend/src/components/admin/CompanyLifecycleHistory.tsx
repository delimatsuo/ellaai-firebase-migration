import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  PlayArrow as ActivateIcon,
  Block as SuspendIcon,
  Close as CloseIcon,
  Download as ExportIcon,
  Payment as PaymentIcon,
  TrendingUp as PlanIcon,
  Person as UserIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { CompanyAccount, CompanyLifecycleHistory as CompanyLifecycleHistoryType } from '../../types/admin';
import { adminService } from '../../services/admin/adminService';
import toast from 'react-hot-toast';

interface CompanyLifecycleHistoryProps {
  open: boolean;
  company: CompanyAccount | null;
  onClose: () => void;
}

const CompanyLifecycleHistory: React.FC<CompanyLifecycleHistoryProps> = ({
  open,
  company,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CompanyLifecycleHistoryType | null>(null);

  useEffect(() => {
    if (open && company) {
      loadHistory();
    }
  }, [open, company]);

  const loadHistory = async () => {
    if (!company) return;

    setLoading(true);
    try {
      const lifecycleHistory = await adminService.getCompanyLifecycleHistory(company.id);
      setHistory(lifecycleHistory);
    } catch (error) {
      console.error('Failed to load lifecycle history:', error);
      toast.error('Failed to load company history');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return <BusinessIcon />;
      case 'activated': return <ActivateIcon />;
      case 'suspended': return <SuspendIcon />;
      case 'reactivated': return <ActivateIcon />;
      case 'closed': return <CloseIcon />;
      case 'data_exported': return <ExportIcon />;
      case 'plan_changed': return <PlanIcon />;
      case 'billing_updated': return <PaymentIcon />;
      default: return <InfoIcon />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return 'primary';
      case 'activated':
      case 'reactivated': return 'success';
      case 'suspended': return 'warning';
      case 'closed': return 'error';
      case 'data_exported': return 'info';
      case 'plan_changed':
      case 'billing_updated': return 'secondary';
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

  const formatEventType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderEventDetails = (event: any) => {
    if (!event.details) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">View Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {Object.entries(event.details).map(([key, value]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:
                  </Typography>
                  <Typography variant="body2">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          minHeight: '600px',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6">
            Lifecycle History: {company?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : history ? (
          <Box>
            {/* Current Status Summary */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={history.currentStatus.toUpperCase()}
                      color={getStatusColor(history.currentStatus) as any}
                      sx={{ mb: 1, fontSize: '1rem', fontWeight: 'bold' }}
                    />
                    <Typography variant="h6">Current Status</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {history.events.length}
                    </Typography>
                    <Typography variant="h6">Total Events</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {Math.floor((new Date().getTime() - new Date(history.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </Typography>
                    <Typography variant="h6">Days Active</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Suspension History */}
            {history.suspensionHistory.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Suspension History
                </Typography>
                <List>
                  {history.suspensionHistory.map((suspension, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <SuspendIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Suspended by ${suspension.suspendedBy}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {suspension.suspendedAt && new Date(suspension.suspendedAt).toLocaleString()}
                              {suspension.reason && ` - ${suspension.reason}`}
                            </Typography>
                            {suspension.reactivatedAt && (
                              <Typography variant="body2" color="success.main">
                                Reactivated: {new Date(suspension.reactivatedAt).toLocaleString()}
                                {suspension.reactivatedBy && ` by ${suspension.reactivatedBy}`}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Closure Details */}
            {history.closureDetails && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                  Closure Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Closed Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(history.closureDetails.closedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Closed By
                    </Typography>
                    <Typography variant="body1">
                      {history.closureDetails.closedBy}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Reason
                    </Typography>
                    <Typography variant="body1">
                      {history.closureDetails.reason}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {history.closureDetails.type === 'archive' ? 'Archive' : 'Permanent Delete'}
                    </Typography>
                  </Grid>
                  {history.closureDetails.gracePeriodEnds && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Grace Period Ends
                      </Typography>
                      <Typography variant="body1">
                        {new Date(history.closureDetails.gracePeriodEnds).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Data Exported
                    </Typography>
                    <Chip
                      label={history.closureDetails.dataExported ? 'Yes' : 'No'}
                      color={history.closureDetails.dataExported ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Event History */}
            <Typography variant="h6" gutterBottom>
              Event Timeline
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {history.events.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              ).map((event, index) => (
                <Card key={event.id} sx={{ position: 'relative' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box 
                        sx={{ 
                          p: 1, 
                          borderRadius: '50%', 
                          bgcolor: `${getEventColor(event.type)}.main`,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getEventIcon(event.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          {formatEventType(event.type)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <UserIcon fontSize="small" />
                      <Typography variant="body2">
                        {event.performedByEmail}
                      </Typography>
                    </Box>

                    {event.reason && (
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Reason:</strong> {event.reason}
                        </Typography>
                      </Alert>
                    )}

                    {event.details && Object.keys(event.details).length > 0 && (
                      renderEventDetails(event)
                    )}
                  </CardContent>
                  
                  {/* Connector line */}
                  {index < history.events.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 28,
                        bottom: -16,
                        width: 2,
                        height: 16,
                        bgcolor: 'divider',
                        zIndex: 1
                      }}
                    />
                  )}
                </Card>
              ))}
            </Box>
          </Box>
        ) : (
          <Alert severity="warning">
            <Typography variant="body2">
              No lifecycle history available for this company.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyLifecycleHistory;