// Admin Dashboard Types
export interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  totalCompanies: number;
  totalAssessments: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastUpdated: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  companyId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QueryResult {
  id: string;
  timestamp: Date;
  query: string;
  result: any[];
  executionTime: number;
  recordCount: number;
  error?: string;
}

export interface DatabaseQuery {
  id: string;
  name?: string;
  query: string;
  collection: string;
  filters?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in';
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  createdAt: Date;
  createdBy: string;
}

export interface UserProfile {
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
}

export interface CompanyAccount {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  size?: string;
  plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  lastActivity?: Date;
  userCount: number;
  assessmentCount: number;
  billingStatus: 'current' | 'overdue' | 'canceled';
  healthScore: number; // 0-100
  notes?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: ServiceStatus;
    authentication: ServiceStatus;
    storage: ServiceStatus;
    api: ServiceStatus;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
  };
  alerts: SystemAlert[];
  lastChecked: Date;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ImpersonationSession {
  id: string;
  adminUserId: string;
  targetUserId: string;
  targetUserEmail: string;
  startedAt: Date;
  endedAt?: Date;
  reason: string;
  ipAddress: string;
  isActive: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  targetUsers?: string[];
  targetCompanies?: string[];
  rolloutPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

// Company Creation Wizard Types
export interface CompanyPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  maxUsers: number;
  maxAssessments: number;
  popular?: boolean;
  trialDays?: number;
}

export interface CompanyWizardData {
  companyInfo: {
    name: string;
    domain: string;
    industry: string;
    size: string;
    description?: string;
  };
  planSelection: {
    planId: string;
    plan?: CompanyPlan;
    billingInterval: 'month' | 'year';
  };
  billingInfo: {
    paymentMethod: 'credit_card' | 'invoice' | 'trial';
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    taxId?: string;
    cardDetails?: {
      number: string;
      expiryMonth: string;
      expiryYear: string;
      cvc: string;
      name: string;
    };
  };
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    phone?: string;
  };
}

export interface WizardValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export interface DomainAvailabilityResult {
  available: boolean;
  suggestions?: string[];
  reason?: string;
}

export interface CompanyCreationResult {
  companyId: string;
  adminUserId: string;
  loginUrl: string;
  tempPassword: string;
}

// Company Closure and Lifecycle Types
export interface CompanyClosureRequest {
  reason: 'payment_issues' | 'violation' | 'requested' | 'other';
  customReason?: string;
  type: 'archive' | 'permanent_delete';
  gracePeriodDays: 7 | 14 | 30;
  exportData: boolean;
  exportFormats?: ('json' | 'csv' | 'excel')[];
  exportScopes?: ('users' | 'assessments' | 'candidates' | 'reports')[];
  confirmationPhrase: string;
  notifyUsers: boolean;
  scheduledFor?: Date;
}

export interface CompanySuspensionRequest {
  reason: string;
  duration?: number; // days, undefined for indefinite
  pauseBilling: boolean;
  notifyUsers: boolean;
  restrictAccess: boolean;
  customMessage?: string;
}

export interface DataExportRequest {
  companyId: string;
  formats: ('json' | 'csv' | 'excel')[];
  scopes: ('users' | 'assessments' | 'candidates' | 'reports')[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeMetadata: boolean;
  encryptData: boolean;
}

export interface DataExportJob {
  id: string;
  companyId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  formats: string[];
  scopes: string[];
  fileSize?: number;
  error?: string;
}

export interface CompanyLifecycleEvent {
  id: string;
  companyId: string;
  type: 'created' | 'activated' | 'suspended' | 'reactivated' | 'closed' | 'data_exported' | 'plan_changed' | 'billing_updated';
  timestamp: Date;
  performedBy: string;
  performedByEmail: string;
  details: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface CompanyLifecycleHistory {
  companyId: string;
  events: CompanyLifecycleEvent[];
  currentStatus: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  lastActivity?: Date;
  suspensionHistory: {
    suspendedAt?: Date;
    suspendedBy?: string;
    reason?: string;
    duration?: number;
    reactivatedAt?: Date;
    reactivatedBy?: string;
  }[];
  closureDetails?: {
    closedAt: Date;
    closedBy: string;
    reason: string;
    type: 'archive' | 'permanent_delete';
    gracePeriodEnds?: Date;
    dataExported: boolean;
  };
}