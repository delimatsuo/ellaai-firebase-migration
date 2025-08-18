import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Storage as DatabaseIcon,
  Security as AuthIcon,
  Cloud as StorageIcon,
  Api as ApiIcon,
  Refresh as RefreshIcon,
  Timeline as MetricsIcon,
  Notifications as AlertIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SystemHealth, SystemAlert } from '../../types/admin';
import toast from 'react-hot-toast';

const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    loadSystemHealth();
    loadPerformanceData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadSystemHealth();
        loadPerformanceData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockHealth: SystemHealth = {
        status: 'healthy',
        services: {
          database: {
            status: 'healthy',
            responseTime: 45,
            errorRate: 0.001,
            lastChecked: new Date(),
          },
          authentication: {
            status: 'healthy',
            responseTime: 89,
            errorRate: 0.002,
            lastChecked: new Date(),
          },
          storage: {
            status: 'degraded',
            responseTime: 234,
            errorRate: 0.012,
            lastChecked: new Date(),
          },
          api: {
            status: 'healthy',
            responseTime: 156,
            errorRate: 0.005,
            lastChecked: new Date(),
          },
        },
        metrics: {
          responseTime: 131,
          errorRate: 0.005,
          throughput: 1247,
          uptime: 99.97,
        },
        alerts: [],
        lastChecked: new Date(),
      };

      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          severity: 'warning',
          title: 'Storage Response Time High',
          message: 'Storage service response time is above normal threshold (>200ms)',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          resolved: false,
        },
        {
          id: '2',
          severity: 'info',
          title: 'Scheduled Maintenance Complete',
          message: 'Database maintenance completed successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          resolved: true,
          resolvedAt: new Date(Date.now() - 1000 * 60 * 60),
          resolvedBy: 'system',
        },
      ];

      setHealth(mockHealth);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load system health:', error);
      toast.error('Failed to load system health');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    // Generate mock performance data for the last 24 hours
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseTime: Math.floor(Math.random() * 100) + 100,
        errorRate: Math.random() * 0.02,
        throughput: Math.floor(Math.random() * 500) + 800,
        uptime: 99.5 + Math.random() * 0.5,
      });
    }
    
    setPerformanceData(data);
  };

  const handleResolveAlert = async (alert: SystemAlert) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedAlerts = alerts.map(a => 
        a.id === alert.id 
          ? { ...a, resolved: true, resolvedAt: new Date(), resolvedBy: 'admin@ellaai.com' }
          : a
      );
      setAlerts(updatedAlerts);
      toast.success('Alert resolved successfully');
      setShowAlertDialog(false);
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'down': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <HealthyIcon sx={{ color: '#4caf50' }} />;
      case 'degraded': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'down': return <ErrorIcon sx={{ color: '#f44336' }} />;
      default: return <WarningIcon sx={{ color: '#757575' }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>System Health</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          System Health Monitor
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff4444' } }}
              />
            }
            label="Auto Refresh"
            sx={{ color: '#ccc' }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSystemHealth}
            sx={{ borderColor: '#444', color: '#fff' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Overall Status */}
      <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getStatusIcon(health?.status || 'down')}
            <Typography variant="h5" sx={{ color: getStatusColor(health?.status || 'down') }}>
              System Status: {health?.status?.toUpperCase()}
            </Typography>
          </Box>
          
          {alerts.filter(a => !a.resolved).length > 0 && (
            <Alert 
              severity="warning" 
              sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800' }}
            >
              {alerts.filter(a => !a.resolved).length} active alert(s) require attention
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Service Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {health && Object.entries(health.services).map(([serviceName, service]) => (
          <Grid item xs={12} sm={6} md={3} key={serviceName}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: getStatusColor(service.status) }}>
                    {serviceName === 'database' && <DatabaseIcon />}
                    {serviceName === 'authentication' && <AuthIcon />}
                    {serviceName === 'storage' && <StorageIcon />}
                    {serviceName === 'api' && <ApiIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', textTransform: 'capitalize' }}>
                      {serviceName}
                    </Typography>
                    <Chip 
                      label={service.status} 
                      size="small"
                      sx={{ 
                        bgcolor: getStatusColor(service.status),
                        color: '#fff',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>Response Time</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>{service.responseTime}ms</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>Error Rate</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>{(service.errorRate * 100).toFixed(3)}%</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#2196f3' }}>
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {health?.metrics.responseTime}ms
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Avg Response Time
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
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {health?.metrics.uptime}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Uptime
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
                  <ErrorIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {(health?.metrics.errorRate || 0 * 100).toFixed(3)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Error Rate
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
                  <MetricsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {health?.metrics.throughput}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Requests/min
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Response Time (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="time" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="responseTime" stroke="#ff4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Throughput (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="time" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="throughput" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Alerts */}
      <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            System Alerts
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Severity</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Title</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Message</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Time</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Status</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell sx={{ borderColor: '#444' }}>
                      <Chip 
                        label={alert.severity.toUpperCase()} 
                        size="small"
                        color={getSeverityColor(alert.severity) as any}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      {alert.title}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      {alert.message}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      {alert.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#444' }}>
                      <Chip 
                        label={alert.resolved ? 'Resolved' : 'Active'} 
                        size="small"
                        color={alert.resolved ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: '#444' }}>
                      {!alert.resolved && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowAlertDialog(true);
                          }}
                          sx={{ color: '#ff4444' }}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Alert Resolution Dialog */}
      <Dialog 
        open={showAlertDialog} 
        onClose={() => setShowAlertDialog(false)}
        PaperProps={{ sx: { bgcolor: '#2a2a2a', color: '#fff' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertIcon sx={{ color: '#ff9800' }} />
          Resolve Alert
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to resolve this alert?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#333', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#ff9800' }}>
                  {selectedAlert.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  {selectedAlert.message}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertDialog(false)} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
          <Button 
            onClick={() => selectedAlert && handleResolveAlert(selectedAlert)}
            variant="contained"
            sx={{ bgcolor: '#ff4444', '&:hover': { bgcolor: '#cc3333' } }}
          >
            Resolve Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemHealthPage;