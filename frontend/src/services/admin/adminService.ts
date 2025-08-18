import { 
  SystemMetrics, 
  AuditLogEntry, 
  UserProfile, 
  CompanyAccount, 
  SystemHealth, 
  QueryResult,
  DatabaseQuery,
  ImpersonationSession 
} from '../../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-dl3telj45a-uc.a.run.app';

class AdminService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing errors, use default message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // System Metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.makeRequest<SystemMetrics>('/api/admin/stats');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.makeRequest<SystemHealth>('/health');
  }

  // User Management
  async getUsers(filters?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: UserProfile[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (filters?.search) searchParams.append('search', filters.search);
    if (filters?.role) searchParams.append('role', filters.role);
    if (filters?.status) searchParams.append('status', filters.status);
    if (filters?.page) searchParams.append('page', filters.page.toString());
    if (filters?.limit) searchParams.append('limit', filters.limit.toString());

    return this.makeRequest<{ users: UserProfile[]; total: number }>(
      `/api/admin/users?${searchParams.toString()}`
    );
  }

  async getUserById(userId: string): Promise<UserProfile> {
    return this.makeRequest<UserProfile>(`/api/admin/users/${userId}`);
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.makeRequest<UserProfile>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unsuspendUser(userId: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/users/${userId}/unsuspend`, {
      method: 'POST',
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // User Impersonation
  async startImpersonation(userId: string, reason: string, duration: number): Promise<ImpersonationSession> {
    return this.makeRequest<ImpersonationSession>('/api/admin/impersonation/start', {
      method: 'POST',
      body: JSON.stringify({ userId, reason, duration }),
    });
  }

  async endImpersonation(sessionId: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/impersonation/${sessionId}/end`, {
      method: 'POST',
    });
  }

  async getActiveImpersonationSessions(): Promise<ImpersonationSession[]> {
    return this.makeRequest<ImpersonationSession[]>('/api/admin/impersonation/active');
  }

  // Company/Account Management
  async getCompanies(filters?: {
    search?: string;
    plan?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ companies: CompanyAccount[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (filters?.search) searchParams.append('search', filters.search);
    if (filters?.plan) searchParams.append('plan', filters.plan);
    if (filters?.status) searchParams.append('status', filters.status);
    if (filters?.page) searchParams.append('page', filters.page.toString());
    if (filters?.limit) searchParams.append('limit', filters.limit.toString());

    return this.makeRequest<{ companies: CompanyAccount[]; total: number }>(
      `/api/companies?${searchParams.toString()}`
    );
  }

  async getCompanyById(companyId: string): Promise<CompanyAccount> {
    return this.makeRequest<CompanyAccount>(`/api/companies/${companyId}`);
  }

  async updateCompany(companyId: string, updates: Partial<CompanyAccount>): Promise<CompanyAccount> {
    return this.makeRequest<CompanyAccount>(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async suspendCompany(companyId: string, reason: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/companies/${companyId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async activateCompany(companyId: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/companies/${companyId}/reactivate`, {
      method: 'POST',
    });
  }

  async closeCompany(companyId: string, reason: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/companies/${companyId}/close`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Database Queries
  async executeQuery(collection: string, query: string): Promise<QueryResult> {
    return this.makeRequest<QueryResult>('/admin/database/query', {
      method: 'POST',
      body: JSON.stringify({ collection, query }),
    });
  }

  async getSavedQueries(): Promise<DatabaseQuery[]> {
    return this.makeRequest<DatabaseQuery[]>('/admin/database/queries');
  }

  async saveQuery(query: Omit<DatabaseQuery, 'id' | 'createdAt' | 'createdBy'>): Promise<DatabaseQuery> {
    return this.makeRequest<DatabaseQuery>('/admin/database/queries', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async deleteQuery(queryId: string): Promise<void> {
    return this.makeRequest<void>(`/admin/database/queries/${queryId}`, {
      method: 'DELETE',
    });
  }

  async getQueryHistory(): Promise<QueryResult[]> {
    return this.makeRequest<QueryResult[]>('/admin/database/history');
  }

  // Audit Logs
  async getAuditLogs(filters?: {
    search?: string;
    action?: string;
    severity?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (filters?.search) searchParams.append('search', filters.search);
    if (filters?.action) searchParams.append('action', filters.action);
    if (filters?.severity) searchParams.append('severity', filters.severity);
    if (filters?.userId) searchParams.append('userId', filters.userId);
    if (filters?.startDate) searchParams.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) searchParams.append('endDate', filters.endDate.toISOString());
    if (filters?.page) searchParams.append('page', filters.page.toString());
    if (filters?.limit) searchParams.append('limit', filters.limit.toString());

    return this.makeRequest<{ logs: AuditLogEntry[]; total: number }>(
      `/api/admin/audit-logs?${searchParams.toString()}`
    );
  }

  async getAuditLogById(logId: string): Promise<AuditLogEntry> {
    return this.makeRequest<AuditLogEntry>(`/api/admin/audit-logs/${logId}`);
  }

  // System Configuration
  async getSystemConfig(): Promise<Record<string, any>> {
    return this.makeRequest<Record<string, any>>('/admin/config');
  }

  async updateSystemConfig(config: Record<string, any>): Promise<void> {
    return this.makeRequest<void>('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Feature Flags
  async getFeatureFlags(): Promise<any[]> {
    return this.makeRequest<any[]>('/admin/feature-flags');
  }

  async updateFeatureFlag(flagId: string, updates: any): Promise<any> {
    return this.makeRequest<any>(`/admin/feature-flags/${flagId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Reports and Analytics
  async generateUserReport(filters?: any): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/admin/reports/users`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters || {}),
    });

    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async generateAuditReport(filters?: any): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/admin/reports/audit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters || {}),
    });

    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Security
  async getSecurityEvents(): Promise<any[]> {
    return this.makeRequest<any[]>('/admin/security/events');
  }

  async blockIpAddress(ipAddress: string, reason: string): Promise<void> {
    return this.makeRequest<void>('/admin/security/block-ip', {
      method: 'POST',
      body: JSON.stringify({ ipAddress, reason }),
    });
  }

  async unblockIpAddress(ipAddress: string): Promise<void> {
    return this.makeRequest<void>('/admin/security/unblock-ip', {
      method: 'POST',
      body: JSON.stringify({ ipAddress }),
    });
  }

  // Company Creation Wizard
  async getCompanyPlans(): Promise<any[]> {
    return this.makeRequest<any[]>('/api/admin/companies/wizard/plans');
  }

  async checkDomainAvailability(domain: string): Promise<any> {
    return this.makeRequest<any>('/api/admin/companies/wizard/check-domain', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  async validateWizardData(wizardData: any): Promise<any> {
    return this.makeRequest<any>('/api/admin/companies/wizard/validate', {
      method: 'POST',
      body: JSON.stringify(wizardData),
    });
  }

  async createCompanyWizard(wizardData: any): Promise<any> {
    return this.makeRequest<any>('/api/admin/companies/wizard/create', {
      method: 'POST',
      body: JSON.stringify(wizardData),
    });
  }

  // Company Lifecycle Management
  async closeCompanyWithDetails(companyId: string, request: import('../../types/admin').CompanyClosureRequest): Promise<void> {
    return this.makeRequest<void>(`/api/admin/companies/${companyId}/close`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async suspendCompanyWithDetails(companyId: string, request: import('../../types/admin').CompanySuspensionRequest): Promise<void> {
    return this.makeRequest<void>(`/api/admin/companies/${companyId}/suspend`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async reactivateCompany(companyId: string, reason?: string): Promise<void> {
    return this.makeRequest<void>(`/api/admin/companies/${companyId}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Data Export
  async createDataExport(request: import('../../types/admin').DataExportRequest): Promise<import('../../types/admin').DataExportJob> {
    return this.makeRequest<import('../../types/admin').DataExportJob>(`/api/admin/companies/${request.companyId}/export`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getExportJob(companyId: string, exportId: string): Promise<import('../../types/admin').DataExportJob> {
    return this.makeRequest<import('../../types/admin').DataExportJob>(`/api/admin/companies/${companyId}/export/${exportId}/status`);
  }

  async getCompanyExports(companyId: string): Promise<import('../../types/admin').DataExportJob[]> {
    return this.makeRequest<import('../../types/admin').DataExportJob[]>(`/api/admin/companies/${companyId}/exports`);
  }

  // Lifecycle History
  async getCompanyLifecycleHistory(companyId: string): Promise<import('../../types/admin').CompanyLifecycleHistory> {
    return this.makeRequest<import('../../types/admin').CompanyLifecycleHistory>(`/api/admin/companies/${companyId}/lifecycle-history`);
  }
}

export const adminService = new AdminService();
export default adminService;