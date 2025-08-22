import React from 'react';
import {
  Box,
  Typography,
  styled,
  alpha,
  useTheme,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { colors } from '../../theme/theme';
import CandidateCard, { Candidate } from './CandidateCard';

interface KanbanBoardProps {
  candidates: Candidate[];
  onCandidateMove: (candidateId: string, newStatus: Candidate['status']) => void;
  onViewProfile?: (candidate: Candidate) => void;
  onSendEmail?: (candidate: Candidate) => void;
  onScheduleInterview?: (candidate: Candidate) => void;
}

interface Column {
  id: Candidate['status'];
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: 'Pending', color: colors.neutral[400] },
  { id: 'in_progress', title: 'In Progress', color: colors.secondary[500] },
  { id: 'completed', title: 'Completed', color: colors.primary[500] },
  { id: 'hired', title: 'Hired', color: '#10B981' },
  { id: 'rejected', title: 'Rejected', color: '#EF4444' },
];

const BoardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  overflowX: 'auto',
  padding: theme.spacing(2),
  minHeight: '70vh',
  '&::-webkit-scrollbar': {
    height: 8,
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

const ColumnContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDraggingOver' && prop !== 'columnColor',
})<{ isDraggingOver: boolean; columnColor: string }>(({ theme, isDraggingOver, columnColor }) => ({
  minWidth: 320,
  maxWidth: 320,
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  borderRadius: 16,
  padding: theme.spacing(2),
  transition: 'all 0.3s ease',
  
  ...(isDraggingOver && {
    backgroundColor: alpha(columnColor, 0.1),
    borderColor: columnColor,
    transform: 'scale(1.02)',
  }),

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: columnColor,
    borderRadius: '16px 16px 0 0',
  },

  position: 'relative',
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

const CandidateList = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDraggingOver',
})<{ isDraggingOver: boolean }>(({ theme, isDraggingOver }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  minHeight: 100,
  transition: 'all 0.3s ease',
  
  ...(isDraggingOver && {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderRadius: 12,
    padding: theme.spacing(1),
  }),
}));

const CountBadge = styled(Box)(({ theme, color }: { theme: any; color: string }) => ({
  backgroundColor: alpha(color, 0.1),
  color: color,
  borderRadius: 20,
  padding: theme.spacing(0.5, 1.5),
  fontSize: '0.875rem',
  fontWeight: 600,
  minWidth: 24,
  textAlign: 'center',
}));

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  onCandidateMove,
  onViewProfile,
  onSendEmail,
  onScheduleInterview,
}) => {
  const theme = useTheme();
  
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move candidate to new status
    const newStatus = destination.droppableId as Candidate['status'];
    onCandidateMove(draggableId, newStatus);
  };

  const getCandidatesByStatus = (status: Candidate['status']) => {
    return candidates.filter(candidate => candidate.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <BoardContainer>
        {columns.map((column) => {
          const columnCandidates = getCandidatesByStatus(column.id);
          
          return (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <ColumnContainer
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                  columnColor={column.color}
                >
                  <ColumnHeader>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {column.title}
                    </Typography>
                    <CountBadge theme={theme} color={column.color}>
                      {columnCandidates.length}
                    </CountBadge>
                  </ColumnHeader>

                  <CandidateList isDraggingOver={snapshot.isDraggingOver}>
                    {columnCandidates.map((candidate, index) => (
                      <Draggable
                        key={candidate.id}
                        draggableId={candidate.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              ...(snapshot.isDragging && {
                                transform: `${provided.draggableProps.style?.transform} rotate(5deg)`,
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                              }),
                            }}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <CandidateCard
                                candidate={candidate}
                                variant="compact"
                                onViewProfile={onViewProfile}
                                onSendEmail={onSendEmail}
                                onScheduleInterview={onScheduleInterview}
                                onUpdateStatus={(candidate: Candidate, status: Candidate['status']) => onCandidateMove(candidate.id, status)}
                              />
                            </motion.div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CandidateList>
                </ColumnContainer>
              )}
            </Droppable>
          );
        })}
      </BoardContainer>
    </DragDropContext>
  );
};

export default KanbanBoard;