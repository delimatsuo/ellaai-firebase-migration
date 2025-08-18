import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  styled,
  alpha,
} from '@mui/material';
import {
  MoreVert,
  Schedule,
  Person,
  Assessment,
  PlayArrow,
  Edit,
  ContentCopy,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { colors } from '../../theme/theme';
import GlassCard from '../ui/GlassCard';

export interface AssessmentData {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'behavioral' | 'cognitive' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // in minutes
  questions: number;
  candidates: {
    total: number;
    completed: number;
    inProgress: number;
  };
  averageScore?: number;
  createdDate: Date;
  lastModified: Date;
  status: 'draft' | 'active' | 'archived';
  tags: string[];
}

interface AssessmentCardProps {
  assessment: AssessmentData;
  onStart?: (assessment: AssessmentData) => void;
  onEdit?: (assessment: AssessmentData) => void;
  onDuplicate?: (assessment: AssessmentData) => void;
  onDelete?: (assessment: AssessmentData) => void;
  onViewResults?: (assessment: AssessmentData) => void;
  variant?: 'candidate' | 'admin';
}

const StyledCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  borderRadius: 16,
  padding: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
    '& .assessment-actions': {
      opacity: 1,
      transform: 'translateY(0)',
    },
    '& .play-button': {
      transform: 'scale(1.1)',
    },
  },
}));

const DifficultyChip = styled(Chip)<{ difficulty: string }>(({ theme, difficulty }) => {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return { bg: theme.palette.success.main, text: theme.palette.success.contrastText };
      case 'medium':
        return { bg: theme.palette.warning.main, text: theme.palette.warning.contrastText };
      case 'hard':
        return { bg: theme.palette.error.main, text: theme.palette.error.contrastText };
      default:
        return { bg: theme.palette.grey[500], text: theme.palette.grey[50] };
    }
  };
  
  const colors = getDifficultyColor();
  
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 24,
  };
});

const TypeChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
  color: theme.palette.secondary.main,
  fontWeight: 500,
  fontSize: '0.75rem',
  height: 24,
}));

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'draft':
        return { bg: theme.palette.grey[500], text: theme.palette.grey[50] };
      case 'active':
        return { bg: theme.palette.success.main, text: theme.palette.success.contrastText };
      case 'archived':
        return { bg: theme.palette.warning.main, text: theme.palette.warning.contrastText };
      default:
        return { bg: theme.palette.grey[500], text: theme.palette.grey[50] };
    }
  };
  
  const colors = getStatusColor();
  
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 24,
  };
});

const TagChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontSize: '0.7rem',
  height: 20,
  '& .MuiChip-label': {
    padding: '0 6px',
  },
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  opacity: 0,
  transform: 'translateY(10px)',
  transition: 'all 0.3s ease',
}));

const PlayButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: colors.gradient.primary,
  color: theme.palette.primary.contrastText,
  width: 56,
  height: 56,
  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    backgroundColor: colors.gradient.primary,
    transform: 'scale(1.1)',
    boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.4)}`,
  },
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderRadius: 12,
  marginTop: theme.spacing(2),
}));

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getTypeLabel = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getDifficultyLabel = (difficulty: string) => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
  onViewResults,
  variant = 'admin',
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const completionRate = assessment.candidates.total > 0 
    ? (assessment.candidates.completed / assessment.candidates.total) * 100 
    : 0;

  const handleCardClick = () => {
    if (variant === 'candidate') {
      onStart?.(assessment);
    } else {
      onViewResults?.(assessment);
    }
  };

  return (
    <StyledCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -6 }}
      onClick={handleCardClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Assessment sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {assessment.title}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {assessment.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TypeChip label={getTypeLabel(assessment.type)} size="small" />
            <DifficultyChip difficulty={assessment.difficulty} label={getDifficultyLabel(assessment.difficulty)} size="small" />
            {variant === 'admin' && (
              <StatusChip status={assessment.status} label={getStatusLabel(assessment.status)} size="small" />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {variant === 'candidate' && (
            <PlayButton
              className="play-button"
              onClick={(e) => {
                e.stopPropagation();
                onStart?.(assessment);
              }}
            >
              <PlayArrow />
            </PlayButton>
          )}
          
          {variant === 'admin' && (
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {formatDuration(assessment.duration)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Assessment sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {assessment.questions} questions
            </Typography>
          </Box>
          
          {variant === 'admin' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {assessment.candidates.total} candidates
              </Typography>
            </Box>
          )}
        </Box>
        
        {assessment.averageScore && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {assessment.averageScore}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              avg score
            </Typography>
          </Box>
        )}
      </Box>

      {variant === 'admin' && assessment.candidates.total > 0 && (
        <ProgressSection>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Completion Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {completionRate.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(colors.primary[500], 0.2),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: colors.gradient.primary,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {assessment.candidates.completed} completed
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {assessment.candidates.inProgress} in progress
            </Typography>
          </Box>
        </ProgressSection>
      )}

      {assessment.tags.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {assessment.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag} label={tag} size="small" />
            ))}
            {assessment.tags.length > 3 && (
              <TagChip label={`+${assessment.tags.length - 3}`} size="small" />
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Created: {formatDate(assessment.createdDate)} • 
          Modified: {formatDate(assessment.lastModified)}
        </Typography>
      </Box>

      {variant === 'admin' && (
        <ActionButtons className="assessment-actions">
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(assessment);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(assessment);
            }}
          >
            Duplicate
          </Button>
          <Button
            size="small"
            startIcon={<Assessment />}
            onClick={(e) => {
              e.stopPropagation();
              onViewResults?.(assessment);
            }}
          >
            Results
          </Button>
        </ActionButtons>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { onEdit?.(assessment); handleMenuClose(); }}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { onDuplicate?.(assessment); handleMenuClose(); }}>
          <ContentCopy sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => { onViewResults?.(assessment); handleMenuClose(); }}>
          <Assessment sx={{ mr: 1 }} /> View Results
        </MenuItem>
        <MenuItem 
          onClick={() => { onDelete?.(assessment); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </StyledCard>
  );
};

// Sample assessment data
export const sampleAssessments: AssessmentData[] = [
  {
    id: '1',
    title: 'Frontend Developer Assessment',
    description: 'Comprehensive React and TypeScript assessment for senior developers',
    type: 'technical',
    difficulty: 'hard',
    duration: 120,
    questions: 25,
    candidates: { total: 45, completed: 32, inProgress: 8 },
    averageScore: 78,
    createdDate: new Date('2024-01-10'),
    lastModified: new Date('2024-01-15'),
    status: 'active',
    tags: ['React', 'TypeScript', 'JavaScript', 'CSS'],
  },
  {
    id: '2',
    title: 'Backend Engineer Challenge',
    description: 'Node.js and database design assessment',
    type: 'technical',
    difficulty: 'medium',
    duration: 90,
    questions: 20,
    candidates: { total: 28, completed: 25, inProgress: 3 },
    averageScore: 82,
    createdDate: new Date('2024-01-08'),
    lastModified: new Date('2024-01-12'),
    status: 'active',
    tags: ['Node.js', 'PostgreSQL', 'API Design'],
  },
  {
    id: '3',
    title: 'Leadership Skills Assessment',
    description: 'Behavioral assessment for management positions',
    type: 'behavioral',
    difficulty: 'easy',
    duration: 45,
    questions: 15,
    candidates: { total: 12, completed: 10, inProgress: 2 },
    averageScore: 85,
    createdDate: new Date('2024-01-05'),
    lastModified: new Date('2024-01-10'),
    status: 'active',
    tags: ['Leadership', 'Communication', 'Team Management'],
  },
];

export default AssessmentCard;