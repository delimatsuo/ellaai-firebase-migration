import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  MenuList,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  MoreVert,
  Download,
  Fullscreen,
  Refresh,
  Info
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

// Chart color palette
const COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  neutral: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff'],
  gradient: ['#8884d8', '#83a6ed', '#8dd1e1', '#d084a7', '#ffb347']
};

interface ChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  height?: number;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  onFullscreen?: () => void;
  showControls?: boolean;
  className?: string;
}

// Score Distribution Chart
interface ScoreDistributionChartProps extends ChartProps {
  type?: 'bar' | 'pie';
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  title,
  subtitle,
  data,
  height = 300,
  type = 'bar',
  showControls = true,
  onRefresh,
  onExport,
  onFullscreen
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [chartType, setChartType] = React.useState(type);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="range" 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#e0e0e0' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#e0e0e0' }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <RechartsTooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '12px'
          }}
          formatter={(value, name) => [`${value} candidates`, 'Count']}
        />
        <Bar 
          dataKey="count" 
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS.neutral[index % COLORS.neutral.length]} />
          ))}
        </Pie>
        <RechartsTooltip 
          formatter={(value, name) => [`${value} candidates`, 'Count']}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {showControls && (
            <Box display="flex" alignItems="center" gap={1}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                  variant="outlined"
                >
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                </Select>
              </FormControl>
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
            </Box>
          )}
        </Box>

        {chartType === 'bar' ? renderBarChart() : renderPieChart()}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {onRefresh && (
            <MenuItemComponent onClick={() => { onRefresh(); handleMenuClose(); }}>
              <ListItemIcon>
                <Refresh fontSize="small" />
              </ListItemIcon>
              <ListItemText>Refresh</ListItemText>
            </MenuItemComponent>
          )}
          {onExport && (
            <>
              <MenuItemComponent onClick={() => { onExport('png'); handleMenuClose(); }}>
                <ListItemIcon>
                  <Download fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as PNG</ListItemText>
              </MenuItemComponent>
              <MenuItemComponent onClick={() => { onExport('csv'); handleMenuClose(); }}>
                <ListItemIcon>
                  <Download fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as CSV</ListItemText>
              </MenuItemComponent>
            </>
          )}
          {onFullscreen && (
            <MenuItemComponent onClick={() => { onFullscreen(); handleMenuClose(); }}>
              <ListItemIcon>
                <Fullscreen fontSize="small" />
              </ListItemIcon>
              <ListItemText>Fullscreen</ListItemText>
            </MenuItemComponent>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};

// Performance Trend Chart
interface PerformanceTrendChartProps extends ChartProps {
  metrics: string[];
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({
  title,
  subtitle,
  data,
  metrics,
  timeRange,
  height = 300,
  onTimeRangeChange,
  showControls = true
}) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {showControls && onTimeRangeChange && (
            <FormControl size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => onTimeRangeChange(e.target.value as any)}
                label="Time Range"
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px'
              }}
            />
            <Legend />
            {metrics.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={COLORS.neutral[index % COLORS.neutral.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Skills Radar Chart
interface SkillsRadarChartProps extends ChartProps {
  candidateId?: string;
  compareWith?: string[];
}

export const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({
  title,
  subtitle,
  data,
  height = 400,
  candidateId,
  compareWith = []
}) => {
  return (
    <Card>
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {compareWith.length > 0 && (
              <Radar
                name="Average"
                dataKey="average"
                stroke={COLORS.neutral[1]}
                fill={COLORS.neutral[1]}
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            <Legend />
            <RechartsTooltip />
          </RadarChart>
        </ResponsiveContainer>

        {compareWith.length > 0 && (
          <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
            <Chip label="Your Score" color="primary" size="small" />
            <Chip label="Company Average" color="default" size="small" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Question Difficulty Analysis
interface QuestionAnalysisChartProps extends ChartProps {
  questionData: Array<{
    questionId: string;
    text: string;
    difficulty: number;
    successRate: number;
    averageTime: number;
    discriminationIndex: number;
  }>;
}

export const QuestionAnalysisChart: React.FC<QuestionAnalysisChartProps> = ({
  title,
  subtitle,
  questionData,
  height = 400
}) => {
  return (
    <Card>
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            X-axis: Success Rate (%), Y-axis: Discrimination Index, Size: Average Time
          </Typography>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart data={questionData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="successRate" 
              name="Success Rate" 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="discriminationIndex" 
              name="Discrimination Index" 
              domain={[-1, 1]}
              tick={{ fontSize: 12 }}
            />
            <RechartsTooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <Box
                      sx={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '12px'
                      }}
                    >
                      <Typography variant="caption" display="block">
                        <strong>Question:</strong> {data.text.substring(0, 50)}...
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Success Rate:</strong> {data.successRate}%
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Discrimination:</strong> {data.discriminationIndex.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Avg Time:</strong> {data.averageTime}s
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Scatter dataKey="discriminationIndex" fill={COLORS.primary} />
          </ScatterChart>
        </ResponsiveContainer>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            • Top-right quadrant: Good discriminating questions with high success rate<br />
            • Top-left quadrant: Discriminating but difficult questions<br />
            • Bottom quadrants: Questions that may need review
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Time Analysis Chart
interface TimeAnalysisChartProps extends ChartProps {
  showAverage?: boolean;
  showMedian?: boolean;
}

export const TimeAnalysisChart: React.FC<TimeAnalysisChartProps> = ({
  title,
  subtitle,
  data,
  height = 300,
  showAverage = true,
  showMedian = true
}) => {
  return (
    <Card>
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeRange" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name="Candidates" />
            {showAverage && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="average" 
                stroke={COLORS.warning} 
                strokeWidth={2}
                name="Average Time"
              />
            )}
            {showMedian && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="median" 
                stroke={COLORS.success} 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Median Time"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Heatmap Component for Activity/Performance by Time
interface HeatmapChartProps extends ChartProps {
  xLabels: string[];
  yLabels: string[];
  values: number[][];
  colorScale?: 'performance' | 'activity';
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  title,
  subtitle,
  xLabels,
  yLabels,
  values,
  height = 300,
  colorScale = 'performance'
}) => {
  const getColor = (value: number, max: number) => {
    const intensity = value / max;
    if (colorScale === 'performance') {
      // Green scale for performance
      return `rgba(46, 125, 50, ${intensity})`;
    } else {
      // Blue scale for activity
      return `rgba(25, 118, 210, ${intensity})`;
    }
  };

  const maxValue = Math.max(...values.flat());
  const cellSize = Math.min(300 / xLabels.length, 200 / yLabels.length);

  return (
    <Card>
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            overflowX: 'auto'
          }}
        >
          <svg width={xLabels.length * cellSize + 100} height={yLabels.length * cellSize + 60}>
            {/* X-axis labels */}
            {xLabels.map((label, i) => (
              <text
                key={i}
                x={50 + i * cellSize + cellSize / 2}
                y={20}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {label}
              </text>
            ))}
            
            {/* Y-axis labels and cells */}
            {yLabels.map((yLabel, j) => (
              <g key={j}>
                <text
                  x={40}
                  y={40 + j * cellSize + cellSize / 2}
                  textAnchor="end"
                  fontSize="10"
                  fill="#666"
                  dominantBaseline="central"
                >
                  {yLabel}
                </text>
                {xLabels.map((xLabel, i) => (
                  <g key={`${i}-${j}`}>
                    <rect
                      x={50 + i * cellSize}
                      y={30 + j * cellSize}
                      width={cellSize - 1}
                      height={cellSize - 1}
                      fill={getColor(values[j][i], maxValue)}
                      stroke="#fff"
                      strokeWidth="1"
                    />
                    <text
                      x={50 + i * cellSize + cellSize / 2}
                      y={30 + j * cellSize + cellSize / 2}
                      textAnchor="middle"
                      fontSize="8"
                      fill={values[j][i] / maxValue > 0.5 ? '#fff' : '#000'}
                      dominantBaseline="central"
                    >
                      {values[j][i]}
                    </text>
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </Box>
      </CardContent>
    </Card>
  );
};

export default {
  ScoreDistributionChart,
  PerformanceTrendChart,
  SkillsRadarChart,
  QuestionAnalysisChart,
  TimeAnalysisChart,
  HeatmapChart
};