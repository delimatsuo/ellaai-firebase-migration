import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  styled,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  DragIndicator,
  Preview,
  Save,
  Publish,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { colors } from '../../theme/theme';
import GlassCard from '../ui/GlassCard';
import { AssessmentProctoringSettings } from './AssessmentProctoringSettings';

interface Question {
  id: string;
  type: 'multiple_choice' | 'coding' | 'essay' | 'true_false';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

interface AssessmentData {
  basic: {
    title: string;
    description: string;
    instructions: string;
    duration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'technical' | 'behavioral' | 'cognitive' | 'mixed';
    passingScore: number;
    tags: string[];
  };
  questions: Question[];
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowBackNavigation: boolean;
    showResults: boolean;
    showCorrectAnswers: boolean;
    preventCheating: boolean;
    recordScreen: boolean;
    requireWebcam: boolean;
    timePerQuestion: boolean;
    autoSubmit: boolean;
  };
}

interface AssessmentWizardProps {
  onSave: (data: AssessmentData) => void;
  onPublish: (data: AssessmentData) => void;
  initialData?: Partial<AssessmentData>;
}

const steps = [
  { label: 'Basic Information', description: 'Assessment details and metadata' },
  { label: 'Questions', description: 'Add and configure questions' },
  { label: 'Settings', description: 'Configure assessment behavior' },
  { label: 'Preview & Publish', description: 'Review and publish assessment' },
];

const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    '& .MuiStepLabel-label': {
      fontSize: '0.9rem',
      fontWeight: 500,
      '&.Mui-active': {
        fontWeight: 600,
        color: theme.palette.primary.main,
      },
      '&.Mui-completed': {
        fontWeight: 500,
        color: theme.palette.success.main,
      },
    },
  },
  '& .MuiStepIcon-root': {
    '&.Mui-active': {
      background: colors.gradient.primary,
      color: 'white',
    },
    '&.Mui-completed': {
      backgroundColor: theme.palette.success.main,
    },
  },
}));

const QuestionCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#ffffff', 0.3)}`,
  borderRadius: 16,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  cursor: 'move',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  onSave,
  onPublish,
  initialData,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    basic: {
      title: '',
      description: '',
      instructions: '',
      duration: 60,
      difficulty: 'medium',
      type: 'technical',
      passingScore: 70,
      tags: [],
    },
    questions: [],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: true,
      allowBackNavigation: true,
      showResults: true,
      showCorrectAnswers: false,
      preventCheating: true,
      recordScreen: false,
      requireWebcam: false,
      timePerQuestion: false,
      autoSubmit: true,
    },
    ...initialData,
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleBasicDataChange = (field: keyof AssessmentData['basic'], value: any) => {
    setAssessmentData(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        [field]: value,
      },
    }));
  };

  const renderBasicInformation = () => (
    <GlassCard variant="light" animate={false}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Assessment Basic Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Assessment Title"
              value={assessmentData.basic.title}
              onChange={(e) => handleBasicDataChange('title', e.target.value)}
              placeholder="Enter a descriptive title for your assessment"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Assessment Type</InputLabel>
              <Select
                value={assessmentData.basic.type}
                onChange={(e) => handleBasicDataChange('type', e.target.value)}
                label="Assessment Type"
              >
                <MenuItem value="technical">Technical Skills</MenuItem>
                <MenuItem value="behavioral">Behavioral</MenuItem>
                <MenuItem value="cognitive">Cognitive Ability</MenuItem>
                <MenuItem value="mixed">Mixed Assessment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={assessmentData.basic.difficulty}
                onChange={(e) => handleBasicDataChange('difficulty', e.target.value)}
                label="Difficulty Level"
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Duration (minutes): {assessmentData.basic.duration}
            </Typography>
            <Slider
              value={assessmentData.basic.duration}
              onChange={(_, value) => handleBasicDataChange('duration', value)}
              min={15}
              max={180}
              step={15}
              marks={[
                { value: 15, label: '15m' },
                { value: 60, label: '1h' },
                { value: 120, label: '2h' },
                { value: 180, label: '3h' },
              ]}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Passing Score (%): {assessmentData.basic.passingScore}
            </Typography>
            <Slider
              value={assessmentData.basic.passingScore}
              onChange={(_, value) => handleBasicDataChange('passingScore', value)}
              min={30}
              max={100}
              step={5}
            />
          </Grid>
        </Grid>
      </Box>
    </GlassCard>
  );

  const renderQuestions = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Assessment Questions ({assessmentData.questions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {}}
          sx={{ borderRadius: 3 }}
        >
          Add Question
        </Button>
      </Box>
      
      {assessmentData.questions.length === 0 && (
        <GlassCard variant="light" animate={false}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No questions added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start building your assessment by adding your first question
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {}}
              size="large"
            >
              Add Your First Question
            </Button>
          </Box>
        </GlassCard>
      )}
    </Box>
  );

  const handleProctoringSettingsChange = (field: string, value: boolean) => {
    setAssessmentData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const renderSettings = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <GlassCard variant="light" animate={false}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Assessment Behavior Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assessmentData.settings.shuffleQuestions}
                    onChange={(e) => setAssessmentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, shuffleQuestions: e.target.checked }
                    }))}
                  />
                }
                label="Shuffle Questions"
              />
              <Typography variant="body2" color="text.secondary">
                Randomize question order for each candidate
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assessmentData.settings.shuffleOptions}
                    onChange={(e) => setAssessmentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, shuffleOptions: e.target.checked }
                    }))}
                  />
                }
                label="Shuffle Answer Options"
              />
              <Typography variant="body2" color="text.secondary">
                Randomize multiple choice answer order
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assessmentData.settings.allowBackNavigation}
                    onChange={(e) => setAssessmentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowBackNavigation: e.target.checked }
                    }))}
                  />
                }
                label="Allow Back Navigation"
              />
              <Typography variant="body2" color="text.secondary">
                Let candidates go back to previous questions
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assessmentData.settings.showResults}
                    onChange={(e) => setAssessmentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, showResults: e.target.checked }
                    }))}
                  />
                }
                label="Show Results to Candidate"
              />
              <Typography variant="body2" color="text.secondary">
                Display score immediately after completion
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assessmentData.settings.autoSubmit}
                    onChange={(e) => setAssessmentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, autoSubmit: e.target.checked }
                    }))}
                  />
                }
                label="Auto-Submit on Time Limit"
              />
              <Typography variant="body2" color="text.secondary">
                Automatically submit when time runs out
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </GlassCard>

      <GlassCard variant="light" animate={false}>
        <Box sx={{ p: 4 }}>
          <AssessmentProctoringSettings
            settings={{
              preventCheating: assessmentData.settings.preventCheating,
              recordScreen: assessmentData.settings.recordScreen,
              requireWebcam: assessmentData.settings.requireWebcam,
            }}
            onChange={handleProctoringSettingsChange}
          />
        </Box>
      </GlassCard>
    </Box>
  );

  const renderPreview = () => (
    <GlassCard variant="light" animate={false}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Assessment Preview
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Basic Information
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Title:</strong> {assessmentData.basic.title || 'Untitled Assessment'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Type:</strong> {assessmentData.basic.type}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Difficulty:</strong> {assessmentData.basic.difficulty}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Duration:</strong> {assessmentData.basic.duration} minutes
              </Typography>
              <Typography variant="body2">
                <strong>Questions:</strong> {assessmentData.questions.length}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </GlassCard>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderQuestions();
      case 2:
        return renderSettings();
      case 3:
        return renderPreview();
      default:
        return null;
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return assessmentData.basic.title.trim().length > 0;
      case 1:
        return assessmentData.questions.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Create Assessment
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Build a comprehensive assessment with our step-by-step wizard
        </Typography>
        
        <StyledStepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </StepLabel>
            </Step>
          ))}
        </StyledStepper>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {getStepContent(activeStep)}
          </motion.div>
        </AnimatePresence>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            size="large"
          >
            Back
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => onSave(assessmentData)}
              variant="outlined"
              startIcon={<Save />}
              size="large"
            >
              Save Draft
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={() => onPublish(assessmentData)}
                variant="contained"
                startIcon={<Publish />}
                size="large"
                disabled={!isStepValid(activeStep)}
              >
                Publish Assessment
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                size="large"
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default AssessmentWizard;
export type { AssessmentData, Question };