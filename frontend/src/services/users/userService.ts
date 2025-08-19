import axios from 'axios';
import { UserProfile } from '../../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface CreateUserRequest {
  email: string;
  displayName: string;
  role: string;
  companyId?: string;
  sendInvitation?: boolean;
  temporaryPassword?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  role?: string;
  companyId?: string;
  isActive?: boolean;
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'suspend' | 'activate' | 'delete' | 'update_role';
  data?: {
    role?: string;
    reason?: string;
    companyId?: string;
  };
}

export interface UserInvitation {
  email: string;
  role: string;
  companyId?: string;
  displayName?: string;
  customMessage?: string;
}

export interface BulkInvitationRequest {
  invitations: UserInvitation[];
  sendImmediately?: boolean;
  expiresInDays?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'suspended' | 'inactive' | 'all';
  companyId?: string;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastSignInAfter?: Date;
  lastSignInBefore?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: UserProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: UserFilters;
}

export interface CSVImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  created: UserProfile[];
}

export interface UserExportRequest {
  filters?: UserFilters;
  format: 'csv' | 'excel' | 'json';
  includeFields: string[];
  includeInactiveUsers?: boolean;
}

class UserService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000, // Increased timeout for bulk operations
  });

  constructor() {
    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Get users with filtering and pagination
  async getUsers(filters: UserFilters = {}, pagination: PaginationParams = {}): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });

      // Add pagination parameters
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await this.axios.get(`/admin/users?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get users:', error);
      throw new Error(error.response?.data?.error || 'Failed to retrieve users');
    }
  }

  // Get single user by ID
  async getUserById(userId: string): Promise<UserProfile> {
    try {
      const response = await this.axios.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user:', error);
      throw new Error(error.response?.data?.error || 'Failed to retrieve user');
    }
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<UserProfile> {
    try {
      const response = await this.axios.post('/admin/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw new Error(error.response?.data?.error || 'Failed to create user');
    }
  }

  // Update user
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UserProfile> {
    try {
      const response = await this.axios.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  }

  // Suspend user
  async suspendUser(userId: string, reason: string, duration?: number): Promise<UserProfile> {
    try {
      const response = await this.axios.post(`/admin/users/${userId}/suspend`, {
        reason,
        duration,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to suspend user:', error);
      throw new Error(error.response?.data?.error || 'Failed to suspend user');
    }
  }

  // Reactivate user
  async reactivateUser(userId: string): Promise<UserProfile> {
    try {
      const response = await this.axios.post(`/admin/users/${userId}/reactivate`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to reactivate user:', error);
      throw new Error(error.response?.data?.error || 'Failed to reactivate user');
    }
  }

  // Delete user
  async deleteUser(userId: string, transferData?: { newOwnerId: string }): Promise<void> {
    try {
      await this.axios.delete(`/admin/users/${userId}`, {
        data: transferData,
      });
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  }

  // Bulk operations
  async performBulkOperation(operation: BulkUserOperation): Promise<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
  }> {
    try {
      const response = await this.axios.post('/admin/users/bulk', operation);
      return response.data;
    } catch (error: any) {
      console.error('Failed to perform bulk operation:', error);
      throw new Error(error.response?.data?.error || 'Failed to perform bulk operation');
    }
  }

  // Send invitations
  async sendInvitations(invitations: BulkInvitationRequest): Promise<{
    successful: number;
    failed: Array<{ email: string; error: string }>;
    invitationIds: string[];
  }> {
    try {
      const response = await this.axios.post('/admin/users/invite', invitations);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send invitations:', error);
      throw new Error(error.response?.data?.error || 'Failed to send invitations');
    }
  }

  // Import users from CSV
  async importFromCSV(csvData: string, options: {
    skipHeader?: boolean;
    defaultRole?: string;
    defaultCompanyId?: string;
    sendInvitations?: boolean;
  } = {}): Promise<CSVImportResult> {
    try {
      const response = await this.axios.post('/admin/users/import-csv', {
        csvData,
        options,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to import users:', error);
      throw new Error(error.response?.data?.error || 'Failed to import users from CSV');
    }
  }

  // Export users
  async exportUsers(request: UserExportRequest): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await this.axios.post('/admin/users/export', request, {
        responseType: 'blob',
      });
      
      // Create download URL
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Extract filename from headers
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `users_export.${request.format}`;

      return { downloadUrl, filename };
    } catch (error: any) {
      console.error('Failed to export users:', error);
      throw new Error(error.response?.data?.error || 'Failed to export users');
    }
  }

  // Get user activity/audit logs
  async getUserActivity(userId: string, options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await this.axios.get(`/admin/users/${userId}/activity?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user activity:', error);
      throw new Error(error.response?.data?.error || 'Failed to retrieve user activity');
    }
  }

  // Validate CSV data before import
  async validateCSV(csvData: string): Promise<{
    valid: boolean;
    errors: Array<{ row: number; field: string; error: string }>;
    preview: any[];
    totalRows: number;
  }> {
    try {
      const response = await this.axios.post('/admin/users/validate-csv', {
        csvData,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to validate CSV:', error);
      throw new Error(error.response?.data?.error || 'Failed to validate CSV data');
    }
  }

  // Get invitation status
  async getInvitations(filters: {
    status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
    companyId?: string;
    email?: string;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await this.axios.get(`/admin/invitations?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get invitations:', error);
      throw new Error(error.response?.data?.error || 'Failed to retrieve invitations');
    }
  }

  // Resend invitation
  async resendInvitation(invitationId: string): Promise<void> {
    try {
      await this.axios.post(`/admin/invitations/${invitationId}/resend`);
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      throw new Error(error.response?.data?.error || 'Failed to resend invitation');
    }
  }

  // Cancel invitation
  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      await this.axios.delete(`/admin/invitations/${invitationId}`);
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel invitation');
    }
  }

  // Company-specific user management
  async getCompanyUsers(companyId: string, filters: UserFilters = {}, pagination: PaginationParams = {}): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add company ID and filters
      params.append('companyId', companyId);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });

      // Add pagination
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await this.axios.get(`/companies/${companyId}/users?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get company users:', error);
      throw new Error(error.response?.data?.error || 'Failed to retrieve company users');
    }
  }

  // Get user statistics
  async getUserStats(filters: UserFilters = {}): Promise<{
    total: number;
    active: number;
    suspended: number;
    byRole: Record<string, number>;
    byCompany: Record<string, number>;
    recentSignUps: number;
    recentActivity: number;
  }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await this.axios.get(`/admin/users/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to retrieve user statistics');
    }
  }
}

export const userService = new UserService();
export default userService;