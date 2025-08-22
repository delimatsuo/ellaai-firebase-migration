import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PerformanceMonitor, usePerformanceMonitor } from '../../utils/performance';
import { getCacheStats, clearServiceWorkerCache } from '../../utils/serviceWorker';

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  fcp: number;
  bundleSize: number;
  cacheHitRate: number;
  apiResponseTime: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [componentMetrics, setComponentMetrics] = useState<any>({});
  
  const performanceMonitor = PerformanceMonitor.getInstance();
  
  useEffect(() => {
    loadPerformanceData();
    loadCacheStats();
    loadComponentMetrics();
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        collectRealTimeMetrics();
      }, 5000); // Collect every 5 seconds
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isMonitoring]);

  const loadPerformanceData = async () => {
    try {
      // Collect Web Vitals
      const vitals = await performanceMonitor.getCoreWebVitals();
      
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // Calculate additional metrics
      const ttfb = navigation.responseStart - navigation.requestStart;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
      
      const newMetrics: PerformanceMetrics = {
        lcp: vitals.lcp,
        fid: vitals.fid,
        cls: vitals.cls,
        ttfb,
        fcp,
        bundleSize: await getBundleSize(),
        cacheHitRate: await getCacheHitRate(),
        apiResponseTime: getAverageApiResponseTime(),
      };
      
      setMetrics(newMetrics);
      
      // Add to historical data
      setHistoricalData(prev => [
        ...prev.slice(-19), // Keep last 20 data points
        {
          timestamp: Date.now(),
          ...newMetrics,
        }
      ]);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const loadComponentMetrics = () => {
    const allMetrics = performanceMonitor.exportMetrics();
    setComponentMetrics(allMetrics.metrics);
  };

  const collectRealTimeMetrics = async () => {
    await loadPerformanceData();
    loadComponentMetrics();
  };

  const getBundleSize = async (): Promise<number> => {
    // Estimate bundle size from resource timing
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    return jsResources.reduce((total, resource) => total + (resource.transferSize || 0), 0);
  };

  const getCacheHitRate = async (): Promise<number> => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cachedResources = resources.filter(r => r.transferSize === 0);
    return resources.length > 0 ? (cachedResources.length / resources.length) * 100 : 0;
  };

  const getAverageApiResponseTime = (): number => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const apiResources = resources.filter(r => r.name.includes('/api/'));
    
    if (apiResources.length === 0) return 0;
    
    const totalTime = apiResources.reduce((total, resource) => 
      total + (resource.responseEnd - resource.responseStart), 0);
    
    return totalTime / apiResources.length;
  };

  const getScoreColor = (score: number, thresholds: { good: number; poor: number }) => {
    if (score <= thresholds.good) return '#4CAF50';
    if (score <= thresholds.poor) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number, thresholds: { good: number; poor: number }) => {
    if (score <= thresholds.good) return 'Good';
    if (score <= thresholds.poor) return 'Needs Improvement';
    return 'Poor';
  };

  const exportMetrics = () => {
    const exportData = {
      timestamp: Date.now(),
      metrics,
      historicalData,
      componentMetrics,
      cacheStats,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ellaai-performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearCache = async () => {
    try {
      await clearServiceWorkerCache();
      await loadCacheStats();
      alert('Cache cleared successfully');
    } catch (error) {
      alert('Failed to clear cache');
    }
  };

  if (!metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Performance Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={isMonitoring}
                onChange={(e) => setIsMonitoring(e.target.checked)}
              />
            }
            label="Real-time monitoring"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPerformanceData}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportMetrics}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Core Web Vitals */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon sx={{ mr: 1, color: getScoreColor(metrics.lcp, { good: 2500, poor: 4000 }) }} />
                <Typography variant="h6">Largest Contentful Paint</Typography>
              </Box>
              <Typography variant="h4" mb={1}>
                {(metrics.lcp / 1000).toFixed(2)}s
              </Typography>
              <Chip
                label={getScoreLabel(metrics.lcp, { good: 2500, poor: 4000 })}
                color={
                  metrics.lcp <= 2500 ? 'success' : 
                  metrics.lcp <= 4000 ? 'warning' : 'error'
                }
                size="small"
              />
              <LinearProgress
                variant="determinate"
                value={Math.min((metrics.lcp / 4000) * 100, 100)}
                sx={{
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(metrics.lcp, { good: 2500, poor: 4000 })
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NetworkIcon sx={{ mr: 1, color: getScoreColor(metrics.fid, { good: 100, poor: 300 }) }} />
                <Typography variant="h6">First Input Delay</Typography>
              </Box>
              <Typography variant="h4" mb={1}>
                {metrics.fid.toFixed(0)}ms
              </Typography>
              <Chip
                label={getScoreLabel(metrics.fid, { good: 100, poor: 300 })}
                color={
                  metrics.fid <= 100 ? 'success' : 
                  metrics.fid <= 300 ? 'warning' : 'error'
                }
                size="small"
              />
              <LinearProgress
                variant="determinate"
                value={Math.min((metrics.fid / 300) * 100, 100)}
                sx={{
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(metrics.fid, { good: 100, poor: 300 })
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WarningIcon sx={{ mr: 1, color: getScoreColor(metrics.cls * 1000, { good: 100, poor: 250 }) }} />
                <Typography variant="h6">Cumulative Layout Shift</Typography>
              </Box>
              <Typography variant="h4" mb={1}>
                {metrics.cls.toFixed(3)}
              </Typography>
              <Chip
                label={getScoreLabel(metrics.cls * 1000, { good: 100, poor: 250 })}
                color={
                  metrics.cls <= 0.1 ? 'success' : 
                  metrics.cls <= 0.25 ? 'warning' : 'error'
                }
                size="small"
              />
              <LinearProgress
                variant="determinate"
                value={Math.min((metrics.cls / 0.25) * 100, 100)}
                sx={{
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(metrics.cls * 1000, { good: 100, poor: 250 })
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      {historicalData.length > 1 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Performance Trends</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                  />
                  <YAxis />
                  <RechartsTooltip
                    labelFormatter={(timestamp) => new Date(timestamp as number).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="lcp"
                    stroke="#2196F3"
                    strokeWidth={2}
                    dot={false}
                    name="LCP (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="fid"
                    stroke="#4CAF50"
                    strokeWidth={2}
                    dot={false}
                    name="FID (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="apiResponseTime"
                    stroke="#FF9800"
                    strokeWidth={2}
                    dot={false}
                    name="API Response (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Additional Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Additional Metrics</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Time to First Byte</Typography>
                  <Typography fontWeight="bold">
                    {metrics.ttfb.toFixed(0)}ms
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>First Contentful Paint</Typography>
                  <Typography fontWeight="bold">
                    {(metrics.fcp / 1000).toFixed(2)}s
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Bundle Size</Typography>
                  <Typography fontWeight="bold">
                    {(metrics.bundleSize / 1024 / 1024).toFixed(2)}MB
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Cache Hit Rate</Typography>
                  <Typography fontWeight="bold">
                    {metrics.cacheHitRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Avg API Response</Typography>
                  <Typography fontWeight="bold">
                    {metrics.apiResponseTime.toFixed(0)}ms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Cache Statistics</Typography>
                <Button size="small" onClick={clearCache}>
                  Clear Cache
                </Button>
              </Box>
              {cacheStats ? (
                <Box>
                  {Object.entries(cacheStats).map(([cacheName, count]) => (
                    <Box key={cacheName} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{cacheName}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {String(count)} items
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No cache data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Component Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Component Performance</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Component</TableCell>
                      <TableCell align="right">Avg Render (ms)</TableCell>
                      <TableCell align="right">Min (ms)</TableCell>
                      <TableCell align="right">Max (ms)</TableCell>
                      <TableCell align="right">P95 (ms)</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(componentMetrics)
                      .filter(([key]) => !key.startsWith('api_'))
                      .map(([componentName, metrics]: [string, any]) => (
                        <TableRow key={componentName}>
                          <TableCell>{componentName}</TableCell>
                          <TableCell align="right">
                            <Tooltip title={metrics.avg > 16 ? 'Slow render detected' : 'Good performance'}>
                              <span style={{ 
                                color: metrics.avg > 16 ? '#f44336' : 
                                       metrics.avg > 8 ? '#ff9800' : '#4caf50'
                              }}>
                                {metrics.avg.toFixed(2)}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">{metrics.min.toFixed(2)}</TableCell>
                          <TableCell align="right">{metrics.max.toFixed(2)}</TableCell>
                          <TableCell align="right">{metrics.p95.toFixed(2)}</TableCell>
                          <TableCell align="right">{metrics.count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Recommendations */}
      {metrics.lcp > 2500 || metrics.fid > 100 || metrics.cls > 0.1 ? (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="h6" mb={1}>Performance Recommendations</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {metrics.lcp > 2500 && (
              <li>Consider lazy loading images and optimizing critical resources for faster LCP</li>
            )}
            {metrics.fid > 100 && (
              <li>Reduce JavaScript execution time and break up long tasks to improve FID</li>
            )}
            {metrics.cls > 0.1 && (
              <li>Add size attributes to images and reserve space for dynamic content to reduce CLS</li>
            )}
          </ul>
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mt: 3 }}>
          Excellent performance! All Core Web Vitals are within the recommended thresholds.
        </Alert>
      )}
    </Box>
  );
}