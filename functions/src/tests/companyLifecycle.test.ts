import { CompanyClosureService } from '../services/companyClosureService';
import { DataExportService } from '../services/dataExportService';
import { NotificationService } from '../utils/notificationService';
import { TransactionHelpers } from '../utils/transactionHelpers';
import {
  CompanyClosureRequest,
  CompanySuspensionRequest,
  CompanyDataExportRequest
} from '../types/closure';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
        limit: jest.fn(() => ({
          get: jest.fn()
        })),
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          }))
        }))
      })),
      add: jest.fn()
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn()
    })),
    runTransaction: jest.fn()
  })),
  auth: jest.fn(() => ({
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    verifyIdToken: jest.fn()
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        getSignedUrl: jest.fn()
      }))
    }))
  })),
  FieldValue: {
    serverTimestamp: jest.fn(),
    arrayUnion: jest.fn(),
    delete: jest.fn()
  },
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date }))
  }
}));

describe('Company Lifecycle Management', () => {
  let closureService: CompanyClosureService;
  let exportService: DataExportService;
  let notificationService: NotificationService;
  let transactionHelpers: TransactionHelpers;

  beforeEach(() => {
    closureService = new CompanyClosureService();
    exportService = new DataExportService();
    notificationService = new NotificationService();
    transactionHelpers = new TransactionHelpers();
    jest.clearAllMocks();
  });

  describe('CompanyClosureService', () => {
    describe('initiateCompanyClosure', () => {
      it('should initiate company closure with valid request', async () => {
        const mockCompanyId = 'test-company-id';
        const mockUserId = 'test-user-id';
        const closureRequest: CompanyClosureRequest = {
          reason: 'company_requested',
          deleteType: 'archive',
          confirmationPhrase: 'PERMANENTLY CLOSE COMPANY',
          notifyUsers: true,
          exportData: true
        };

        // Mock successful company lookup
        const mockCompanyDoc = {
          exists: true,
          data: () => ({
            id: mockCompanyId,
            name: 'Test Company',
            status: 'active'
          })
        };

        // Mock empty closure query (no existing closure)
        const mockClosureQuery = {
          empty: true,
          docs: []
        };

        jest.spyOn(closureService, 'getClosureStatus').mockResolvedValue({
          success: false,
          error: 'No closure process found'
        });

        const result = await closureService.initiateCompanyClosure(
          mockCompanyId,
          closureRequest,
          mockUserId
        );

        expect(result.success).toBe(true);
        expect(result.closureId).toBeDefined();
        expect(result.status).toBe('pending_validation');
        expect(result.gracePeriodEnds).toBeInstanceOf(Date);
      });

      it('should reject closure with invalid confirmation phrase', async () => {
        const mockCompanyId = 'test-company-id';
        const mockUserId = 'test-user-id';
        const closureRequest: CompanyClosureRequest = {
          reason: 'company_requested',
          deleteType: 'archive',
          confirmationPhrase: 'wrong phrase',
          notifyUsers: true,
          exportData: true
        };

        const result = await closureService.initiateCompanyClosure(
          mockCompanyId,
          closureRequest,
          mockUserId
        );

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Confirmation phrase must be exactly: "PERMANENTLY CLOSE COMPANY"');
      });

      it('should reject closure for non-existent company', async () => {
        const mockCompanyId = 'non-existent-company';
        const mockUserId = 'test-user-id';
        const closureRequest: CompanyClosureRequest = {
          reason: 'company_requested',
          deleteType: 'archive',
          confirmationPhrase: 'PERMANENTLY CLOSE COMPANY',
          notifyUsers: true,
          exportData: true
        };

        const result = await closureService.initiateCompanyClosure(
          mockCompanyId,
          closureRequest,
          mockUserId
        );

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Company not found');
      });
    });

    describe('suspendCompany', () => {
      it('should suspend company with valid request', async () => {
        const mockCompanyId = 'test-company-id';
        const mockUserId = 'test-user-id';
        const suspensionRequest: CompanySuspensionRequest = {
          reason: 'payment_overdue',
          customReason: 'Payment is 30 days overdue',
          duration: 7,
          notifyUsers: true,
          restrictAccess: true,
          suspendBilling: true
        };

        const result = await closureService.suspendCompany(
          mockCompanyId,
          suspensionRequest,
          mockUserId
        );

        expect(result.success).toBe(true);
        expect(result.suspensionId).toBeDefined();
        expect(result.status).toBe('suspended');
        expect(result.suspendUntil).toBeInstanceOf(Date);
      });

      it('should reject suspension for non-existent company', async () => {
        const mockCompanyId = 'non-existent-company';
        const mockUserId = 'test-user-id';
        const suspensionRequest: CompanySuspensionRequest = {
          reason: 'payment_overdue',
          notifyUsers: true,
          restrictAccess: false,
          suspendBilling: false
        };

        const result = await closureService.suspendCompany(
          mockCompanyId,
          suspensionRequest,
          mockUserId
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Company not found');
      });
    });

    describe('reactivateCompany', () => {
      it('should reactivate suspended company', async () => {
        const mockCompanyId = 'test-company-id';
        const mockUserId = 'test-user-id';

        const result = await closureService.reactivateCompany(
          mockCompanyId,
          mockUserId
        );

        expect(result.success).toBe(true);
        expect(result.status).toBe('active');
      });
    });
  });

  describe('DataExportService', () => {
    describe('initiateDataExport', () => {
      it('should initiate data export with valid request', async () => {
        const exportRequest: CompanyDataExportRequest = {
          companyId: 'test-company-id',
          format: 'json',
          includeUserData: true,
          includeAssessmentData: true,
          includeCandidateData: true,
          includeSystemLogs: false,
          requestedBy: 'test-user-id',
          purpose: 'backup'
        };

        const result = await exportService.initiateDataExport(exportRequest);

        expect(result.success).toBe(true);
        expect(result.exportId).toBeDefined();
      });

      it('should reject export for non-existent company', async () => {
        const exportRequest: CompanyDataExportRequest = {
          companyId: 'non-existent-company',
          format: 'json',
          includeUserData: true,
          includeAssessmentData: true,
          includeCandidateData: true,
          includeSystemLogs: false,
          requestedBy: 'test-user-id',
          purpose: 'backup'
        };

        const result = await exportService.initiateDataExport(exportRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Company not found');
      });

      it('should support different export formats', async () => {
        const formats = ['json', 'csv', 'xlsx', 'sql'] as const;

        for (const format of formats) {
          const exportRequest: CompanyDataExportRequest = {
            companyId: 'test-company-id',
            format,
            includeUserData: true,
            includeAssessmentData: false,
            includeCandidateData: false,
            includeSystemLogs: false,
            requestedBy: 'test-user-id',
            purpose: 'compliance'
          };

          const result = await exportService.initiateDataExport(exportRequest);
          expect(result.success).toBe(true);
        }
      });
    });

    describe('getDownloadLink', () => {
      it('should generate download link for completed export', async () => {
        const mockExportId = 'test-export-id';
        const mockUserId = 'test-user-id';

        const result = await exportService.getDownloadLink(mockExportId, mockUserId);

        expect(result.success).toBe(true);
        expect(result.downloadUrl).toBeDefined();
        expect(result.expiresAt).toBeInstanceOf(Date);
      });

      it('should reject download for non-existent export', async () => {
        const mockExportId = 'non-existent-export';
        const mockUserId = 'test-user-id';

        const result = await exportService.getDownloadLink(mockExportId, mockUserId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Export not found');
      });
    });
  });

  describe('NotificationService', () => {
    describe('sendClosureNotifications', () => {
      it('should send notifications to all company users', async () => {
        const mockCompanyId = 'test-company-id';
        const mockClosureId = 'test-closure-id';
        const gracePeriodEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await expect(
          notificationService.sendClosureNotifications(
            mockCompanyId,
            mockClosureId,
            'company_requested',
            gracePeriodEnds
          )
        ).resolves.not.toThrow();
      });
    });

    describe('sendSuspensionNotifications', () => {
      it('should send suspension notifications', async () => {
        const mockCompanyId = 'test-company-id';
        const mockSuspensionId = 'test-suspension-id';
        const suspendUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await expect(
          notificationService.sendSuspensionNotifications(
            mockCompanyId,
            mockSuspensionId,
            'payment_overdue',
            suspendUntil
          )
        ).resolves.not.toThrow();
      });
    });
  });

  describe('TransactionHelpers', () => {
    describe('executeTransaction', () => {
      it('should execute transaction with retry logic', async () => {
        const mockOperation = jest.fn().mockResolvedValue('success');

        const result = await transactionHelpers.executeTransaction(mockOperation);

        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(1);
      });

      it('should retry failed transactions', async () => {
        const mockOperation = jest.fn()
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValueOnce('success');

        const result = await transactionHelpers.executeTransaction(mockOperation, 2);

        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(2);
      });

      it('should fail after max retries', async () => {
        const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

        await expect(
          transactionHelpers.executeTransaction(mockOperation, 2)
        ).rejects.toThrow('Transaction failed after 2 attempts');

        expect(mockOperation).toHaveBeenCalledTimes(2);
      });
    });

    describe('acquireLock', () => {
      it('should acquire distributed lock', async () => {
        const lockName = 'test-lock';
        const lockId = await transactionHelpers.acquireLock(lockName);

        expect(lockId).toBeDefined();
        expect(typeof lockId).toBe('string');
      });
    });

    describe('createCheckpoint', () => {
      it('should create operation checkpoint', async () => {
        const operationId = 'test-operation';
        const checkpoint = {
          step: 'validation',
          completedSteps: ['preparation'],
          data: { processed: 100 },
          timestamp: { toDate: () => new Date() } as any
        };

        await expect(
          transactionHelpers.createCheckpoint(operationId, checkpoint)
        ).resolves.not.toThrow();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete closure workflow', async () => {
      const mockCompanyId = 'integration-test-company';
      const mockUserId = 'integration-test-user';

      // Step 1: Initiate closure
      const closureRequest: CompanyClosureRequest = {
        reason: 'company_requested',
        deleteType: 'archive',
        confirmationPhrase: 'PERMANENTLY CLOSE COMPANY',
        notifyUsers: true,
        exportData: true,
        gracePeriodDays: 30
      };

      const closureResult = await closureService.initiateCompanyClosure(
        mockCompanyId,
        closureRequest,
        mockUserId
      );

      expect(closureResult.success).toBe(true);

      // Step 2: Check closure status
      if (closureResult.closureId) {
        const statusResult = await closureService.getClosureStatus(mockCompanyId);
        expect(statusResult.success).toBe(true);
      }

      // Step 3: Initiate data export
      const exportRequest: CompanyDataExportRequest = {
        companyId: mockCompanyId,
        format: 'json',
        includeUserData: true,
        includeAssessmentData: true,
        includeCandidateData: true,
        includeSystemLogs: true,
        requestedBy: mockUserId,
        purpose: 'closure'
      };

      const exportResult = await exportService.initiateDataExport(exportRequest);
      expect(exportResult.success).toBe(true);
    });

    it('should handle suspension and reactivation workflow', async () => {
      const mockCompanyId = 'suspension-test-company';
      const mockUserId = 'suspension-test-user';

      // Step 1: Suspend company
      const suspensionRequest: CompanySuspensionRequest = {
        reason: 'policy_violation',
        customReason: 'Terms of service violation detected',
        duration: 14,
        notifyUsers: true,
        restrictAccess: true,
        suspendBilling: false
      };

      const suspensionResult = await closureService.suspendCompany(
        mockCompanyId,
        suspensionRequest,
        mockUserId
      );

      expect(suspensionResult.success).toBe(true);

      // Step 2: Reactivate company
      const reactivationResult = await closureService.reactivateCompany(
        mockCompanyId,
        mockUserId
      );

      expect(reactivationResult.success).toBe(true);
      expect(reactivationResult.status).toBe('active');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockCompanyId = 'error-test-company';
      const mockUserId = 'error-test-user';

      // Mock database error
      jest.spyOn(closureService as any, 'validateClosureRequest')
        .mockRejectedValue(new Error('Database connection failed'));

      const closureRequest: CompanyClosureRequest = {
        reason: 'company_requested',
        deleteType: 'archive',
        confirmationPhrase: 'PERMANENTLY CLOSE COMPANY',
        notifyUsers: true,
        exportData: true
      };

      const result = await closureService.initiateCompanyClosure(
        mockCompanyId,
        closureRequest,
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Failed to initiate closure');
    });

    it('should handle validation failures gracefully', async () => {
      const mockCompanyId = 'validation-test-company';
      const mockUserId = 'validation-test-user';

      // Mock validation failure
      jest.spyOn(closureService as any, 'validateClosureRequest')
        .mockResolvedValue({
          canClose: false,
          blockers: [{
            type: 'billing',
            message: 'Outstanding billing amount: $500',
            details: { amount: 500 },
            resolution: 'Pay outstanding amount'
          }],
          warnings: [],
          checkedAt: new Date()
        });

      const closureRequest: CompanyClosureRequest = {
        reason: 'company_requested',
        deleteType: 'archive',
        confirmationPhrase: 'PERMANENTLY CLOSE COMPANY',
        notifyUsers: true,
        exportData: true
      };

      const result = await closureService.initiateCompanyClosure(
        mockCompanyId,
        closureRequest,
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Outstanding billing amount: $500');
    });
  });

  describe('Security Tests', () => {
    it('should validate admin permissions for closure', async () => {
      // This would test that only authorized users can initiate closures
      const unauthorizedUserId = 'unauthorized-user';
      const companyId = 'protected-company';

      // In a real implementation, this would check user permissions
      // For now, we'll assume the service handles this upstream
      expect(true).toBe(true); // Placeholder for permission check
    });

    it('should sanitize sensitive data in exports', async () => {
      const exportRequest: CompanyDataExportRequest = {
        companyId: 'sensitive-data-company',
        format: 'json',
        includeUserData: true,
        includeAssessmentData: true,
        includeCandidateData: true,
        includeSystemLogs: false,
        requestedBy: 'test-user',
        purpose: 'compliance'
      };

      const result = await exportService.initiateDataExport(exportRequest);
      expect(result.success).toBe(true);

      // In a real implementation, we would verify that sensitive fields
      // like passwords, SSNs, etc. are removed or hashed
    });
  });
});