import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid,
  TextField,
  Switch,
  Link,
} from '@mui/material';
import {
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Report as ReportIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  DateRange as DateRangeIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
// Note: Date picker imports would be:
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// For now, using regular text fields for date input
import { CompanyAccount, DataExportRequest, DataExportJob } from '../../types/admin';
import { adminService } from '../../services/admin/adminService';
import toast from 'react-hot-toast';

interface DataExportDialogProps {
  open: boolean;
  company: CompanyAccount | null;
  onClose: () => void;
}

const DataExportDialog: React.FC<DataExportDialogProps> = ({
  open,
  company,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [exportJob, setExportJob] = useState<DataExportJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [formData, setFormData] = useState<Partial<DataExportRequest>>({
    formats: ['json'],
    scopes: ['users', 'assessments'],
    includeMetadata: true,
    encryptData: true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        formats: ['json'],
        scopes: ['users', 'assessments'],
        includeMetadata: true,
        encryptData: true,
      });
      setExportJob(null);
      setPolling(false);
    }
  }, [open]);

  // Poll for export job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (polling && exportJob?.id) {
      intervalId = setInterval(async () => {
        try {
          const updatedJob = await adminService.getExportJob(company?.id || '', exportJob.id);
          setExportJob(updatedJob);
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            setPolling(false);
            if (updatedJob.status === 'completed') {
              toast.success('Data export completed successfully!');
            } else {
              toast.error('Data export failed');
            }
          }
        } catch (error) {
          console.error('Failed to poll export status:', error);
          setPolling(false);
        }
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling, exportJob?.id]);

  const handleClose = () => {
    setPolling(false);
    onClose();
  };

  const handleStartExport = async () => {
    if (!company || !formData.formats?.length || !formData.scopes?.length) {
      toast.error('Please select at least one format and data scope');
      return;
    }

    setLoading(true);
    try {
      const exportRequest: DataExportRequest = {
        companyId: company.id,
        formats: formData.formats,
        scopes: formData.scopes,
        dateRange: formData.dateRange,
        includeMetadata: formData.includeMetadata || false,
        encryptData: formData.encryptData || false,
      };

      const job = await adminService.createDataExport(exportRequest);
      setExportJob(job);
      setPolling(true);
      toast.success('Data export started successfully');
    } catch (error) {
      console.error('Failed to start export:', error);
      toast.error('Failed to start data export');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (exportJob?.downloadUrl) {
      window.open(exportJob.downloadUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'users': return <PeopleIcon />;
      case 'assessments': return <AssessmentIcon />;
      case 'candidates': return <PersonIcon />;
      case 'reports': return <ReportIcon />;
      default: return <FileIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          minHeight: '500px',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon color="primary" />
          <Typography variant="h6">
            Export Data: {company?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {exportJob ? (
          // Export Status View
          <Box>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={exportJob.status.toUpperCase()}
                  color={getStatusColor(exportJob.status) as any}
                  icon={
                    exportJob.status === 'completed' ? <CheckIcon /> :
                    exportJob.status === 'failed' ? <ErrorIcon /> :
                    <ScheduleIcon />
                  }
                />
                <Typography variant="h6">
                  Export Job #{exportJob.id.slice(-8)}
                </Typography>
              </Box>

              {exportJob.status === 'processing' && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="body2">{exportJob.progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={exportJob.progress} />
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Started
                  </Typography>
                  <Typography variant="body1">
                    {new Date(exportJob.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Formats
                  </Typography>
                  <Typography variant="body1">
                    {exportJob.formats.join(', ').toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data Scope
                  </Typography>
                  <Typography variant="body1">
                    {exportJob.scopes.join(', ')}
                  </Typography>
                </Grid>
                {exportJob.fileSize && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      File Size
                    </Typography>
                    <Typography variant="body1">
                      {formatFileSize(exportJob.fileSize)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {exportJob.status === 'completed' && exportJob.downloadUrl && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Export completed successfully! Click the button below to download your data.
                    </Typography>
                  </Alert>
                  <Button
                    variant="contained"
                    startIcon={<GetAppIcon />}
                    onClick={handleDownload}
                    size="large"
                  >
                    Download Export
                  </Button>
                  {exportJob.expiresAt && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Download expires: {new Date(exportJob.expiresAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}

              {exportJob.status === 'failed' && exportJob.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Export failed:</strong> {exportJob.error}
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Box>
        ) : (
          // Export Configuration View
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Export company data to secure, downloadable files. All exports are encrypted 
                and available for 30 days.
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom>
              Export Formats
            </Typography>
            <FormGroup row sx={{ mb: 3 }}>
              {[
                { key: 'json', label: 'JSON', description: 'Machine-readable format' },
                { key: 'csv', label: 'CSV', description: 'Spreadsheet compatible' },
                { key: 'excel', label: 'Excel', description: 'Microsoft Excel format' }
              ].map((format) => (
                <FormControlLabel
                  key={format.key}
                  control={
                    <Checkbox
                      checked={formData.formats?.includes(format.key as any) || false}
                      onChange={(e) => {
                        const formats = formData.formats || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, formats: [...formats, format.key as any] });
                        } else {
                          setFormData({ ...formData, formats: formats.filter(f => f !== format.key) });
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{format.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            <Typography variant="h6" gutterBottom>
              Data Scope
            </Typography>
            <FormGroup row sx={{ mb: 3 }}>
              {[
                { key: 'users', label: 'Users & Profiles', description: 'User accounts and profile data' },
                { key: 'assessments', label: 'Assessments', description: 'Assessment questions and configurations' },
                { key: 'candidates', label: 'Candidates', description: 'Candidate profiles and applications' },
                { key: 'reports', label: 'Reports & Analytics', description: 'Generated reports and metrics' }
              ].map((scope) => (
                <FormControlLabel
                  key={scope.key}
                  control={
                    <Checkbox
                      checked={formData.scopes?.includes(scope.key as any) || false}
                      onChange={(e) => {
                        const scopes = formData.scopes || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, scopes: [...scopes, scope.key as any] });
                        } else {
                          setFormData({ ...formData, scopes: scopes.filter(s => s !== scope.key) });
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getScopeIcon(scope.key)}
                      <Box>
                        <Typography variant="body2">{scope.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {scope.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            <Typography variant="h6" gutterBottom>
              Date Range (Optional)
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.dateRange?.startDate ? 
                    formData.dateRange.startDate.toISOString().split('T')[0] : ''
                  }
                  onChange={(e) => 
                    setFormData({
                      ...formData,
                      dateRange: {
                        ...formData.dateRange,
                        startDate: e.target.value ? new Date(e.target.value) : new Date(),
                        endDate: formData.dateRange?.endDate || new Date(),
                      }
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.dateRange?.endDate ? 
                    formData.dateRange.endDate.toISOString().split('T')[0] : ''
                  }
                  onChange={(e) => 
                    setFormData({
                      ...formData,
                      dateRange: {
                        ...formData.dateRange,
                        startDate: formData.dateRange?.startDate || new Date(),
                        endDate: e.target.value ? new Date(e.target.value) : new Date(),
                      }
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Export Options
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Include Metadata"
                  secondary="Add creation dates, user info, and system metadata"
                />
                <Switch
                  checked={formData.includeMetadata}
                  onChange={(e) => setFormData({ ...formData, includeMetadata: e.target.checked })}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Encrypt Data"
                  secondary="Password-protect exported files (recommended)"
                />
                <Switch
                  checked={formData.encryptData}
                  onChange={(e) => setFormData({ ...formData, encryptData: e.target.checked })}
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Large exports may take several minutes to complete. You'll be notified when 
                the export is ready for download.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={loading || polling}>
          {exportJob?.status === 'completed' ? 'Close' : 'Cancel'}
        </Button>
        {!exportJob && (
          <Button
            variant="contained"
            onClick={handleStartExport}
            disabled={loading || !formData.formats?.length || !formData.scopes?.length}
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {loading ? 'Starting Export...' : 'Start Export'}
          </Button>
        )}
        {exportJob && exportJob.status === 'failed' && (
          <Button
            variant="contained"
            onClick={() => {
              setExportJob(null);
              setPolling(false);
            }}
            startIcon={<DownloadIcon />}
          >
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DataExportDialog;