import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Paper,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Share,
  ExpandMore,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Code,
  Timer,
  Score,
  TrendingUp,
  TrendingDown,
  Assessment,
  Person,
  Business,
  CalendarToday,
  PlayCircleFilledRounded,
  StopCircleRounded,
  Visibility,
  Security,
  BugReport,
  Speed,
  Memory,
  Functions
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

import { CandidateResult, QuestionResult, ProctoringViolation } from '@/types/analytics';
import { resultsService } from '@/services/analytics/resultsService';
import { SkillsRadarChart, PerformanceTrendChart } from './AnalyticsCharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CandidateResultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CandidateResult | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (id) {
      loadResultDetail(id);
    }
  }, [id]);

  const loadResultDetail = async (resultId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const resultDetail = await resultsService.getCandidateResultDetail(resultId);
      setResult(resultDetail);
    } catch (err: any) {
      setError(err.message || 'Failed to load result details');
      console.error('Failed to load result details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (!result) return;
    
    try {
      setGeneratingReport(true);
      
      const report = await resultsService.generateReport({
        type: 'candidate',
        format,
        template: 'detailed',
        includeCharts: true,
        includeDetailedBreakdown: true,
        includeProctoringData: true,
        includeRecommendations: true,
        branding: {
          companyName: result.companyName
        }
      }, [result.id]);

      // Monitor report status and provide download when ready
      console.log('Report generation started:', report.reportId);
      setShowReportDialog(false);
      
    } catch (err: any) {
      console.error('Report generation failed:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleShare = async (method: 'email' | 'link') => {
    if (!result) return;
    
    if (method === 'link') {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } else {
      // Email sharing logic would go here
      console.log('Email sharing not implemented');
    }
    
    setShowShareDialog(false);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getQuestionIcon = (question: QuestionResult) => {
    if (question.isCorrect) return <CheckCircle color="success" />;
    if (question.points > 0) return <Warning color="warning" />;
    return <Cancel color="error" />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const OverviewTab = () => {
    if (!result) return null;

    return (
      <Grid container spacing={3}>
        {/* Candidate Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                  <Person fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {result.candidateName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.candidateEmail}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" alignItems="center" mb={1}>
                <Business fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {result.companyName}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {result.positionTitle}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {new Date(result.completedAt).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Score Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color={`${getScoreColor(result.percentage)}.main`}>
                {result.percentage}%
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {result.totalScore} / {result.maxScore} points
              </Typography>
              
              <LinearProgress
                variant="determinate"
                value={result.percentage}
                color={getScoreColor(result.percentage) as any}
                sx={{ mt: 2, mb: 1, height: 8, borderRadius: 4 }}
              />
              
              <Chip
                label={result.evaluation.recommendation.replace('_', ' ').toUpperCase()}
                color={
                  result.evaluation.recommendation === 'strong_hire' ? 'success' :
                  result.evaluation.recommendation === 'hire' ? 'primary' :
                  result.evaluation.recommendation === 'needs_review' ? 'warning' : 'error'
                }
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Assessment Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assessment Details
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Title:
                </Typography>
                <Typography variant="body2">
                  {result.assessmentTitle}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Difficulty:
                </Typography>
                <Chip
                  label={result.difficulty}
                  size="small"
                  color={
                    result.difficulty === 'easy' ? 'success' :
                    result.difficulty === 'medium' ? 'warning' : 'error'
                  }
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Time Spent:
                </Typography>
                <Typography variant="body2">
                  {formatTime(result.timeSpent * 60)}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={result.status}
                  size="small"
                  color={result.status === 'completed' ? 'success' : 'warning'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Breakdown */}
        <Grid item xs={12} md={8}>
          <SkillsRadarChart
            title="Skills Performance"
            subtitle="Performance breakdown by skill area"
            data={Object.entries(result.evaluation.skillBreakdown).map(([skill, score]) => ({
              skill,
              score: score as number,
              average: 70 // Mock average data
            }))}
            height={400}
            compareWith={['average']}
          />
        </Grid>

        {/* Key Insights */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Insights
              </Typography>
              
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Strengths:
              </Typography>
              <List dense>
                {result.evaluation.strengths.map((strength, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={strength}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ mt: 2 }}>
                Areas for Improvement:
              </Typography>
              <List dense>
                {result.evaluation.improvements.map((improvement, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TrendingUp color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={improvement}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Feedback */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Feedback
              </Typography>
              <Typography variant="body1" paragraph>
                {result.evaluation.overallFeedback}
              </Typography>
              
              <Box display="flex" alignItems="center" mt={2}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Confidence Score:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={result.evaluation.confidenceScore * 100}
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Typography variant="body2">
                  {(result.evaluation.confidenceScore * 100).toFixed(0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const QuestionDetailsTab = () => {
    if (!result) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Question-by-Question Analysis
        </Typography>
        
        {result.questionResults.map((question, index) => (
          <Accordion key={question.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" width="100%">
                <Box sx={{ mr: 2 }}>
                  {getQuestionIcon(question)}
                </Box>
                <Box flexGrow={1}>
                  <Typography variant="subtitle1">
                    Question {index + 1}: {question.questionText.substring(0, 100)}...
                  </Typography>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Chip
                      label={question.questionType}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      {question.points}/{question.maxPoints} pts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(question.timeSpent)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Your Answer:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: question.questionType === 'coding' ? 'monospace' : 'inherit',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {typeof question.userAnswer === 'string' 
                        ? question.userAnswer 
                        : JSON.stringify(question.userAnswer, null, 2)}
                    </Typography>
                  </Paper>
                  
                  {question.questionType === 'coding' && question.codeMetrics && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Code Metrics:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center">
                            <Functions fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              Lines: {question.codeMetrics.linesOfCode}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center">
                            <BugReport fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              Complexity: {question.codeMetrics.complexity}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center">
                            <Speed fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              Tests: {question.codeMetrics.testCasesPassed}/{question.codeMetrics.totalTestCases}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center">
                            <Memory fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              Memory: {question.codeMetrics.memoryUsage}MB
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Feedback:
                  </Typography>
                  <Alert
                    severity={
                      question.isCorrect ? 'success' :
                      question.points > 0 ? 'warning' : 'error'
                    }
                  >
                    {question.feedback}
                  </Alert>
                  
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Scoring:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(question.points / question.maxPoints) * 100}
                      color={
                        question.isCorrect ? 'success' :
                        question.points > 0 ? 'warning' : 'error'
                      }
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Partial Credit: {(question.partialCredit * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const ProctoringTab = () => {
    if (!result?.proctoring) {
      return (
        <Alert severity="info">
          No proctoring data available for this assessment.
        </Alert>
      );
    }

    const proctoring = result.proctoring;

    return (
      <Grid container spacing={3}>
        {/* Proctoring Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proctoring Summary
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Security 
                  color={proctoring.riskScore < 0.3 ? 'success' : 
                         proctoring.riskScore < 0.7 ? 'warning' : 'error'} 
                  sx={{ mr: 1 }} 
                />
                <Typography variant="body2">
                  Risk Score: {(proctoring.riskScore * 100).toFixed(0)}%
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Visibility sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Camera Frames: {proctoring.cameraFrames.toLocaleString()}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Warning 
                  color={proctoring.violations.length > 0 ? 'warning' : 'success'} 
                  sx={{ mr: 1 }} 
                />
                <Typography variant="body2">
                  Violations: {proctoring.violations.length}
                </Typography>
              </Box>
              
              {proctoring.suspiciousActivity && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Suspicious activity detected during assessment
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Violations Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Violation Details
              </Typography>
              
              {proctoring.violations.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proctoring.violations.map((violation, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={violation.type.replace('_', ' ')}
                              size="small"
                              color="default"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(violation.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={violation.severity}
                              size="small"
                              color={
                                violation.severity === 'high' ? 'error' :
                                violation.severity === 'medium' ? 'warning' : 'info'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {violation.duration ? `${violation.duration}s` : '-'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {violation.description}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success">
                  No violations detected during this assessment.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !result) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Result not found'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/results')}>
            Back to Results
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" gutterBottom>
                Assessment Result Details
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive analysis for {result.candidateName}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              startIcon={<Download />}
              onClick={() => setShowReportDialog(true)}
            >
              Generate Report
            </Button>
            <Button
              startIcon={<Share />}
              onClick={() => setShowShareDialog(true)}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" icon={<Assessment />} />
            <Tab label="Question Details" icon={<Code />} />
            <Tab label="Proctoring" icon={<Security />} />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <OverviewTab />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <QuestionDetailsTab />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ProctoringTab />
        </TabPanel>

        {/* Report Generation Dialog */}
        <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)}>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              Choose the format for the detailed assessment report:
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleGenerateReport('excel')}
              disabled={generatingReport}
            >
              Excel
            </Button>
            <Button
              onClick={() => handleGenerateReport('pdf')}
              disabled={generatingReport}
              variant="contained"
            >
              {generatingReport ? <CircularProgress size={20} /> : 'PDF'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)}>
          <DialogTitle>Share Result</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              How would you like to share this result?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleShare('email')}>
              Email
            </Button>
            <Button onClick={() => handleShare('link')} variant="contained">
              Copy Link
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CandidateResultDetail;