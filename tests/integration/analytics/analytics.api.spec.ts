import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Test app setup
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5001/ellaai-platform-dev/us-central1/api';

// Test data
const testUser = {
  uid: 'test-analytics-user-123',
  email: 'analytics-test@example.com',
  displayName: 'Analytics Test User'
};

const testCompany = {
  id: 'test-company-analytics',
  name: 'Analytics Test Company',
  domain: 'analytics-test.com'
};

const testAssessment = {
  id: 'test-assessment-analytics',
  title: 'Analytics Test Assessment',
  companyId: testCompany.id,
  questions: ['q1', 'q2', 'q3'],
  timeLimit: 60,
  difficulty: 'medium',
  skills: ['JavaScript', 'Problem Solving']
};

const testResult = {
  id: 'test-result-analytics',
  candidateId: testUser.uid,
  assessmentId: testAssessment.id,
  companyId: testCompany.id,
  status: 'completed',
  score: 85,
  timeSpent: 3600, // 1 hour
  answers: [
    {
      questionId: 'q1',
      answer: 'Test answer 1',
      timeSpent: 1200,
      submittedAt: new Date()
    }
  ]
};

let authToken: string;

describe('Analytics API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'test-project',
        credential: admin.credential.applicationDefault()
      });
    }

    const db = getFirestore();

    // Create test data
    await Promise.all([
      db.collection('users').doc(testUser.uid).set(testUser),
      db.collection('companies').doc(testCompany.id).set(testCompany),
      db.collection('assessments').doc(testAssessment.id).set(testAssessment),
      db.collection('assessment-attempts').doc(testResult.id).set({
        ...testResult,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    ]);

    // Get auth token for test user
    authToken = await getAuth().createCustomToken(testUser.uid);
  });

  afterAll(async () => {
    // Clean up test data
    const db = getFirestore();
    
    await Promise.all([
      db.collection('users').doc(testUser.uid).delete(),
      db.collection('companies').doc(testCompany.id).delete(),
      db.collection('assessments').doc(testAssessment.id).delete(),
      db.collection('assessment-attempts').doc(testResult.id).delete()
    ]);
  });

  describe('GET /api/analytics/candidate-results', () => {
    it('should return candidate results for authenticated user', async () => {
      const response = await request(API_BASE)
        .get('/analytics/candidate-results')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          candidateId: testUser.uid,
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body).toMatchObject({
        results: expect.arrayContaining([
          expect.objectContaining({
            candidateId: testUser.uid,
            assessmentId: testAssessment.id,
            status: 'completed'
          })
        ]),
        total: expect.any(Number),
        analytics: expect.objectContaining({
          averageScore: expect.any(Number),
          completionRate: expect.any(Number),
          totalTime: expect.any(Number)
        })
      });
    });

    it('should filter results by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = new Date();

      const response = await request(API_BASE)
        .get('/analytics/candidate-results')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          candidateId: testUser.uid,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .expect(200);

      expect(response.body.results).toBeInstanceOf(Array);
    });

    it('should return 403 for unauthorized candidate access', async () => {
      const otherUserToken = await getAuth().createCustomToken('other-user-123');

      await request(API_BASE)
        .get('/analytics/candidate-results')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .query({
          candidateId: testUser.uid
        })
        .expect(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(API_BASE)
        .get('/analytics/candidate-results')
        .expect(401);
    });
  });

  describe('GET /api/analytics/candidate-results/:id', () => {
    it('should return detailed candidate result', async () => {
      const response = await request(API_BASE)
        .get(`/analytics/candidate-results/${testResult.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testResult.id,
        candidateId: testUser.uid,
        assessmentId: testAssessment.id,
        status: 'completed',
        totalScore: expect.any(Number),
        percentage: expect.any(Number),
        questionResults: expect.any(Array)
      });
    });

    it('should return 404 for non-existent result', async () => {
      await request(API_BASE)
        .get('/analytics/candidate-results/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/analytics/assessments/:id', () => {
    it('should return assessment analytics', async () => {
      const response = await request(API_BASE)
        .get(`/analytics/assessments/${testAssessment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        assessmentId: testAssessment.id,
        assessmentTitle: testAssessment.title,
        totalAttempts: expect.any(Number),
        completedAttempts: expect.any(Number),
        averageScore: expect.any(Number),
        completionRate: expect.any(Number),
        passRate: expect.any(Number)
      });
    });

    it('should include question breakdown when requested', async () => {
      const response = await request(API_BASE)
        .get(`/analytics/assessments/${testAssessment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          includeQuestionBreakdown: true
        })
        .expect(200);

      expect(response.body.questionAnalytics).toBeInstanceOf(Array);
    });

    it('should include skill analysis when requested', async () => {
      const response = await request(API_BASE)
        .get(`/analytics/assessments/${testAssessment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          includeSkillAnalysis: true
        })
        .expect(200);

      expect(response.body.skillsAnalytics).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/analytics/assessments/compare', () => {
    it('should compare multiple assessments', async () => {
      const response = await request(API_BASE)
        .post('/analytics/assessments/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentIds: [testAssessment.id],
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body).toMatchObject({
        assessments: expect.arrayContaining([
          expect.objectContaining({
            assessmentId: testAssessment.id
          })
        ]),
        comparison: expect.objectContaining({
          scoreComparison: expect.any(Array),
          timeComparison: expect.any(Array),
          completionComparison: expect.any(Array),
          difficultyComparison: expect.any(Array)
        })
      });
    });

    it('should return 400 for invalid assessment IDs', async () => {
      await request(API_BASE)
        .post('/analytics/assessments/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentIds: []
        })
        .expect(400);
    });
  });

  describe('POST /api/analytics/reports/generate', () => {
    it('should generate a candidate report', async () => {
      const response = await request(API_BASE)
        .post('/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: {
            type: 'candidate',
            format: 'pdf',
            template: 'standard',
            includeCharts: true,
            includeDetailedBreakdown: true,
            includeProctoringData: false,
            includeRecommendations: true
          },
          entityIds: [testResult.id]
        })
        .expect(200);

      expect(response.body).toMatchObject({
        reportId: expect.any(String),
        status: expect.stringMatching(/^(queued|processing|ready)$/),
        estimatedTime: expect.any(Number)
      });
    });

    it('should return 400 for invalid config', async () => {
      await request(API_BASE)
        .post('/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: {},
          entityIds: []
        })
        .expect(400);
    });
  });

  describe('GET /api/analytics/reports', () => {
    it('should list user reports', async () => {
      const response = await request(API_BASE)
        .get('/analytics/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body).toMatchObject({
        reports: expect.any(Array),
        total: expect.any(Number)
      });
    });

    it('should filter reports by type', async () => {
      const response = await request(API_BASE)
        .get('/analytics/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          type: 'candidate'
        })
        .expect(200);

      expect(response.body.reports).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/analytics/bulk-export', () => {
    it('should start bulk export', async () => {
      const response = await request(API_BASE)
        .post('/analytics/bulk-export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityIds: [testResult.id],
          entityType: 'candidates',
          format: 'csv',
          includeAnalytics: true
        })
        .expect(200);

      expect(response.body).toMatchObject({
        exportId: expect.any(String),
        status: 'queued',
        estimatedTime: expect.any(Number)
      });
    });

    it('should return 400 for invalid entity type', async () => {
      await request(API_BASE)
        .post('/analytics/bulk-export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityIds: [testResult.id],
          entityType: 'invalid',
          format: 'csv'
        })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for internal server errors', async () => {
      // This test would simulate a scenario that causes an internal error
      // For example, database connection issues
      const response = await request(API_BASE)
        .get('/analytics/candidate-results/cause-internal-error')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });

    it('should handle malformed request bodies', async () => {
      await request(API_BASE)
        .post('/analytics/assessments/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send('invalid-json')
        .expect(400);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters correctly', async () => {
      const response1 = await request(API_BASE)
        .get('/analytics/candidate-results')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          candidateId: testUser.uid,
          limit: 1,
          offset: 0
        })
        .expect(200);

      const response2 = await request(API_BASE)
        .get('/analytics/candidate-results')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          candidateId: testUser.uid,
          limit: 1,
          offset: 1
        })
        .expect(200);

      // Verify pagination is working
      expect(response1.body.results.length).toBeLessThanOrEqual(1);
      expect(response2.body.results.length).toBeLessThanOrEqual(1);
    });

    it('should respect limit boundaries', async () => {
      const response = await request(API_BASE)
        .get('/analytics/candidate-results')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          candidateId: testUser.uid,
          limit: 1000 // Large limit
        })
        .expect(200);

      // API should cap the results to a reasonable limit
      expect(response.body.results.length).toBeLessThanOrEqual(100);
    });
  });
});