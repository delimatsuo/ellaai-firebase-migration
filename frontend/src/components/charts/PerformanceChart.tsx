import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  styled,
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { motion } from 'framer-motion';
import { colors } from '../../theme/theme';
import GlassCard from '../ui/GlassCard';

type ChartType = 'area' | 'bar' | 'line' | 'pie';

interface PerformanceData {
  period: string;
  assessments: number;
  candidates: number;
  completionRate: number;
  averageScore: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title: string;
  type?: ChartType;
  height?: number;
  showControls?: boolean;
}

const ChartContainer = styled(Box)(({ theme }) => ({
  '& .recharts-tooltip-wrapper': {
    '& .recharts-default-tooltip': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
  },
  '& .recharts-legend-wrapper': {
    '& .recharts-legend-item': {
      '& .recharts-legend-icon': {
        borderRadius: 4,
      },
    },
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  backdropFilter: 'blur(10px)',
  borderRadius: 10,
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: 8,
    margin: 2,
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  },
}));

// Sample data
const sampleData: PerformanceData[] = [
  { period: 'Jan', assessments: 45, candidates: 120, completionRate: 85, averageScore: 78 },
  { period: 'Feb', assessments: 52, candidates: 145, completionRate: 88, averageScore: 82 },
  { period: 'Mar', assessments: 48, candidates: 135, completionRate: 92, averageScore: 85 },
  { period: 'Apr', assessments: 61, candidates: 165, completionRate: 89, averageScore: 80 },
  { period: 'May', assessments: 55, candidates: 155, completionRate: 94, averageScore: 87 },
  { period: 'Jun', assessments: 58, candidates: 170, completionRate: 91, averageScore: 84 },
];

const pieData: PieData[] = [
  { name: 'Completed', value: 68, color: colors.primary[500] },
  { name: 'In Progress', value: 22, color: colors.secondary[400] },
  { name: 'Pending', value: 10, color: colors.neutral[400] },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color, fontWeight: 500 }}
          >
            {entry.name}: {entry.value}
            {entry.name.includes('Rate') || entry.name.includes('Score') ? '%' : ''}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data = sampleData,
  title,
  type = 'area',
  height = 300,
  showControls = true,
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = React.useState<ChartType>(type);

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: ChartType,
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary[500]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.primary[500]} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.secondary[500]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.secondary[500]} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
            <XAxis dataKey="period" stroke={colors.neutral[500]} />
            <YAxis stroke={colors.neutral[500]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="assessments"
              stroke={colors.primary[500]}
              fillOpacity={1}
              fill="url(#colorAssessments)"
              name="Assessments"
            />
            <Area
              type="monotone"
              dataKey="candidates"
              stroke={colors.secondary[500]}
              fillOpacity={1}
              fill="url(#colorCandidates)"
              name="Candidates"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
            <XAxis dataKey="period" stroke={colors.neutral[500]} />
            <YAxis stroke={colors.neutral[500]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="assessments" fill={colors.primary[500]} name="Assessments" radius={[4, 4, 0, 0]} />
            <Bar dataKey="candidates" fill={colors.secondary[500]} name="Candidates" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
            <XAxis dataKey="period" stroke={colors.neutral[500]} />
            <YAxis stroke={colors.neutral[500]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="completionRate"
              stroke={colors.primary[500]}
              strokeWidth={3}
              dot={{ fill: colors.primary[500], strokeWidth: 2, r: 6 }}
              name="Completion Rate"
            />
            <Line
              type="monotone"
              dataKey="averageScore"
              stroke={colors.secondary[500]}
              strokeWidth={3}
              dot={{ fill: colors.secondary[500], strokeWidth: 2, r: 6 }}
              name="Average Score"
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <GlassCard variant="light" animate={false}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>

          {showControls && (
            <StyledToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="area">Area</ToggleButton>
              <ToggleButton value="bar">Bar</ToggleButton>
              <ToggleButton value="line">Line</ToggleButton>
              <ToggleButton value="pie">Pie</ToggleButton>
            </StyledToggleButtonGroup>
          )}
        </Box>

        <ChartContainer>
          <motion.div
            key={chartType}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ResponsiveContainer width="100%" height={height}>
              {renderChart()}
            </ResponsiveContainer>
          </motion.div>
        </ChartContainer>
      </Box>
    </GlassCard>
  );
};

export default PerformanceChart;