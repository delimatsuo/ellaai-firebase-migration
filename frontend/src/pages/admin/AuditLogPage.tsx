import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuditLogEntry } from '../../types/admin';
import toast from 'react-hot-toast';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  const actions = [
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_SUSPENDED',
    'USER_DELETED',
    'COMPANY_CREATED',
    'COMPANY_UPDATED',
    'COMPANY_SUSPENDED',
    'ASSESSMENT_CREATED',
    'ASSESSMENT_UPDATED',
    'ASSESSMENT_DELETED',
    'DATABASE_QUERY',
    'SYSTEM_CONFIG_CHANGED',
    'IMPERSONATION_STARTED',
    'IMPERSONATION_ENDED',
  ];

  const severities = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, severityFilter, userFilter, startDate, endDate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (realTimeEnabled) {
      interval = setInterval(() => {
        loadNewLogs();
      }, 5000); // Poll every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeEnabled]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          userId: 'admin_001',
          userEmail: 'admin@ellaai.com',
          action: 'USER_SUSPENDED',
          resource: 'user',
          resourceId: 'user_123',
          details: { 
            reason: 'Policy violation',
            suspendedUser: 'john.doe@example.com',
            previousStatus: 'active'
          },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          severity: 'high',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          userId: 'admin_002',
          userEmail: 'support@ellaai.com',
          action: 'COMPANY_CREATED',
          resource: 'company',
          resourceId: 'company_456',
          details: { 
            companyName: 'TechCorp Inc.',
            plan: 'professional',
            initialUsers: 25
          },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'medium',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          userId: 'admin_001',
          userEmail: 'admin@ellaai.com',
          action: 'DATABASE_QUERY',
          resource: 'database',
          details: { 
            collection: 'users',
            query: '{"where": [["role", "==", "admin"]]}',
            recordCount: 5,
            executionTime: 45
          },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          severity: 'low',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          userId: 'admin_003',
          userEmail: 'security@ellaai.com',
          action: 'IMPERSONATION_STARTED',
          resource: 'user',
          resourceId: 'user_789',
          details: { 
            targetUser: 'jane.smith@techcorp.com',
            reason: 'Customer Support',
            duration: 60,
            sessionId: 'imp_session_123'
          },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'critical',
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          userId: 'system',
          userEmail: 'system@ellaai.com',
          action: 'SYSTEM_CONFIG_CHANGED',
          resource: 'config',
          details: { 
            configKey: 'max_file_upload_size',
            oldValue: '10MB',
            newValue: '25MB',
            changedBy: 'admin@ellaai.com'
          },
          ipAddress: '127.0.0.1',
          userAgent: 'System Internal',
          severity: 'medium',
        },
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadNewLogs = async () => {
    try {
      // Simulate fetching new logs
      const newLog: AuditLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        userId: 'admin_001',
        userEmail: 'admin@ellaai.com',
        action: 'USER_LOGIN',
        resource: 'auth',
        details: { loginMethod: 'email' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        severity: 'low',
      };

      // Only add if it's a new log (in real app, check against last known timestamp)
      if (Math.random() > 0.8) { // 20% chance of new log
        setLogs(prev => [newLog, ...prev]);
      }
    } catch (error) {
      console.error('Failed to load new logs:', error);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    if (userFilter) {
      filtered = filtered.filter(log => 
        log.userEmail.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(log => log.timestamp <= endDate);
    }

    setFilteredLogs(filtered);
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'success';
    if (action.includes('DELETED') || action.includes('SUSPENDED')) return 'error';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'warning';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'info';
    if (action.includes('IMPERSONATION')) return 'secondary';
    return 'default';
  };

  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
            Audit Logs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={realTimeEnabled ? 'contained' : 'outlined'}
              startIcon={<RefreshIcon />}
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              sx={{ 
                borderColor: '#444', 
                color: realTimeEnabled ? '#fff' : '#fff',
                bgcolor: realTimeEnabled ? '#ff4444' : 'transparent'
              }}
            >
              {realTimeEnabled ? 'Live Updates On' : 'Enable Live Updates'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportLogs}
              sx={{ borderColor: '#444', color: '#fff' }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {realTimeEnabled && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3' }}
          >
            Live updates enabled - new audit logs will appear automatically
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
          <CardContent>
            <Accordion sx={{ bgcolor: 'transparent', color: '#fff' }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
                sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}
              >
                <FilterIcon sx={{ color: '#ccc' }} />
                <Typography>Advanced Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#ccc' }} />
                          </InputAdornment>
                        ),
                        sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#ccc' }}>Action</InputLabel>
                      <Select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                      >
                        <MenuItem value="all">All Actions</MenuItem>
                        {actions.map((action) => (
                          <MenuItem key={action} value={action}>
                            {action.replace(/_/g, ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#ccc' }}>Severity</InputLabel>
                      <Select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                      >
                        <MenuItem value="all">All Severities</MenuItem>
                        {severities.map((severity) => (
                          <MenuItem key={severity} value={severity}>
                            {severity.toUpperCase()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true, sx: { color: '#ccc' } }}
                      InputProps={{
                        sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true, sx: { color: '#ccc' } }}
                      InputProps={{
                        sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                      }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    {filteredLogs.length} log entries found
                  </Typography>
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setActionFilter('all');
                      setSeverityFilter('all');
                      setUserFilter('');
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    sx={{ color: '#ff4444' }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>User</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Action</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Resource</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Severity</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>IP Address</TableCell>
                  <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      <Typography variant="body2">
                        {log.timestamp.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {log.userEmail}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        {log.userId}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#444' }}>
                      <Chip 
                        label={log.action.replace(/_/g, ' ')} 
                        size="small"
                        color={getActionColor(log.action) as any}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      <Typography variant="body2">
                        {log.resource}
                      </Typography>
                      {log.resourceId && (
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          ID: {log.resourceId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#444' }}>
                      <Chip 
                        label={log.severity.toUpperCase()} 
                        size="small"
                        color={getSeverityColor(log.severity) as any}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                      {log.ipAddress}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#444' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(log)}
                        sx={{ color: '#ff4444' }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredLogs.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ color: '#fff', borderTop: '1px solid #444' }}
          />
        </Card>

        {/* Log Details Dialog */}
        <Dialog 
          open={showDetailDialog} 
          onClose={() => setShowDetailDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { bgcolor: '#2a2a2a', color: '#fff' } }}
        >
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      Timestamp
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.timestamp.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      User
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.userEmail}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ccc' }}>
                      ID: {selectedLog.userId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      Action
                    </Typography>
                    <Chip 
                      label={selectedLog.action.replace(/_/g, ' ')} 
                      color={getActionColor(selectedLog.action) as any}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      Severity
                    </Typography>
                    <Chip 
                      label={selectedLog.severity.toUpperCase()} 
                      color={getSeverityColor(selectedLog.severity) as any}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      Resource
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.resource}
                    </Typography>
                    {selectedLog.resourceId && (
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        ID: {selectedLog.resourceId}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      IP Address
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.ipAddress}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      User Agent
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', wordBreak: 'break-all' }}>
                      {selectedLog.userAgent}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 0.5 }}>
                      Details
                    </Typography>
                    <Box sx={{ 
                      bgcolor: '#333', 
                      p: 2, 
                      borderRadius: 1, 
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      maxHeight: 300
                    }}>
                      <pre style={{ margin: 0, color: '#fff' }}>
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailDialog(false)} sx={{ color: '#ccc' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AuditLogPage;