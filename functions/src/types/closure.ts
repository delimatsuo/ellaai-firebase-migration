import * as admin from 'firebase-admin';

// Company Closure Types and Interfaces

export interface CompanyClosureRequest {
  reason: ClosureReason;
  customReason?: string;
  gracePeriodDays?: number;
  deleteType: 'archive' | 'permanent';
  confirmationPhrase: string;
  notifyUsers: boolean;
  exportData: boolean;
  scheduledAt?: Date;
}

export interface CompanyClosureStatus {
  companyId: string;
  status: ClosureStatusType;
  reason: ClosureReason;
  customReason?: string;
  initiatedBy: string;
  initiatedAt: admin.firestore.Timestamp;
  scheduledAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  gracePeriodEnds?: admin.firestore.Timestamp;
  deleteType: 'archive' | 'permanent';
  progress: ClosureProgress;
  rollbackAvailable: boolean;
  dataExportUrl?: string;
  dataExportExpires?: admin.firestore.Timestamp;
  notifications: ClosureNotification[];
  auditTrail: ClosureAuditEntry[];
  metadata: ClosureMetadata;
}

export interface ClosureProgress {
  step: ClosureStep;
  completedSteps: ClosureStep[];
  failedSteps: ClosureStep[];
  totalSteps: number;
  percentage: number;
  estimatedTimeRemaining?: number; // minutes
  lastUpdated: admin.firestore.Timestamp;
}

export interface ClosureNotification {
  id: string;
  type: NotificationType;
  recipient: string;
  sentAt?: admin.firestore.Timestamp;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  content: {
    subject: string;
    message: string;
    actionRequired?: boolean;
    deadlineDate?: Date;
  };
}

export interface ClosureAuditEntry {
  id: string;
  timestamp: admin.firestore.Timestamp;
  action: string;
  performedBy: string;
  details: Record<string, any>;
  outcome: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}

export interface ClosureMetadata {
  originalCompanySize: number;
  totalUsers: number;
  totalAssessments: number;
  totalCandidates: number;
  storageUsed: number; // bytes
  activeSubscription: boolean;
  outstandingBilling: number;
  lastBillingCheck: admin.firestore.Timestamp;
  preClosureValidation: ValidationResults;
  dataRetentionCertificate?: DataRetentionCertificate;
}

export interface ValidationResults {
  canClose: boolean;
  blockers: ValidationBlocker[];
  warnings: ValidationWarning[];
  checkedAt: admin.firestore.Timestamp;
}

export interface ValidationBlocker {
  type: 'billing' | 'active_assessments' | 'system_dependency' | 'legal_hold';
  message: string;
  details: Record<string, any>;
  resolution?: string;
}

export interface ValidationWarning {
  type: 'data_loss' | 'user_impact' | 'integration_break';
  message: string;
  impact: 'low' | 'medium' | 'high';
  details?: Record<string, any>;
}

export interface DataRetentionCertificate {
  certificateId: string;
  companyId: string;
  companyName: string;
  dataTypes: string[];
  retentionPeriod: number; // months
  destructionDate: Date;
  issuedAt: admin.firestore.Timestamp;
  issuedBy: string;
  legalBasis: string;
  contactEmail: string;
}

// Data Export Types

export interface CompanyDataExportRequest {
  companyId: string;
  format: ExportFormat;
  includeUserData: boolean;
  includeAssessmentData: boolean;
  includeCandidateData: boolean;
  includeSystemLogs: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  requestedBy: string;
  purpose: 'closure' | 'backup' | 'compliance' | 'migration';
}

export interface CompanyDataExportStatus {
  exportId: string;
  companyId: string;
  status: ExportStatusType;
  format: ExportFormat;
  requestedBy: string;
  requestedAt: admin.firestore.Timestamp;
  startedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  progress: ExportProgress;
  downloadUrl?: string;
  downloadExpires?: admin.firestore.Timestamp;
  fileSize?: number; // bytes
  checksum?: string;
  encryptionKey?: string;
  errorMessage?: string;
  metadata: ExportMetadata;
}

export interface ExportProgress {
  phase: ExportPhase;
  completedTables: string[];
  totalTables: number;
  recordsProcessed: number;
  totalRecords: number;
  percentage: number;
  lastUpdated: admin.firestore.Timestamp;
}

export interface ExportMetadata {
  tablesCounts: Record<string, number>;
  dataTypes: string[];
  sensitiveDataIncluded: boolean;
  complianceFlags: string[];
  retentionPeriod: number; // days
  autoDeleteAt: admin.firestore.Timestamp;
}

// Company Suspension Types

export interface CompanySuspensionRequest {
  reason: SuspensionReason;
  customReason?: string;
  duration?: number; // days, undefined for indefinite
  notifyUsers: boolean;
  restrictAccess: boolean;
  suspendBilling: boolean;
  scheduledAt?: Date;
}

export interface CompanySuspensionStatus {
  companyId: string;
  status: 'suspended' | 'active';
  reason: SuspensionReason;
  customReason?: string;
  suspendedBy: string;
  suspendedAt: admin.firestore.Timestamp;
  suspendUntil?: admin.firestore.Timestamp;
  reactivatedBy?: string;
  reactivatedAt?: admin.firestore.Timestamp;
  restrictedFeatures: string[];
  billingStatus: 'suspended' | 'active';
  userNotifications: SuspensionNotification[];
  auditTrail: SuspensionAuditEntry[];
}

export interface SuspensionNotification {
  id: string;
  type: 'suspension_notice' | 'reactivation_notice' | 'reminder';
  recipient: string;
  sentAt: admin.firestore.Timestamp;
  content: {
    subject: string;
    message: string;
    supportContact?: string;
  };
}

export interface SuspensionAuditEntry {
  timestamp: admin.firestore.Timestamp;
  action: 'suspend' | 'reactivate' | 'modify';
  performedBy: string;
  details: Record<string, any>;
  reason: string;
}

// Enums and Union Types

export type ClosureReason = 
  | 'non_payment'
  | 'policy_violation'
  | 'company_requested'
  | 'inactivity'
  | 'data_breach'
  | 'legal_requirement'
  | 'business_closure'
  | 'migration'
  | 'other';

export type SuspensionReason =
  | 'payment_overdue'
  | 'policy_violation'
  | 'security_concern'
  | 'investigation'
  | 'maintenance'
  | 'company_requested'
  | 'legal_requirement'
  | 'other';

export type ClosureStatusType =
  | 'pending_validation'
  | 'validation_failed'
  | 'scheduled'
  | 'in_progress'
  | 'grace_period'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'rolled_back';

export type ClosureStep =
  | 'validation'
  | 'user_notification'
  | 'data_export'
  | 'assessment_closure'
  | 'user_deactivation'
  | 'billing_resolution'
  | 'integration_cleanup'
  | 'data_archival'
  | 'final_cleanup'
  | 'audit_finalization';

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'sql';

export type ExportStatusType =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type ExportPhase =
  | 'preparation'
  | 'user_data'
  | 'assessment_data'
  | 'candidate_data'
  | 'system_logs'
  | 'packaging'
  | 'encryption'
  | 'upload'
  | 'cleanup';

export type NotificationType =
  | 'closure_initiated'
  | 'grace_period_started'
  | 'grace_period_ending'
  | 'closure_completed'
  | 'closure_cancelled'
  | 'data_export_ready'
  | 'action_required';

// API Response Types

export interface ClosureInitiationResponse {
  success: boolean;
  closureId?: string;
  status?: ClosureStatusType;
  gracePeriodEnds?: Date;
  validation?: ValidationResults;
  errors?: string[];
  warnings?: string[];
  nextSteps?: string[];
}

export interface ClosureStatusResponse {
  success: boolean;
  status?: CompanyClosureStatus;
  error?: string;
}

export interface DataExportResponse {
  success: boolean;
  exportId?: string;
  status?: ExportStatusType;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

export interface SuspensionResponse {
  success: boolean;
  suspensionId?: string;
  status?: 'suspended' | 'active';
  suspendUntil?: Date;
  restrictions?: string[];
  error?: string;
}

// Utility Types

export interface CompanyClosureConfig {
  defaultGracePeriodDays: number;
  maxGracePeriodDays: number;
  dataRetentionMonths: number;
  exportLinkExpirationDays: number;
  confirmationPhrase: string;
  notificationTemplates: Record<NotificationType, {
    subject: string;
    template: string;
  }>;
  suspensionReasons: SuspensionReason[];
  closureReasons: ClosureReason[];
}