import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import * as admin from 'firebase-admin';
import express from 'express';

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    arrayUnion: jest.fn((item: any) => [item]),
  },
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: jest.fn(() => ({ toMillis: () => Date.now() })),
  },
}));

// Import after mocking
import { supportRoutes } from '../routes/support';
import { adminRoutes } from '../routes/admin';
import { authMiddleware } from '../middleware/auth';
import { supportContextMiddleware } from '../middleware/supportMode';
import { auditMiddleware } from '../middleware/audit';

describe('Support System Integration Tests', () => {
  let app: express.Application;
  let mockDb: any;
  let mockAuth: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Set up mocks
    mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        })),
        add: jest.fn(),
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              orderBy: jest.fn(() => ({
                limit: jest.fn(() => ({
                  get: jest.fn(),
                })),
              })),
            })),
          })),
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              offset: jest.fn(() => ({
                get: jest.fn(),
              })),
              get: jest.fn(),
            })),
          })),
          get: jest.fn(),
        })),
        get: jest.fn(),
      })),
    };

    mockAuth = {
      verifyIdToken: jest.fn(),
    };

    (admin.firestore as jest.Mock).mockReturnValue(mockDb);
    (admin.auth as jest.Mock).mockReturnValue(mockAuth);

    // Add middleware and routes
    app.use(authMiddleware);
    app.use(supportContextMiddleware);
    app.use(auditMiddleware);
    app.use('/api/support', supportRoutes);
    app.use('/api/admin', adminRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Support Session Management', () => {
    test('POST /api/support/act-as - Should start acting as company', async () => {
      // Mock user authentication
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'ella-recruiter-123',
        email: 'recruiter@ella.ai',
      });

      // Mock user document
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          role: 'ella_recruiter',
          email: 'recruiter@ella.ai',
          supportPermissions: {
            canActAs: true,
            canModifyRecords: false,
          },
        }),
      });

      // Mock no existing support session
      mockDb.collection().where().where().get.mockResolvedValue({
        empty: true,
        docs: [],
      });

      // Mock target company exists
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test Company Ltd',
          id: 'company-123',
        }),
      });

      // Mock support session creation
      mockDb.collection().add.mockResolvedValue({
        id: 'support-session-123',
      });

      const response = await request(app)
        .post('/api/support/act-as')
        .set('Authorization', 'Bearer valid-token')
        .send({
          targetCompanyId: 'company-123',
          reason: 'Customer support request - help with assessment setup',
          estimatedDuration: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        sessionId: 'support-session-123',
        supportContext: {
          isActingAs: true,
          targetCompanyId: 'company-123',
          sessionStartTime: expect.any(Object),
        },
        message: 'Started acting as company: Test Company Ltd',
      });
    });

    test('POST /api/support/act-as - Should reject if user already has active session', async () => {
      // Mock user authentication
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'ella-recruiter-123',
        email: 'recruiter@ella.ai',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          role: 'ella_recruiter',
          supportPermissions: { canActAs: true },
        }),
      });

      // Mock existing active session
      mockDb.collection().where().where().get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'existing-session-123' }],
      });

      const response = await request(app)
        .post('/api/support/act-as')
        .set('Authorization', 'Bearer valid-token')
        .send({
          targetCompanyId: 'company-123',
          reason: 'Test reason',
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ACTIVE_SESSION_EXISTS');
    });

    test('POST /api/support/end-session - Should end support session', async () => {
      // Mock user authentication
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'ella-recruiter-123',
        email: 'recruiter@ella.ai',
      });

      mockDb.collection().doc().get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ role: 'ella_recruiter' }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            ellaRecruiterId: 'ella-recruiter-123',
            targetCompanyId: 'company-123',
            targetCompanyName: 'Test Company Ltd',
            startedAt: { toMillis: () => Date.now() - 30000 },
            status: 'active',
          }),
        });

      const response = await request(app)
        .post('/api/support/end-session')
        .set('Authorization', 'Bearer valid-token')
        .send({
          sessionId: 'support-session-123',
          summary: 'Helped customer set up new assessment',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockDb.collection().doc().update).toHaveBeenCalled();
    });

    test('GET /api/support/active-sessions - Should list active sessions (admin only)', async () => {
      // Mock admin authentication
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      });

      // Mock active sessions
      mockDb.collection().where().orderBy().limit().offset().get.mockResolvedValue({
        docs: [
          {
            id: 'session-1',
            data: () => ({
              ellaRecruiterId: 'recruiter-1',
              targetCompanyId: 'company-1',
              status: 'active',
            }),
          },
        ],
      });

      mockDb.collection().where().get.mockResolvedValue({
        size: 1,
      });

      const response = await request(app)
        .get('/api/support/active-sessions')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('Admin Database Operations', () => {
    test('POST /api/admin/modify-record - Should allow admin to modify records', async () => {
      // Mock admin authentication
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            role: 'admin',
            supportPermissions: { canModifyRecords: true },
          }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ name: 'Old Company Name' }),
        });

      mockDb.collection().add.mockResolvedValue({
        id: 'admin-action-123',
      });

      const response = await request(app)
        .post('/api/admin/modify-record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          collection: 'companies',
          documentId: 'company-123',
          action: 'update',
          data: { name: 'New Company Name' },
          reason: 'Company name correction per customer request',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.actionId).toBe('admin-action-123');
      expect(mockDb.collection().doc().update).toHaveBeenCalled();
    });

    test('POST /api/admin/modify-record - Should validate data for dry-run', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ role: 'admin', supportPermissions: { canModifyRecords: true } }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ name: 'Old Company Name' }),
        });

      const response = await request(app)
        .post('/api/admin/modify-record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          collection: 'companies',
          documentId: 'company-123',
          action: 'update',
          data: { name: 'New Company Name' },
          reason: 'Validation test',
          validateOnly: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Validation successful');
      expect(mockDb.collection().doc().update).not.toHaveBeenCalled();
    });

    test('POST /api/admin/modify-record - Should reject access to system collections', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin', supportPermissions: { canModifyRecords: true } }),
      });

      const response = await request(app)
        .post('/api/admin/modify-record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          collection: 'audit-logs',
          documentId: 'log-123',
          action: 'delete',
          reason: 'Testing system protection',
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('SYSTEM_COLLECTION_PROTECTED');
    });

    test('GET /api/admin/audit-logs - Should retrieve audit logs with filtering', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      });

      // Mock audit logs
      mockDb.collection().orderBy().limit().offset().get.mockResolvedValue({
        docs: [
          {
            id: 'audit-1',
            data: () => ({
              timestamp: { toMillis: () => Date.now() },
              userId: 'user-123',
              action: 'LOGIN',
              resource: 'AUTH',
            }),
          },
        ],
      });

      mockDb.collection().get.mockResolvedValue({ size: 1 });

      const response = await request(app)
        .get('/api/admin/audit-logs')
        .query({
          action: 'LOGIN',
          limit: 10,
        })
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.logs).toHaveLength(1);
    });

    test('GET /api/admin/stats - Should provide administrative statistics', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      });

      // Mock various collection queries
      mockDb.collection().where().get.mockResolvedValue({ size: 2 }); // active support sessions
      mockDb.collection().get.mockResolvedValue({ size: 100 }); // total users/companies

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.activeSupportSessions).toBe(2);
      expect(response.body.totalUsers).toBe(100);
      expect(response.body.totalCompanies).toBe(100);
    });
  });

  describe('Authorization and Security', () => {
    test('Should reject non-admin access to admin routes', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'regular-user-123',
        email: 'user@example.com',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'recruiter' }),
      });

      const response = await request(app)
        .post('/api/admin/modify-record')
        .set('Authorization', 'Bearer user-token')
        .send({
          collection: 'companies',
          documentId: 'company-123',
          action: 'update',
          data: { name: 'Hacked Name' },
          reason: 'Unauthorized attempt',
        });

      expect(response.status).toBe(403);
    });

    test('Should reject non-recruiter access to support routes', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'candidate-123',
        email: 'candidate@example.com',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'candidate' }),
      });

      const response = await request(app)
        .post('/api/support/act-as')
        .set('Authorization', 'Bearer candidate-token')
        .send({
          targetCompanyId: 'company-123',
          reason: 'Unauthorized attempt',
        });

      expect(response.status).toBe(403);
    });

    test('Should require authentication for all support and admin routes', async () => {
      const supportResponse = await request(app)
        .get('/api/support/active-sessions');

      const adminResponse = await request(app)
        .get('/api/admin/audit-logs');

      expect(supportResponse.status).toBe(401);
      expect(adminResponse.status).toBe(401);
    });
  });

  describe('Audit Trail Verification', () => {
    test('Should log support session activities', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'ella-recruiter-123',
        email: 'recruiter@ella.ai',
      });

      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          role: 'ella_recruiter',
          supportPermissions: { canActAs: true },
        }),
      });

      mockDb.collection().where().where().get.mockResolvedValue({
        empty: true,
        docs: [],
      });

      mockDb.collection().add.mockResolvedValue({
        id: 'support-session-123',
      });

      await request(app)
        .post('/api/support/act-as')
        .set('Authorization', 'Bearer valid-token')
        .send({
          targetCompanyId: 'company-123',
          reason: 'Test support session',
        });

      // Verify audit log was created
      expect(mockDb.collection).toHaveBeenCalledWith('audit-logs');
      expect(mockDb.collection().add).toHaveBeenCalled();
    });

    test('Should log admin database modifications', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@ella.ai',
      });

      mockDb.collection().doc().get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ role: 'admin', supportPermissions: { canModifyRecords: true } }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ name: 'Old Name' }),
        });

      mockDb.collection().add.mockResolvedValue({
        id: 'admin-action-123',
      });

      await request(app)
        .post('/api/admin/modify-record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          collection: 'companies',
          documentId: 'company-123',
          action: 'update',
          data: { name: 'New Name' },
          reason: 'Data correction',
        });

      // Verify admin action was logged
      expect(mockDb.collection).toHaveBeenCalledWith('admin-actions');
      expect(mockDb.collection().add).toHaveBeenCalled();
    });
  });
});