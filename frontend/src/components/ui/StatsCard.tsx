import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  styled,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { colors } from '../../theme/theme';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

const StyledCard = styled(motion.div)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
    '& .gradient-overlay': {
      opacity: 0.1,
    },
    '& .icon-container': {
      transform: 'scale(1.1) rotate(5deg)',
    },
  },
}));

const GradientOverlay = styled(Box)<{ gradient: string }>(({ gradient }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: gradient,
  opacity: 0.05,
  transition: 'opacity 0.3s ease',
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 56,
  height: 56,
  borderRadius: 16,
  background: alpha(theme.palette.primary.main, 0.1),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  marginBottom: theme.spacing(2),
}));

const TrendContainer = styled(Box)<{ isPositive: boolean }>(({ theme, isPositive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: isPositive ? theme.palette.success.main : theme.palette.error.main,
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = colors.gradient.primary,
  delay = 0,
}) => {
  return (
    <StyledCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.95 }}
    >
      <GradientOverlay gradient={gradient} className="gradient-overlay" />
      
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          {icon && (
            <IconContainer className="icon-container">
              {icon}
            </IconContainer>
          )}
          
          {trend && (
            <TrendContainer isPositive={trend.isPositive}>
              {trend.isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
              {Math.abs(trend.value)}%
            </TrendContainer>
          )}
        </Box>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.2 }}
        >
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {value}
          </Typography>
        </motion.div>

        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 600, 
            mb: subtitle ? 0.5 : 0,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default StatsCard;