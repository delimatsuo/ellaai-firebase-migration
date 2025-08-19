import * as admin from 'firebase-admin';

// Core User Types
export interface User {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastSignIn?: admin.firestore.Timestamp;
  lastActiveAt?: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  createdBy?: string;
  invitedBy?: string;
  invitedAt?: admin.firestore.Timestamp;
  activatedAt?: admin.firestore.Timestamp;
  suspendedAt?: admin.firestore.Timestamp;
  deletedAt?: admin.firestore.Timestamp;
  metadata: UserMetadata;
  preferences: UserPreferences;
  security: UserSecurity;
}

export interface CompanyUser extends User {
  companyId: string;
  companyRole: CompanyRole;
  permissions: UserPermissions;
  departmentId?: string;
  position?: string;
  manager?: string;
  joinedCompanyAt: admin.firestore.Timestamp;
  leftCompanyAt?: admin.firestore.Timestamp;
  companyAccess: string[]; // Multiple company access
}

// User Roles and Status
export type UserRole = 'admin' | 'ella_recruiter' | 'company_admin' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'candidate';
export type CompanyRole = 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'deleted' | 'pending_verification';

// User Permissions
export interface UserPermissions {
  canCreateAssessments: boolean;
  canViewAllCandidates: boolean;
  canManageUsers: boolean;
  canModifySettings: boolean;
  canViewBilling: boolean;
  canExportData: boolean;
  canManageIntegrations: boolean;
  canViewReports: boolean;
  canManagePositions: boolean;
  canScheduleInterviews: boolean;
  restrictedToPositions?: string[];
  restrictedToDepartments?: string[];
  customPermissions?: Record<string, boolean>;
}

// User Metadata
export interface UserMetadata {
  loginCount: number;
  failedLoginAttempts: number;
  lastFailedLogin?: admin.firestore.Timestamp;
  passwordLastChanged?: admin.firestore.Timestamp;
  profileCompleted: boolean;
  onboardingCompleted: boolean;
  timezone?: string;
  locale?: string;
  source: UserSource;
  tags?: string[];
  notes?: string;
}

export type UserSource = 'direct_signup' | 'company_invite' | 'admin_created' | 'bulk_import' | 'sso';

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  emailNotifications: EmailNotificationSettings;
  uiSettings: UISettings;
  privacy: PrivacySettings;
}

export interface EmailNotificationSettings {
  assessmentUpdates: boolean;
  candidateUpdates: boolean;
  systemUpdates: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
}

export interface UISettings {
  density: 'compact' | 'comfortable' | 'spacious';
  sidebarCollapsed: boolean;
  defaultView: string;
  itemsPerPage: number;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'company' | 'private';
  shareActivityStatus: boolean;
  allowAnalytics: boolean;
}

// User Security
export interface UserSecurity {
  passwordPolicy: PasswordPolicy;
  sessionSettings: SessionSettings;
  accessRestrictions?: AccessRestrictions;
  auditTrail: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expiryDays?: number;
}

export interface SessionSettings {
  maxSessions: number;
  sessionTimeout: number; // minutes
  requireReauth: boolean;
  ipWhitelist?: string[];
}

export interface AccessRestrictions {
  allowedIPs?: string[];
  blockedIPs?: string[];
  allowedCountries?: string[];
  timeRestrictions?: TimeRestriction[];
  deviceRestrictions?: DeviceRestriction[];
}

export interface TimeRestriction {
  days: number[]; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
}

export interface DeviceRestriction {
  allowMobile: boolean;
  allowDesktop: boolean;
  allowTablet: boolean;
  trustedDevicesOnly: boolean;
}

// User Invitation System
export interface UserInvitation {
  id: string;
  email: string;
  companyId: string;
  inviterUserId: string;
  inviterEmail: string;
  role: CompanyRole;
  permissions: UserPermissions;
  status: InvitationStatus;
  token: string;
  expiresAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  acceptedAt?: admin.firestore.Timestamp;
  rejectedAt?: admin.firestore.Timestamp;
  remindersSent: number;
  lastReminderAt?: admin.firestore.Timestamp;
  metadata: InvitationMetadata;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface InvitationMetadata {
  personalMessage?: string;
  departmentId?: string;
  position?: string;
  manager?: string;
  customData?: Record<string, any>;
  source: 'manual' | 'bulk_import' | 'api';
}

// Bulk Operations
export interface BulkUserOperation {
  id: string;
  type: BulkOperationType;
  companyId: string;
  initiatedBy: string;
  status: BulkOperationStatus;
  totalUsers: number;
  processedUsers: number;
  successfulUsers: number;
  failedUsers: number;
  progress: number; // 0-100
  results: BulkOperationResult[];
  errors: BulkOperationError[];
  createdAt: admin.firestore.Timestamp;
  startedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  metadata: BulkOperationMetadata;
}

export type BulkOperationType = 'create' | 'update' | 'delete' | 'suspend' | 'reactivate' | 'invite';
export type BulkOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BulkOperationResult {
  userId?: string;
  email: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  error?: string;
}

export interface BulkOperationError {
  line?: number;
  email?: string;
  field?: string;
  error: string;
  code: string;
}

export interface BulkOperationMetadata {
  filename?: string;
  fileSize?: number;
  csvHeaders?: string[];
  validationRules?: Record<string, any>;
  dryRun: boolean;
  sendInviteEmails: boolean;
  customSettings?: Record<string, any>;
}

// CSV Import/Export
export interface CSVUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: CompanyRole;
  departmentId?: string;
  position?: string;
  phone?: string;
  manager?: string;
  permissions?: Partial<UserPermissions>;
  customFields?: Record<string, string>;
}

export interface CSVImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  processedRows: number;
  errors: CSVImportError[];
  warnings: CSVImportWarning[];
  preview?: CSVUserData[];
}

export interface CSVImportError {
  line: number;
  field?: string;
  value?: string;
  error: string;
  code: string;
}

export interface CSVImportWarning {
  line: number;
  field?: string;
  value?: string;
  warning: string;
  suggestion?: string;
}

// User Session Management
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: LocationInfo;
  userAgent: string;
  isActive: boolean;
  lastActivity: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  terminatedAt?: admin.firestore.Timestamp;
  terminatedBy?: string;
  terminationReason?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  isKnownDevice: boolean;
  fingerprint: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// User Activity and Audit
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  timestamp: admin.firestore.Timestamp;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  result: 'success' | 'failure' | 'partial';
  duration?: number; // milliseconds
}

// API Request/Response Types
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: CompanyRole;
  companyId: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  manager?: string;
  permissions?: Partial<UserPermissions>;
  sendInviteEmail?: boolean;
  customData?: Record<string, any>;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  manager?: string;
  permissions?: Partial<UserPermissions>;
  preferences?: Partial<UserPreferences>;
  metadata?: Partial<UserMetadata>;
}

export interface BulkCreateUsersRequest {
  companyId: string;
  users: CreateUserRequest[];
  sendInviteEmails: boolean;
  dryRun?: boolean;
}

export interface UserListQuery {
  companyId?: string;
  role?: CompanyRole;
  status?: UserStatus;
  departmentId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

export interface UserListResponse {
  users: CompanyUser[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: Record<string, any>;
}

export interface InviteUserRequest {
  email: string;
  role: CompanyRole;
  permissions?: Partial<UserPermissions>;
  personalMessage?: string;
  departmentId?: string;
  position?: string;
  manager?: string;
  expiresInDays?: number;
}

export interface UserActionResponse {
  success: boolean;
  userId?: string;
  message: string;
  errors?: string[];
  warnings?: string[];
}

// Password and Security
export interface PasswordResetRequest {
  userId: string;
  reason: string;
  sendEmail: boolean;
  temporaryPassword?: boolean;
  expiresInHours?: number;
}

export interface ForceLogoutRequest {
  userId: string;
  reason: string;
  excludeCurrentSession?: boolean;
  notifyUser?: boolean;
}

export interface SecurityAuditResult {
  userId: string;
  lastPasswordChange: admin.firestore.Timestamp;
  activeSessions: number;
  recentFailedLogins: number;
  securityScore: number;
  recommendations: SecurityRecommendation[];
  violations: SecurityViolation[];
}

export interface SecurityRecommendation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: string;
}

export interface SecurityViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: admin.firestore.Timestamp;
  resolved: boolean;
}

// Role Templates
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  companyId: string;
  baseRole: CompanyRole;
  permissions: UserPermissions;
  isDefault: boolean;
  createdBy: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// Export Types
export interface UserExportRequest {
  companyId: string;
  format: 'csv' | 'json' | 'xlsx';
  includeFields: string[];
  filters?: UserListQuery;
  includePersonalData: boolean;
  reason: string;
}

export interface UserExportResult {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalUsers: number;
  downloadUrl?: string;
  expiresAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
}

// Helper function types
export type UserValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}