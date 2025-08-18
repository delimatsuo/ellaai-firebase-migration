import { Router, Response, NextFunction } from 'express';
import * as joi from 'joi';
import { AuthenticatedRequest, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { CompanyManagementService } from '../../services/companyManagement';
import {
  CompanyWizardData,
  CreateCompanyWizardResponse,
  ValidateCompanyWizardResponse,
  CheckDomainResponse,
  GetPlansResponse
} from '../../types/company';

const router = Router();
const companyService = new CompanyManagementService();

// Validation schemas
const companyInfoSchema = joi.object({
  name: joi.string().required().min(2).max(200).trim(),
  domain: joi.string().required().min(2).max(63).lowercase().trim()
    .pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/)
    .messages({
      'string.pattern.base': 'Domain can only contain letters, numbers, and hyphens'
    }),
  industry: joi.string().required().valid(
    'technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing',
    'consulting', 'marketing', 'real-estate', 'legal', 'government', 'nonprofit',
    'media', 'transportation', 'energy', 'agriculture', 'construction', 'hospitality',
    'telecommunications', 'automotive', 'aerospace', 'other'
  ),
  size: joi.string().required().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
  website: joi.string().uri().optional().allow(''),
  description: joi.string().optional().max(1000).allow(''),
  logo: joi.string().uri().optional().allow('')
});

const planSchema = joi.object({
  type: joi.string().required().valid('trial', 'basic', 'professional', 'enterprise'),
  features: joi.object({
    maxUsers: joi.number().integer().min(-1),
    maxAssessments: joi.number().integer().min(-1),
    maxCandidates: joi.number().integer().min(-1),
    customBranding: joi.boolean(),
    apiAccess: joi.boolean(),
    ssoIntegration: joi.boolean(),
    advancedReporting: joi.boolean(),
    candidateTracking: joi.boolean(),
    multiCompanySupport: joi.boolean(),
    prioritySupport: joi.boolean(),
    customIntegrations: joi.boolean(),
    whiteLabeling: joi.boolean()
  }).required(),
  limits: joi.object({
    storage: joi.number().integer().min(-1),
    bandwidth: joi.number().integer().min(-1),
    apiCallsPerMonth: joi.number().integer().min(-1),
    concurrentAssessments: joi.number().integer().min(-1),
    reportRetentionMonths: joi.number().integer().min(1).max(120),
    supportTicketsPerMonth: joi.number().integer().min(-1)
  }).required(),
  billing: joi.string().valid('monthly', 'annual').required()
});

const billingInfoSchema = joi.object({
  email: joi.string().email().required(),
  paymentMethod: joi.string().valid('credit_card', 'bank_transfer', 'invoice', 'stripe').required(),
  address: joi.object({
    street: joi.string().required().min(3).max(200),
    city: joi.string().required().min(2).max(100),
    state: joi.string().optional().max(100).allow(''),
    postalCode: joi.string().optional().max(20).allow(''),
    country: joi.string().required().min(2).max(100)
  }).required(),
  taxId: joi.string().optional().allow('')
});

const initialAdminSchema = joi.object({
  firstName: joi.string().required().min(1).max(50).trim(),
  lastName: joi.string().required().min(1).max(50).trim(),
  email: joi.string().email().required(),
  phone: joi.string().optional().pattern(/^\+?[\d\s-()]+$/).allow(''),
  role: joi.string().valid('admin', 'owner').required()
});

const settingsSchema = joi.object({
  emailNotifications: joi.boolean().default(true),
  assessmentSettings: joi.object({
    allowRetakes: joi.boolean().default(true),
    maxRetakeAttempts: joi.number().integer().min(0).max(10).default(2),
    timeLimit: joi.number().integer().min(1).max(480).default(60),
    autoGrading: joi.boolean().default(true),
    proctoring: joi.boolean().default(false),
    requiresApproval: joi.boolean().default(false),
    resultVisibility: joi.string().valid('immediate', 'after_review', 'never').default('immediate')
  }),
  integrations: joi.object({
    ats: joi.boolean().default(false),
    sso: joi.boolean().default(false),
    slack: joi.boolean().default(false),
    teams: joi.boolean().default(false),
    webhook: joi.boolean().default(false),
    api: joi.boolean().default(false)
  }),
  branding: joi.object({
    primaryColor: joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#007bff'),
    secondaryColor: joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#6c757d'),
    logo: joi.string().uri().optional().allow(''),
    companyName: joi.string().required(),
    customDomain: joi.string().optional().allow(''),
    emailTemplate: joi.string().optional().allow('')
  }),
  security: joi.object({
    twoFactorRequired: joi.boolean().default(false),
    passwordPolicy: joi.object({
      minLength: joi.number().integer().min(8).max(128).default(8),
      requireUppercase: joi.boolean().default(true),
      requireLowercase: joi.boolean().default(true),
      requireNumbers: joi.boolean().default(true),
      requireSpecialChars: joi.boolean().default(false),
      preventReuse: joi.number().integer().min(0).max(24).default(5)
    }),
    sessionTimeout: joi.number().integer().min(15).max(10080).default(480), // 15 min to 1 week
    ipWhitelist: joi.array().items(joi.string().ip()).optional(),
    auditLogging: joi.boolean().default(true),
    dataRetention: joi.number().integer().min(1).max(120).default(24) // 1 to 120 months
  })
});

const wizardDataSchema = joi.object({
  companyInfo: companyInfoSchema.required(),
  plan: planSchema.required(),
  billingInfo: billingInfoSchema.required(),
  initialAdmin: initialAdminSchema.required(),
  settings: settingsSchema.required()
});

const domainCheckSchema = joi.object({
  domain: joi.string().required().min(2).max(63).lowercase().trim()
    .pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/)
});

/**
 * POST /api/admin/companies/wizard/validate
 * Validate company wizard data before creation
 */
router.post('/validate',
  requireRole('admin'),
  validateRequest(wizardDataSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const wizardData: CompanyWizardData = req.body;

      const validation = await companyService.validateWizardData(wizardData);
      
      const isValid = Object.values(validation).every(v => !v || v.isValid);
      
      const suggestions: string[] = [];
      
      // Add suggestions based on validation results
      if (validation.domain && !validation.domain.isAvailable) {
        suggestions.push(...(validation.domain.suggestions || []));
      }
      
      if (wizardData.plan.type === 'trial') {
        suggestions.push('Consider upgrading to a paid plan for full features');
      }
      
      if (!wizardData.settings.security.twoFactorRequired) {
        suggestions.push('Enable two-factor authentication for enhanced security');
      }

      const response: ValidateCompanyWizardResponse = {
        isValid,
        validation,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/companies/wizard/create
 * Create company with full wizard setup
 */
router.post('/create',
  requireRole('admin'),
  validateRequest(wizardDataSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const wizardData: CompanyWizardData = req.body;
      const createdBy = req.user!.uid;

      const result = await companyService.createCompanyWithWizard(wizardData, createdBy);

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        } as CreateCompanyWizardResponse);
        return;
      }

      const response: CreateCompanyWizardResponse = {
        success: true,
        data: {
          companyId: result.companyId!,
          adminUserId: result.adminUserId!,
          welcomeEmailSent: true,
          nextSteps: result.nextSteps || []
        },
        warnings: result.warnings?.map(w => ({ field: 'general', message: w, code: 'WARNING' }))
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/companies/wizard/check-domain
 * Check if domain is available for company creation
 */
router.post('/check-domain',
  requireRole('admin'),
  validateRequest(domainCheckSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { domain } = req.body;

      const validation = await companyService.checkDomainAvailability(domain);

      const response: CheckDomainResponse = {
        available: validation.isAvailable,
        domain,
        suggestions: validation.suggestions,
        conflictingCompany: validation.conflictingCompany ? {
          id: 'hidden', // Don't expose company IDs
          name: validation.conflictingCompany
        } : undefined,
        validation
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/companies/wizard/plans
 * Get available plans with features and pricing
 */
router.get('/plans',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await companyService.getAvailablePlans();

      const response: GetPlansResponse = {
        plans,
        currency: 'USD',
        taxRate: 0.0825, // Example tax rate
        promoCode: undefined // Could be dynamically determined
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/companies/wizard/validation-schema
 * Get validation schema for frontend form validation
 */
router.get('/validation-schema',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Return simplified schema structure for frontend validation
      const schema = {
        companyInfo: {
          name: { required: true, minLength: 2, maxLength: 200 },
          domain: { required: true, minLength: 2, maxLength: 63, pattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$' },
          industry: { required: true, options: [
            'technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing',
            'consulting', 'marketing', 'real-estate', 'legal', 'government', 'nonprofit',
            'media', 'transportation', 'energy', 'agriculture', 'construction', 'hospitality',
            'telecommunications', 'automotive', 'aerospace', 'other'
          ]},
          size: { required: true, options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
          website: { required: false, format: 'url' },
          description: { required: false, maxLength: 1000 }
        },
        plan: {
          type: { required: true, options: ['trial', 'basic', 'professional', 'enterprise'] }
        },
        billingInfo: {
          email: { required: true, format: 'email' },
          paymentMethod: { required: true, options: ['credit_card', 'bank_transfer', 'invoice', 'stripe'] },
          address: {
            street: { required: true, minLength: 3, maxLength: 200 },
            city: { required: true, minLength: 2, maxLength: 100 },
            country: { required: true, minLength: 2, maxLength: 100 }
          }
        },
        initialAdmin: {
          firstName: { required: true, minLength: 1, maxLength: 50 },
          lastName: { required: true, minLength: 1, maxLength: 50 },
          email: { required: true, format: 'email' },
          role: { required: true, options: ['admin', 'owner'] }
        },
        settings: {
          assessmentSettings: {
            maxRetakeAttempts: { min: 0, max: 10, default: 2 },
            timeLimit: { min: 1, max: 480, default: 60 },
            resultVisibility: { options: ['immediate', 'after_review', 'never'], default: 'immediate' }
          },
          security: {
            passwordPolicy: {
              minLength: { min: 8, max: 128, default: 8 },
              preventReuse: { min: 0, max: 24, default: 5 }
            },
            sessionTimeout: { min: 15, max: 10080, default: 480 },
            dataRetention: { min: 1, max: 120, default: 24 }
          }
        }
      };

      res.json({ schema });
    } catch (error) {
      next(error);
    }
  }
);

export { router as companyWizardRoutes };