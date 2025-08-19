// Analytics and Results Dashboard Types

export interface CandidateResult {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  assessmentId: string;
  assessmentTitle: string;
  companyId: string;
  companyName: string;
  positionId: string;
  positionTitle: string;
  startedAt: Date;
  completedAt: Date;
  status: 'in_progress' | 'completed' | 'abandoned' | 'timeout';
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  skills: string[];
  questionResults: QuestionResult[];
  evaluation: AssessmentEvaluation;
  proctoring?: ProctoringData;
}

export interface QuestionResult {
  id: string;
  questionId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'coding' | 'short_answer' | 'essay';
  userAnswer: any;
  correctAnswer?: any;
  isCorrect: boolean;
  partialCredit: number; // 0-1
  points: number;
  maxPoints: number;
  timeSpent: number; // in seconds
  feedback: string;
  codeMetrics?: CodeMetrics;
}

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  testCasesPassed: number;
  totalTestCases: number;
  executionTime: number;
  memoryUsage: number;
  codeQuality: {
    readability: number;
    maintainability: number;
    efficiency: number;
  };
}

export interface AssessmentEvaluation {
  overallScore: number;
  skillBreakdown: Record<string, number>;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'needs_review';
  confidenceScore: number;
}

export interface ProctoringData {
  violations: ProctoringViolation[];
  riskScore: number;
  screenRecording?: string;
  audioRecording?: string;
  keystrokePattern: any[];
  cameraFrames: number;
  suspiciousActivity: boolean;
}

export interface ProctoringViolation {
  type: 'face_not_detected' | 'multiple_faces' | 'tab_switch' | 'copy_paste' | 'suspicious_behavior';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  duration?: number;
}

// Analytics Types
export interface AssessmentAnalytics {
  assessmentId: string;
  assessmentTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  medianScore: number;
  scoreDistribution: ScoreDistribution;
  timeAnalytics: TimeAnalytics;
  questionAnalytics: QuestionAnalytics[];
  difficultyAnalytics: DifficultyAnalytics;
  skillsAnalytics: SkillAnalytics[];
  completionRate: number;
  passRate: number;
  passThreshold: number;
}

export interface ScoreDistribution {
  ranges: {
    '0-20': number;
    '21-40': number;
    '41-60': number;
    '61-80': number;
    '81-100': number;
  };
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
}

export interface TimeAnalytics {
  averageTimeSpent: number; // minutes
  medianTimeSpent: number;
  minTimeSpent: number;
  maxTimeSpent: number;
  timeDistribution: {
    '0-10min': number;
    '11-20min': number;
    '21-30min': number;
    '31-45min': number;
    '46-60min': number;
    '60+min': number;
  };
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  type: string;
  difficulty: string;
  correctAnswers: number;
  totalAttempts: number;
  successRate: number;
  averageTimeSpent: number;
  commonMistakes: string[];
  discriminationIndex: number; // measures how well question differentiates between high/low performers
}

export interface DifficultyAnalytics {
  easy: {
    attempts: number;
    averageScore: number;
    passRate: number;
  };
  medium: {
    attempts: number;
    averageScore: number;
    passRate: number;
  };
  hard: {
    attempts: number;
    averageScore: number;
    passRate: number;
  };
}

export interface SkillAnalytics {
  skill: string;
  averageScore: number;
  totalQuestions: number;
  strongCandidates: number;
  weakCandidates: number;
  improvementTrend: number; // -1 to 1, trending down/up
}

// Company Analytics
export interface CompanyAnalytics {
  companyId: string;
  companyName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  overview: CompanyOverview;
  assessmentPerformance: CompanyAssessmentPerformance[];
  candidateAnalytics: CompanyCandidateAnalytics;
  hiringFunnel: HiringFunnelAnalytics;
  trends: TrendAnalytics;
}

export interface CompanyOverview {
  totalAssessments: number;
  totalCandidates: number;
  completedAssessments: number;
  averageScore: number;
  hiringRate: number;
  timeToComplete: number;
  topSkills: string[];
  bottomSkills: string[];
}

export interface CompanyAssessmentPerformance {
  assessmentId: string;
  assessmentTitle: string;
  attempts: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
  averageTime: number;
  difficulty: string;
  lastUsed: Date;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export interface CompanyCandidateAnalytics {
  totalCandidates: number;
  candidatesBySource: Record<string, number>;
  candidatesByLevel: Record<string, number>;
  performanceDistribution: {
    topPerformers: number; // 90-100%
    strongPerformers: number; // 70-89%
    averagePerformers: number; // 50-69%
    poorPerformers: number; // <50%
  };
  retakeRate: number;
  dropoutRate: number;
}

export interface HiringFunnelAnalytics {
  stages: {
    invited: number;
    started: number;
    completed: number;
    passed: number;
    hired: number;
  };
  conversionRates: {
    inviteToStart: number;
    startToComplete: number;
    completeToPass: number;
    passToHire: number;
    overallConversion: number;
  };
  averageTimePerStage: {
    inviteToStart: number; // days
    startToComplete: number; // hours
    completeToDecision: number; // days
  };
}

export interface TrendAnalytics {
  scoresTrend: DataPoint[];
  volumeTrend: DataPoint[];
  completionRateTrend: DataPoint[];
  skillsTrend: SkillTrend[];
}

export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface SkillTrend {
  skill: string;
  data: DataPoint[];
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

// Report Generation Types
export interface ReportConfig {
  type: 'candidate' | 'assessment' | 'company' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: string;
  includeCharts: boolean;
  includeDetailedBreakdown: boolean;
  includeProctoringData: boolean;
  includeRecommendations: boolean;
  customSections?: ReportSection[];
  branding?: {
    logo?: string;
    companyName?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'text' | 'summary';
  data: any;
  config?: any;
}

export interface GeneratedReport {
  id: string;
  type: string;
  format: string;
  filename: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  downloadUrl: string;
  status: 'generating' | 'ready' | 'failed';
  error?: string;
}

// Dashboard Configuration
export interface DashboardConfig {
  userId: string;
  dashboardType: 'candidate' | 'company' | 'admin';
  widgets: DashboardWidget[];
  layout: {
    cols: number;
    breakpoints: Record<string, number>;
  };
  refreshInterval: number; // in seconds
  dateRange: {
    start: Date;
    end: Date;
    preset?: 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'custom';
  };
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'progress' | 'heatmap';
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  dataSource: string;
  config: any;
  filters?: any;
  visible: boolean;
}

// Real-time Updates
export interface RealTimeUpdate {
  type: 'assessment_completed' | 'assessment_started' | 'score_calculated' | 'violation_detected';
  timestamp: Date;
  data: any;
  affectedEntities: string[]; // IDs that should refresh their data
}

export interface ProgressTracking {
  entityId: string; // assessment or candidate ID
  entityType: 'assessment' | 'candidate';
  progress: number; // 0-100
  currentStage: string;
  estimatedCompletion?: Date;
  realTimeStats: {
    questionsAnswered: number;
    totalQuestions: number;
    timeElapsed: number;
    averageTimePerQuestion: number;
  };
}