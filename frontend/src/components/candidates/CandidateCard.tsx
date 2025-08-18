import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  styled,
  alpha,
} from '@mui/material';
import {
  MoreVert,
  Email,
  Phone,
  LinkedIn,
  Schedule,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { colors } from '../../theme/theme';
import GlassCard from '../ui/GlassCard';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  position: string;
  experience: string;
  location: string;
  skills: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'hired';
  assessmentScore?: number;
  appliedDate: Date;
  lastActivity: Date;
  linkedIn?: string;
  rating?: number;
}

interface CandidateCardProps {
  candidate: Candidate;
  onViewProfile?: (candidate: Candidate) => void;
  onSendEmail?: (candidate: Candidate) => void;
  onScheduleInterview?: (candidate: Candidate) => void;
  onUpdateStatus?: (candidate: Candidate, status: Candidate['status']) => void;
  variant?: 'compact' | 'detailed';
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
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
    '& .candidate-actions': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: colors.gradient.primary,
  },
}));

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return { bg: theme.palette.warning.main, text: theme.palette.warning.contrastText };
      case 'in_progress':
        return { bg: theme.palette.info.main, text: theme.palette.info.contrastText };
      case 'completed':
        return { bg: theme.palette.success.main, text: theme.palette.success.contrastText };
      case 'rejected':
        return { bg: theme.palette.error.main, text: theme.palette.error.contrastText };
      case 'hired':
        return { bg: theme.palette.primary.main, text: theme.palette.primary.contrastText };
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

const SkillChip = styled(Chip)(({ theme }) => ({
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

const ScoreIndicator = styled(Box)<{ score: number }>(({ theme, score }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: score >= 80 
    ? alpha(theme.palette.success.main, 0.2)
    : score >= 60
    ? alpha(theme.palette.warning.main, 0.2)
    : alpha(theme.palette.error.main, 0.2),
  color: score >= 80 
    ? theme.palette.success.main
    : score >= 60
    ? theme.palette.warning.main
    : theme.palette.error.main,
  fontWeight: 700,
  fontSize: '0.9rem',
}));

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getStatusLabel = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onViewProfile,
  onSendEmail,
  onScheduleInterview,
  onUpdateStatus,
  variant = 'detailed',
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus: Candidate['status']) => {
    onUpdateStatus?.(candidate, newStatus);
    handleMenuClose();
  };

  const handleCardClick = () => {
    onViewProfile?.(candidate);
  };

  const renderRating = () => {
    if (!candidate.rating) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            sx={{
              fontSize: 16,
              color: index < candidate.rating! 
                ? colors.secondary[400] 
                : colors.neutral[300],
            }}
          />
        ))}
      </Box>
    );
  };

  return (
    <StyledCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar
            src={candidate.avatar}
            sx={{ 
              width: 60, 
              height: 60,
              border: `3px solid ${alpha(colors.primary[500], 0.2)}`,
            }}
          >
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {candidate.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {candidate.position}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {candidate.experience} • {candidate.location}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusChip 
            status={candidate.status} 
            label={getStatusLabel(candidate.status)}
            size="small"
          />
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {variant === 'detailed' && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {candidate.skills.slice(0, 4).map((skill) => (
                <SkillChip key={skill} label={skill} size="small" />
              ))}
              {candidate.skills.length > 4 && (
                <SkillChip label={`+${candidate.skills.length - 4}`} size="small" />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Applied: {formatDate(candidate.appliedDate)}
              </Typography>
              <br />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Last Activity: {formatDate(candidate.lastActivity)}
              </Typography>
            </Box>

            {candidate.assessmentScore && (
              <ScoreIndicator score={candidate.assessmentScore}>
                {candidate.assessmentScore}%
              </ScoreIndicator>
            )}
          </Box>

          {renderRating()}
        </>
      )}

      <ActionButtons className="candidate-actions">
        <Button
          size="small"
          startIcon={<Email />}
          onClick={(e) => {
            e.stopPropagation();
            onSendEmail?.(candidate);
          }}
        >
          Email
        </Button>
        <Button
          size="small"
          startIcon={<Schedule />}
          onClick={(e) => {
            e.stopPropagation();
            onScheduleInterview?.(candidate);
          }}
        >
          Interview
        </Button>
        <Button
          size="small"
          startIcon={<TrendingUp />}
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile?.(candidate);
          }}
        >
          Profile
        </Button>
      </ActionButtons>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleStatusChange('pending')}>Mark as Pending</MenuItem>
        <MenuItem onClick={() => handleStatusChange('in_progress')}>Mark as In Progress</MenuItem>
        <MenuItem onClick={() => handleStatusChange('completed')}>Mark as Completed</MenuItem>
        <MenuItem onClick={() => handleStatusChange('hired')}>Mark as Hired</MenuItem>
        <MenuItem onClick={() => handleStatusChange('rejected')}>Mark as Rejected</MenuItem>
      </Menu>
    </StyledCard>
  );
};

// Sample candidate data
export const sampleCandidates: Candidate[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    position: 'Senior Frontend Developer',
    experience: '5+ years',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'AWS'],
    status: 'completed',
    assessmentScore: 87,
    appliedDate: new Date('2024-01-15'),
    lastActivity: new Date('2024-01-20'),
    rating: 4,
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah.smith@email.com',
    position: 'Full Stack Developer',
    experience: '3 years',
    location: 'Austin, TX',
    skills: ['Node.js', 'React', 'Python', 'PostgreSQL'],
    status: 'in_progress',
    assessmentScore: 92,
    appliedDate: new Date('2024-01-18'),
    lastActivity: new Date('2024-01-22'),
    rating: 5,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@email.com',
    position: 'Backend Developer',
    experience: '4 years',
    location: 'Seattle, WA',
    skills: ['Java', 'Spring Boot', 'Docker', 'Kubernetes'],
    status: 'pending',
    appliedDate: new Date('2024-01-20'),
    lastActivity: new Date('2024-01-20'),
    rating: 3,
  },
];

export default CandidateCard;