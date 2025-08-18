import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Code,
  Quiz,
  TextFields,
  Save,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  type: 'multiple_choice' | 'coding' | 'short_answer';
  question: string;
  options?: string[];
  code?: string;
  language?: string;
  points: number;
  timeLimit?: number;
}

interface AssessmentForm {
  title: string;
  description: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  passingScore: number;
  instructions: string;
  isActive: boolean;
  questions: Question[];
}

const steps = ['Basic Info', 'Questions', 'Settings', 'Review'];

const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AssessmentForm>({
    title: '',
    description: '',
    language: '',
    difficulty: 'beginner',
    estimatedTime: 30,
    passingScore: 70,
    instructions: '',
    isActive: true,
    questions: [],
  });

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    points: 10,
    timeLimit: 5,
  });

  const handleFormChange = (field: keyof AssessmentForm) => (e: any) => {
    setForm(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.question?.trim()) {
      const question: Question = {
        id: Date.now().toString(),
        type: newQuestion.type || 'multiple_choice',
        question: newQuestion.question,
        options: newQuestion.type === 'multiple_choice' ? newQuestion.options : undefined,
        code: newQuestion.type === 'coding' ? newQuestion.code : undefined,
        language: newQuestion.type === 'coding' ? form.language : undefined,
        points: newQuestion.points || 10,
        timeLimit: newQuestion.timeLimit,
      };

      setForm(prev => ({
        ...prev,
        questions: [...prev.questions, question]
      }));

      // Reset form
      setNewQuestion({
        type: 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        points: 10,
        timeLimit: 5,
      });
      
      setShowQuestionDialog(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion(question);
    setShowQuestionDialog(true);
  };

  const handleUpdateQuestion = () => {
    if (editingQuestion && newQuestion.question?.trim()) {
      setForm(prev => ({
        ...prev,
        questions: prev.questions.map(q => 
          q.id === editingQuestion.id 
            ? { ...editingQuestion, ...newQuestion }
            : q
        )
      }));
      
      setEditingQuestion(null);
      setNewQuestion({
        type: 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        points: 10,
        timeLimit: 5,
      });
      
      setShowQuestionDialog(false);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!form.title.trim() || !form.description.trim() || !form.language) {
        throw new Error('Please fill in all required fields');
      }

      if (form.questions.length === 0) {
        throw new Error('Please add at least one question');
      }

      // Mock API call - in real app, this would create the assessment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Assessment created successfully!');
      navigate('/company');
    } catch (err: any) {
      console.error('Create assessment error:', err);
      setError(err.message || 'Failed to create assessment');
      toast.error(err.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code />;
      case 'short_answer': return <TextFields />;
      default: return <Quiz />;
    }
  };

  const totalPoints = form.questions.reduce((sum, q) => sum + q.points, 0);

  const renderBasicInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Assessment Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Assessment Title"
              value={form.title}
              onChange={handleFormChange('title')}
              placeholder="e.g., Frontend Developer Assessment"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={form.description}
              onChange={handleFormChange('description')}
              placeholder="Describe what this assessment tests..."
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Programming Language</InputLabel>
              <Select
                value={form.language}
                onChange={handleFormChange('language')}
                label="Programming Language"
              >
                <MenuItem value="JavaScript">JavaScript</MenuItem>
                <MenuItem value="TypeScript">TypeScript</MenuItem>
                <MenuItem value="Python">Python</MenuItem>
                <MenuItem value="Java">Java</MenuItem>
                <MenuItem value="Go">Go</MenuItem>
                <MenuItem value="Rust">Rust</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={form.difficulty}
                onChange={handleFormChange('difficulty')}
                label="Difficulty Level"
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Estimated Time (minutes)"
              value={form.estimatedTime}
              onChange={handleFormChange('estimatedTime')}
              inputProps={{ min: 5, max: 180 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Instructions"
              value={form.instructions}
              onChange={handleFormChange('instructions')}
              placeholder="Provide detailed instructions for candidates..."
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderQuestions = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Questions ({form.questions.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowQuestionDialog(true)}
          >
            Add Question
          </Button>
        </Box>

        {form.questions.length === 0 ? (
          <Alert severity="info">
            No questions added yet. Click "Add Question" to get started.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {form.questions.map((question, index) => (
              <Card key={question.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                      {getQuestionIcon(question.type)}
                      <Typography variant="subtitle1">
                        Question {index + 1}
                      </Typography>
                      <Chip 
                        label={question.type.replace('_', ' ')} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={`${question.points} pts`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleEditQuestion(question)}>
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {question.question}
                  </Typography>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <Box sx={{ ml: 2 }}>
                      {question.options.map((option, i) => (
                        <Typography key={i} variant="body2" color="text.secondary">
                          {String.fromCharCode(65 + i)}. {option}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                  {question.type === 'coding' && question.code && (
                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.100' }}>
                      <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                        {question.code}
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <Alert severity="success" sx={{ mt: 2 }}>
              Total Points: {totalPoints}
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Assessment Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Passing Score (%)"
              value={form.passingScore}
              onChange={handleFormChange('passingScore')}
              inputProps={{ min: 0, max: 100 }}
              helperText="Minimum score required to pass"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Make assessment active immediately"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderReview = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Review Assessment
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Title</Typography>
            <Typography variant="body1">{form.title}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Description</Typography>
            <Typography variant="body1">{form.description}</Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Language</Typography>
            <Typography variant="body1">{form.language}</Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Difficulty</Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {form.difficulty}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Questions</Typography>
            <Typography variant="body1">{form.questions.length}</Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Total Points</Typography>
            <Typography variant="body1">{totalPoints}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderBasicInfo();
      case 1: return renderQuestions();
      case 2: return renderSettings();
      case 3: return renderReview();
      default: return renderBasicInfo();
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/company')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            Create Assessment
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'Creating...' : 'Create Assessment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>

        {/* Question Dialog */}
        <Dialog 
          open={showQuestionDialog} 
          onClose={() => setShowQuestionDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingQuestion ? 'Edit Question' : 'Add Question'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion(prev => ({ 
                    ...prev, 
                    type: e.target.value as any 
                  }))}
                  label="Question Type"
                >
                  <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                  <MenuItem value="coding">Coding</MenuItem>
                  <MenuItem value="short_answer">Short Answer</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Question"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ 
                  ...prev, 
                  question: e.target.value 
                }))}
                sx={{ mb: 3 }}
              />

              {newQuestion.type === 'multiple_choice' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Answer Options
                  </Typography>
                  {newQuestion.options?.map((option, index) => (
                    <TextField
                      key={index}
                      fullWidth
                      label={`Option ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(newQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setNewQuestion(prev => ({ ...prev, options: newOptions }));
                      }}
                      sx={{ mb: 2 }}
                    />
                  ))}
                </Box>
              )}

              {newQuestion.type === 'coding' && (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Code Template"
                  value={newQuestion.code}
                  onChange={(e) => setNewQuestion(prev => ({ 
                    ...prev, 
                    code: e.target.value 
                  }))}
                  placeholder="function solutionName() {\n  // Your code here\n}"
                  sx={{ mb: 3, fontFamily: 'monospace' }}
                />
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Points"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion(prev => ({ 
                      ...prev, 
                      points: parseInt(e.target.value) || 0 
                    }))}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Time Limit (minutes)"
                    value={newQuestion.timeLimit}
                    onChange={(e) => setNewQuestion(prev => ({ 
                      ...prev, 
                      timeLimit: parseInt(e.target.value) || 0 
                    }))}
                    inputProps={{ min: 1, max: 60 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQuestionDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
            >
              {editingQuestion ? 'Update' : 'Add'} Question
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CreateAssessmentPage;