// User Management Types
export interface UserManagementStats {
  total: number;
  active: number;
  suspended: number;
  byRole: Record<string, number>;
  byCompany: Record<string, number>;
  recentSignUps: number;
  recentActivity: number;
}

export interface UserListFilters {
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

export interface UserBulkAction {
  type: 'suspend' | 'activate' | 'delete' | 'update_role' | 'change_company';
  userIds: string[];
  data?: {
    role?: string;
    reason?: string;
    companyId?: string;
  };
}

export interface UserInvitationData {
  email: string;
  role: string;
  companyId?: string;
  displayName?: string;
  customMessage?: string;
}

export interface BulkInvitationData {
  invitations: UserInvitationData[];
  sendImmediately?: boolean;
  expiresInDays?: number;
}

export interface CSVImportOptions {
  skipHeader?: boolean;
  defaultRole?: string;
  defaultCompanyId?: string;
  sendInvitations?: boolean;
}

export interface CSVValidationError {
  row: number;
  field: string;
  error: string;
  value?: string;
}

export interface CSVImportStats {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  created: any[]; // UserProfile array
}

export interface UserExportOptions {
  filters?: UserListFilters;
  format: 'csv' | 'excel' | 'json';
  includeFields: string[];
  includeInactiveUsers?: boolean;
}

export interface UserActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface ExtendedUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'candidate' | 'recruiter' | 'hiring_manager' | 'admin' | 'system_admin';
  companyId?: string;
  companyAccess?: string[];
  emailVerified: boolean;
  lastSignIn?: Date;
  createdAt: Date;
  isActive: boolean;
  suspendedAt?: Date;
  suspendedBy?: string;
  suspensionReason?: string;
  permissions?: UserPermission[];
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  userCount?: number;
}

export interface UserManagementConfig {
  roles: Array<{
    value: string;
    label: string;
    color: string;
    permissions?: string[];
  }>;
  statuses: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  bulkOperations: Array<{
    type: string;
    label: string;
    description: string;
    requiresConfirmation: boolean;
    requiresReason?: boolean;
  }>;
}

// Form interfaces
export interface UserProfileFormData {
  displayName?: string;
  role?: string;
  companyId?: string;
  isActive?: boolean;
  permissions?: UserPermission[];
}

export interface UserSuspensionFormData {
  reason: string;
  duration?: number; // days, undefined for indefinite
  notifyUser?: boolean;
  customMessage?: string;
}

export interface UserCreationFormData {
  email: string;
  displayName: string;
  role: string;
  companyId?: string;
  sendInvitation?: boolean;
  temporaryPassword?: string;
  permissions?: UserPermission[];
}

// API Response interfaces
export interface UserListResponse {
  users: ExtendedUserProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: UserListFilters;
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    userId: string;
    error: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export interface InvitationResult {
  successful: number;
  failed: Array<{
    email: string;
    error: string;
  }>;
  invitationIds: string[];
}

// Component prop interfaces
export interface UserTableProps {
  users: ExtendedUserProfile[];
  selectedUsers: Set<string>;
  onSelectUser: (userId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onUserAction: (action: string, user: ExtendedUserProfile) => void;
  loading?: boolean;
}

export interface UserFiltersProps {
  filters: UserListFilters;
  onFilterChange: (field: keyof UserListFilters, value: any) => void;
  companies: Company[];
  roles: UserManagementConfig['roles'];
  statuses: UserManagementConfig['statuses'];
}

export interface BulkActionBarProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
  availableActions: string[];
}

// Event interfaces
export interface UserManagementEvent {
  type: 'user_created' | 'user_updated' | 'user_suspended' | 'user_deleted' | 'bulk_operation';
  timestamp: Date;
  performedBy: string;
  data: Record<string, any>;
}

export interface UserNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
}

// Utility types
export type UserTableColumn = {
  id: string;
  label: string;
  sortable?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (user: ExtendedUserProfile) => React.ReactNode;
};

export type UserManagementAction = 'view' | 'edit' | 'suspend' | 'activate' | 'delete' | 'impersonate' | 'export';

export type BulkOperationType = 'suspend' | 'activate' | 'delete' | 'update_role' | 'change_company' | 'export';

export type UserImportSource = 'csv' | 'excel' | 'json' | 'api';

export type UserExportFormat = 'csv' | 'excel' | 'json' | 'pdf';