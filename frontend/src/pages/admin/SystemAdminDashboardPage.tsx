import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SystemMetrics, AuditLogEntry, SystemAlert } from '../../types/admin';
import { adminService } from '../../services/admin/adminService';

const SystemAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load real data from APIs
      const [metricsData, auditLogsData] = await Promise.all([
        adminService.getSystemMetrics().catch(() => ({
          activeUsers: 0,
          totalUsers: 0,
          totalCompanies: 0,
          totalAssessments: 0,
          averageResponseTime: 0,
          errorRate: 0,
          uptime: 0,
          lastUpdated: new Date(),
        })),
        adminService.getAuditLogs({ limit: 10 }).catch(() => ({ logs: [], total: 0 }))
      ]);

      setMetrics(metricsData);
      setRecentActivity(auditLogsData.logs);

      // Check for system alerts based on metrics
      const alerts: SystemAlert[] = [];
      if (metricsData.averageResponseTime > 500) {
        alerts.push({
          id: 'response-time',
          severity: 'warning',
          title: 'High API Response Time',
          message: `Average response time is ${metricsData.averageResponseTime}ms (threshold: 500ms)`,
          timestamp: new Date(),
          resolved: false,
        });
      }
      if (metricsData.errorRate > 0.05) {
        alerts.push({
          id: 'error-rate',
          severity: 'error',
          title: 'High Error Rate',
          message: `Error rate is ${(metricsData.errorRate * 100).toFixed(2)}% (threshold: 5%)`,
          timestamp: new Date(),
          resolved: false,
        });
      }
      if (metricsData.uptime < 99.9) {
        alerts.push({
          id: 'uptime',
          severity: 'warning',
          title: 'Low System Uptime',
          message: `System uptime is ${metricsData.uptime}% (target: 99.9%)`,
          timestamp: new Date(),
          resolved: false,
        });
      }
      setSystemAlerts(alerts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback data on error
      setMetrics({
        activeUsers: 0,
        totalUsers: 0,
        totalCompanies: 0,
        totalAssessments: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
        lastUpdated: new Date(),
      });
      setRecentActivity([]);
      setSystemAlerts([{
        id: 'api-error',
        severity: 'error',
        title: 'API Connection Failed',
        message: 'Unable to connect to backend services. Please check system status.',
        timestamp: new Date(),
        resolved: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#757575';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>System Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          System Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
          sx={{ borderColor: '#ff4444', color: '#ff4444' }}
        >
          Refresh
        </Button>
      </Box>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800' }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/admin/health')}>
              View Details
            </Button>
          }
        >
          {systemAlerts.length} active system alert(s) require attention
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {metrics?.activeUsers?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Active Users
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4caf50' }}>
                    Total: {metrics?.totalUsers?.toLocaleString() || '0'}
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
                <Avatar sx={{ bgcolor: '#2196f3' }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {metrics?.totalCompanies || '0'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Companies
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4caf50' }}>
                    Total Registered
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
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {metrics?.averageResponseTime || '0'}ms
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Avg Response Time
                  </Typography>
                  <Typography variant="caption" sx={{ color: (metrics?.averageResponseTime || 0) > 500 ? '#ff9800' : '#4caf50' }}>
                    {(metrics?.averageResponseTime || 0) > 500 ? 'Above threshold' : 'Within threshold'}
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
                    {metrics?.uptime?.toFixed(2) || '0.00'}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    System Uptime
                  </Typography>
                  <Typography variant="caption" sx={{ color: (metrics?.uptime || 0) >= 99.9 ? '#4caf50' : '#ff9800' }}>
                    {(metrics?.uptime || 0) >= 99.9 ? 'Meeting SLA' : 'Below SLA target'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<StorageIcon />}
                  onClick={() => navigate('/admin/database')}
                  sx={{ justifyContent: 'flex-start', borderColor: '#444', color: '#fff' }}
                >
                  Database Query Tool
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/admin/users')}
                  sx={{ justifyContent: 'flex-start', borderColor: '#444', color: '#fff' }}
                >
                  Manage Users
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/admin/accounts')}
                  sx={{ justifyContent: 'flex-start', borderColor: '#444', color: '#fff' }}
                >
                  Account Management
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/admin/audit')}
                  sx={{ justifyContent: 'flex-start', borderColor: '#444', color: '#fff' }}
                >
                  View Audit Logs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Recent Admin Activity
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/admin/audit')}
                  sx={{ color: '#ff4444' }}
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Time</TableCell>
                      <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Admin</TableCell>
                      <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Action</TableCell>
                      <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Resource</TableCell>
                      <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Severity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivity.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                          {entry.userEmail || 'System'}
                        </TableCell>
                        <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                          {entry.action?.replace(/_/g, ' ') || 'Unknown'}
                        </TableCell>
                        <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                          {entry.resource || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#444' }}>
                          <Chip 
                            label={entry.severity || 'medium'} 
                            size="small"
                            color={getSeverityColor(entry.severity || 'medium') as any}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemAdminDashboardPage;