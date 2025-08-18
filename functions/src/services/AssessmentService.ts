import * as admin from 'firebase-admin';
import { AppError, NotFoundError, ConflictError } from '../utils/errors';

interface Assessment {
  id?: string;
  title: string;
  description?: string;
  positionId: string;
  companyId: string;
  candidateId?: string;
  questions: string[];
  timeLimit: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  skills?: string[];
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

interface AssessmentAttempt {
  id?: string;
  assessmentId: string;
  candidateId: string;
  startedAt: admin.firestore.FieldValue;
  completedAt?: admin.firestore.FieldValue;
  status: 'in_progress' | 'completed' | 'abandoned';
  answers: AssessmentAnswer[];
  timeRemaining: number; // in seconds
  score?: number;
  evaluation?: any;
}

interface AssessmentAnswer {
  questionId: string;
  answer: string | string[] | object;
  timeSpent?: number; // in seconds
  submittedAt: admin.firestore.FieldValue;
}

export class AssessmentService {
  private db = admin.firestore();

  async createAssessment(assessmentData: Assessment): Promise<Assessment> {
    try {
      const docRef = await this.db.collection('assessments').add(assessmentData);
      const doc = await docRef.get();
      
      return {
        id: doc.id,
        ...doc.data() as Assessment,
      };
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw new AppError('Failed to create assessment', 500);
    }
  }

  async getAssessment(id: string): Promise<Assessment | null> {
    try {
      const doc = await this.db.collection('assessments').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data() as Assessment,
      };
    } catch (error) {
      console.error('Error fetching assessment:', error);
      throw new AppError('Failed to fetch assessment', 500);
    }
  }

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    try {
      const docRef = this.db.collection('assessments').doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new NotFoundError('Assessment not found');
      }
      
      await docRef.update(updates);
      const updatedDoc = await docRef.get();
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data() as Assessment,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error updating assessment:', error);
      throw new AppError('Failed to update assessment', 500);
    }
  }

  async deleteAssessment(id: string): Promise<void> {
    try {
      const docRef = this.db.collection('assessments').doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new NotFoundError('Assessment not found');
      }
      
      // Check if there are any active attempts
      const attempts = await this.db.collection('assessment-attempts')
        .where('assessmentId', '==', id)
        .where('status', '==', 'in_progress')
        .get();
      
      if (!attempts.empty) {
        throw new ConflictError('Cannot delete assessment with active attempts');
      }
      
      await docRef.delete();
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting assessment:', error);
      throw new AppError('Failed to delete assessment', 500);
    }
  }

  async startAssessmentAttempt(attemptData: Partial<AssessmentAttempt>): Promise<AssessmentAttempt> {
    try {
      // Check if user already has an active attempt for this assessment
      const existingAttempt = await this.db.collection('assessment-attempts')
        .where('assessmentId', '==', attemptData.assessmentId)
        .where('candidateId', '==', attemptData.candidateId)
        .where('status', '==', 'in_progress')
        .get();
      
      if (!existingAttempt.empty) {
        throw new ConflictError('An active attempt already exists for this assessment');
      }
      
      const docRef = await this.db.collection('assessment-attempts').add(attemptData);
      const doc = await docRef.get();
      
      return {
        id: doc.id,
        ...doc.data() as AssessmentAttempt,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error starting assessment attempt:', error);
      throw new AppError('Failed to start assessment attempt', 500);
    }
  }

  async submitAnswer(
    assessmentId: string,
    candidateId: string,
    questionId: string,
    answer: any,
    timeSpent?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find the active attempt
      const attempts = await this.db.collection('assessment-attempts')
        .where('assessmentId', '==', assessmentId)
        .where('candidateId', '==', candidateId)
        .where('status', '==', 'in_progress')
        .get();
      
      if (attempts.empty) {
        throw new NotFoundError('No active assessment attempt found');
      }
      
      const attemptDoc = attempts.docs[0];
      const attemptData = attemptDoc.data() as AssessmentAttempt;
      
      // Update the answers array
      const existingAnswerIndex = attemptData.answers.findIndex(a => a.questionId === questionId);
      const newAnswer: AssessmentAnswer = {
        questionId,
        answer,
        timeSpent,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (existingAnswerIndex >= 0) {
        attemptData.answers[existingAnswerIndex] = newAnswer;
      } else {
        attemptData.answers.push(newAnswer);
      }
      
      await attemptDoc.ref.update({
        answers: attemptData.answers,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return {
        success: true,
        message: 'Answer submitted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error submitting answer:', error);
      throw new AppError('Failed to submit answer', 500);
    }
  }

  async completeAssessment(
    assessmentId: string,
    candidateId: string,
    finalAnswers: AssessmentAnswer[]
  ): Promise<{ success: boolean; score: number; attemptId: string }> {
    try {
      // Find the active attempt
      const attempts = await this.db.collection('assessment-attempts')
        .where('assessmentId', '==', assessmentId)
        .where('candidateId', '==', candidateId)
        .where('status', '==', 'in_progress')
        .get();
      
      if (attempts.empty) {
        throw new NotFoundError('No active assessment attempt found');
      }
      
      const attemptDoc = attempts.docs[0];
      
      // Calculate score (simplified scoring logic)
      const score = await this.calculateScore(assessmentId, finalAnswers);
      
      // Update attempt as completed
      await attemptDoc.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        answers: finalAnswers,
        score,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Trigger evaluation (could be done asynchronously)
      this.triggerEvaluation(attemptDoc.id, assessmentId, finalAnswers).catch(error => {
        console.error('Failed to trigger evaluation:', error);
      });
      
      return {
        success: true,
        score,
        attemptId: attemptDoc.id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error completing assessment:', error);
      throw new AppError('Failed to complete assessment', 500);
    }
  }

  async getAssessmentResults(
    assessmentId: string,
    userId: string,
    userRole: string
  ): Promise<any> {
    try {
      let query = this.db.collection('assessment-attempts')
        .where('assessmentId', '==', assessmentId) as any;
      
      // Candidates can only see their own results
      if (userRole === 'candidate') {
        query = query.where('candidateId', '==', userId);
      }
      
      const attempts = await query.get();
      
      if (attempts.empty) {
        throw new NotFoundError('No assessment results found');
      }
      
      const results = attempts.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // For company users, include additional analytics
      if (userRole !== 'candidate') {
        const analytics = await this.calculateAssessmentAnalytics(assessmentId);
        return {
          attempts: results,
          analytics,
        };
      }
      
      return {
        attempts: results,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error fetching assessment results:', error);
      throw new AppError('Failed to fetch assessment results', 500);
    }
  }

  private async calculateScore(assessmentId: string, answers: AssessmentAnswer[]): Promise<number> {
    // Simplified scoring logic - in real implementation, this would involve
    // complex evaluation based on question types, correct answers, etc.
    
    // For now, return a random score between 0-100
    return Math.floor(Math.random() * 101);
  }

  private async triggerEvaluation(
    attemptId: string,
    assessmentId: string,
    answers: AssessmentAnswer[]
  ): Promise<void> {
    // This would typically trigger an AI evaluation service
    // For now, just log the trigger
    console.log(`Triggering evaluation for attempt ${attemptId}`);
    
    // In a real implementation, you might:
    // 1. Send answers to an AI evaluation service
    // 2. Calculate detailed scoring and feedback
    // 3. Update the attempt with evaluation results
    // 4. Send notifications to relevant parties
  }

  private async calculateAssessmentAnalytics(assessmentId: string): Promise<any> {
    const attempts = await this.db.collection('assessment-attempts')
      .where('assessmentId', '==', assessmentId)
      .where('status', '==', 'completed')
      .get();
    
    if (attempts.empty) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
      };
    }
    
    const scores = attempts.docs.map((doc: any) => doc.data().score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate completion rate (would need additional data in real implementation)
    const completionRate = 100; // Simplified
    
    return {
      totalAttempts: attempts.size,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate,
      scoreDistribution: this.calculateScoreDistribution(scores),
    };
  }

  private calculateScoreDistribution(scores: number[]): any {
    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };
    
    scores.forEach(score => {
      if (score <= 20) ranges['0-20']++;
      else if (score <= 40) ranges['21-40']++;
      else if (score <= 60) ranges['41-60']++;
      else if (score <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    });
    
    return ranges;
  }
}