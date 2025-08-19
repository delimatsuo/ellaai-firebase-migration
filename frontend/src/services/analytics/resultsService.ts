import axios from 'axios';
import { auth } from '@/firebase/config';
import {
  CandidateResult,
  AssessmentAnalytics,
  CompanyAnalytics,
  ReportConfig,
  GeneratedReport,
  ProgressTracking,
  DashboardConfig,
  RealTimeUpdate
} from '@/types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ResultsService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 60000, // Longer timeout for analytics queries
  });

  private eventSource?: EventSource;

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
          console.error('Authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  // Candidate Results
  async getCandidateResults(params: {
    candidateId?: string;
    assessmentId?: string;
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    includeInProgress?: boolean;
  }): Promise<{
    results: CandidateResult[];
    total: number;
    analytics: {
      averageScore: number;
      completionRate: number;
      totalTime: number;
    };
  }> {
    try {
      const response = await this.axios.get('/analytics/candidate-results', { 
        params: {
          ...params,
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString(),
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch candidate results:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate results');
    }
  }

  async getCandidateResultDetail(resultId: string): Promise<CandidateResult> {
    try {
      const response = await this.axios.get(`/analytics/candidate-results/${resultId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch candidate result detail:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate result detail');
    }
  }

  // Assessment Analytics
  async getAssessmentAnalytics(assessmentId: string, params?: {
    startDate?: Date;
    endDate?: Date;
    includeQuestionBreakdown?: boolean;
    includeSkillAnalysis?: boolean;
  }): Promise<AssessmentAnalytics> {
    try {
      const response = await this.axios.get(`/analytics/assessments/${assessmentId}`, {
        params: {
          ...params,
          startDate: params?.startDate?.toISOString(),
          endDate: params?.endDate?.toISOString(),
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch assessment analytics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch assessment analytics');
    }
  }

  async getAssessmentComparison(assessmentIds: string[], params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    assessments: AssessmentAnalytics[];
    comparison: {
      scoreComparison: any[];
      timeComparison: any[];
      completionComparison: any[];
      difficultyComparison: any[];
    };
  }> {
    try {
      const response = await this.axios.post('/analytics/assessments/compare', {
        assessmentIds,
        ...params,
        startDate: params?.startDate?.toISOString(),
        endDate: params?.endDate?.toISOString(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch assessment comparison:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch assessment comparison');
    }
  }

  // Company Analytics
  async getCompanyAnalytics(companyId: string, params: {
    startDate: Date;
    endDate: Date;
    includeTeamBreakdown?: boolean;
    includeSkillAnalysis?: boolean;
    includeTrends?: boolean;
  }): Promise<CompanyAnalytics> {
    try {
      const response = await this.axios.get(`/analytics/companies/${companyId}`, {
        params: {
          ...params,
          startDate: params.startDate.toISOString(),
          endDate: params.endDate.toISOString(),
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch company analytics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch company analytics');
    }
  }

  async getCompanyBenchmark(companyId: string, params?: {
    industry?: string;
    companySize?: string;
    metrics?: string[];
  }): Promise<{
    company: CompanyAnalytics;
    benchmark: {
      industry: any;
      size: any;
      overall: any;
    };
    comparison: any[];
  }> {
    try {
      const response = await this.axios.get(`/analytics/companies/${companyId}/benchmark`, {
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch company benchmark:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch company benchmark');
    }
  }

  // Report Generation
  async generateReport(config: ReportConfig, entityIds: string[]): Promise<{
    reportId: string;
    status: 'queued' | 'processing' | 'ready' | 'failed';
    estimatedTime?: number;
  }> {
    try {
      const response = await this.axios.post('/analytics/reports/generate', {
        config,
        entityIds
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate report');
    }
  }

  async getReportStatus(reportId: string): Promise<GeneratedReport> {
    try {
      const response = await this.axios.get(`/analytics/reports/${reportId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch report status:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch report status');
    }
  }

  async getReports(params?: {
    userId?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    reports: GeneratedReport[];
    total: number;
  }> {
    try {
      const response = await this.axios.get('/analytics/reports', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch reports');
    }
  }

  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await this.axios.get(`/analytics/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to download report:', error);
      throw new Error(error.response?.data?.error || 'Failed to download report');
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      await this.axios.delete(`/analytics/reports/${reportId}`);
    } catch (error: any) {
      console.error('Failed to delete report:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete report');
    }
  }

  // Dashboard Configuration
  async getDashboardConfig(userId: string, dashboardType: string): Promise<DashboardConfig> {
    try {
      const response = await this.axios.get('/analytics/dashboard/config', {
        params: { userId, dashboardType }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard config:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard config');
    }
  }

  async saveDashboardConfig(config: DashboardConfig): Promise<void> {
    try {
      await this.axios.put('/analytics/dashboard/config', config);
    } catch (error: any) {
      console.error('Failed to save dashboard config:', error);
      throw new Error(error.response?.data?.error || 'Failed to save dashboard config');
    }
  }

  // Real-time Progress Tracking
  async getProgressTracking(entityId: string, entityType: 'assessment' | 'candidate'): Promise<ProgressTracking> {
    try {
      const response = await this.axios.get('/analytics/progress', {
        params: { entityId, entityType }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch progress tracking:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch progress tracking');
    }
  }

  // Real-time Updates via Server-Sent Events
  subscribeToRealTimeUpdates(
    entityIds: string[],
    onUpdate: (update: RealTimeUpdate) => void,
    onError?: (error: Event) => void
  ): () => void {
    try {
      const url = new URL('/analytics/realtime', window.location.origin);
      url.searchParams.set('entities', entityIds.join(','));
      
      this.eventSource = new EventSource(url.toString());
      
      this.eventSource.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data);
          onUpdate(update);
        } catch (error) {
          console.error('Failed to parse real-time update:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error);
        if (onError) onError(error);
      };

      // Return cleanup function
      return () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = undefined;
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to real-time updates:', error);
      return () => {}; // Return no-op cleanup function
    }
  }

  // Bulk Operations
  async bulkExportResults(params: {
    entityIds: string[];
    entityType: 'candidates' | 'assessments' | 'companies';
    format: 'excel' | 'csv' | 'json';
    includeAnalytics?: boolean;
  }): Promise<{
    exportId: string;
    status: 'queued' | 'processing' | 'ready';
    estimatedTime?: number;
  }> {
    try {
      const response = await this.axios.post('/analytics/bulk-export', params);
      return response.data;
    } catch (error: any) {
      console.error('Failed to start bulk export:', error);
      throw new Error(error.response?.data?.error || 'Failed to start bulk export');
    }
  }

  async getBulkExportStatus(exportId: string): Promise<{
    id: string;
    status: 'queued' | 'processing' | 'ready' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
  }> {
    try {
      const response = await this.axios.get(`/analytics/bulk-export/${exportId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch export status:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch export status');
    }
  }

  // Custom Queries
  async executeCustomQuery(query: {
    collection: string;
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    aggregations?: Array<{
      type: 'count' | 'sum' | 'avg' | 'min' | 'max';
      field?: string;
      groupBy?: string;
    }>;
    limit?: number;
    orderBy?: Array<{
      field: string;
      direction: 'asc' | 'desc';
    }>;
  }): Promise<{
    results: any[];
    aggregations?: Record<string, any>;
    total: number;
  }> {
    try {
      const response = await this.axios.post('/analytics/custom-query', query);
      return response.data;
    } catch (error: any) {
      console.error('Failed to execute custom query:', error);
      throw new Error(error.response?.data?.error || 'Failed to execute custom query');
    }
  }

  // Utility methods
  cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }
}

export const resultsService = new ResultsService();