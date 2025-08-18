import * as admin from 'firebase-admin';

/**
 * Interface for tracking support sessions when Ella Recruiters act as customer companies
 */
export interface SupportSession {
  id: string;
  ellaRecruiterId: string;
  ellaRecruiterEmail: string;
  targetCompanyId: string;
  targetCompanyName: string;
  startedAt: admin.firestore.Timestamp;
  endedAt?: admin.firestore.Timestamp;
  reason: string;
  actions: SupportAction[];
  status: 'active' | 'ended';
  metadata?: {
    originalCompanyId?: string;
    originalRole?: string;
    sessionDuration?: number;
    estimatedDuration?: number;
  };
}

/**
 * Interface for tracking individual actions taken during support sessions
 */
export interface SupportAction {
  timestamp: admin.firestore.Timestamp;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  details?: any;
  statusCode?: number;
}

/**
 * Interface for tracking system admin database modifications with audit trails
 */
export interface AdminAction {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
  collection: string;
  documentId: string;
  oldData?: any;
  newData?: any;
  timestamp: admin.firestore.Timestamp;
  reason: string;
  metadata?: {
    affectedCount?: number;
    batchOperation?: boolean;
    originalRequest?: any;
  };
}

/**
 * Extended user interface with support permissions and context
 */
export interface SupportUser extends admin.auth.DecodedIdToken {
  role?: string;
  companyId?: string;
  companyAccess?: string[];
  supportPermissions?: {
    canActAs: boolean;
    canModifyRecords: boolean;
    allowedCompanies?: string[];
    restrictions?: string[];
  };
  supportContext?: {
    isActingAs: boolean;
    originalUserId?: string;
    supportSessionId?: string;
    targetCompanyId?: string;
    sessionStartTime?: admin.firestore.Timestamp;
  };
}

/**
 * Request payload for starting a support session
 */
export interface ActAsRequest {
  targetCompanyId: string;
  reason: string;
  estimatedDuration?: number; // in minutes
}

/**
 * Request payload for ending a support session
 */
export interface EndSupportSessionRequest {
  sessionId: string;
  summary?: string;
}

/**
 * Request payload for admin record modifications
 */
export interface AdminModifyRecordRequest {
  collection: string;
  documentId: string;
  action: 'create' | 'update' | 'delete';
  data?: any;
  reason: string;
  validateOnly?: boolean; // for dry-run operations
}

/**
 * Response structure for support session operations
 */
export interface SupportSessionResponse {
  success: boolean;
  sessionId?: string;
  supportContext?: {
    isActingAs: boolean;
    targetCompanyId?: string;
    sessionStartTime?: admin.firestore.Timestamp;
  };
  message?: string;
  error?: string;
}

/**
 * Response structure for admin operations
 */
export interface AdminActionResponse {
  success: boolean;
  actionId?: string;
  affectedDocuments?: number;
  changes?: {
    before?: any;
    after?: any;
  };
  message?: string;
  error?: string;
}

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  companyId?: string;
  supportSessionId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Enhanced audit log entry with support context
 */
export interface EnhancedAuditLogEntry {
  id: string;
  timestamp: admin.firestore.Timestamp;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  statusCode?: number;
  duration?: number;
  details?: any;
  supportContext?: {
    isSupportAction: boolean;
    supportSessionId?: string;
    ellaRecruiterId?: string;
    targetCompanyId?: string;
  };
  adminContext?: {
    isAdminAction: boolean;
    adminActionId?: string;
    reason?: string;
  };
}