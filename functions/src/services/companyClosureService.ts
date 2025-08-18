import * as admin from 'firebase-admin';
import {
  CompanyClosureRequest,
  CompanyClosureStatus,
  CompanySuspensionRequest,
  CompanySuspensionStatus,
  ClosureInitiationResponse,
  ClosureStatusResponse,
  SuspensionResponse,
  ValidationResults,
  ValidationBlocker,
  ValidationWarning,
  ClosureAuditEntry,
  ClosureMetadata,
  ClosureStep,
  SuspensionReason
} from '../types/closure';
import { Company, CompanyStatus } from '../types/company';

export class CompanyClosureService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Initiate company closure process
   */
  async initiateCompanyClosure(
    companyId: string,
    request: CompanyClosureRequest,
    initiatedBy: string
  ): Promise<ClosureInitiationResponse> {
    const batch = this.db.batch();

    try {
      // Validate company exists and is active
      const companyRef = this.db.collection('companies').doc(companyId);
      const companyDoc = await companyRef.get();
      
      if (!companyDoc.exists) {
        return {
          success: false,
          errors: ['Company not found']
        };
      }

      // Check if company is already in closure process
      const existingClosureQuery = await this.db
        .collection('company-closures')
        .where('companyId', '==', companyId)
        .where('status', 'in', ['pending_validation', 'scheduled', 'in_progress', 'grace_period'])
        .limit(1)
        .get();

      if (!existingClosureQuery.empty) {
        return {
          success: false,
          errors: ['Company closure is already in progress']
        };
      }

      // Validate closure request
      const validation = await this.validateClosureRequest(companyId, request);
      
      if (!validation.canClose) {
        return {
          success: false,
          validation,
          errors: validation.blockers.map(b => b.message),
          warnings: validation.warnings.map(w => w.message)
        };
      }

      // Validate confirmation phrase
      const expectedPhrase = "PERMANENTLY CLOSE COMPANY";
      if (request.confirmationPhrase !== expectedPhrase) {
        return {
          success: false,
          errors: [`Confirmation phrase must be exactly: "${expectedPhrase}"`]
        };
      }

      const now = admin.firestore.Timestamp.now();
      const gracePeriodDays = request.gracePeriodDays || 30;
      const gracePeriodEnds = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000)
      );

      // Create closure status document
      const closureRef = this.db.collection('company-closures').doc();
      const closureId = closureRef.id;

      const metadata = await this.gatherClosureMetadata(companyId, validation);

      const closureStatus: CompanyClosureStatus = {
        companyId,
        status: 'pending_validation',
        reason: request.reason,
        customReason: request.customReason,
        initiatedBy,
        initiatedAt: now,
        scheduledAt: request.scheduledAt ? admin.firestore.Timestamp.fromDate(request.scheduledAt) : now,
        gracePeriodEnds,
        deleteType: request.deleteType,
        progress: {
          step: 'validation',
          completedSteps: [],
          failedSteps: [],
          totalSteps: 10,
          percentage: 0,
          lastUpdated: now
        },
        rollbackAvailable: true,
        notifications: [],
        auditTrail: [],
        metadata
      };

      batch.set(closureRef, closureStatus);

      // Update company status to indicate closure in progress
      batch.update(companyRef, {
        status: 'pending_closure' as CompanyStatus,
        'metadata.closureInitiated': true,
        'metadata.closureId': closureId,
        updatedAt: now
      });

      // Create initial audit entry
      const auditEntry = await this.createAuditEntry(
        'closure_initiated',
        initiatedBy,
        {
          companyId,
          reason: request.reason,
          customReason: request.customReason,
          deleteType: request.deleteType,
          gracePeriodDays
        },
        'success'
      );

      // Update closure with audit entry
      batch.update(closureRef, {
        auditTrail: admin.firestore.FieldValue.arrayUnion(auditEntry)
      });

      await batch.commit();

      // Schedule async operations
      this.scheduleClosureOperations(closureId, request).catch(error => {
        console.error('Error scheduling closure operations:', error);
      });

      return {
        success: true,
        closureId,
        status: 'pending_validation',
        gracePeriodEnds: gracePeriodEnds.toDate(),
        validation,
        warnings: validation.warnings.map(w => w.message),
        nextSteps: [
          'Validation checks will be performed',
          'Users will be notified if validation passes',
          'Grace period will begin',
          `Company will be ${request.deleteType === 'permanent' ? 'permanently deleted' : 'archived'} after grace period`
        ]
      };

    } catch (error: any) {
      console.error('Error initiating company closure:', error);
      return {
        success: false,
        errors: [`Failed to initiate closure: ${error.message}`]
      };
    }
  }

  /**
   * Get closure status for a company
   */
  async getClosureStatus(companyId: string): Promise<ClosureStatusResponse> {
    try {
      const closureQuery = await this.db
        .collection('company-closures')
        .where('companyId', '==', companyId)
        .orderBy('initiatedAt', 'desc')
        .limit(1)
        .get();

      if (closureQuery.empty) {
        return {
          success: false,
          error: 'No closure process found for this company'
        };
      }

      const closureDoc = closureQuery.docs[0];
      const status = closureDoc.data() as CompanyClosureStatus;

      return {
        success: true,
        status
      };

    } catch (error: any) {
      console.error('Error getting closure status:', error);
      return {
        success: false,
        error: `Failed to get closure status: ${error.message}`
      };
    }
  }

  /**
   * Suspend a company temporarily
   */
  async suspendCompany(
    companyId: string,
    request: CompanySuspensionRequest,
    suspendedBy: string
  ): Promise<SuspensionResponse> {
    const batch = this.db.batch();

    try {
      const companyRef = this.db.collection('companies').doc(companyId);
      const companyDoc = await companyRef.get();
      
      if (!companyDoc.exists) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const companyData = companyDoc.data() as Company;
      
      if (companyData.status === 'suspended') {
        return {
          success: false,
          error: 'Company is already suspended'
        };
      }

      const now = admin.firestore.Timestamp.now();
      const suspendUntil = request.duration 
        ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000))
        : undefined;

      // Create suspension record
      const suspensionRef = this.db.collection('company-suspensions').doc();
      const suspensionStatus: CompanySuspensionStatus = {
        companyId,
        status: 'suspended',
        reason: request.reason,
        customReason: request.customReason,
        suspendedBy,
        suspendedAt: now,
        suspendUntil,
        restrictedFeatures: this.getRestrictedFeatures(request.restrictAccess),
        billingStatus: request.suspendBilling ? 'suspended' : 'active',
        userNotifications: [],
        auditTrail: [{
          timestamp: now,
          action: 'suspend',
          performedBy: suspendedBy,
          details: {
            reason: request.reason,
            customReason: request.customReason,
            duration: request.duration,
            restrictAccess: request.restrictAccess,
            suspendBilling: request.suspendBilling
          },
          reason: request.customReason || request.reason
        }]
      };

      batch.set(suspensionRef, suspensionStatus);

      // Update company status
      batch.update(companyRef, {
        status: 'suspended' as CompanyStatus,
        suspendedAt: now,
        suspendedBy,
        'metadata.suspensionId': suspensionRef.id,
        updatedAt: now
      });

      // Deactivate all company users if access is restricted
      if (request.restrictAccess) {
        await this.deactivateCompanyUsers(companyId, batch);
      }

      await batch.commit();

      // Send notifications
      if (request.notifyUsers) {
        this.sendSuspensionNotifications(companyId, suspensionRef.id, request.reason)
          .catch(error => console.error('Error sending suspension notifications:', error));
      }

      return {
        success: true,
        suspensionId: suspensionRef.id,
        status: 'suspended',
        suspendUntil: suspendUntil?.toDate(),
        restrictions: suspensionStatus.restrictedFeatures
      };

    } catch (error: any) {
      console.error('Error suspending company:', error);
      return {
        success: false,
        error: `Failed to suspend company: ${error.message}`
      };
    }
  }

  /**
   * Reactivate a suspended company
   */
  async reactivateCompany(
    companyId: string,
    reactivatedBy: string
  ): Promise<SuspensionResponse> {
    const batch = this.db.batch();

    try {
      const companyRef = this.db.collection('companies').doc(companyId);
      const companyDoc = await companyRef.get();
      
      if (!companyDoc.exists) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const companyData = companyDoc.data() as Company;
      
      if (companyData.status !== 'suspended') {
        return {
          success: false,
          error: 'Company is not suspended'
        };
      }

      // Get current suspension record
      const suspensionQuery = await this.db
        .collection('company-suspensions')
        .where('companyId', '==', companyId)
        .where('status', '==', 'suspended')
        .limit(1)
        .get();

      if (suspensionQuery.empty) {
        return {
          success: false,
          error: 'No active suspension found'
        };
      }

      const suspensionRef = suspensionQuery.docs[0].ref;
      const now = admin.firestore.Timestamp.now();

      // Update suspension status
      batch.update(suspensionRef, {
        status: 'active',
        reactivatedBy,
        reactivatedAt: now,
        'auditTrail': admin.firestore.FieldValue.arrayUnion({
          timestamp: now,
          action: 'reactivate',
          performedBy: reactivatedBy,
          details: {},
          reason: 'Manual reactivation'
        })
      });

      // Update company status
      batch.update(companyRef, {
        status: 'active' as CompanyStatus,
        suspendedAt: admin.firestore.FieldValue.delete(),
        suspendedBy: admin.firestore.FieldValue.delete(),
        'metadata.suspensionId': admin.firestore.FieldValue.delete(),
        updatedAt: now
      });

      // Reactivate company users
      await this.reactivateCompanyUsers(companyId, batch);

      await batch.commit();

      // Send reactivation notifications
      this.sendReactivationNotifications(companyId)
        .catch(error => console.error('Error sending reactivation notifications:', error));

      return {
        success: true,
        status: 'active'
      };

    } catch (error: any) {
      console.error('Error reactivating company:', error);
      return {
        success: false,
        error: `Failed to reactivate company: ${error.message}`
      };
    }
  }

  /**
   * Validate closure request and check for blockers
   */
  private async validateClosureRequest(
    companyId: string,
    request: CompanyClosureRequest
  ): Promise<ValidationResults> {
    const blockers: ValidationBlocker[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Check for outstanding billing
      const billingCheck = await this.checkOutstandingBilling(companyId);
      if (billingCheck.hasOutstanding) {
        blockers.push({
          type: 'billing',
          message: `Outstanding billing amount: $${billingCheck.amount}`,
          details: { amount: billingCheck.amount, invoices: billingCheck.invoices },
          resolution: 'Resolve outstanding payments before closure'
        });
      }

      // Check for active assessments
      const activeAssessments = await this.checkActiveAssessments(companyId);
      if (activeAssessments.count > 0) {
        warnings.push({
          type: 'data_loss',
          message: `${activeAssessments.count} active assessments will be terminated`,
          impact: 'high',
          details: { assessments: activeAssessments.list }
        });
      }

      // Check for active user sessions
      const activeSessions = await this.checkActiveSessions(companyId);
      if (activeSessions.count > 0) {
        warnings.push({
          type: 'user_impact',
          message: `${activeSessions.count} users currently logged in`,
          impact: 'medium',
          details: { sessions: activeSessions.sessions }
        });
      }

      // Check for legal holds
      const legalHolds = await this.checkLegalHolds(companyId);
      if (legalHolds.hasHolds) {
        blockers.push({
          type: 'legal_hold',
          message: 'Company data is under legal hold',
          details: { holds: legalHolds.holds },
          resolution: 'Contact legal team to release holds'
        });
      }

      // Check for system dependencies
      const dependencies = await this.checkSystemDependencies(companyId);
      if (dependencies.hasCritical) {
        blockers.push({
          type: 'system_dependency',
          message: 'Company has critical system integrations',
          details: { integrations: dependencies.critical },
          resolution: 'Disable integrations before closure'
        });
      }

      return {
        canClose: blockers.length === 0,
        blockers,
        warnings,
        checkedAt: admin.firestore.Timestamp.now()
      };

    } catch (error: any) {
      console.error('Error validating closure request:', error);
      return {
        canClose: false,
        blockers: [{
          type: 'system_dependency',
          message: 'Validation failed due to system error',
          details: { error: error.message }
        }],
        warnings: [],
        checkedAt: admin.firestore.Timestamp.now()
      };
    }
  }

  /**
   * Gather metadata about company for closure
   */
  private async gatherClosureMetadata(
    companyId: string,
    validation: ValidationResults
  ): Promise<ClosureMetadata> {
    try {
      const [
        companyDoc,
        usersSnapshot,
        assessmentsSnapshot,
        candidatesSnapshot
      ] = await Promise.all([
        this.db.collection('companies').doc(companyId).get(),
        this.db.collection('users').where('companyId', '==', companyId).get(),
        this.db.collection('assessments').where('companyId', '==', companyId).get(),
        this.db.collection('candidates').where('companyId', '==', companyId).get()
      ]);

      const companyData = companyDoc.data() as Company;
      const billingCheck = await this.checkOutstandingBilling(companyId);

      return {
        originalCompanySize: companyData.metadata?.usage?.totalUsers || usersSnapshot.size,
        totalUsers: usersSnapshot.size,
        totalAssessments: assessmentsSnapshot.size,
        totalCandidates: candidatesSnapshot.size,
        storageUsed: companyData.metadata?.usage?.storageUsed || 0,
        activeSubscription: companyData.status === 'active',
        outstandingBilling: billingCheck.amount,
        lastBillingCheck: admin.firestore.Timestamp.now(),
        preClosureValidation: validation
      };

    } catch (error: any) {
      console.error('Error gathering closure metadata:', error);
      throw error;
    }
  }

  /**
   * Schedule closure operations
   */
  private async scheduleClosureOperations(
    closureId: string,
    request: CompanyClosureRequest
  ): Promise<void> {
    try {
      // Start validation process
      await this.updateClosureProgress(closureId, 'validation', [], []);

      // If validation passes, proceed with notifications
      if (request.notifyUsers) {
        await this.sendClosureNotifications(closureId);
      }

      // Schedule data export if requested
      if (request.exportData) {
        // This would be handled by the DataExportService
        console.log(`Data export scheduled for closure ${closureId}`);
      }

      // Mark validation complete and move to next step
      await this.updateClosureProgress(closureId, 'user_notification', ['validation'], []);

    } catch (error: any) {
      console.error('Error in closure operations:', error);
      await this.updateClosureProgress(closureId, 'validation', [], ['validation']);
    }
  }

  /**
   * Create audit entry
   */
  private async createAuditEntry(
    action: string,
    performedBy: string,
    details: Record<string, any>,
    outcome: 'success' | 'failed' | 'pending'
  ): Promise<ClosureAuditEntry> {
    return {
      id: this.db.collection('temp').doc().id,
      timestamp: admin.firestore.Timestamp.now(),
      action,
      performedBy,
      details,
      outcome,
      errorMessage: outcome === 'failed' ? details.error : undefined
    };
  }

  /**
   * Update closure progress
   */
  private async updateClosureProgress(
    closureId: string,
    currentStep: ClosureStep,
    completedSteps: ClosureStep[],
    failedSteps: ClosureStep[]
  ): Promise<void> {
    const totalSteps = 10;
    const percentage = Math.round((completedSteps.length / totalSteps) * 100);

    await this.db.collection('company-closures').doc(closureId).update({
      'progress.step': currentStep,
      'progress.completedSteps': completedSteps,
      'progress.failedSteps': failedSteps,
      'progress.percentage': percentage,
      'progress.lastUpdated': admin.firestore.Timestamp.now()
    });
  }

  /**
   * Send closure notifications to users
   */
  private async sendClosureNotifications(closureId: string): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending closure notifications for ${closureId}`);
  }

  /**
   * Check for outstanding billing
   */
  private async checkOutstandingBilling(companyId: string): Promise<{
    hasOutstanding: boolean;
    amount: number;
    invoices: string[];
  }> {
    // In a real implementation, this would check billing system
    return {
      hasOutstanding: false,
      amount: 0,
      invoices: []
    };
  }

  /**
   * Check for active assessments
   */
  private async checkActiveAssessments(companyId: string): Promise<{
    count: number;
    list: string[];
  }> {
    const activeAssessments = await this.db
      .collection('assessment-attempts')
      .where('companyId', '==', companyId)
      .where('status', '==', 'in_progress')
      .get();

    return {
      count: activeAssessments.size,
      list: activeAssessments.docs.map(doc => doc.id)
    };
  }

  /**
   * Check for active user sessions
   */
  private async checkActiveSessions(companyId: string): Promise<{
    count: number;
    sessions: string[];
  }> {
    // In a real implementation, this would check active sessions
    return {
      count: 0,
      sessions: []
    };
  }

  /**
   * Check for legal holds
   */
  private async checkLegalHolds(companyId: string): Promise<{
    hasHolds: boolean;
    holds: string[];
  }> {
    // In a real implementation, this would check legal hold system
    return {
      hasHolds: false,
      holds: []
    };
  }

  /**
   * Check for system dependencies
   */
  private async checkSystemDependencies(companyId: string): Promise<{
    hasCritical: boolean;
    critical: string[];
  }> {
    // In a real implementation, this would check integrations
    return {
      hasCritical: false,
      critical: []
    };
  }

  /**
   * Get restricted features for suspension
   */
  private getRestrictedFeatures(restrictAccess: boolean): string[] {
    if (!restrictAccess) return [];
    
    return [
      'user_login',
      'assessment_creation',
      'candidate_management',
      'data_export',
      'api_access',
      'integrations'
    ];
  }

  /**
   * Deactivate all company users
   */
  private async deactivateCompanyUsers(
    companyId: string,
    batch: admin.firestore.WriteBatch
  ): Promise<void> {
    const usersSnapshot = await this.db
      .collection('users')
      .where('companyId', '==', companyId)
      .where('status', '==', 'active')
      .get();

    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'suspended',
        suspendedAt: admin.firestore.Timestamp.now()
      });
    });
  }

  /**
   * Reactivate company users
   */
  private async reactivateCompanyUsers(
    companyId: string,
    batch: admin.firestore.WriteBatch
  ): Promise<void> {
    const usersSnapshot = await this.db
      .collection('users')
      .where('companyId', '==', companyId)
      .where('status', '==', 'suspended')
      .get();

    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'active',
        suspendedAt: admin.firestore.FieldValue.delete()
      });
    });
  }

  /**
   * Send suspension notifications
   */
  private async sendSuspensionNotifications(
    companyId: string,
    suspensionId: string,
    reason: SuspensionReason
  ): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending suspension notifications for company ${companyId}, reason: ${reason}`);
  }

  /**
   * Send reactivation notifications
   */
  private async sendReactivationNotifications(companyId: string): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending reactivation notifications for company ${companyId}`);
  }
}