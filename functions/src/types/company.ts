import * as admin from 'firebase-admin';

export interface CompanyInfo {
  name: string;
  domain: string;
  industry: string;
  size: CompanySize;
  website?: string;
  description?: string;
  logo?: string;
}

export interface CompanyPlan {
  type: PlanType;
  features: PlanFeatures;
  limits: PlanLimits;
  billing: BillingCycle;
}

export interface BillingInfo {
  email: string;
  paymentMethod: PaymentMethod;
  address: BillingAddress;
  taxId?: string;
}

export interface InitialAdminUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'owner';
}

export interface CompanySettings {
  emailNotifications: boolean;
  assessmentSettings: AssessmentSettings;
  integrations: IntegrationSettings;
  branding: BrandingSettings;
  security: SecuritySettings;
}

export interface CompanyWizardData {
  companyInfo: CompanyInfo;
  plan: CompanyPlan;
  billingInfo: BillingInfo;
  initialAdmin: InitialAdminUser;
  settings: CompanySettings;
}

export interface CompanyWizardValidation {
  companyInfo?: ValidationResult;
  plan?: ValidationResult;
  billingInfo?: ValidationResult;
  initialAdmin?: ValidationResult;
  settings?: ValidationResult;
  domain?: DomainValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

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

export interface DomainValidationResult extends ValidationResult {
  isAvailable: boolean;
  suggestions?: string[];
  conflictingCompany?: string;
}

export interface CompanyCreationResult {
  success: boolean;
  companyId?: string;
  adminUserId?: string;
  errors?: string[];
  warnings?: string[];
  nextSteps?: string[];
}

export interface PlanValidationResult {
  planExists: boolean;
  features: PlanFeatures;
  limits: PlanLimits;
  pricing: PlanPricing;
}

// Enums and Types
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';

export type PlanType = 'trial' | 'basic' | 'professional' | 'enterprise' | 'custom';

export type BillingCycle = 'monthly' | 'annual';

export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'invoice' | 'stripe';

export interface PlanFeatures {
  maxUsers: number;
  maxAssessments: number;
  maxCandidates: number;
  customBranding: boolean;
  apiAccess: boolean;
  ssoIntegration: boolean;
  advancedReporting: boolean;
  candidateTracking: boolean;
  multiCompanySupport: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  whiteLabeling: boolean;
}

export interface PlanLimits {
  storage: number; // GB
  bandwidth: number; // GB per month
  apiCallsPerMonth: number;
  concurrentAssessments: number;
  reportRetentionMonths: number;
  supportTicketsPerMonth: number;
}

export interface PlanPricing {
  basePrice: number;
  currency: string;
  cycle: BillingCycle;
  setup?: number;
  perUserPrice?: number;
  discounts?: PlanDiscount[];
}

export interface PlanDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  validUntil?: Date;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AssessmentSettings {
  allowRetakes: boolean;
  maxRetakeAttempts: number;
  timeLimit: number; // minutes
  autoGrading: boolean;
  proctoring: boolean;
  requiresApproval: boolean;
  resultVisibility: 'immediate' | 'after_review' | 'never';
}

export interface IntegrationSettings {
  ats: boolean;
  sso: boolean;
  slack: boolean;
  teams: boolean;
  webhook: boolean;
  api: boolean;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  companyName: string;
  customDomain?: string;
  emailTemplate?: string;
}

export interface SecuritySettings {
  twoFactorRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // minutes
  ipWhitelist?: string[];
  auditLogging: boolean;
  dataRetention: number; // months
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
}

// Database Models
export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: CompanySize;
  website?: string;
  description?: string;
  logo?: string;
  plan: CompanyPlan;
  settings: CompanySettings;
  billing: BillingInfo;
  status: CompanyStatus;
  members: Record<string, CompanyMemberRole>;
  admins: Record<string, boolean>;
  createdBy: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  activatedAt?: admin.firestore.Timestamp;
  suspendedAt?: admin.firestore.Timestamp;
  deletedAt?: admin.firestore.Timestamp;
  trialExpiresAt?: admin.firestore.Timestamp;
  lastBillingDate?: admin.firestore.Timestamp;
  nextBillingDate?: admin.firestore.Timestamp;
  metadata: CompanyMetadata;
}

export interface CompanyUser {
  id: string;
  companyId: string;
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: CompanyMemberRole;
  status: UserStatus;
  permissions: UserPermissions;
  invitedBy?: string;
  invitedAt?: admin.firestore.Timestamp;
  joinedAt?: admin.firestore.Timestamp;
  lastActiveAt?: admin.firestore.Timestamp;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export type CompanyStatus = 'active' | 'trial' | 'suspended' | 'deleted' | 'pending_activation';

export type CompanyMemberRole = 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'viewer';

export type UserStatus = 'active' | 'invited' | 'suspended' | 'deleted';

export interface UserPermissions {
  canCreateAssessments: boolean;
  canViewAllCandidates: boolean;
  canManageUsers: boolean;
  canModifySettings: boolean;
  canViewBilling: boolean;
  canExportData: boolean;
  canManageIntegrations: boolean;
  restrictedToPositions?: string[];
  restrictedToDepartments?: string[];
}

export interface CompanyMetadata {
  onboardingCompleted: boolean;
  setupSteps: SetupStep[];
  integration: IntegrationMetadata;
  usage: UsageMetadata;
  support: SupportMetadata;
}

export interface SetupStep {
  step: string;
  completed: boolean;
  completedAt?: admin.firestore.Timestamp;
  completedBy?: string;
}

export interface IntegrationMetadata {
  connectedSystems: string[];
  lastSyncAt?: admin.firestore.Timestamp;
  syncStatus?: 'success' | 'error' | 'pending';
  webhookUrl?: string;
  apiKeyCreated?: boolean;
}

export interface UsageMetadata {
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  totalCandidates: number;
  storageUsed: number; // bytes
  bandwidthUsed: number; // bytes
  apiCallsThisMonth: number;
  lastUsageUpdate: admin.firestore.Timestamp;
}

export interface SupportMetadata {
  supportPlan: string;
  lastSupportContact?: admin.firestore.Timestamp;
  openTickets: number;
  totalTickets: number;
  satisfactionRating?: number;
}

// API Response Types
export interface CreateCompanyWizardResponse {
  success: boolean;
  data?: {
    companyId: string;
    adminUserId: string;
    welcomeEmailSent: boolean;
    nextSteps: string[];
  };
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidateCompanyWizardResponse {
  isValid: boolean;
  validation: CompanyWizardValidation;
  suggestions?: string[];
}

export interface CheckDomainResponse {
  available: boolean;
  domain: string;
  suggestions?: string[];
  conflictingCompany?: {
    id: string;
    name: string;
  };
  validation: DomainValidationResult;
}

export interface GetPlansResponse {
  plans: PlanDetails[];
  currency: string;
  taxRate?: number;
  promoCode?: string;
}

export interface PlanDetails {
  type: PlanType;
  name: string;
  description: string;
  features: PlanFeatures;
  limits: PlanLimits;
  pricing: PlanPricing;
  popular?: boolean;
  recommended?: boolean;
  trialDays?: number;
}