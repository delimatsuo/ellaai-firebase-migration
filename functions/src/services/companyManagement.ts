import * as admin from 'firebase-admin';
import {
  CompanyWizardData,
  CompanyWizardValidation,
  CompanyCreationResult,
  DomainValidationResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Company,
  PlanDetails,
  PlanType,
  CompanyInfo,
  BillingInfo,
  InitialAdminUser,
  CompanySettings,
  CompanyPlan
} from '../types/company';

export class CompanyManagementService {
  private db: admin.firestore.Firestore;
  private auth: admin.auth.Auth;

  constructor() {
    this.db = admin.firestore();
    this.auth = admin.auth();
  }

  /**
   * Validate complete wizard data before creation
   */
  async validateWizardData(wizardData: CompanyWizardData): Promise<CompanyWizardValidation> {
    const validation: CompanyWizardValidation = {};

    // Validate each section in parallel
    const [
      companyValidation,
      planValidation,
      billingValidation,
      adminValidation,
      settingsValidation,
      domainValidation
    ] = await Promise.all([
      this.validateCompanyInfo(wizardData.companyInfo),
      this.validatePlan(wizardData.plan),
      this.validateBillingInfo(wizardData.billingInfo),
      this.validateInitialAdmin(wizardData.initialAdmin),
      this.validateSettings(wizardData.settings),
      this.validateDomain(wizardData.companyInfo.domain)
    ]);

    validation.companyInfo = companyValidation;
    validation.plan = planValidation;
    validation.billingInfo = billingValidation;
    validation.initialAdmin = adminValidation;
    validation.settings = settingsValidation;
    validation.domain = domainValidation;

    return validation;
  }

  /**
   * Check if domain is available
   */
  async checkDomainAvailability(domain: string): Promise<DomainValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})?$/;
    if (!domainRegex.test(domain)) {
      errors.push({
        field: 'domain',
        message: 'Invalid domain format',
        code: 'INVALID_DOMAIN_FORMAT'
      });
    }

    // Check reserved domains
    const reservedDomains = ['admin', 'api', 'www', 'mail', 'support', 'help'];
    if (reservedDomains.includes(domain.toLowerCase())) {
      errors.push({
        field: 'domain',
        message: 'Domain is reserved and cannot be used',
        code: 'RESERVED_DOMAIN'
      });
    }

    let isAvailable = true;
    let conflictingCompany: string | undefined;
    const suggestions: string[] = [];

    if (errors.length === 0) {
      // Check if domain already exists
      const existingCompany = await this.db.collection('companies')
        .where('domain', '==', domain.toLowerCase())
        .limit(1)
        .get();

      if (!existingCompany.empty) {
        isAvailable = false;
        const companyData = existingCompany.docs[0].data();
        conflictingCompany = companyData.name;
        
        errors.push({
          field: 'domain',
          message: `Domain '${domain}' is already taken by ${companyData.name}`,
          code: 'DOMAIN_TAKEN'
        });

        // Generate suggestions
        const baseDomain = domain.toLowerCase();
        for (let i = 1; i <= 5; i++) {
          suggestions.push(`${baseDomain}${i}`);
          suggestions.push(`${baseDomain}-${i}`);
        }
        suggestions.push(`${baseDomain}-inc`);
        suggestions.push(`${baseDomain}-corp`);
      }
    }

    return {
      isValid: errors.length === 0,
      isAvailable,
      errors,
      warnings,
      suggestions,
      conflictingCompany
    };
  }

  /**
   * Get available plans with features and pricing
   */
  async getAvailablePlans(): Promise<PlanDetails[]> {
    // In a real implementation, this would come from a database or configuration
    return [
      {
        type: 'trial',
        name: 'Free Trial',
        description: 'Try EllaAI for 14 days with full access',
        features: {
          maxUsers: 5,
          maxAssessments: 10,
          maxCandidates: 50,
          customBranding: false,
          apiAccess: false,
          ssoIntegration: false,
          advancedReporting: false,
          candidateTracking: true,
          multiCompanySupport: false,
          prioritySupport: false,
          customIntegrations: false,
          whiteLabeling: false
        },
        limits: {
          storage: 1,
          bandwidth: 10,
          apiCallsPerMonth: 0,
          concurrentAssessments: 2,
          reportRetentionMonths: 3,
          supportTicketsPerMonth: 2
        },
        pricing: {
          basePrice: 0,
          currency: 'USD',
          cycle: 'monthly'
        },
        trialDays: 14
      },
      {
        type: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for small teams getting started',
        features: {
          maxUsers: 10,
          maxAssessments: 50,
          maxCandidates: 200,
          customBranding: true,
          apiAccess: true,
          ssoIntegration: false,
          advancedReporting: true,
          candidateTracking: true,
          multiCompanySupport: false,
          prioritySupport: false,
          customIntegrations: false,
          whiteLabeling: false
        },
        limits: {
          storage: 5,
          bandwidth: 50,
          apiCallsPerMonth: 10000,
          concurrentAssessments: 5,
          reportRetentionMonths: 12,
          supportTicketsPerMonth: 10
        },
        pricing: {
          basePrice: 99,
          currency: 'USD',
          cycle: 'monthly',
          perUserPrice: 15
        }
      },
      {
        type: 'professional',
        name: 'Professional Plan',
        description: 'Advanced features for growing companies',
        features: {
          maxUsers: 50,
          maxAssessments: 200,
          maxCandidates: 1000,
          customBranding: true,
          apiAccess: true,
          ssoIntegration: true,
          advancedReporting: true,
          candidateTracking: true,
          multiCompanySupport: true,
          prioritySupport: true,
          customIntegrations: true,
          whiteLabeling: false
        },
        limits: {
          storage: 25,
          bandwidth: 200,
          apiCallsPerMonth: 50000,
          concurrentAssessments: 15,
          reportRetentionMonths: 24,
          supportTicketsPerMonth: 25
        },
        pricing: {
          basePrice: 299,
          currency: 'USD',
          cycle: 'monthly',
          perUserPrice: 25
        },
        popular: true
      },
      {
        type: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Complete solution for large organizations',
        features: {
          maxUsers: -1, // unlimited
          maxAssessments: -1,
          maxCandidates: -1,
          customBranding: true,
          apiAccess: true,
          ssoIntegration: true,
          advancedReporting: true,
          candidateTracking: true,
          multiCompanySupport: true,
          prioritySupport: true,
          customIntegrations: true,
          whiteLabeling: true
        },
        limits: {
          storage: -1, // unlimited
          bandwidth: -1,
          apiCallsPerMonth: -1,
          concurrentAssessments: -1,
          reportRetentionMonths: 60,
          supportTicketsPerMonth: -1
        },
        pricing: {
          basePrice: 999,
          currency: 'USD',
          cycle: 'monthly',
          perUserPrice: 45
        },
        recommended: true
      }
    ];
  }

  /**
   * Create a new company with full wizard data
   */
  async createCompanyWithWizard(
    wizardData: CompanyWizardData,
    createdBy: string
  ): Promise<CompanyCreationResult> {
    const batch = this.db.batch();
    const errors: string[] = [];
    const warnings: string[] = [];
    const nextSteps: string[] = [];

    try {
      // Validate data first
      const validation = await this.validateWizardData(wizardData);
      const hasErrors = Object.values(validation).some(v => v && !v.isValid);
      
      if (hasErrors) {
        const allErrors = Object.values(validation)
          .filter(v => v && v.errors)
          .flatMap(v => v!.errors!.map((e: ValidationError) => e.message));
        return {
          success: false,
          errors: allErrors
        };
      }

      // Check domain availability one more time
      const domainCheck = await this.checkDomainAvailability(wizardData.companyInfo.domain);
      if (!domainCheck.isAvailable) {
        return {
          success: false,
          errors: ['Domain is no longer available']
        };
      }

      // Create company document
      const companyRef = this.db.collection('companies').doc();
      const companyId = companyRef.id;

      const companyData: Omit<Company, 'id'> = {
        name: wizardData.companyInfo.name,
        domain: wizardData.companyInfo.domain.toLowerCase(),
        industry: wizardData.companyInfo.industry,
        size: wizardData.companyInfo.size,
        website: wizardData.companyInfo.website,
        description: wizardData.companyInfo.description,
        logo: wizardData.companyInfo.logo,
        plan: wizardData.plan,
        settings: wizardData.settings,
        billing: wizardData.billingInfo,
        status: wizardData.plan.type === 'trial' ? 'trial' : 'active',
        members: {},
        admins: {},
        createdBy,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        activatedAt: admin.firestore.Timestamp.now(),
        trialExpiresAt: wizardData.plan.type === 'trial' 
          ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
          : undefined,
        nextBillingDate: wizardData.plan.type !== 'trial'
          ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          : undefined,
        metadata: {
          onboardingCompleted: false,
          setupSteps: [
            { step: 'company_created', completed: true, completedAt: admin.firestore.Timestamp.now(), completedBy: createdBy },
            { step: 'admin_user_created', completed: false },
            { step: 'welcome_email_sent', completed: false },
            { step: 'first_assessment_created', completed: false },
            { step: 'team_invited', completed: false }
          ],
          integration: {
            connectedSystems: [],
            apiKeyCreated: false
          },
          usage: {
            totalUsers: 0,
            activeUsers: 0,
            totalAssessments: 0,
            totalCandidates: 0,
            storageUsed: 0,
            bandwidthUsed: 0,
            apiCallsThisMonth: 0,
            lastUsageUpdate: admin.firestore.Timestamp.now()
          },
          support: {
            supportPlan: wizardData.plan.type,
            openTickets: 0,
            totalTickets: 0
          }
        }
      };

      batch.set(companyRef, companyData);

      // Create admin user
      let adminUserId: string;
      try {
        const adminUser = await this.auth.createUser({
          email: wizardData.initialAdmin.email,
          displayName: `${wizardData.initialAdmin.firstName} ${wizardData.initialAdmin.lastName}`,
          emailVerified: false
        });
        adminUserId = adminUser.uid;

        // Create user document
        const userRef = this.db.collection('users').doc(adminUserId);
        const userData = {
          uid: adminUserId,
          email: wizardData.initialAdmin.email,
          firstName: wizardData.initialAdmin.firstName,
          lastName: wizardData.initialAdmin.lastName,
          displayName: `${wizardData.initialAdmin.firstName} ${wizardData.initialAdmin.lastName}`,
          role: 'admin',
          companyId,
          companyRole: wizardData.initialAdmin.role,
          status: 'active',
          emailVerified: false,
          phoneVerified: false,
          twoFactorEnabled: false,
          permissions: {
            canCreateAssessments: true,
            canViewAllCandidates: true,
            canManageUsers: true,
            canModifySettings: true,
            canViewBilling: true,
            canExportData: true,
            canManageIntegrations: true
          },
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          joinedAt: admin.firestore.Timestamp.now()
        };

        batch.set(userRef, userData);

        // Update company with admin user
        batch.update(companyRef, {
          [`members.${adminUserId}`]: wizardData.initialAdmin.role,
          [`admins.${adminUserId}`]: true,
          'metadata.setupSteps.1.completed': true,
          'metadata.setupSteps.1.completedAt': admin.firestore.Timestamp.now(),
          'metadata.setupSteps.1.completedBy': createdBy,
          'metadata.usage.totalUsers': 1,
          'metadata.usage.activeUsers': 1
        });

        nextSteps.push('Welcome email will be sent to admin user');
        nextSteps.push('Admin user should verify their email address');
        nextSteps.push('Complete onboarding checklist in dashboard');

      } catch (userError: any) {
        errors.push(`Failed to create admin user: ${userError.message}`);
        return {
          success: false,
          errors
        };
      }

      // Create audit log entry
      const auditRef = this.db.collection('audit-logs').doc();
      const auditData = {
        userId: createdBy,
        action: 'CREATE',
        resource: 'COMPANY',
        resourceId: companyId,
        timestamp: admin.firestore.Timestamp.now(),
        details: {
          companyName: wizardData.companyInfo.name,
          domain: wizardData.companyInfo.domain,
          plan: wizardData.plan.type,
          adminEmail: wizardData.initialAdmin.email,
          method: 'wizard'
        },
        userAgent: 'system',
        ipAddress: '127.0.0.1'
      };

      batch.set(auditRef, auditData);

      // Commit all changes
      await batch.commit();

      // Send welcome email (async, don't wait)
      this.sendWelcomeEmail(companyId, adminUserId!, wizardData)
        .catch(error => console.error('Failed to send welcome email:', error));

      return {
        success: true,
        companyId,
        adminUserId: adminUserId!,
        warnings,
        nextSteps
      };

    } catch (error: any) {
      console.error('Error creating company:', error);
      return {
        success: false,
        errors: [`Failed to create company: ${error.message}`]
      };
    }
  }

  /**
   * Send welcome email to new admin user
   */
  private async sendWelcomeEmail(
    companyId: string,
    adminUserId: string,
    wizardData: CompanyWizardData
  ): Promise<void> {
    try {
      // Update setup step
      await this.db.collection('companies').doc(companyId).update({
        'metadata.setupSteps.2.completed': true,
        'metadata.setupSteps.2.completedAt': admin.firestore.Timestamp.now()
      });

      // In a real implementation, integrate with email service (SendGrid, SES, etc.)
      console.log(`Welcome email sent to ${wizardData.initialAdmin.email} for company ${wizardData.companyInfo.name}`);
      
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Validate company information
   */
  private async validateCompanyInfo(companyInfo: CompanyInfo): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!companyInfo.name || companyInfo.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'Company name must be at least 2 characters long',
        code: 'INVALID_COMPANY_NAME'
      });
    }

    if (!companyInfo.domain || companyInfo.domain.trim().length < 2) {
      errors.push({
        field: 'domain',
        message: 'Domain is required',
        code: 'DOMAIN_REQUIRED'
      });
    }

    if (!companyInfo.industry) {
      errors.push({
        field: 'industry',
        message: 'Industry is required',
        code: 'INDUSTRY_REQUIRED'
      });
    }

    if (!companyInfo.size) {
      errors.push({
        field: 'size',
        message: 'Company size is required',
        code: 'SIZE_REQUIRED'
      });
    }

    // Optional field validation
    if (companyInfo.website) {
      try {
        new URL(companyInfo.website);
      } catch {
        errors.push({
          field: 'website',
          message: 'Website URL is invalid',
          code: 'INVALID_WEBSITE_URL'
        });
      }
    }

    if (companyInfo.description && companyInfo.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 1000 characters',
        code: 'DESCRIPTION_TOO_LONG'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate plan selection
   */
  private async validatePlan(plan: CompanyPlan): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const validPlanTypes: PlanType[] = ['trial', 'basic', 'professional', 'enterprise'];
    if (!validPlanTypes.includes(plan.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid plan type',
        code: 'INVALID_PLAN_TYPE'
      });
    }

    // Validate plan features and limits exist
    if (!plan.features) {
      errors.push({
        field: 'features',
        message: 'Plan features are required',
        code: 'FEATURES_REQUIRED'
      });
    }

    if (!plan.limits) {
      errors.push({
        field: 'limits',
        message: 'Plan limits are required',
        code: 'LIMITS_REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate billing information
   */
  private async validateBillingInfo(billingInfo: BillingInfo): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!billingInfo.email || !emailRegex.test(billingInfo.email)) {
      errors.push({
        field: 'email',
        message: 'Valid billing email is required',
        code: 'INVALID_BILLING_EMAIL'
      });
    }

    // Address validation
    if (!billingInfo.address.street || billingInfo.address.street.trim().length < 3) {
      errors.push({
        field: 'address.street',
        message: 'Street address is required',
        code: 'STREET_REQUIRED'
      });
    }

    if (!billingInfo.address.city || billingInfo.address.city.trim().length < 2) {
      errors.push({
        field: 'address.city',
        message: 'City is required',
        code: 'CITY_REQUIRED'
      });
    }

    if (!billingInfo.address.country || billingInfo.address.country.trim().length < 2) {
      errors.push({
        field: 'address.country',
        message: 'Country is required',
        code: 'COUNTRY_REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate initial admin user
   */
  private async validateInitialAdmin(adminUser: InitialAdminUser): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Name validation
    if (!adminUser.firstName || adminUser.firstName.trim().length < 1) {
      errors.push({
        field: 'firstName',
        message: 'First name is required',
        code: 'FIRST_NAME_REQUIRED'
      });
    }

    if (!adminUser.lastName || adminUser.lastName.trim().length < 1) {
      errors.push({
        field: 'lastName',
        message: 'Last name is required',
        code: 'LAST_NAME_REQUIRED'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminUser.email || !emailRegex.test(adminUser.email)) {
      errors.push({
        field: 'email',
        message: 'Valid email address is required',
        code: 'INVALID_EMAIL'
      });
    } else {
      // Check if email already exists
      try {
        await this.auth.getUserByEmail(adminUser.email);
        errors.push({
          field: 'email',
          message: 'Email address is already registered',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
          warnings.push({
            field: 'email',
            message: 'Could not verify email availability',
            suggestion: 'Please ensure email is correct'
          });
        }
      }
    }

    // Role validation
    if (!['admin', 'owner'].includes(adminUser.role)) {
      errors.push({
        field: 'role',
        message: 'Role must be either admin or owner',
        code: 'INVALID_ROLE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate company settings
   */
  private async validateSettings(settings: CompanySettings): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate assessment settings
    if (settings.assessmentSettings.maxRetakeAttempts < 0 || settings.assessmentSettings.maxRetakeAttempts > 10) {
      errors.push({
        field: 'assessmentSettings.maxRetakeAttempts',
        message: 'Max retake attempts must be between 0 and 10',
        code: 'INVALID_RETAKE_ATTEMPTS'
      });
    }

    if (settings.assessmentSettings.timeLimit < 1 || settings.assessmentSettings.timeLimit > 480) {
      errors.push({
        field: 'assessmentSettings.timeLimit',
        message: 'Time limit must be between 1 and 480 minutes',
        code: 'INVALID_TIME_LIMIT'
      });
    }

    // Validate security settings
    if (settings.security.passwordPolicy.minLength < 8 || settings.security.passwordPolicy.minLength > 128) {
      errors.push({
        field: 'security.passwordPolicy.minLength',
        message: 'Password minimum length must be between 8 and 128 characters',
        code: 'INVALID_PASSWORD_LENGTH'
      });
    }

    if (settings.security.sessionTimeout < 15 || settings.security.sessionTimeout > 10080) {
      errors.push({
        field: 'security.sessionTimeout',
        message: 'Session timeout must be between 15 minutes and 1 week',
        code: 'INVALID_SESSION_TIMEOUT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate domain format and availability
   */
  private async validateDomain(domain: string): Promise<DomainValidationResult> {
    return this.checkDomainAvailability(domain);
  }
}