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
} from '@mui/icons-material';

interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  assessmentTitle: string;
  assessmentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  status: 'completed' | 'in_progress' | 'not_started' | 'abandoned';
  submittedAt?: Date;
  timeSpent: number;
  difficulty: string;
  language: string;
}

const CandidatesPage: React.FC = () => {
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app, this would be an API call
      const mockCandidates: Candidate[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice.johnson@email.com',
          assessmentTitle: 'Frontend Developer Assessment',
          assessmentId: 'assessment-1',
          score: 85,
          totalPoints: 100,
          percentage: 85,
          status: 'completed',
          submittedAt: new Date('2024-01-15'),
          timeSpent: 45,
          difficulty: 'intermediate',
          language: 'JavaScript',
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob.smith@email.com',
          assessmentTitle: 'React Developer Challenge',
          assessmentId: 'assessment-2',
          score: 92,
          totalPoints: 120,
          percentage: 77,
          status: 'completed',
          submittedAt: new Date('2024-01-14'),
          timeSpent: 52,
          difficulty: 'advanced',
          language: 'JavaScript',
        },
        {
          id: '3',
          name: 'Carol Wilson',
          email: 'carol.wilson@email.com',
          assessmentTitle: 'Python Backend Skills',
          assessmentId: 'assessment-3',
          score: 78,
          totalPoints: 90,
          percentage: 87,
          status: 'completed',
          submittedAt: new Date('2024-01-13'),
          timeSpent: 38,
          difficulty: 'intermediate',
          language: 'Python',
        },
        {
          id: '4',
          name: 'David Brown',
          email: 'david.brown@email.com',
          assessmentTitle: 'Frontend Developer Assessment',
          assessmentId: 'assessment-1',
          score: 0,
          totalPoints: 100,
          percentage: 0,
          status: 'in_progress',
          timeSpent: 15,
          difficulty: 'intermediate',
          language: 'JavaScript',
        },
        {
          id: '5',
          name: 'Eve Davis',
          email: 'eve.davis@email.com',
          assessmentTitle: 'Junior Developer Screening',
          assessmentId: 'assessment-4',
          score: 0,
          totalPoints: 60,
          percentage: 0,
          status: 'not_started',
          timeSpent: 0,
          difficulty: 'beginner',
          language: 'JavaScript',
        },
      ];

      setCandidates(mockCandidates);
      setError(null);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const handleSendEmail = () => {
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

  const uniqueAssessments = Array.from(new Set(candidates.map(c => c.assessmentTitle)))
    .map(title => candidates.find(c => c.assessmentTitle === title)!)
    .filter(Boolean);

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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Candidates
        </Typography>
        
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Review and manage candidate assessment submissions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {candidates.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Candidates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {candidates.filter(c => c.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {candidates.filter(c => c.status === 'in_progress').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Score sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {candidates.filter(c => c.status === 'completed').length > 0 
                    ? Math.round(candidates.filter(c => c.status === 'completed')
                        .reduce((sum, c) => sum + c.percentage, 0) / 
                        candidates.filter(c => c.status === 'completed').length)
                    : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
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
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="abandoned">Abandoned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Assessment</InputLabel>
                <Select
                  value={assessmentFilter}
                  onChange={(e) => setAssessmentFilter(e.target.value)}
                  label="Assessment"
                >
                  <MenuItem value="">All Assessments</MenuItem>
                  {uniqueAssessments.map((assessment) => (
                    <MenuItem key={assessment.assessmentId} value={assessment.assessmentId}>
                      {assessment.assessmentTitle}
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
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Candidates Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Time Spent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCandidates
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((candidate) => (
                    <TableRow key={candidate.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {candidate.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {candidate.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {candidate.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {candidate.assessmentTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={candidate.language} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={candidate.difficulty} 
                          size="small" 
                          color={getDifficultyColor(candidate.difficulty) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {candidate.status === 'completed' ? (
                          <Box>
                            <Typography variant="body2" color={getScoreColor(candidate.percentage)}>
                              {candidate.percentage}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={candidate.percentage} 
                              color={getScoreColor(candidate.percentage) as any}
                              sx={{ width: 60, mt: 0.5 }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {candidate.timeSpent}m
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(candidate.status)} 
                          size="small" 
                          color={getStatusColor(candidate.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {candidate.submittedAt 
                            ? candidate.submittedAt.toLocaleDateString() 
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, candidate)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
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
        </Paper>

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
          <MenuItem onClick={handleSendEmail}>
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
                  <Typography variant="body2" color="text.secondary">Assessment</Typography>
                  <Typography variant="body1">{selectedCandidate.assessmentTitle}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Language</Typography>
                  <Typography variant="body1">{selectedCandidate.language}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Difficulty</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedCandidate.difficulty}
                  </Typography>
                </Grid>
                {selectedCandidate.status === 'completed' && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Score</Typography>
                      <Typography variant="body1">
                        {selectedCandidate.score}/{selectedCandidate.totalPoints} ({selectedCandidate.percentage}%)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Time Spent</Typography>
                      <Typography variant="body1">{selectedCandidate.timeSpent} minutes</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Submitted At</Typography>
                      <Typography variant="body1">
                        {selectedCandidate.submittedAt?.toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
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
      </Box>
    </Container>
  );
};

export default CandidatesPage;