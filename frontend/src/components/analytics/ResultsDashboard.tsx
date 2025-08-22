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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  Dashboard,
  FilterList,
  Download,
  Refresh,
  Share,
  Settings,
  TrendingUp,
  TrendingDown,
  People,
  Assessment,
  Timer,
  Score,
  MoreVert,
  Fullscreen,
  Close,
  DateRange,
  Analytics,
  BarChart,
  PieChart,
  ShowChart
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';

import { 
  CandidateResult,
  AssessmentAnalytics,
  CompanyAnalytics,
  DashboardConfig 
} from '../../types/analytics';
import { resultsService } from '../../services/analytics/resultsService';
import {
  ScoreDistributionChart,
  PerformanceTrendChart,
  SkillsRadarChart,
  TimeAnalysisChart,
  HeatmapChart
} from './AnalyticsCharts';

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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ResultsDashboardProps {
  dashboardType: 'candidate' | 'company' | 'admin';
  userId?: string;
  companyId?: string;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  dashboardType,
  userId,
  companyId
}) => {
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [candidateResults, setCandidateResults] = useState<CandidateResult[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [companyAnalytics, setCompanyAnalytics] = useState<CompanyAnalytics | null>(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    assessmentId: '',
    status: 'all',
    difficulty: 'all'
  });
  
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0
  });

  // UI state
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<HTMLElement | null>(null);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  // Dashboard configuration
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);

  // Load data on mount and when filters change
  useEffect(() => {
    loadDashboardData();
  }, [filters, pagination.page, pagination.rowsPerPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load results based on dashboard type
      if (dashboardType === 'candidate' && userId) {
        await loadCandidateResults();
      } else if (dashboardType === 'company' && companyId) {
        await loadCompanyResults();
      } else if (dashboardType === 'admin') {
        await loadAdminResults();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateResults = async () => {
    if (!userId) return;

    const response = await resultsService.getCandidateResults({
      candidateId: userId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit: pagination.rowsPerPage,
      offset: pagination.page * pagination.rowsPerPage
    });

    setCandidateResults(response.results);
    setAnalytics(response.analytics);
    setPagination(prev => ({ ...prev, total: response.total }));
  };

  const loadCompanyResults = async () => {
    if (!companyId) return;

    const [resultsResponse, companyAnalyticsResponse] = await Promise.all([
      resultsService.getCandidateResults({
        companyId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: pagination.rowsPerPage,
        offset: pagination.page * pagination.rowsPerPage
      }),
      resultsService.getCompanyAnalytics(companyId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeTeamBreakdown: true,
        includeSkillAnalysis: true,
        includeTrends: true
      })
    ]);

    setCandidateResults(resultsResponse.results);
    setAnalytics(resultsResponse.analytics);
    setCompanyAnalytics(companyAnalyticsResponse);
    setPagination(prev => ({ ...prev, total: resultsResponse.total }));
  };

  const loadAdminResults = async () => {
    // Load system-wide analytics for admin dashboard
    const response = await resultsService.getCandidateResults({
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit: pagination.rowsPerPage,
      offset: pagination.page * pagination.rowsPerPage
    });

    setCandidateResults(response.results);
    setAnalytics(response.analytics);
    setPagination(prev => ({ ...prev, total: response.total }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const entityIds = candidateResults.map(r => r.id);
      const report = await resultsService.generateReport({
        type: dashboardType === 'candidate' ? 'candidate' : 'assessment',
        format: format === 'pdf' ? 'pdf' : format === 'excel' ? 'excel' : 'csv',
        template: 'default',
        includeCharts: true,
        includeDetailedBreakdown: true,
        includeProctoringData: false,
        includeRecommendations: true
      }, entityIds);

      // Handle report generation status
      console.log('Report generation started:', report.reportId);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Metric Cards Component
  const MetricCards = () => {
    const metrics = [
      {
        title: 'Total Results',
        value: pagination.total.toLocaleString(),
        change: '+12%',
        trend: 'up' as const,
        icon: <Assessment />
      },
      {
        title: 'Average Score',
        value: analytics?.averageScore?.toFixed(1) || '0.0',
        change: '+5%',
        trend: 'up' as const,
        icon: <Score />
      },
      {
        title: 'Completion Rate',
        value: `${(analytics?.completionRate || 0).toFixed(1)}%`,
        change: '-2%',
        trend: 'down' as const,
        icon: <Timer />
      },
      {
        title: 'Active Candidates',
        value: candidateResults.filter(r => r.status === 'in_progress').length.toString(),
        change: '+8%',
        trend: 'up' as const,
        icon: <People />
      }
    ];

    return (
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {metric.title}
                    </Typography>
                    <Typography variant="h4">
                      {metric.value}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {metric.trend === 'up' ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={metric.trend === 'up' ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {metric.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {metric.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Results Table Component
  const ResultsTable = () => {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Recent Results</Typography>
            <Box>
              <IconButton onClick={(e) => setFilterMenuAnchor(e.currentTarget)}>
                <FilterList />
              </IconButton>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Time Spent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidateResults.map((result) => (
                  <TableRow key={result.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {result.candidateName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {result.candidateName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.candidateEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {result.assessmentTitle}
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
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography 
                          variant="h6" 
                          color={
                            result.percentage >= 80 ? 'success.main' :
                            result.percentage >= 60 ? 'warning.main' : 'error.main'
                          }
                        >
                          {result.percentage}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({result.totalScore}/{result.maxScore})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={result.status} 
                        size="small"
                        color={
                          result.status === 'completed' ? 'success' :
                          result.status === 'in_progress' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/results/${result.id}`)}
                      >
                        <Analytics />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={(event, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
            onRowsPerPageChange={(event) => {
              setPagination(prev => ({ 
                ...prev, 
                rowsPerPage: parseInt(event.target.value, 10),
                page: 0
              }));
            }}
          />
        </CardContent>
      </Card>
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

  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={handleRefresh}>
            Retry
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
          <Box>
            <Typography variant="h4" gutterBottom>
              Results Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {dashboardType === 'candidate' ? 'Your assessment results and progress' :
               dashboardType === 'company' ? 'Company-wide assessment analytics' :
               'System-wide assessment analytics'}
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              startIcon={<Download />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            >
              Export
            </Button>
            <Button
              startIcon={<Settings />}
              onClick={() => navigate('/dashboard/settings')}
            >
              Configure
            </Button>
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Badge color="secondary" variant="dot" invisible={!refreshing}>
                <Refresh />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        {/* Date Range Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  slots={{
                    textField: TextField
                  }}
                  slotProps={{
                    textField: { size: "small" }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  slots={{
                    textField: TextField
                  }}
                  slotProps={{
                    textField: { size: "small" }
                  }}
                />
              </LocalizationProvider>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="abandoned">Abandoned</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filters.difficulty}
                  label="Difficulty"
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <Box mb={4}>
          <MetricCards />
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" icon={<Dashboard />} />
            <Tab label="Analytics" icon={<BarChart />} />
            <Tab label="Results" icon={<Assessment />} />
            {dashboardType === 'company' && <Tab label="Company Insights" icon={<TrendingUp />} />}
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ScoreDistributionChart
                title="Score Distribution"
                data={[
                  { range: '0-20', count: 5 },
                  { range: '21-40', count: 12 },
                  { range: '41-60', count: 25 },
                  { range: '61-80', count: 35 },
                  { range: '81-100', count: 23 }
                ]}
                height={300}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeAnalysisChart
                title="Time Analysis"
                data={[
                  { timeRange: '0-10min', count: 8, average: 8.5, median: 9 },
                  { timeRange: '11-20min', count: 22, average: 15.2, median: 16 },
                  { timeRange: '21-30min', count: 35, average: 25.8, median: 26 },
                  { timeRange: '31-45min', count: 28, average: 38.4, median: 37 },
                  { timeRange: '46-60min', count: 12, average: 52.1, median: 53 },
                  { timeRange: '60+min', count: 5, average: 68.3, median: 65 }
                ]}
                height={300}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <PerformanceTrendChart
                title="Performance Trends"
                data={[
                  { date: '2024-01-01', score: 75, completion: 85, time: 35 },
                  { date: '2024-01-02', score: 78, completion: 88, time: 33 },
                  { date: '2024-01-03', score: 72, completion: 82, time: 38 },
                  { date: '2024-01-04', score: 80, completion: 90, time: 32 },
                  { date: '2024-01-05', score: 77, completion: 87, time: 36 }
                ]}
                metrics={['score', 'completion', 'time']}
                timeRange="week"
                height={400}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <SkillsRadarChart
                title="Skills Analysis"
                data={[
                  { skill: 'JavaScript', score: 85, average: 70 },
                  { skill: 'Python', score: 78, average: 75 },
                  { skill: 'React', score: 92, average: 68 },
                  { skill: 'Node.js', score: 74, average: 72 },
                  { skill: 'SQL', score: 88, average: 80 },
                  { skill: 'Algorithms', score: 65, average: 60 }
                ]}
                height={350}
                compareWith={['average']}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ResultsTable />
        </TabPanel>

        {dashboardType === 'company' && (
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Company Performance Insights
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Company-specific analytics and insights will be displayed here.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        )}

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={() => { handleExport('pdf'); setExportMenuAnchor(null); }}>
            Export as PDF
          </MenuItem>
          <MenuItem onClick={() => { handleExport('excel'); setExportMenuAnchor(null); }}>
            Export as Excel
          </MenuItem>
          <MenuItem onClick={() => { handleExport('csv'); setExportMenuAnchor(null); }}>
            Export as CSV
          </MenuItem>
        </Menu>

        {/* Fullscreen Chart Dialog */}
        <Dialog
          fullScreen
          open={Boolean(fullscreenChart)}
          onClose={() => setFullscreenChart(null)}
        >
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                {fullscreenChart} - Fullscreen View
              </Typography>
              <IconButton onClick={() => setFullscreenChart(null)}>
                <Close />
              </IconButton>
            </Box>
            <Box flexGrow={1}>
              {/* Render fullscreen chart based on fullscreenChart value */}
            </Box>
          </Box>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ResultsDashboard;