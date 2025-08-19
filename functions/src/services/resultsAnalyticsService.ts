import * as admin from 'firebase-admin';
import { AppError, NotFoundError } from '../utils/errors';

interface AnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  companyId?: string;
  candidateId?: string;
  assessmentId?: string;
  status?: string;
  difficulty?: string;
  includeInProgress?: boolean;
  limit?: number;
  offset?: number;
}

interface CandidateResult {
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
  timeSpent: number;
  difficulty: 'easy' | 'medium' | 'hard';
  skills: string[];
  questionResults: QuestionResult[];
  evaluation: AssessmentEvaluation;
  proctoring?: ProctoringData;
}

interface QuestionResult {
  id: string;
  questionId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'coding' | 'short_answer' | 'essay';
  userAnswer: any;
  correctAnswer?: any;
  isCorrect: boolean;
  partialCredit: number;
  points: number;
  maxPoints: number;
  timeSpent: number;
  feedback: string;
  codeMetrics?: CodeMetrics;
}

interface CodeMetrics {
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

interface AssessmentEvaluation {
  overallScore: number;
  skillBreakdown: Record<string, number>;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'needs_review';
  confidenceScore: number;
}

interface ProctoringData {
  violations: ProctoringViolation[];
  riskScore: number;
  screenRecording?: string;
  audioRecording?: string;
  keystrokePattern: any[];
  cameraFrames: number;
  suspiciousActivity: boolean;
}

interface ProctoringViolation {
  type: 'face_not_detected' | 'multiple_faces' | 'tab_switch' | 'copy_paste' | 'suspicious_behavior';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  duration?: number;
}

interface AssessmentAnalytics {
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

interface ScoreDistribution {
  ranges: Record<string, number>;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
}

interface TimeAnalytics {
  averageTimeSpent: number;
  medianTimeSpent: number;
  minTimeSpent: number;
  maxTimeSpent: number;
  timeDistribution: Record<string, number>;
}

interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  type: string;
  difficulty: string;
  correctAnswers: number;
  totalAttempts: number;
  successRate: number;
  averageTimeSpent: number;
  commonMistakes: string[];
  discriminationIndex: number;
}

interface DifficultyAnalytics {
  easy: DifficultyStats;
  medium: DifficultyStats;
  hard: DifficultyStats;
}

interface DifficultyStats {
  attempts: number;
  averageScore: number;
  passRate: number;
}

interface SkillAnalytics {
  skill: string;
  averageScore: number;
  totalQuestions: number;
  strongCandidates: number;
  weakCandidates: number;
  improvementTrend: number;
}

export class ResultsAnalyticsService {
  private db = admin.firestore();

  // Get candidate results with analytics
  async getCandidateResults(query: AnalyticsQuery): Promise<{
    results: CandidateResult[];
    total: number;
    analytics: {
      averageScore: number;
      completionRate: number;
      totalTime: number;
    };
  }> {
    try {
      let firestoreQuery = this.db.collection('assessment-attempts') as admin.firestore.Query;

      // Apply filters
      if (query.candidateId) {
        firestoreQuery = firestoreQuery.where('candidateId', '==', query.candidateId);
      }

      if (query.companyId) {
        firestoreQuery = firestoreQuery.where('companyId', '==', query.companyId);
      }

      if (query.assessmentId) {
        firestoreQuery = firestoreQuery.where('assessmentId', '==', query.assessmentId);
      }

      if (query.status && query.status !== 'all') {
        firestoreQuery = firestoreQuery.where('status', '==', query.status);
      }

      if (query.startDate) {
        firestoreQuery = firestoreQuery.where('completedAt', '>=', query.startDate);
      }

      if (query.endDate) {
        firestoreQuery = firestoreQuery.where('completedAt', '<=', query.endDate);
      }

      // Order and paginate
      firestoreQuery = firestoreQuery.orderBy('completedAt', 'desc');

      if (query.limit) {
        firestoreQuery = firestoreQuery.limit(query.limit);
      }

      if (query.offset) {
        firestoreQuery = firestoreQuery.offset(query.offset);
      }

      const snapshot = await firestoreQuery.get();
      const attempts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Enrich with related data
      const results = await this.enrichCandidateResults(attempts);

      // Calculate analytics
      const analytics = this.calculateResultsAnalytics(results);

      // Get total count (without pagination)
      const totalQuery = this.db.collection('assessment-attempts');
      const totalSnapshot = await totalQuery.get();

      return {
        results,
        total: totalSnapshot.size,
        analytics
      };

    } catch (error) {
      console.error('Error fetching candidate results:', error);
      throw new AppError('Failed to fetch candidate results', 500);
    }
  }

  // Get detailed candidate result
  async getCandidateResultDetail(resultId: string): Promise<CandidateResult> {
    try {
      const doc = await this.db.collection('assessment-attempts').doc(resultId).get();

      if (!doc.exists) {
        throw new NotFoundError('Assessment result not found');
      }

      const attemptData = { id: doc.id, ...doc.data() };
      const enrichedResults = await this.enrichCandidateResults([attemptData]);

      return enrichedResults[0];

    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error fetching candidate result detail:', error);
      throw new AppError('Failed to fetch candidate result detail', 500);
    }
  }

  // Get assessment analytics
  async getAssessmentAnalytics(
    assessmentId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      includeQuestionBreakdown?: boolean;
      includeSkillAnalysis?: boolean;
    } = {}
  ): Promise<AssessmentAnalytics> {
    try {
      let query = this.db.collection('assessment-attempts')
        .where('assessmentId', '==', assessmentId) as admin.firestore.Query;

      if (options.startDate) {
        query = query.where('completedAt', '>=', options.startDate);
      }

      if (options.endDate) {
        query = query.where('completedAt', '<=', options.endDate);
      }

      const [attempts, assessment] = await Promise.all([
        query.get(),
        this.db.collection('assessments').doc(assessmentId).get()
      ]);

      if (!assessment.exists) {
        throw new NotFoundError('Assessment not found');
      }

      const assessmentData = assessment.data()!;
      const attemptData = attempts.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedAttempts = attemptData.filter(a => a.status === 'completed');

      const analytics: AssessmentAnalytics = {
        assessmentId,
        assessmentTitle: assessmentData.title,
        totalAttempts: attemptData.length,
        completedAttempts: completedAttempts.length,
        averageScore: this.calculateAverageScore(completedAttempts),
        medianScore: this.calculateMedianScore(completedAttempts),
        scoreDistribution: this.calculateScoreDistribution(completedAttempts),
        timeAnalytics: this.calculateTimeAnalytics(completedAttempts),
        questionAnalytics: [],
        difficultyAnalytics: this.calculateDifficultyAnalytics(completedAttempts),
        skillsAnalytics: [],
        completionRate: attemptData.length > 0 ? (completedAttempts.length / attemptData.length) * 100 : 0,
        passRate: this.calculatePassRate(completedAttempts),
        passThreshold: 70 // Default pass threshold
      };

      if (options.includeQuestionBreakdown) {
        analytics.questionAnalytics = await this.calculateQuestionAnalytics(assessmentId, completedAttempts);
      }

      if (options.includeSkillAnalysis) {
        analytics.skillsAnalytics = await this.calculateSkillAnalytics(assessmentId, completedAttempts);
      }

      return analytics;

    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error calculating assessment analytics:', error);
      throw new AppError('Failed to calculate assessment analytics', 500);
    }
  }

  // Get company analytics
  async getCompanyAnalytics(
    companyId: string,
    options: {
      startDate: Date;
      endDate: Date;
      includeTeamBreakdown?: boolean;
      includeSkillAnalysis?: boolean;
      includeTrends?: boolean;
    }
  ): Promise<any> {
    try {
      const query = this.db.collection('assessment-attempts')
        .where('companyId', '==', companyId)
        .where('completedAt', '>=', options.startDate)
        .where('completedAt', '<=', options.endDate);

      const snapshot = await query.get();
      const attempts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedAttempts = attempts.filter(a => a.status === 'completed');

      // Get company data
      const companyDoc = await this.db.collection('companies').doc(companyId).get();
      const companyData = companyDoc.data()!;

      const analytics = {
        companyId,
        companyName: companyData.name,
        period: {
          startDate: options.startDate,
          endDate: options.endDate
        },
        overview: {
          totalAssessments: new Set(attempts.map(a => a.assessmentId)).size,
          totalCandidates: new Set(attempts.map(a => a.candidateId)).size,
          completedAssessments: completedAttempts.length,
          averageScore: this.calculateAverageScore(completedAttempts),
          hiringRate: this.calculateHiringRate(completedAttempts),
          timeToComplete: this.calculateAverageTimeToComplete(completedAttempts),
          topSkills: await this.getTopSkills(completedAttempts),
          bottomSkills: await this.getBottomSkills(completedAttempts)
        },
        assessmentPerformance: await this.getAssessmentPerformance(companyId, attempts),
        candidateAnalytics: this.calculateCandidateAnalytics(attempts),
        hiringFunnel: await this.calculateHiringFunnel(companyId, options.startDate, options.endDate),
        trends: options.includeTrends ? await this.calculateTrends(companyId, options.startDate, options.endDate) : null
      };

      return analytics;

    } catch (error) {
      console.error('Error calculating company analytics:', error);
      throw new AppError('Failed to calculate company analytics', 500);
    }
  }

  // Private helper methods

  private async enrichCandidateResults(attempts: any[]): Promise<CandidateResult[]> {
    const results: CandidateResult[] = [];

    for (const attempt of attempts) {
      try {
        // Get related data
        const [assessment, candidate, company] = await Promise.all([
          this.db.collection('assessments').doc(attempt.assessmentId).get(),
          this.db.collection('users').doc(attempt.candidateId).get(),
          attempt.companyId ? this.db.collection('companies').doc(attempt.companyId).get() : null
        ]);

        const assessmentData = assessment.data() || {};
        const candidateData = candidate.data() || {};
        const companyData = company?.data() || {};

        // Get question results if they exist
        const questionResults = await this.getQuestionResults(attempt.id);

        // Generate evaluation if not exists
        const evaluation = attempt.evaluation || this.generateMockEvaluation(attempt);

        const result: CandidateResult = {
          id: attempt.id,
          candidateId: attempt.candidateId,
          candidateName: candidateData.displayName || candidateData.email || 'Unknown',
          candidateEmail: candidateData.email || 'unknown@example.com',
          assessmentId: attempt.assessmentId,
          assessmentTitle: assessmentData.title || 'Unknown Assessment',
          companyId: attempt.companyId || '',
          companyName: companyData.name || 'Unknown Company',
          positionId: assessmentData.positionId || '',
          positionTitle: assessmentData.positionTitle || 'Unknown Position',
          startedAt: attempt.startedAt?.toDate() || new Date(),
          completedAt: attempt.completedAt?.toDate() || new Date(),
          status: attempt.status,
          totalScore: attempt.score || 0,
          maxScore: assessmentData.maxScore || 100,
          percentage: attempt.score ? Math.round((attempt.score / (assessmentData.maxScore || 100)) * 100) : 0,
          timeSpent: attempt.timeSpent || 0,
          difficulty: assessmentData.difficulty || 'medium',
          skills: assessmentData.skills || [],
          questionResults,
          evaluation,
          proctoring: attempt.proctoring
        };

        results.push(result);
      } catch (error) {
        console.error('Error enriching result:', attempt.id, error);
        // Continue with other results even if one fails
      }
    }

    return results;
  }

  private async getQuestionResults(attemptId: string): Promise<QuestionResult[]> {
    try {
      const snapshot = await this.db.collection('question-results')
        .where('attemptId', '==', attemptId)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          questionId: data.questionId,
          questionText: data.questionText || 'Question text not available',
          questionType: data.questionType || 'unknown',
          userAnswer: data.userAnswer,
          correctAnswer: data.correctAnswer,
          isCorrect: data.isCorrect || false,
          partialCredit: data.partialCredit || 0,
          points: data.points || 0,
          maxPoints: data.maxPoints || 10,
          timeSpent: data.timeSpent || 0,
          feedback: data.feedback || 'No feedback available',
          codeMetrics: data.codeMetrics
        };
      });
    } catch (error) {
      console.error('Error fetching question results:', error);
      return [];
    }
  }

  private generateMockEvaluation(attempt: any): AssessmentEvaluation {
    const score = attempt.score || 0;
    
    return {
      overallScore: score,
      skillBreakdown: {
        'Problem Solving': Math.min(100, score + Math.random() * 20 - 10),
        'Code Quality': Math.min(100, score + Math.random() * 15 - 7.5),
        'Algorithm Knowledge': Math.min(100, score + Math.random() * 25 - 12.5),
        'Communication': Math.min(100, score + Math.random() * 10 - 5)
      },
      strengths: score > 70 ? [
        'Strong problem-solving approach',
        'Clean and readable code',
        'Good understanding of algorithms'
      ] : [
        'Shows basic understanding',
        'Attempts logical solutions'
      ],
      improvements: score < 80 ? [
        'Practice more complex algorithms',
        'Improve code efficiency',
        'Work on edge case handling'
      ] : [
        'Continue practicing advanced concepts'
      ],
      overallFeedback: score > 80 ? 
        'Excellent performance with strong technical skills and problem-solving abilities.' :
        score > 60 ?
        'Good foundation with room for improvement in certain areas.' :
        'Shows potential but needs more practice with fundamental concepts.',
      recommendation: score > 85 ? 'strong_hire' :
                     score > 70 ? 'hire' :
                     score > 50 ? 'needs_review' : 'no_hire',
      confidenceScore: Math.min(0.95, 0.6 + (score / 100) * 0.3)
    };
  }

  private calculateResultsAnalytics(results: CandidateResult[]): {
    averageScore: number;
    completionRate: number;
    totalTime: number;
  } {
    if (results.length === 0) {
      return { averageScore: 0, completionRate: 0, totalTime: 0 };
    }

    const completedResults = results.filter(r => r.status === 'completed');
    const totalScore = completedResults.reduce((sum, r) => sum + r.percentage, 0);
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);

    return {
      averageScore: completedResults.length > 0 ? totalScore / completedResults.length : 0,
      completionRate: (completedResults.length / results.length) * 100,
      totalTime: totalTime / results.length
    };
  }

  private calculateAverageScore(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    return totalScore / attempts.length;
  }

  private calculateMedianScore(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    const scores = attempts.map(a => a.score || 0).sort((a, b) => a - b);
    const mid = Math.floor(scores.length / 2);
    return scores.length % 2 !== 0 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
  }

  private calculateScoreDistribution(attempts: any[]): ScoreDistribution {
    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    attempts.forEach(attempt => {
      const score = attempt.score || 0;
      if (score <= 20) ranges['0-20']++;
      else if (score <= 40) ranges['21-40']++;
      else if (score <= 60) ranges['41-60']++;
      else if (score <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    });

    const scores = attempts.map(a => a.score || 0).sort((a, b) => a - b);
    
    return {
      ranges,
      percentiles: {
        p25: this.calculatePercentile(scores, 0.25),
        p50: this.calculatePercentile(scores, 0.50),
        p75: this.calculatePercentile(scores, 0.75),
        p90: this.calculatePercentile(scores, 0.90),
        p95: this.calculatePercentile(scores, 0.95)
      }
    };
  }

  private calculatePercentile(scores: number[], percentile: number): number {
    if (scores.length === 0) return 0;
    const index = Math.ceil(percentile * scores.length) - 1;
    return scores[Math.max(0, index)];
  }

  private calculateTimeAnalytics(attempts: any[]): TimeAnalytics {
    if (attempts.length === 0) {
      return {
        averageTimeSpent: 0,
        medianTimeSpent: 0,
        minTimeSpent: 0,
        maxTimeSpent: 0,
        timeDistribution: {}
      };
    }

    const times = attempts.map(a => a.timeSpent || 0);
    const sortedTimes = [...times].sort((a, b) => a - b);
    
    const distribution = {
      '0-10min': 0,
      '11-20min': 0,
      '21-30min': 0,
      '31-45min': 0,
      '46-60min': 0,
      '60+min': 0
    };

    times.forEach(time => {
      const minutes = time / 60;
      if (minutes <= 10) distribution['0-10min']++;
      else if (minutes <= 20) distribution['11-20min']++;
      else if (minutes <= 30) distribution['21-30min']++;
      else if (minutes <= 45) distribution['31-45min']++;
      else if (minutes <= 60) distribution['46-60min']++;
      else distribution['60+min']++;
    });

    return {
      averageTimeSpent: times.reduce((sum, time) => sum + time, 0) / times.length / 60, // in minutes
      medianTimeSpent: sortedTimes[Math.floor(sortedTimes.length / 2)] / 60, // in minutes
      minTimeSpent: Math.min(...times) / 60, // in minutes
      maxTimeSpent: Math.max(...times) / 60, // in minutes
      timeDistribution: distribution
    };
  }

  private calculateDifficultyAnalytics(attempts: any[]): DifficultyAnalytics {
    const difficulties = { easy: [], medium: [], hard: [] } as any;
    
    attempts.forEach(attempt => {
      const difficulty = attempt.difficulty || 'medium';
      if (difficulties[difficulty]) {
        difficulties[difficulty].push(attempt);
      }
    });

    const calculateStats = (attemptsForDifficulty: any[]): DifficultyStats => {
      if (attemptsForDifficulty.length === 0) {
        return { attempts: 0, averageScore: 0, passRate: 0 };
      }

      const averageScore = this.calculateAverageScore(attemptsForDifficulty);
      const passRate = (attemptsForDifficulty.filter(a => (a.score || 0) >= 70).length / attemptsForDifficulty.length) * 100;

      return {
        attempts: attemptsForDifficulty.length,
        averageScore,
        passRate
      };
    };

    return {
      easy: calculateStats(difficulties.easy || []),
      medium: calculateStats(difficulties.medium || []),
      hard: calculateStats(difficulties.hard || [])
    };
  }

  private calculatePassRate(attempts: any[], threshold: number = 70): number {
    if (attempts.length === 0) return 0;
    const passed = attempts.filter(a => (a.score || 0) >= threshold).length;
    return (passed / attempts.length) * 100;
  }

  private async calculateQuestionAnalytics(assessmentId: string, attempts: any[]): Promise<QuestionAnalytics[]> {
    // This would require more complex analysis of question-level data
    // For now, return empty array - implementation would depend on data structure
    return [];
  }

  private async calculateSkillAnalytics(assessmentId: string, attempts: any[]): Promise<SkillAnalytics[]> {
    // This would require skill-level analysis
    // For now, return empty array - implementation would depend on data structure
    return [];
  }

  private calculateHiringRate(attempts: any[]): number {
    // This would require hiring decision data
    // For now, estimate based on high scores
    if (attempts.length === 0) return 0;
    const highScorers = attempts.filter(a => (a.score || 0) >= 85).length;
    return (highScorers / attempts.length) * 100;
  }

  private calculateAverageTimeToComplete(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    return totalTime / attempts.length / 60; // in minutes
  }

  private async getTopSkills(attempts: any[]): Promise<string[]> {
    // Mock implementation
    return ['JavaScript', 'Problem Solving', 'Algorithms', 'Data Structures', 'System Design'];
  }

  private async getBottomSkills(attempts: any[]): Promise<string[]> {
    // Mock implementation
    return ['Advanced Math', 'Machine Learning', 'Cryptography'];
  }

  private async getAssessmentPerformance(companyId: string, attempts: any[]): Promise<any[]> {
    // Group by assessment and calculate performance metrics
    const assessmentMap = new Map();
    
    attempts.forEach(attempt => {
      if (!assessmentMap.has(attempt.assessmentId)) {
        assessmentMap.set(attempt.assessmentId, []);
      }
      assessmentMap.get(attempt.assessmentId).push(attempt);
    });

    const performance = [];
    for (const [assessmentId, assessmentAttempts] of assessmentMap) {
      const completedAttempts = assessmentAttempts.filter((a: any) => a.status === 'completed');
      
      performance.push({
        assessmentId,
        assessmentTitle: 'Assessment Title', // Would fetch from assessment collection
        attempts: assessmentAttempts.length,
        completionRate: (completedAttempts.length / assessmentAttempts.length) * 100,
        averageScore: this.calculateAverageScore(completedAttempts),
        passRate: this.calculatePassRate(completedAttempts),
        averageTime: this.calculateAverageTimeToComplete(completedAttempts),
        difficulty: 'medium', // Would fetch from assessment
        lastUsed: new Date(),
        performance: 'good'
      });
    }

    return performance;
  }

  private calculateCandidateAnalytics(attempts: any[]): any {
    const uniqueCandidates = new Set(attempts.map(a => a.candidateId)).size;
    
    return {
      totalCandidates: uniqueCandidates,
      candidatesBySource: {
        'Direct Application': Math.floor(uniqueCandidates * 0.4),
        'Job Board': Math.floor(uniqueCandidates * 0.3),
        'Referral': Math.floor(uniqueCandidates * 0.2),
        'Other': Math.floor(uniqueCandidates * 0.1)
      },
      candidatesByLevel: {
        'Entry Level': Math.floor(uniqueCandidates * 0.3),
        'Mid Level': Math.floor(uniqueCandidates * 0.4),
        'Senior Level': Math.floor(uniqueCandidates * 0.3)
      },
      performanceDistribution: {
        topPerformers: attempts.filter(a => (a.score || 0) >= 90).length,
        strongPerformers: attempts.filter(a => (a.score || 0) >= 70 && (a.score || 0) < 90).length,
        averagePerformers: attempts.filter(a => (a.score || 0) >= 50 && (a.score || 0) < 70).length,
        poorPerformers: attempts.filter(a => (a.score || 0) < 50).length
      },
      retakeRate: 15, // Mock data
      dropoutRate: 25 // Mock data
    };
  }

  private async calculateHiringFunnel(companyId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - would require integration with hiring system
    const totalInvited = 1000;
    const started = 800;
    const completed = 600;
    const passed = 300;
    const hired = 150;

    return {
      stages: {
        invited: totalInvited,
        started,
        completed,
        passed,
        hired
      },
      conversionRates: {
        inviteToStart: (started / totalInvited) * 100,
        startToComplete: (completed / started) * 100,
        completeToPass: (passed / completed) * 100,
        passToHire: (hired / passed) * 100,
        overallConversion: (hired / totalInvited) * 100
      },
      averageTimePerStage: {
        inviteToStart: 2.5, // days
        startToComplete: 1.5, // hours
        completeToDecision: 5 // days
      }
    };
  }

  private async calculateTrends(companyId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - would calculate actual trends over time
    return {
      scoresTrend: [],
      volumeTrend: [],
      completionRateTrend: [],
      skillsTrend: []
    };
  }
}