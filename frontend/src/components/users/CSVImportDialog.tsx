import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Settings as SettingsIcon,
  PlayArrow as ImportIcon,
  Close as CloseIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { UserInvitation, CSVImportResult } from '../../services/users/userService';
import toast from 'react-hot-toast';

interface CSVImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (csvData: string, options: {
    skipHeader?: boolean;
    defaultRole?: string;
    defaultCompanyId?: string;
    sendInvitations?: boolean;
  }) => Promise<CSVImportResult>;
  companies?: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
}

interface ValidationError {
  row: number;
  field: string;
  error: string;
  value?: string;
}

interface ParsedUser {
  row: number;
  email: string;
  displayName?: string;
  role?: string;
  companyId?: string;
  isValid: boolean;
  errors: string[];
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  open,
  onClose,
  onImport,
  companies = [],
  defaultCompanyId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  // Import options
  const [skipHeader, setSkipHeader] = useState(true);
  const [defaultRole, setDefaultRole] = useState('candidate');
  const [targetCompanyId, setTargetCompanyId] = useState(defaultCompanyId || '');
  const [sendInvitations, setSendInvitations] = useState(true);

  const steps = ['Upload CSV', 'Preview & Validate', 'Configure Import', 'Import Results'];

  const roles = [
    { value: 'candidate', label: 'Candidate' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'admin', label: 'Company Admin' },
  ];

  const requiredFields = ['email'];
  const optionalFields = ['displayName', 'name', 'role', 'companyId'];
  const allValidFields = [...requiredFields, ...optionalFields];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setCsvData(data);
      parseCSV(data);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const parseCSV = (data: string) => {
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error(`CSV parsing error: ${results.errors[0]?.message || 'Unknown error'}`);
          return;
        }

        setParsedData(results.data as any[]);
        validateData(results.data as any[]);
        setCurrentStep(1);
      },
      error: (error: any) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
  };

  const validateData = (data: any[]) => {
    const errors: ValidationError[] = [];
    const users: ParsedUser[] = [];
    const emailSet = new Set<string>();

    data.forEach((row, index) => {
      const rowNumber = index + (skipHeader ? 2 : 1); // Account for header row
      const userErrors: string[] = [];
      
      // Validate email
      const email = row.email?.trim();
      if (!email) {
        errors.push({ row: rowNumber, field: 'email', error: 'Email is required' });
        userErrors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNumber, field: 'email', error: 'Invalid email format', value: email });
        userErrors.push('Invalid email format');
      } else if (emailSet.has(email.toLowerCase())) {
        errors.push({ row: rowNumber, field: 'email', error: 'Duplicate email', value: email });
        userErrors.push('Duplicate email');
      } else {
        emailSet.add(email.toLowerCase());
      }

      // Validate role
      const role = row.role?.trim() || defaultRole;
      if (role && !roles.some(r => r.value === role)) {
        errors.push({ row: rowNumber, field: 'role', error: 'Invalid role', value: role });
        userErrors.push('Invalid role');
      }

      // Validate company
      const companyId = row.companyId?.trim() || targetCompanyId;
      if (companies.length > 0 && companyId && !companies.some(c => c.id === companyId)) {
        errors.push({ row: rowNumber, field: 'companyId', error: 'Invalid company ID', value: companyId });
        userErrors.push('Invalid company');
      }

      users.push({
        row: rowNumber,
        email: email || '',
        displayName: row.displayName?.trim() || row.name?.trim() || '',
        role: role,
        companyId: companyId,
        isValid: userErrors.length === 0,
        errors: userErrors,
      });
    });

    setValidationErrors(errors);
    setParsedUsers(users);
  };

  const handleNext = () => {
    if (currentStep === 1 && validationErrors.length > 0) {
      const criticalErrors = validationErrors.filter(e => e.field === 'email');
      if (criticalErrors.length > 0) {
        toast.error('Please fix critical errors before proceeding');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleImport = async () => {
    if (!csvData) return;

    setLoading(true);
    setProgress(0);
    setCurrentStep(3);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const result = await onImport(csvData, {
        skipHeader,
        defaultRole,
        defaultCompanyId: targetCompanyId,
        sendInvitations,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);

      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.successful} user(s)`);
      } else if (result.successful === 0) {
        toast.error(`Failed to import all users`);
      } else {
        toast.error(`Imported ${result.successful} user(s), ${result.failed} failed`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['email', 'displayName', 'role', 'companyId'];
    const sampleData = [
      ['john.doe@example.com', 'John Doe', 'candidate', targetCompanyId || 'company_1'],
      ['jane.smith@example.com', 'Jane Smith', 'recruiter', targetCompanyId || 'company_1'],
      ['bob.wilson@example.com', 'Bob Wilson', 'hiring_manager', targetCompanyId || 'company_2'],
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (validationErrors.length === 0) return;

    const headers = ['Row', 'Field', 'Error', 'Value'];
    const errorData = validationErrors.map(error => [
      error.row.toString(),
      error.field,
      error.error,
      error.value || '',
    ]);

    const csvContent = [headers, ...errorData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_errors.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const validUsers = useMemo(() => parsedUsers.filter(u => u.isValid), [parsedUsers]);
  const invalidUsers = useMemo(() => parsedUsers.filter(u => !u.isValid), [parsedUsers]);

  const handleClose = () => {
    setCurrentStep(0);
    setCsvFile(null);
    setCsvData('');
    setParsedData([]);
    setParsedUsers([]);
    setValidationErrors([]);
    setImportResult(null);
    setProgress(0);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Upload CSV File
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                variant="outlined"
                sx={{ borderColor: '#9333EA', color: '#9333EA' }}
              >
                Download Template
              </Button>
            </Box>

            <Paper
              {...(getRootProps() as any)}
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: isDragActive ? 'rgba(147, 51, 234, 0.1)' : '#2a2a2a',
                border: `2px dashed ${isDragActive ? '#9333EA' : '#444'}`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                mb: 3,
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 64, color: '#9333EA', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>
                {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                or click to select file
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                Supports CSV files with user data (email, name, role, company)
              </Typography>
            </Paper>

            {csvFile && (
              <Alert severity="success" sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#a5d6a7' }}>
                File uploaded: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
              </Alert>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                Required CSV Format:
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                • <strong>email</strong> (required): Valid email address<br />
                • <strong>displayName</strong> (optional): User's display name<br />
                • <strong>role</strong> (optional): candidate, recruiter, hiring_manager, admin<br />
                • <strong>companyId</strong> (optional): Company identifier
              </Typography>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Preview & Validation
              </Typography>
              {validationErrors.length > 0 && (
                <Button
                  startIcon={<FileDownloadIcon />}
                  onClick={downloadErrorReport}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Download Error Report
                </Button>
              )}
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Paper sx={{ p: 2, bgcolor: '#2a2a2a', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#4caf50' }}>
                    {validUsers.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Valid Users
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper sx={{ p: 2, bgcolor: '#2a2a2a', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#f44336' }}>
                    {invalidUsers.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Invalid Users
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper sx={{ p: 2, bgcolor: '#2a2a2a', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#ff9800' }}>
                    {validationErrors.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Total Errors
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper sx={{ p: 2, bgcolor: '#2a2a2a', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#2196f3' }}>
                    {parsedUsers.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Total Rows
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {validationErrors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ffb74d' }}>
                Found {validationErrors.length} validation error(s). Please review and fix before importing.
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ maxHeight: 400, bgcolor: '#2a2a2a' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Row</TableCell>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Status</TableCell>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Email</TableCell>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Display Name</TableCell>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Role</TableCell>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Company</TableCell>
                    <TableCell sx={{ bgcolor: '#333', color: '#ccc' }}>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {user.row}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        {user.isValid ? (
                          <CheckIcon sx={{ color: '#4caf50' }} />
                        ) : (
                          <ErrorIcon sx={{ color: '#f44336' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {user.email}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {user.displayName || '-'}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        <Chip 
                          label={user.role || defaultRole} 
                          size="small"
                          color={user.role ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {user.companyId || targetCompanyId || '-'}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        {user.errors.length > 0 && (
                          <Tooltip title={user.errors.join(', ')}>
                            <Chip 
                              label={`${user.errors.length} error(s)`}
                              size="small"
                              color="error"
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Configure Import Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#ccc' }}>Default Role</InputLabel>
                  <Select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value)}
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {companies.length > 0 && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ccc' }}>Default Company</InputLabel>
                    <Select
                      value={targetCompanyId}
                      onChange={(e) => setTargetCompanyId(e.target.value)}
                      sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                    >
                      <MenuItem value="">
                        <em>No Company</em>
                      </MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={skipHeader}
                      onChange={(e) => setSkipHeader(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#9333EA' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#9333EA' },
                      }}
                    />
                  }
                  label="Skip header row"
                  sx={{ color: '#fff' }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sendInvitations}
                      onChange={(e) => setSendInvitations(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#9333EA' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#9333EA' },
                      }}
                    />
                  }
                  label="Send invitation emails to imported users"
                  sx={{ color: '#fff' }}
                />
              </Grid>
            </Grid>

            <Paper sx={{ p: 3, mt: 3, bgcolor: '#2a2a2a' }}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Import Summary
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon sx={{ color: '#4caf50' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${validUsers.length} valid user(s) will be imported`}
                    primaryTypographyProps={{ color: '#fff' }}
                  />
                </ListItem>
                {invalidUsers.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <ErrorIcon sx={{ color: '#f44336' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${invalidUsers.length} invalid user(s) will be skipped`}
                      primaryTypographyProps={{ color: '#fff' }}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon sx={{ color: '#9333EA' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Default role: ${roles.find(r => r.value === defaultRole)?.label}`}
                    primaryTypographyProps={{ color: '#fff' }}
                  />
                </ListItem>
                {targetCompanyId && (
                  <ListItem>
                    <ListItemIcon>
                      <SettingsIcon sx={{ color: '#9333EA' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Default company: ${companies.find(c => c.id === targetCompanyId)?.name}`}
                      primaryTypographyProps={{ color: '#fff' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              {loading ? 'Importing Users...' : 'Import Complete'}
            </Typography>

            {loading && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{
                    height: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #6B46C1, #9333EA)',
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: '#ccc', mt: 1, textAlign: 'center' }}>
                  Processing {validUsers.length} user(s)... {progress}%
                </Typography>
              </Box>
            )}

            {importResult && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: '#2a2a2a', textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#4caf50' }}>
                        {importResult.successful}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Successful
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: '#2a2a2a', textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#f44336' }}>
                        {importResult.failed}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Failed
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {importResult.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f48fb1' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Import Errors:
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {importResult.errors.map((error, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          Row {error.row}: {error.email} - {error.error}
                        </Typography>
                      ))}
                    </Box>
                  </Alert>
                )}

                {importResult.created.length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: '#2a2a2a' }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2 }}>
                      Successfully Created Users ({importResult.created.length}):
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {importResult.created.map((user, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CheckIcon sx={{ color: '#4caf50', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {user.email} ({user.displayName || 'No name'})
                          </Typography>
                          <Chip 
                            label={user.role} 
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e1e1e',
          backgroundImage: 'linear-gradient(135deg, rgba(107, 70, 193, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          border: '1px solid #333',
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon sx={{ color: '#9333EA' }} />
            <Typography variant="h6">CSV User Import</Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: '#ccc' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper 
          activeStep={currentStep} 
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-label': { color: '#ccc' },
            '& .MuiStepLabel-label.Mui-active': { color: '#9333EA' },
            '& .MuiStepLabel-label.Mui-completed': { color: '#4caf50' },
            '& .MuiStepIcon-root': { color: '#444' },
            '& .MuiStepIcon-root.Mui-active': { color: '#9333EA' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #333' }}>
        {currentStep > 0 && currentStep < 3 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            sx={{ color: '#ccc' }}
          >
            Back
          </Button>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        {currentStep === 0 && (
          <Button onClick={handleClose} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
        )}
        
        {currentStep === 1 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={validUsers.length === 0}
            sx={{
              background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
              },
            }}
          >
            Continue
          </Button>
        )}
        
        {currentStep === 2 && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={validUsers.length === 0 || loading}
            startIcon={<ImportIcon />}
            sx={{
              background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
              },
            }}
          >
            Import {validUsers.length} User(s)
          </Button>
        )}
        
        {currentStep === 3 && !loading && (
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6B46C1, #9333EA)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b39a8, #7c3aed)',
              },
            }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CSVImportDialog;