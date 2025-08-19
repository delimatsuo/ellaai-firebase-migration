import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resultsService } from '@/services/analytics/resultsService';
import type { CandidateResult, AssessmentAnalytics, ReportConfig } from '@/types/analytics';

// Mock Firebase auth
const mockAuth = {
  currentUser: {
    uid: 'test-user-123',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  }
};

// Mock axios
const mockAxios = {
  create: vi.fn().mockReturnThis(),
  interceptors: {
    request: {
      use: vi.fn()
    },
    response: {
      use: vi.fn()
    }
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

vi.mock('@/firebase/config', () => ({
  auth: mockAuth
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxios)
  }
}));

describe('ResultsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCandidateResults', () => {
    it('should fetch candidate results successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'result-1',
              candidateId: 'candidate-1',
              candidateName: 'John Doe',
              candidateEmail: 'john@example.com',
              assessmentId: 'assessment-1',
              assessmentTitle: 'JavaScript Fundamentals',
              percentage: 85,
              status: 'completed'
            }
          ] as CandidateResult[],
          total: 1,
          analytics: {
            averageScore: 85,
            completionRate: 100,
            totalTime: 45
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const params = {
        candidateId: 'candidate-1',
        limit: 10,
        offset: 0
      };

      const result = await resultsService.getCandidateResults(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/candidate-results', {
        params: expect.objectContaining(params)
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Access denied'
          },
          status: 403
        }
      };

      mockAxios.get.mockRejectedValue(errorResponse);

      await expect(
        resultsService.getCandidateResults({ candidateId: 'candidate-1' })
      ).rejects.toThrow('Access denied');
    });

    it('should format date parameters correctly', async () => {
      const mockResponse = { data: { results: [], total: 0, analytics: {} } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await resultsService.getCandidateResults({
        startDate,
        endDate
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/candidate-results', {
        params: expect.objectContaining({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });
    });
  });

  describe('getCandidateResultDetail', () => {
    it('should fetch detailed candidate result', async () => {
      const mockResult: Partial<CandidateResult> = {
        id: 'result-1',
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        assessmentTitle: 'JavaScript Fundamentals',
        percentage: 85,
        questionResults: [
          {
            id: 'q1',
            questionId: 'question-1',
            questionText: 'What is closure in JavaScript?',
            questionType: 'short_answer',
            userAnswer: 'A closure is a function that has access to variables in its outer scope.',
            isCorrect: true,
            points: 10,
            maxPoints: 10,
            timeSpent: 120,
            feedback: 'Excellent answer!',
            partialCredit: 1
          }
        ]
      };

      mockAxios.get.mockResolvedValue({ data: mockResult });

      const result = await resultsService.getCandidateResultDetail('result-1');

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/candidate-results/result-1');
      expect(result).toEqual(mockResult);
    });

    it('should throw error for non-existent result', async () => {
      mockAxios.get.mockRejectedValue({
        response: { data: { error: 'Result not found' }, status: 404 }
      });

      await expect(
        resultsService.getCandidateResultDetail('non-existent')
      ).rejects.toThrow('Result not found');
    });
  });

  describe('getAssessmentAnalytics', () => {
    it('should fetch assessment analytics', async () => {
      const mockAnalytics: Partial<AssessmentAnalytics> = {
        assessmentId: 'assessment-1',
        assessmentTitle: 'JavaScript Fundamentals',
        totalAttempts: 100,
        completedAttempts: 85,
        averageScore: 75.5,
        completionRate: 85,
        passRate: 70
      };

      mockAxios.get.mockResolvedValue({ data: mockAnalytics });

      const result = await resultsService.getAssessmentAnalytics('assessment-1');

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/assessments/assessment-1', {
        params: {}
      });
      expect(result).toEqual(mockAnalytics);
    });

    it('should include optional parameters', async () => {
      const mockAnalytics = { assessmentId: 'assessment-1' };
      mockAxios.get.mockResolvedValue({ data: mockAnalytics });

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        includeQuestionBreakdown: true,
        includeSkillAnalysis: true
      };

      await resultsService.getAssessmentAnalytics('assessment-1', params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/assessments/assessment-1', {
        params: {
          startDate: params.startDate.toISOString(),
          endDate: params.endDate.toISOString(),
          includeQuestionBreakdown: true,
          includeSkillAnalysis: true
        }
      });
    });
  });

  describe('generateReport', () => {
    it('should generate report successfully', async () => {
      const mockResponse = {
        data: {
          reportId: 'report-123',
          status: 'processing',
          estimatedTime: 30
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const config: ReportConfig = {
        type: 'candidate',
        format: 'pdf',
        template: 'standard',
        includeCharts: true,
        includeDetailedBreakdown: true,
        includeProctoringData: false,
        includeRecommendations: true
      };

      const entityIds = ['result-1', 'result-2'];

      const result = await resultsService.generateReport(config, entityIds);

      expect(mockAxios.post).toHaveBeenCalledWith('/analytics/reports/generate', {
        config,
        entityIds
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle report generation errors', async () => {
      mockAxios.post.mockRejectedValue({
        response: { data: { error: 'Invalid configuration' }, status: 400 }
      });

      const config: ReportConfig = {
        type: 'candidate',
        format: 'pdf',
        template: 'standard',
        includeCharts: true,
        includeDetailedBreakdown: true,
        includeProctoringData: false,
        includeRecommendations: true
      };

      await expect(
        resultsService.generateReport(config, ['result-1'])
      ).rejects.toThrow('Invalid configuration');
    });
  });

  describe('getReportStatus', () => {
    it('should fetch report status', async () => {
      const mockReport = {
        id: 'report-123',
        type: 'candidate',
        format: 'pdf',
        filename: 'candidate_report.pdf',
        status: 'ready',
        downloadUrl: 'https://example.com/reports/report-123.pdf',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      mockAxios.get.mockResolvedValue({ data: mockReport });

      const result = await resultsService.getReportStatus('report-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/reports/report-123');
      expect(result).toEqual(mockReport);
    });
  });

  describe('downloadReport', () => {
    it('should download report as blob', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      mockAxios.get.mockResolvedValue({ data: mockBlob });

      const result = await resultsService.downloadReport('report-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/reports/report-123/download', {
        responseType: 'blob'
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('bulkExportResults', () => {
    it('should start bulk export', async () => {
      const mockResponse = {
        data: {
          exportId: 'export-123',
          status: 'queued',
          estimatedTime: 120
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const params = {
        entityIds: ['result-1', 'result-2'],
        entityType: 'candidates' as const,
        format: 'excel' as const,
        includeAnalytics: true
      };

      const result = await resultsService.bulkExportResults(params);

      expect(mockAxios.post).toHaveBeenCalledWith('/analytics/bulk-export', params);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('executeCustomQuery', () => {
    it('should execute custom query', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 'doc1', field1: 'value1' },
            { id: 'doc2', field1: 'value2' }
          ],
          aggregations: {
            count_field1: 2,
            avg_score: 75.5
          },
          total: 2
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const query = {
        collection: 'assessment-attempts',
        filters: [
          { field: 'status', operator: '==', value: 'completed' }
        ],
        aggregations: [
          { type: 'count', field: 'id' },
          { type: 'avg', field: 'score' }
        ],
        limit: 10
      };

      const result = await resultsService.executeCustomQuery(query);

      expect(mockAxios.post).toHaveBeenCalledWith('/analytics/custom-query', query);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('real-time updates', () => {
    let mockEventSource: any;

    beforeEach(() => {
      mockEventSource = {
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        addEventListener: vi.fn()
      };

      // Mock EventSource
      global.EventSource = vi.fn().mockImplementation(() => mockEventSource);
      global.window = { location: { origin: 'http://localhost:3000' } } as any;
    });

    it('should subscribe to real-time updates', () => {
      const onUpdate = vi.fn();
      const onError = vi.fn();
      const entityIds = ['result-1', 'result-2'];

      const cleanup = resultsService.subscribeToRealTimeUpdates(entityIds, onUpdate, onError);

      expect(global.EventSource).toHaveBeenCalledWith(
        'http://localhost:3000/analytics/realtime?entities=result-1%2Cresult-2'
      );

      // Test cleanup function
      expect(typeof cleanup).toBe('function');
      cleanup();
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should handle real-time update messages', () => {
      const onUpdate = vi.fn();
      const entityIds = ['result-1'];

      resultsService.subscribeToRealTimeUpdates(entityIds, onUpdate);

      const mockUpdate = {
        type: 'assessment_completed',
        timestamp: new Date(),
        data: { resultId: 'result-1', score: 85 },
        affectedEntities: ['result-1']
      };

      // Simulate incoming message
      const mockEvent = {
        data: JSON.stringify(mockUpdate)
      };

      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(mockEvent);
      }

      expect(onUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    it('should handle malformed real-time messages', () => {
      const onUpdate = vi.fn();
      const entityIds = ['result-1'];
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      resultsService.subscribeToRealTimeUpdates(entityIds, onUpdate);

      // Simulate malformed message
      const mockEvent = { data: 'invalid-json' };

      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(mockEvent);
      }

      expect(onUpdate).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to parse real-time update:',
        expect.any(SyntaxError)
      );

      consoleError.mockRestore();
    });

    it('should handle connection errors', () => {
      const onUpdate = vi.fn();
      const onError = vi.fn();
      const entityIds = ['result-1'];

      resultsService.subscribeToRealTimeUpdates(entityIds, onUpdate, onError);

      const mockError = new Event('error');

      if (mockEventSource.onerror) {
        mockEventSource.onerror(mockError);
      }

      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('cleanup', () => {
    it('should cleanup event source', () => {
      const mockEventSource = {
        close: vi.fn()
      };

      (resultsService as any).eventSource = mockEventSource;

      resultsService.cleanup();

      expect(mockEventSource.close).toHaveBeenCalled();
      expect((resultsService as any).eventSource).toBeUndefined();
    });

    it('should handle cleanup when no event source exists', () => {
      (resultsService as any).eventSource = undefined;

      expect(() => resultsService.cleanup()).not.toThrow();
    });
  });
});