import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  styled,
  alpha,
  Fab,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  GetApp,
  Email,
  FilterList,
  Person,
  Assessment,
  Schedule,
  Score,
  ViewModule,
  TableChart,
  Add,
  FileDownload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../theme/theme';
import StatsCard from '../../components/ui/StatsCard';
import GlassCard from '../../components/ui/GlassCard';
import KanbanBoard from '../../components/candidates/KanbanBoard';
import { sampleCandidates, Candidate } from '../../components/candidates/CandidateCard';

type ViewMode = 'kanban' | 'table';

const HeroSection = styled(Box)(({ theme }) => ({
  background: colors.gradient.background,
  borderRadius: 24,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
}));

const ViewToggle = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: 12,
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: 10,
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
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
  },
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  background: colors.gradient.primary,
  color: 'white',
  zIndex: theme.zIndex.fab,
  '&:hover': {
    background: colors.gradient.primary,
    transform: 'scale(1.1)',
  },
}));

const CandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(sampleCandidates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    // Using sample data - in real app, this would be an API call
    setCandidates(sampleCandidates);
  };

  const handleCandidateMove = (candidateId: string, newStatus: Candidate['status']) => {
    setCandidates(prevCandidates =>
      prevCandidates.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, status: newStatus }
          : candidate
      )
    );
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailsDialog(true);
  };

  const handleSendEmail = (candidate: Candidate) => {
    console.log('Sending email to:', candidate.email);
    // Implement email functionality
  };

  const handleScheduleInterview = (candidate: Candidate) => {
    console.log('Scheduling interview with:', candidate.name);
    // Implement interview scheduling
  };

  const handleBulkExport = () => {
    console.log('Exporting candidates data');
    // Implement bulk export functionality
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || candidate.status === statusFilter;
    const matchesAssessment = !assessmentFilter || candidate.assessmentId === assessmentFilter;
    
    return matchesSearch && matchesStatus && matchesAssessment;
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, candidate: Candidate) => {
    setAnchorEl(event.currentTarget);
    setSelectedCandidate(candidate);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCandidate(null);
  };

  const handleViewDetails = () => {
    if (selectedCandidate) {
      setShowDetailsDialog(true);
    }
    handleMenuClose();
  };

  const handleDownloadResults = () => {
    // Mock download functionality
    console.log('Download results for:', selectedCandidate?.name);
    handleMenuClose();
  };

  const handleSendEmailFromMenu = () => {
    // Mock email functionality
    console.log('Send email to:', selectedCandidate?.email);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'not_started': return 'default';
      case 'abandoned': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      case 'abandoned': return 'Abandoned';
      default: return status;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    if (percentage >= 50) return 'info';
    return 'error';
  };

  const uniqueAssessments = Array.from(new Set(candidates.map(c => c.position)))
    .map(position => candidates.find(c => c.position === position)!)
    .filter(Boolean);

  const stats = [
    {
      title: 'Total Candidates',
      value: candidates.length.toString(),
      subtitle: 'All time',
      icon: <Person sx={{ fontSize: 28, color: colors.primary[500] }} />,
      trend: { value: 12, isPositive: true },
      gradient: colors.gradient.primary,
    },
    {
      title: 'Completed',
      value: candidates.filter(c => c.status === 'completed').length.toString(),
      subtitle: 'Assessments done',
      icon: <Assessment sx={{ fontSize: 28, color: '#10B981' }} />,
      trend: { value: 8, isPositive: true },
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    },
    {
      title: 'In Progress',
      value: candidates.filter(c => c.status === 'in_progress').length.toString(),
      subtitle: 'Currently active',
      icon: <Schedule sx={{ fontSize: 28, color: colors.secondary[500] }} />,
      trend: { value: 5, isPositive: true },
      gradient: colors.gradient.secondary,
    },
    {
      title: 'Average Score',
      value: `${candidates.filter(c => c.assessmentScore && c.status === 'completed').length > 0 
        ? Math.round(candidates.filter(c => c.assessmentScore && c.status === 'completed')
            .reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / 
            candidates.filter(c => c.assessmentScore && c.status === 'completed').length)
        : 0}%`,
      subtitle: 'All assessments',
      icon: <Score sx={{ fontSize: 28, color: '#F59E0B' }} />,
      trend: { value: 3, isPositive: true },
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
  ];

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <HeroSection>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, position: 'relative', zIndex: 1 }}>
            Candidate Pipeline 🚀
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, position: 'relative', zIndex: 1 }}>
            Track, manage, and hire the best talent with our comprehensive candidate management system
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, position: 'relative', zIndex: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Invite Candidate
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleBulkExport}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Export Data
            </Button>
          </Box>
        </motion.div>
      </HeroSection>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              trend={stat.trend}
              gradient={stat.gradient}
              delay={index * 0.1}
            />
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <GlassCard variant="light" animate={false}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Candidate Management
            </Typography>
            <ViewToggle
              value={viewMode}
              exclusive
              onChange={(_, newMode: ViewMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="kanban">
                <ViewModule sx={{ mr: 1 }} />
                Kanban
              </ToggleButton>
              <ToggleButton value="table">
                <TableChart sx={{ mr: 1 }} />
                Table
              </ToggleButton>
            </ViewToggle>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="hired">Hired</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={assessmentFilter}
                  onChange={(e) => setAssessmentFilter(e.target.value)}
                  label="Position"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">All Positions</MenuItem>
                  {uniqueAssessments.map((candidate) => (
                    <MenuItem key={candidate.id} value={candidate.position}>
                      {candidate.position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setAssessmentFilter('');
                }}
                sx={{ borderRadius: 2 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>
      </GlassCard>

      {/* Main Content */}
      <Box sx={{ mt: 3 }}>
        <AnimatePresence mode="wait">
          {viewMode === 'kanban' ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <KanbanBoard
                candidates={filteredCandidates}
                onCandidateMove={handleCandidateMove}
                onViewProfile={handleViewProfile}
                onSendEmail={handleSendEmail}
                onScheduleInterview={handleScheduleInterview}
              />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard variant="light" animate={false}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Experience</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Applied</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCandidates
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((candidate, index) => (
                          <motion.tr
                            key={candidate.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            component={TableRow}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleViewProfile(candidate)}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    mr: 2, 
                                    width: 40, 
                                    height: 40,
                                    border: `2px solid ${alpha(colors.primary[500], 0.2)}`,
                                  }}
                                  src={candidate.avatar}
                                >
                                  {candidate.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {candidate.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {candidate.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {candidate.position}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {candidate.experience}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {candidate.location}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {candidate.assessmentScore ? (
                                <Box>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: candidate.assessmentScore >= 80 
                                        ? '#10B981' 
                                        : candidate.assessmentScore >= 60 
                                        ? '#F59E0B' 
                                        : '#EF4444'
                                    }}
                                  >
                                    {candidate.assessmentScore}%
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={candidate.assessmentScore} 
                                    sx={{ 
                                      width: 60, 
                                      mt: 0.5,
                                      backgroundColor: alpha(colors.neutral[300], 0.3),
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: candidate.assessmentScore >= 80 
                                          ? '#10B981' 
                                          : candidate.assessmentScore >= 60 
                                          ? '#F59E0B' 
                                          : '#EF4444'
                                      }
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={candidate.status.replace('_', ' ')}
                                size="small" 
                                sx={{
                                  backgroundColor: candidate.status === 'completed'
                                    ? alpha('#10B981', 0.1)
                                    : candidate.status === 'in_progress'
                                    ? alpha('#F59E0B', 0.1)
                                    : candidate.status === 'hired'
                                    ? alpha(colors.primary[500], 0.1)
                                    : alpha('#EF4444', 0.1),
                                  color: candidate.status === 'completed'
                                    ? '#10B981'
                                    : candidate.status === 'in_progress'
                                    ? '#F59E0B'
                                    : candidate.status === 'hired'
                                    ? colors.primary[500]
                                    : '#EF4444',
                                  fontWeight: 600,
                                  textTransform: 'capitalize',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {candidate.appliedDate.toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuOpen(e, candidate);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </TableCell>
                          </motion.tr>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredCandidates.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedCandidate?.status === 'completed' && (
          <MenuItem onClick={handleDownloadResults}>
            <GetApp sx={{ mr: 1 }} />
            Download Results
          </MenuItem>
        )}
        <MenuItem onClick={handleSendEmailFromMenu}>
          <Email sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog 
          open={showDetailsDialog} 
          onClose={() => setShowDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Candidate Details
          </DialogTitle>
          <DialogContent>
            {selectedCandidate && (
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedCandidate.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedCandidate.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Position</Typography>
                  <Typography variant="body1">{selectedCandidate.position}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Experience</Typography>
                  <Typography variant="body1">{selectedCandidate.experience}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{selectedCandidate.location}</Typography>
                </Grid>
                {selectedCandidate.assessmentScore && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Assessment Score</Typography>
                      <Typography variant="body1">
                        {selectedCandidate.assessmentScore}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Rating</Typography>
                      <Typography variant="body1">{selectedCandidate.rating || 'Not rated'}</Typography>
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Applied Date</Typography>
                  <Typography variant="body1">
                    {selectedCandidate.appliedDate.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedCandidate.skills.map((skill) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedCandidate?.status === 'completed' && (
              <Button variant="contained" onClick={handleDownloadResults}>
                Download Results
              </Button>
            )}
          </DialogActions>
        </Dialog>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => console.log('Add new candidate')}>
        <Add />
      </FloatingActionButton>
    </Container>
  );
};

export default CandidatesPage;