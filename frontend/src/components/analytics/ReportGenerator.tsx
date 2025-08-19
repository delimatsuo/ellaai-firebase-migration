import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  RadioGroup,
  Radio,
  Grid,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  InsertDriveFile,
  Settings,
  Preview,
  Send,
  Delete,
  Refresh,
  CheckCircle,
  Error,
  Schedule,
  CloudDownload
} from '@mui/icons-material';

import { 
  ReportConfig, 
  GeneratedReport,
  CandidateResult,
  ReportSection 
} from '@/types/analytics';
import { resultsService } from '@/services/analytics/resultsService';

interface ReportGeneratorProps {
  open: boolean;
  onClose: () => void;
  entityIds: string[];
  entityType: 'candidates' | 'assessments' | 'companies';
  title?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  open,
  onClose,
  entityIds,
  entityType,
  title = 'Generate Report'
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'custom',
    format: 'pdf',
    template: 'standard',
    includeCharts: true,
    includeDetailedBreakdown: true,
    includeProctoringData: false,
    includeRecommendations: true,
    customSections: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const steps = [
    'Report Type & Format',
    'Content Selection',
    'Customization',
    'Preview & Generate',
    'Download'
  ];

  useEffect(() => {
    if (open) {
      loadExistingReports();
    }
  }, [open]);

  useEffect(() => {
    if (isGenerating && generatedReport) {
      const interval = setInterval(async () => {
        try {
          const status = await resultsService.getReportStatus(generatedReport.id);
          setGeneratedReport(status);
          
          if (status.status === 'ready' || status.status === 'failed') {
            setIsGenerating(false);
            clearInterval(interval);
            if (status.status === 'ready') {
              setActiveStep(4); // Move to download step
            }
          } else {
            // Estimate progress based on status
            const progressMap = {
              'queued': 10,
              'processing': 50,
              'ready': 100,
              'failed': 0
            };
            setGenerationProgress(progressMap[status.status] || 0);
          }
        } catch (error) {
          console.error('Failed to check report status:', error);
          clearInterval(interval);
          setIsGenerating(false);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isGenerating, generatedReport]);

  const loadExistingReports = async () => {
    try {
      setLoadingReports(true);
      const response = await resultsService.getReports({
        type: entityType,
        limit: 10
      });
      setReports(response.reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setGeneratedReport(null);
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  const handleConfigChange = (field: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      const response = await resultsService.generateReport(reportConfig, entityIds);
      
      if (response.status === 'ready') {
        // Report generated immediately
        const reportStatus = await resultsService.getReportStatus(response.reportId);
        setGeneratedReport(reportStatus);
        setActiveStep(4);
        setIsGenerating(false);
      } else {
        // Report is being generated
        setGeneratedReport({
          id: response.reportId,
          type: reportConfig.type,
          format: reportConfig.format,
          filename: `report_${Date.now()}.${reportConfig.format}`,
          size: 0,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          downloadUrl: '',
          status: 'generating'
        });
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const blob = await resultsService.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generatedReport?.filename || 'report';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await resultsService.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PictureAsPdf />;
      case 'excel': return <TableChart />;
      case 'csv': return <InsertDriveFile />;
      default: return <InsertDriveFile />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success';
      case 'failed': return 'error';
      case 'processing': case 'generating': return 'warning';
      default: return 'default';
    }
  };

  // Step 1: Report Type & Format
  const TypeFormatStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Report Type</InputLabel>
          <Select
            value={reportConfig.type}
            label="Report Type"
            onChange={(e) => handleConfigChange('type', e.target.value)}
          >
            <MenuItem value="candidate">Individual Candidate Report</MenuItem>
            <MenuItem value="assessment">Assessment Summary</MenuItem>
            <MenuItem value="company">Company Analytics</MenuItem>
            <MenuItem value="custom">Custom Report</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Format</InputLabel>
          <Select
            value={reportConfig.format}
            label="Format"
            onChange={(e) => handleConfigChange('format', e.target.value)}
          >
            <MenuItem value="pdf">
              <Box display="flex" alignItems="center">
                <PictureAsPdf sx={{ mr: 1 }} />
                PDF Document
              </Box>
            </MenuItem>
            <MenuItem value="excel">
              <Box display="flex" alignItems="center">
                <TableChart sx={{ mr: 1 }} />
                Excel Spreadsheet
              </Box>
            </MenuItem>
            <MenuItem value="csv">
              <Box display="flex" alignItems="center">
                <InsertDriveFile sx={{ mr: 1 }} />
                CSV Data
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Template</InputLabel>
          <Select
            value={reportConfig.template}
            label="Template"
            onChange={(e) => handleConfigChange('template', e.target.value)}
          >
            <MenuItem value="standard">Standard Report</MenuItem>
            <MenuItem value="detailed">Detailed Analysis</MenuItem>
            <MenuItem value="executive">Executive Summary</MenuItem>
            <MenuItem value="technical">Technical Deep Dive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  // Step 2: Content Selection
  const ContentSelectionStep = () => (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={reportConfig.includeCharts}
            onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
          />
        }
        label="Include Charts and Visualizations"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={reportConfig.includeDetailedBreakdown}
            onChange={(e) => handleConfigChange('includeDetailedBreakdown', e.target.checked)}
          />
        }
        label="Include Detailed Score Breakdown"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={reportConfig.includeProctoringData}
            onChange={(e) => handleConfigChange('includeProctoringData', e.target.checked)}
          />
        }
        label="Include Proctoring Information"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={reportConfig.includeRecommendations}
            onChange={(e) => handleConfigChange('includeRecommendations', e.target.checked)}
          />
        }
        label="Include Hiring Recommendations"
      />
    </FormGroup>
  );

  // Step 3: Customization
  const CustomizationStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Branding Options
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Company Name"
          value={reportConfig.branding?.companyName || ''}
          onChange={(e) => handleConfigChange('branding', {
            ...reportConfig.branding,
            companyName: e.target.value
          })}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Primary Color"
          type="color"
          value={reportConfig.branding?.colors?.primary || '#1976d2'}
          onChange={(e) => handleConfigChange('branding', {
            ...reportConfig.branding,
            colors: {
              ...reportConfig.branding?.colors,
              primary: e.target.value
            }
          })}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Custom Sections (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Add custom sections to your report for additional context or analysis.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            const newSection: ReportSection = {
              id: `section_${Date.now()}`,
              title: 'Custom Section',
              type: 'text',
              data: ''
            };
            handleConfigChange('customSections', [
              ...(reportConfig.customSections || []),
              newSection
            ]);
          }}
        >
          Add Custom Section
        </Button>
      </Grid>
    </Grid>
  );

  // Step 4: Preview & Generate
  const PreviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Report Configuration Summary
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Type:</Typography>
            <Typography variant="body1">{reportConfig.type}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Format:</Typography>
            <Typography variant="body1">{reportConfig.format.toUpperCase()}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Template:</Typography>
            <Typography variant="body1">{reportConfig.template}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Entities:</Typography>
            <Typography variant="body1">{entityIds.length} selected</Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="subtitle2" gutterBottom>
        Content Included:
      </Typography>
      <Box mb={2}>
        {reportConfig.includeCharts && <Chip label="Charts" size="small" sx={{ mr: 1, mb: 1 }} />}
        {reportConfig.includeDetailedBreakdown && <Chip label="Detailed Breakdown" size="small" sx={{ mr: 1, mb: 1 }} />}
        {reportConfig.includeProctoringData && <Chip label="Proctoring Data" size="small" sx={{ mr: 1, mb: 1 }} />}
        {reportConfig.includeRecommendations && <Chip label="Recommendations" size="small" sx={{ mr: 1, mb: 1 }} />}
      </Box>
      
      {isGenerating ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            Generating report... {generationProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={generationProgress} sx={{ mb: 2 }} />
        </Box>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={handleGenerateReport}
          startIcon={<Download />}
          sx={{ mt: 2 }}
        >
          Generate Report
        </Button>
      )}
    </Box>
  );

  // Step 5: Download
  const DownloadStep = () => (
    <Box textAlign="center">
      {generatedReport?.status === 'ready' ? (
        <>
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Report Generated Successfully!
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your report is ready for download.
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                {getFormatIcon(generatedReport.format)}
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body1">
                    {generatedReport.filename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(generatedReport.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<CloudDownload />}
                onClick={() => handleDownloadReport(generatedReport.id)}
              >
                Download
              </Button>
            </Box>
          </Card>
          
          <Typography variant="caption" color="text.secondary">
            Report expires on {new Date(generatedReport.expiresAt).toLocaleDateString()}
          </Typography>
        </>
      ) : generatedReport?.status === 'failed' ? (
        <>
          <Error color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Report Generation Failed
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {generatedReport.error || 'An unexpected error occurred.'}
          </Typography>
          <Button variant="outlined" onClick={handleReset}>
            Try Again
          </Button>
        </>
      ) : (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generating Report...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we prepare your report.
          </Typography>
        </>
      )}
    </Box>
  );

  // Previous Reports Section
  const PreviousReports = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Previous Reports
      </Typography>
      
      {loadingReports ? (
        <CircularProgress />
      ) : reports.length > 0 ? (
        <List>
          {reports.map((report) => (
            <ListItem key={report.id}>
              <ListItemIcon>
                {getFormatIcon(report.format)}
              </ListItemIcon>
              <ListItemText
                primary={report.filename}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={report.status}
                      size="small"
                      color={getStatusColor(report.status) as any}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {report.status === 'ready' && (
                  <IconButton
                    onClick={() => handleDownloadReport(report.id)}
                    title="Download"
                  >
                    <Download />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleDeleteReport(report.id)}
                  title="Delete"
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Alert severity="info">
          No previous reports found.
        </Alert>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={loadExistingReports}>
            <Refresh />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {index === 0 && <TypeFormatStep />}
                    {index === 1 && <ContentSelectionStep />}
                    {index === 2 && <CustomizationStep />}
                    {index === 3 && <PreviewStep />}
                    {index === 4 && <DownloadStep />}
                    
                    {index < 3 && (
                      <Box sx={{ mb: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          {index === steps.length - 1 ? 'Finish' : 'Continue'}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                      </Box>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <PreviousReports />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {activeStep === steps.length - 1 && (
          <Button onClick={handleReset} variant="outlined">
            Generate Another
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportGenerator;