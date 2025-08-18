import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  styled,
  alpha,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Assessment,
  Person,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { colors } from '../../theme/theme';
import GlassCard from '../ui/GlassCard';

export interface ActivityItem {
  id: string;
  type: 'assessment_completed' | 'candidate_invited' | 'result_reviewed' | 'assessment_created';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    score?: number;
    status?: 'success' | 'warning' | 'error';
    assessmentName?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const ActivityContainer = styled(Box)(({ theme }) => ({
  maxHeight: 400,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.primary.main, 0.1),
    borderRadius: 10,
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.3),
    borderRadius: 10,
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.5),
    },
  },
}));

const ActivityItemContainer = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: 12,
  marginBottom: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.5)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha('#ffffff', 0.2)}`,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.7)',
    transform: 'translateX(4px)',
    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const IconContainer = styled(Box)<{ activityType: string }>(({ theme, activityType }) => {
  const getColor = () => {
    switch (activityType) {
      case 'assessment_completed':
        return theme.palette.success.main;
      case 'candidate_invited':
        return theme.palette.info.main;
      case 'result_reviewed':
        return theme.palette.warning.main;
      case 'assessment_created':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: alpha(getColor(), 0.1),
    color: getColor(),
    flexShrink: 0,
  };
});

const TimelineConnector = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 20,
  top: 50,
  bottom: -10,
  width: 2,
  background: alpha(theme.palette.primary.main, 0.2),
  '&:last-child': {
    display: 'none',
  },
}));

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'assessment_completed':
      return <CheckCircle />;
    case 'candidate_invited':
      return <Person />;
    case 'result_reviewed':
      return <TrendingUp />;
    case 'assessment_created':
      return <Assessment />;
    default:
      return <Schedule />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, maxItems = 10 }) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <GlassCard variant="light" animate={false}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Recent Activity
        </Typography>

        <ActivityContainer>
          <AnimatePresence>
            {displayActivities.map((activity, index) => (
              <Box key={activity.id} sx={{ position: 'relative' }}>
                <ActivityItemContainer
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <IconContainer activityType={activity.type}>
                    {getActivityIcon(activity.type)}
                  </IconContainer>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {activity.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 1 }}>
                        {formatTime(activity.timestamp)}
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {activity.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {activity.user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={activity.user.avatar}
                            sx={{ width: 20, height: 20, fontSize: '0.75rem' }}
                          >
                            {activity.user.name[0]}
                          </Avatar>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {activity.user.name}
                          </Typography>
                        </Box>
                      )}

                      {activity.metadata?.score && (
                        <Chip
                          label={`${activity.metadata.score}%`}
                          size="small"
                          color={activity.metadata.score >= 80 ? 'success' : activity.metadata.score >= 60 ? 'warning' : 'error'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}

                      {activity.metadata?.status && (
                        <Chip
                          label={activity.metadata.status}
                          size="small"
                          color={getStatusColor(activity.metadata.status) as any}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </ActivityItemContainer>

                {index < displayActivities.length - 1 && <TimelineConnector />}
              </Box>
            ))}
          </AnimatePresence>
        </ActivityContainer>

        {activities.length > maxItems && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {activities.length - maxItems} more activities
            </Typography>
          </Box>
        )}
      </Box>
    </GlassCard>
  );
};

// Sample data for demonstration
export const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'assessment_completed',
    title: 'Assessment Completed',
    description: 'Frontend Developer assessment completed by John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    user: { name: 'John Doe', avatar: undefined },
    metadata: { score: 87, status: 'success' },
  },
  {
    id: '2',
    type: 'candidate_invited',
    title: 'Candidate Invited',
    description: 'New candidate invited to React Developer assessment',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: { name: 'Sarah Smith' },
  },
  {
    id: '3',
    type: 'result_reviewed',
    title: 'Results Reviewed',
    description: 'Backend assessment results reviewed and approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    user: { name: 'Mike Johnson' },
    metadata: { status: 'success' },
  },
  {
    id: '4',
    type: 'assessment_created',
    title: 'Assessment Created',
    description: 'New Full-Stack Developer assessment created',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    user: { name: 'Alex Chen' },
  },
];

export default ActivityFeed;