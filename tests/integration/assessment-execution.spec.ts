import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { TestClient } from '../helpers/TestClient';
import { FirebaseTestHelper } from '../helpers/FirebaseTestHelper';
import { AssessmentTestData } from '../helpers/AssessmentTestData';

describe('Assessment Execution Integration Tests', () => {
  let testClient: TestClient;
  let firebaseHelper: FirebaseTestHelper;
  let testData: AssessmentTestData;

  beforeAll(async () => {
    testClient = new TestClient();
    firebaseHelper = new FirebaseTestHelper();
    testData = new AssessmentTestData();
    
    await firebaseHelper.setup();
    await testClient.initialize();
  });

  afterAll(async () => {
    await firebaseHelper.cleanup();
    await testClient.cleanup();
  });

  beforeEach(async () => {
    await firebaseHelper.clearTestData();
  });

  describe('Assessment Creation and Management', () => {
    it('should create a new assessment with valid parameters', async () => {
      const assessmentData = testData.getBasicAssessment();
      
      const response = await testClient.post('/api/assessments', assessmentData);
      
      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        title: assessmentData.title,
        difficulty: assessmentData.difficulty,
        status: 'draft'
      });
    });

    it('should retrieve assessment by ID', async () => {
      const assessment = await testData.createTestAssessment();
      
      const response = await testClient.get(`/api/assessments/${assessment.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(assessment.id);
      expect(response.data.questions).toHaveLength(assessment.questions.length);
    });

    it('should update assessment metadata', async () => {
      const assessment = await testData.createTestAssessment();
      const updateData = {
        title: 'Updated Assessment Title',
        timeLimit: 45
      };
      
      const response = await testClient.patch(`/api/assessments/${assessment.id}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.timeLimit).toBe(updateData.timeLimit);
    });
  });

  describe('Assessment Attempt Lifecycle', () => {
    it('should start an assessment attempt', async () => {
      const assessment = await testData.createTestAssessment();
      const candidate = await testData.createTestCandidate();
      
      const response = await testClient.post(`/api/assessments/${assessment.id}/attempts`, {
        candidateId: candidate.id
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        assessmentId: assessment.id,
        candidateId: candidate.id,
        status: 'in_progress',
        startedAt: expect.any(String),
        timeRemaining: assessment.timeLimit * 60
      });
    });

    it('should auto-save code during assessment', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      const codeUpdate = {
        questionId: assessment.questions[0].id,
        code: 'function solution() { return "test"; }',
        language: 'javascript'
      };
      
      const response = await testClient.patch(
        `/api/assessments/attempts/${attempt.id}/auto-save`,
        codeUpdate
      );
      
      expect(response.status).toBe(200);
      expect(response.data.saved).toBe(true);
      expect(response.data.lastSaved).toBeTruthy();
    });

    it('should execute code with test cases', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      const executionRequest = {
        questionId: assessment.questions[0].id,
        code: 'function twoSum(nums, target) { return [0, 1]; }',
        language: 'javascript'
      };
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/execute`,
        executionRequest
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: expect.any(Boolean),
        testResults: expect.any(Array),
        totalPassed: expect.any(Number),
        totalTests: expect.any(Number),
        score: expect.any(Number),
        executionTime: expect.any(Number)
      });
      
      expect(response.data.testResults).not.toHaveLength(0);
    });

    it('should submit assessment attempt', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      
      // Add some code first
      await testClient.patch(`/api/assessments/attempts/${attempt.id}/auto-save`, {
        questionId: assessment.questions[0].id,
        code: 'function solution() { return true; }',
        language: 'javascript'
      });
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/submit`
      );
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('submitted');
      expect(response.data.submittedAt).toBeTruthy();
      expect(response.data.finalScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle auto-submission on time expiry', async () => {
      const { attempt } = await testData.createExpiredAttempt();
      
      const response = await testClient.get(`/api/assessments/attempts/${attempt.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('auto_submitted');
      expect(response.data.submittedAt).toBeTruthy();
    });
  });

  describe('Code Execution Security', () => {
    it('should reject malicious code patterns', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      const maliciousCode = {
        questionId: assessment.questions[0].id,
        code: 'require("fs").readFileSync("/etc/passwd")',
        language: 'javascript'
      };
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/execute`,
        maliciousCode
      );
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('unsafe operations');
    });

    it('should enforce time limits on code execution', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      const infiniteLoopCode = {
        questionId: assessment.questions[0].id,
        code: 'function solution() { while(true) {} }',
        language: 'javascript'
      };
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/execute`,
        infiniteLoopCode
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('time limit');
    });
  });

  describe('Real-time Features', () => {
    it('should track typing activity', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      
      // Simulate typing activity
      const activities = [
        { timestamp: Date.now(), action: 'keypress', data: { key: 'f' } },
        { timestamp: Date.now() + 100, action: 'keypress', data: { key: 'u' } },
        { timestamp: Date.now() + 200, action: 'keypress', data: { key: 'n' } }
      ];
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/activity`,
        { activities }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.recorded).toBe(activities.length);
    });

    it('should handle session heartbeat', async () => {
      const { attempt } = await testData.createActiveAttempt();
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/heartbeat`
      );
      
      expect(response.status).toBe(200);
      expect(response.data.alive).toBe(true);
      expect(response.data.timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('Proctoring Integration', () => {
    it('should initialize proctoring session', async () => {
      const { attempt } = await testData.createActiveAttempt();
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/proctor/start`
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        sessionId: expect.any(String),
        proctorUrl: expect.any(String),
        trustScore: expect.any(Number)
      });
    });

    it('should receive proctoring events', async () => {
      const { attempt } = await testData.createActiveAttemptWithProctoring();
      const event = {
        type: 'suspicious_activity',
        severity: 'medium',
        details: 'Multiple faces detected',
        timestamp: Date.now()
      };
      
      const response = await testClient.post(
        `/api/assessments/attempts/${attempt.id}/proctor/event`,
        event
      );
      
      expect(response.status).toBe(200);
      expect(response.data.recorded).toBe(true);
    });
  });

  describe('Results and Analytics', () => {
    it('should generate assessment results', async () => {
      const { attempt } = await testData.createSubmittedAttempt();
      
      const response = await testClient.get(
        `/api/assessments/attempts/${attempt.id}/results`
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        attemptId: attempt.id,
        score: expect.any(Number),
        percentage: expect.any(Number),
        completionTime: expect.any(Number),
        questionResults: expect.any(Array),
        strengths: expect.any(Array),
        improvements: expect.any(Array)
      });
    });

    it('should provide detailed analytics for recruiters', async () => {
      const company = await testData.createTestCompany();
      const assessment = await testData.createCompanyAssessment(company.id);
      await testData.createMultipleAttempts(assessment.id, 5);
      
      const response = await testClient.get(
        `/api/assessments/${assessment.id}/analytics`
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        totalAttempts: 5,
        averageScore: expect.any(Number),
        completionRate: expect.any(Number),
        difficultyBreakdown: expect.any(Object),
        timeAnalytics: expect.any(Object),
        topPerformers: expect.any(Array)
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent assessment attempts', async () => {
      const assessment = await testData.createTestAssessment();
      const candidates = await testData.createMultipleCandidates(10);
      
      const promises = candidates.map(candidate =>
        testClient.post(`/api/assessments/${assessment.id}/attempts`, {
          candidateId: candidate.id
        })
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should maintain performance under load', async () => {
      const { attempt, assessment } = await testData.createActiveAttempt();
      const startTime = Date.now();
      
      // Simulate multiple rapid requests
      const requests = Array.from({ length: 20 }, (_, i) =>
        testClient.patch(`/api/assessments/attempts/${attempt.id}/auto-save`, {
          questionId: assessment.questions[0].id,
          code: `console.log(${i});`,
          language: 'javascript'
        })
      );
      
      await Promise.all(requests);
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid assessment ID', async () => {
      const response = await testClient.get('/api/assessments/invalid-id');
      
      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should prevent duplicate attempts', async () => {
      const assessment = await testData.createTestAssessment();
      const candidate = await testData.createTestCandidate();
      
      // Create first attempt
      await testClient.post(`/api/assessments/${assessment.id}/attempts`, {
        candidateId: candidate.id
      });
      
      // Try to create second attempt
      const response = await testClient.post(`/api/assessments/${assessment.id}/attempts`, {
        candidateId: candidate.id
      });
      
      expect(response.status).toBe(409);
      expect(response.data.error).toContain('already exists');
    });

    it('should handle database connection failures gracefully', async () => {
      // Simulate database failure
      await firebaseHelper.simulateConnectionFailure();
      
      const response = await testClient.get('/api/assessments');
      
      expect(response.status).toBe(503);
      expect(response.data.error).toContain('service unavailable');
      
      // Restore connection
      await firebaseHelper.restoreConnection();
    });
  });
});