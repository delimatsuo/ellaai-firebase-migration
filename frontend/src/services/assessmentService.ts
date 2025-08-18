import axios from 'axios';
import { auth } from '@/firebase/config';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Assessment {
  id?: string;
  title: string;
  description?: string;
  positionId: string;
  companyId: string;
  candidateId?: string;
  questions: string[];
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  skills?: string[];
  status: 'draft' | 'published' | 'archived';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssessmentAttempt {
  id?: string;
  assessmentId: string;
  candidateId: string;
  startedAt?: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  answers: AssessmentAnswer[];
  timeRemaining: number;
  score?: number;
  evaluation?: any;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string | string[] | object;
  timeSpent?: number;
  submittedAt?: Date;
}

export interface AssessmentResults {
  attempts: AssessmentAttempt[];
  analytics?: {
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    scoreDistribution: Record<string, number>;
  };
}

class AssessmentService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000,
  });

  constructor() {
    // Add request interceptor to include auth token
    this.axios.interceptors.request.use(
      async (config) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${idToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle authentication errors
          console.error('Authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  async getAssessments(params?: {
    companyId?: string;
    candidateId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    assessments: Assessment[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const response = await this.axios.get('/assessments', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch assessments');
    }
  }

  async getAssessment(id: string): Promise<Assessment> {
    try {
      const response = await this.axios.get(`/assessments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch assessment:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch assessment');
    }
  }

  async createAssessment(assessment: Omit<Assessment, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Assessment> {
    try {
      const response = await this.axios.post('/assessments', assessment);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create assessment:', error);
      throw new Error(error.response?.data?.error || 'Failed to create assessment');
    }
  }

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    try {
      const response = await this.axios.put(`/assessments/${id}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update assessment:', error);
      throw new Error(error.response?.data?.error || 'Failed to update assessment');
    }
  }

  async deleteAssessment(id: string): Promise<void> {
    try {
      await this.axios.delete(`/assessments/${id}`);
    } catch (error: any) {
      console.error('Failed to delete assessment:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete assessment');
    }
  }

  async startAssessment(assessmentId: string): Promise<AssessmentAttempt> {
    try {
      const response = await this.axios.post(`/assessments/${assessmentId}/start`, {
        assessmentId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to start assessment:', error);
      throw new Error(error.response?.data?.error || 'Failed to start assessment');
    }
  }

  async submitAnswer(
    assessmentId: string,
    questionId: string,
    answer: any,
    timeSpent?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axios.post(`/assessments/${assessmentId}/submit-answer`, {
        questionId,
        answer,
        timeSpent,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit answer');
    }
  }

  async completeAssessment(
    assessmentId: string,
    answers: AssessmentAnswer[]
  ): Promise<{ success: boolean; score: number; attemptId: string }> {
    try {
      const response = await this.axios.post(`/assessments/${assessmentId}/complete`, {
        answers,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to complete assessment:', error);
      throw new Error(error.response?.data?.error || 'Failed to complete assessment');
    }
  }

  async getAssessmentResults(assessmentId: string): Promise<AssessmentResults> {
    try {
      const response = await this.axios.get(`/assessments/${assessmentId}/results`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch assessment results:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch assessment results');
    }
  }

  async getMyAssessments(): Promise<Assessment[]> {
    try {
      const response = await this.axios.get('/assessments', {
        params: { candidateId: auth.currentUser?.uid },
      });
      return response.data.assessments;
    } catch (error: any) {
      console.error('Failed to fetch my assessments:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch my assessments');
    }
  }

  async getCompanyAssessments(companyId: string): Promise<Assessment[]> {
    try {
      const response = await this.axios.get('/assessments', {
        params: { companyId },
      });
      return response.data.assessments;
    } catch (error: any) {
      console.error('Failed to fetch company assessments:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch company assessments');
    }
  }
}

export const assessmentService = new AssessmentService();