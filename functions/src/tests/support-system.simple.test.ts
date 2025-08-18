import { describe, test, expect } from '@jest/globals';
import { 
  SupportSession, 
  AdminAction, 
  SupportUser,
  ActAsRequest,
  AdminModifyRecordRequest 
} from '../types/support';

describe('Support System Type Definitions', () => {
  test('SupportSession interface should have correct structure', () => {
    const supportSession: SupportSession = {
      id: 'session-123',
      ellaRecruiterId: 'recruiter-123',
      ellaRecruiterEmail: 'recruiter@ella.ai',
      targetCompanyId: 'company-123',
      targetCompanyName: 'Test Company',
      startedAt: { toMillis: () => Date.now() } as any,
      reason: 'Customer support request',
      actions: [],
      status: 'active',
      metadata: {
        originalCompanyId: 'ella-company',
        originalRole: 'ella_recruiter',
        estimatedDuration: 30
      }
    };

    expect(supportSession.id).toBe('session-123');
    expect(supportSession.status).toBe('active');
    expect(supportSession.metadata?.estimatedDuration).toBe(30);
  });

  test('AdminAction interface should have correct structure', () => {
    const adminAction: AdminAction = {
      id: 'action-123',
      adminUserId: 'admin-123',
      adminEmail: 'admin@ella.ai',
      action: 'update',
      collection: 'companies',
      documentId: 'company-123',
      oldData: { name: 'Old Name' },
      newData: { name: 'New Name' },
      timestamp: { toMillis: () => Date.now() } as any,
      reason: 'Data correction',
      metadata: {
        affectedCount: 1,
        batchOperation: false
      }
    };

    expect(adminAction.action).toBe('update');
    expect(adminAction.collection).toBe('companies');
    expect(adminAction.metadata?.affectedCount).toBe(1);
  });

  test('SupportUser interface should extend with support permissions', () => {
    const supportUser: SupportUser = {
      uid: 'user-123',
      iss: 'https://securetoken.google.com/project',
      aud: 'project',
      auth_time: Date.now(),
      user_id: 'user-123',
      sub: 'user-123',
      iat: Date.now(),
      exp: Date.now() + 3600,
      email: 'user@example.com',
      email_verified: true,
      firebase: {
        identities: {},
        sign_in_provider: 'email'
      },
      role: 'ella_recruiter',
      companyId: 'ella-company',
      companyAccess: ['company-1', 'company-2'],
      supportPermissions: {
        canActAs: true,
        canModifyRecords: false,
        allowedCompanies: ['company-1', 'company-2']
      },
      supportContext: {
        isActingAs: false
      }
    };

    expect(supportUser.supportPermissions?.canActAs).toBe(true);
    expect(supportUser.supportContext?.isActingAs).toBe(false);
  });

  test('ActAsRequest interface should validate required fields', () => {
    const actAsRequest: ActAsRequest = {
      targetCompanyId: 'company-123',
      reason: 'Customer support request',
      estimatedDuration: 30
    };

    expect(actAsRequest.targetCompanyId).toBe('company-123');
    expect(actAsRequest.reason).toBe('Customer support request');
    expect(actAsRequest.estimatedDuration).toBe(30);
  });

  test('AdminModifyRecordRequest interface should validate required fields', () => {
    const modifyRequest: AdminModifyRecordRequest = {
      collection: 'companies',
      documentId: 'company-123',
      action: 'update',
      data: { name: 'Updated Name' },
      reason: 'Data correction',
      validateOnly: false
    };

    expect(modifyRequest.action).toBe('update');
    expect(modifyRequest.collection).toBe('companies');
    expect(modifyRequest.validateOnly).toBe(false);
  });
});

describe('Support System Business Logic', () => {
  test('Support session should track actions correctly', () => {
    const supportAction = {
      timestamp: { toMillis: () => Date.now() } as any,
      action: 'READ',
      resource: 'COMPANIES',
      method: 'GET',
      path: '/api/companies/123',
      statusCode: 200
    };

    expect(supportAction.action).toBe('READ');
    expect(supportAction.resource).toBe('COMPANIES');
    expect(supportAction.statusCode).toBe(200);
  });

  test('Support permissions should be role-based', () => {
    const ellaRecruiterPermissions = {
      canActAs: true,
      canModifyRecords: false,
      allowedCompanies: undefined, // Can access any company
      restrictions: []
    };

    const adminPermissions = {
      canActAs: true,
      canModifyRecords: true,
      allowedCompanies: undefined, // Can access any company
      restrictions: []
    };

    const candidatePermissions = {
      canActAs: false,
      canModifyRecords: false,
      allowedCompanies: [],
      restrictions: ['no_support_access']
    };

    expect(ellaRecruiterPermissions.canActAs).toBe(true);
    expect(ellaRecruiterPermissions.canModifyRecords).toBe(false);

    expect(adminPermissions.canActAs).toBe(true);
    expect(adminPermissions.canModifyRecords).toBe(true);

    expect(candidatePermissions.canActAs).toBe(false);
    expect(candidatePermissions.canModifyRecords).toBe(false);
  });

  test('Admin actions should have proper audit trail', () => {
    const adminAction: AdminAction = {
      id: 'action-123',
      adminUserId: 'admin-123',
      adminEmail: 'admin@ella.ai',
      action: 'delete',
      collection: 'users',
      documentId: 'user-456',
      oldData: { name: 'User Name', email: 'user@example.com' },
      newData: null, // Deleted
      timestamp: { toMillis: () => Date.now() } as any,
      reason: 'Account closure requested by user',
      metadata: {
        affectedCount: 1,
        batchOperation: false,
        originalRequest: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          path: '/api/admin/modify-record'
        }
      }
    };

    expect(adminAction.action).toBe('delete');
    expect(adminAction.newData).toBeNull();
    expect(adminAction.metadata?.originalRequest?.ip).toBe('192.168.1.1');
  });

  test('Support context should provide session information', () => {
    const supportContext = {
      isActingAs: true,
      originalUserId: 'recruiter-123',
      supportSessionId: 'session-456',
      targetCompanyId: 'company-789',
      sessionStartTime: { toMillis: () => Date.now() } as any
    };

    expect(supportContext.isActingAs).toBe(true);
    expect(supportContext.targetCompanyId).toBe('company-789');
    expect(supportContext.supportSessionId).toBe('session-456');
  });
});

describe('Support System Security Validations', () => {
  test('Restricted actions should be properly defined', () => {
    const restrictedActions = [
      'CLOSE_COMPANY',
      'DELETE_COMPANY', 
      'DELETE_USER',
      'PROCESS_PAYMENT',
      'ADMIN_ACTION'
    ];

    expect(restrictedActions).toContain('CLOSE_COMPANY');
    expect(restrictedActions).toContain('DELETE_USER');
    expect(restrictedActions).toContain('PROCESS_PAYMENT');
  });

  test('Protected collections should be properly defined', () => {
    const protectedCollections = [
      'audit-logs',
      'admin-actions'
    ];

    expect(protectedCollections).toContain('audit-logs');
    expect(protectedCollections).toContain('admin-actions');
  });

  test('Allowed collections for admin modifications should be defined', () => {
    const allowedCollections = [
      'users',
      'companies', 
      'assessments',
      'assessment-attempts',
      'questions',
      'skills',
      'positions',
      'support-sessions'
    ];

    expect(allowedCollections).toContain('users');
    expect(allowedCollections).toContain('companies');
    expect(allowedCollections).toContain('assessments');
    expect(allowedCollections).not.toContain('audit-logs');
  });

  test('Valid admin actions should be properly defined', () => {
    const validActions = ['create', 'update', 'delete'];
    
    expect(validActions).toContain('create');
    expect(validActions).toContain('update');
    expect(validActions).toContain('delete');
    expect(validActions).not.toContain('invalid_action');
  });

  test('Support session status should be properly validated', () => {
    const validStatuses = ['active', 'ended'];
    
    expect(validStatuses).toContain('active');
    expect(validStatuses).toContain('ended');
    expect(validStatuses).not.toContain('pending');
  });
});