import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errors';
import {
  UserInvitation,
  InviteUserRequest,
  CompanyRole,
  UserPermissions,
  InvitationStatus,
  UserActionResponse,
} from '../types/user';

export class InvitationService {
  private db = admin.firestore();

  /**
   * Send invitation to user
   */
  async sendInvitation(
    request: InviteUserRequest,
    companyId: string,
    inviterUserId: string,
    inviterEmail: string
  ): Promise<UserActionResponse> {
    try {
      // Check if user already exists in the system
      const existingUserQuery = await this.db.collection('users')
        .where('email', '==', request.email.toLowerCase())
        .limit(1)
        .get();

      if (!existingUserQuery.empty) {
        const existingUser = existingUserQuery.docs[0].data();
        
        // If user already has access to this company
        if (existingUser.companyAccess?.includes(companyId)) {
          throw new AppError('User already has access to this company', 409, 'USER_ALREADY_IN_COMPANY');
        }

        // If user exists but not in this company, add them
        return this.addExistingUserToCompany(
          existingUserQuery.docs[0].id,
          companyId,
          request,
          inviterUserId
        );
      }

      // Check for existing pending invitation
      const existingInvitationQuery = await this.db.collection('user-invitations')
        .where('email', '==', request.email.toLowerCase())
        .where('companyId', '==', companyId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (!existingInvitationQuery.empty) {
        // Update existing invitation
        const invitationId = existingInvitationQuery.docs[0].id;
        return this.updateExistingInvitation(invitationId, request, inviterUserId);
      }

      // Create new invitation
      const token = this.generateInvitationToken();
      const expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + (request.expiresInDays || 7) * 24 * 60 * 60 * 1000)
      );

      const invitation: Omit<UserInvitation, 'id'> = {
        email: request.email.toLowerCase(),
        companyId,
        inviterUserId,
        inviterEmail,
        role: request.role,
        permissions: this.getDefaultPermissions(request.role, request.permissions),
        status: 'pending',
        token,
        expiresAt,
        createdAt: admin.firestore.Timestamp.now(),
        remindersSent: 0,
        metadata: {
          personalMessage: request.personalMessage,
          departmentId: request.departmentId,
          position: request.position,
          manager: request.manager,
          source: 'manual'
        }
      };

      const invitationRef = await this.db.collection('user-invitations').add(invitation);

      // Send invitation email
      await this.sendInvitationEmail({...invitation, id: invitationRef.id}, token);

      // Log activity
      await this.logInvitationActivity({
        action: 'SEND_INVITATION',
        invitationId: invitationRef.id,
        inviterUserId,
        email: request.email,
        companyId,
        details: {
          role: request.role,
          hasPersonalMessage: !!request.personalMessage
        }
      });

      return {
        success: true,
        userId: invitationRef.id,
        message: 'Invitation sent successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error sending invitation:', error);
      throw new AppError('Failed to send invitation', 500, 'SEND_INVITATION_FAILED');
    }
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userData: {
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<UserActionResponse> {
    try {
      const invitationQuery = await this.db.collection('user-invitations')
        .where('token', '==', token)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (invitationQuery.empty) {
        throw new AppError('Invalid or expired invitation', 404, 'INVITATION_NOT_FOUND');
      }

      const invitationDoc = invitationQuery.docs[0];
      const invitation = invitationDoc.data() as UserInvitation;

      // Check if invitation has expired
      if (invitation.expiresAt.toMillis() < Date.now()) {
        await invitationDoc.ref.update({
          status: 'expired',
          updatedAt: admin.firestore.Timestamp.now()
        });
        throw new AppError('Invitation has expired', 410, 'INVITATION_EXPIRED');
      }

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: invitation.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`,
        emailVerified: false
      });

      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: invitation.role,
        companyId: invitation.companyId,
        companyAccess: [invitation.companyId]
      });

      // Create user document
      const now = admin.firestore.Timestamp.now();
      const newUser = {
        uid: userRecord.uid,
        email: invitation.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        role: 'candidate',
        companyRole: invitation.role,
        companyId: invitation.companyId,
        status: 'active',
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false,
        companyAccess: [invitation.companyId],
        permissions: invitation.permissions,
        departmentId: invitation.metadata.departmentId,
        position: invitation.metadata.position,
        manager: invitation.metadata.manager,
        invitedBy: invitation.inviterUserId,
        invitedAt: invitation.createdAt,
        joinedCompanyAt: now,
        activatedAt: now,
        createdAt: now,
        updatedAt: now,
        metadata: {
          loginCount: 0,
          failedLoginAttempts: 0,
          profileCompleted: false,
          onboardingCompleted: false,
          source: 'company_invite',
          tags: []
        },
        preferences: this.getDefaultPreferences(),
        security: this.getDefaultSecurity()
      };

      const userRef = await this.db.collection('users').add(newUser);

      // Update invitation status
      await invitationDoc.ref.update({
        status: 'accepted',
        acceptedAt: now,
        updatedAt: now
      });

      // Log activity
      await this.logInvitationActivity({
        action: 'ACCEPT_INVITATION',
        invitationId: invitationDoc.id,
        userId: userRef.id,
        email: invitation.email,
        companyId: invitation.companyId,
        details: {
          role: invitation.role
        }
      });

      return {
        success: true,
        userId: userRef.id,
        message: 'Invitation accepted successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error accepting invitation:', error);
      throw new AppError('Failed to accept invitation', 500, 'ACCEPT_INVITATION_FAILED');
    }
  }

  /**
   * Reject invitation
   */
  async rejectInvitation(token: string): Promise<UserActionResponse> {
    try {
      const invitationQuery = await this.db.collection('user-invitations')
        .where('token', '==', token)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (invitationQuery.empty) {
        throw new AppError('Invalid or expired invitation', 404, 'INVITATION_NOT_FOUND');
      }

      const invitationDoc = invitationQuery.docs[0];
      const invitation = invitationDoc.data() as UserInvitation;

      await invitationDoc.ref.update({
        status: 'rejected',
        rejectedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Log activity
      await this.logInvitationActivity({
        action: 'REJECT_INVITATION',
        invitationId: invitationDoc.id,
        email: invitation.email,
        companyId: invitation.companyId,
        details: {
          role: invitation.role
        }
      });

      return {
        success: true,
        message: 'Invitation rejected'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error rejecting invitation:', error);
      throw new AppError('Failed to reject invitation', 500, 'REJECT_INVITATION_FAILED');
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, cancelledBy: string): Promise<UserActionResponse> {
    try {
      const invitationDoc = await this.db.collection('user-invitations').doc(invitationId).get();
      
      if (!invitationDoc.exists) {
        throw new AppError('Invitation not found', 404, 'INVITATION_NOT_FOUND');
      }

      const invitation = invitationDoc.data() as UserInvitation;

      if (invitation.status !== 'pending') {
        throw new AppError('Can only cancel pending invitations', 400, 'INVITATION_NOT_PENDING');
      }

      await invitationDoc.ref.update({
        status: 'cancelled',
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Log activity
      await this.logInvitationActivity({
        action: 'CANCEL_INVITATION',
        invitationId,
        cancelledBy,
        email: invitation.email,
        companyId: invitation.companyId,
        details: {
          role: invitation.role
        }
      });

      return {
        success: true,
        message: 'Invitation cancelled successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error cancelling invitation:', error);
      throw new AppError('Failed to cancel invitation', 500, 'CANCEL_INVITATION_FAILED');
    }
  }

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: string, resentBy: string): Promise<UserActionResponse> {
    try {
      const invitationDoc = await this.db.collection('user-invitations').doc(invitationId).get();
      
      if (!invitationDoc.exists) {
        throw new AppError('Invitation not found', 404, 'INVITATION_NOT_FOUND');
      }

      const invitation = invitationDoc.data() as UserInvitation;

      if (invitation.status !== 'pending') {
        throw new AppError('Can only resend pending invitations', 400, 'INVITATION_NOT_PENDING');
      }

      // Check if invitation has expired and extend if needed
      const now = Date.now();
      let expiresAt = invitation.expiresAt;
      
      if (expiresAt.toMillis() < now) {
        // Extend expiration by 7 days
        expiresAt = admin.firestore.Timestamp.fromDate(new Date(now + 7 * 24 * 60 * 60 * 1000));
      }

      await invitationDoc.ref.update({
        remindersSent: invitation.remindersSent + 1,
        lastReminderAt: admin.firestore.Timestamp.now(),
        expiresAt,
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Send reminder email
      await this.sendInvitationEmail(invitation, invitation.token);

      // Log activity
      await this.logInvitationActivity({
        action: 'RESEND_INVITATION',
        invitationId,
        resentBy,
        email: invitation.email,
        companyId: invitation.companyId,
        details: {
          reminderCount: invitation.remindersSent + 1
        }
      });

      return {
        success: true,
        message: 'Invitation resent successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error resending invitation:', error);
      throw new AppError('Failed to resend invitation', 500, 'RESEND_INVITATION_FAILED');
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<UserInvitation> {
    try {
      const invitationQuery = await this.db.collection('user-invitations')
        .where('token', '==', token)
        .limit(1)
        .get();

      if (invitationQuery.empty) {
        throw new AppError('Invitation not found', 404, 'INVITATION_NOT_FOUND');
      }

      const invitationDoc = invitationQuery.docs[0];
      const invitation = invitationDoc.data() as UserInvitation;

      return {
        ...invitation,
        id: invitationDoc.id
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting invitation by token:', error);
      throw new AppError('Failed to get invitation', 500, 'GET_INVITATION_FAILED');
    }
  }

  /**
   * Get company invitations
   */
  async getCompanyInvitations(
    companyId: string,
    status?: InvitationStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    invitations: UserInvitation[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      let query = this.db.collection('user-invitations')
        .where('companyId', '==', companyId);

      if (status) {
        query = query.where('status', '==', status);
      }

      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Apply pagination and ordering
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserInvitation));

      return {
        invitations,
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + invitations.length < total
        }
      };
    } catch (error: any) {
      console.error('Error getting company invitations:', error);
      throw new AppError('Failed to get company invitations', 500, 'GET_COMPANY_INVITATIONS_FAILED');
    }
  }

  /**
   * Bulk send invitations
   */
  async bulkSendInvitations(
    invitations: InviteUserRequest[],
    companyId: string,
    inviterUserId: string,
    inviterEmail: string
  ): Promise<any> {
    try {
      const operation = {
        type: 'invite',
        companyId,
        initiatedBy: inviterUserId,
        status: 'processing',
        totalUsers: invitations.length,
        processedUsers: 0,
        successfulUsers: 0,
        failedUsers: 0,
        progress: 0,
        results: [],
        errors: [],
        createdAt: admin.firestore.Timestamp.now(),
        startedAt: admin.firestore.Timestamp.now(),
        metadata: {
          dryRun: false,
          sendInviteEmails: true
        }
      };

      const operationRef = await this.db.collection('bulk-operations').add(operation);

      // Process invitations in background
      this.processBulkInvitations(operationRef.id, invitations, companyId, inviterUserId, inviterEmail);

      return {
        id: operationRef.id,
        ...operation
      };
    } catch (error: any) {
      console.error('Error starting bulk invitation operation:', error);
      throw new AppError('Failed to start bulk invitation operation', 500, 'BULK_INVITATION_FAILED');
    }
  }

  /**
   * Process bulk invitations (async)
   */
  private async processBulkInvitations(
    operationId: string,
    invitations: InviteUserRequest[],
    companyId: string,
    inviterUserId: string,
    inviterEmail: string
  ): Promise<void> {
    const operationRef = this.db.collection('bulk-operations').doc(operationId);
    let processedUsers = 0;
    let successfulUsers = 0;
    let failedUsers = 0;
    const results: any[] = [];
    const errors: any[] = [];

    try {
      for (const invitation of invitations) {
        try {
          await this.sendInvitation(invitation, companyId, inviterUserId, inviterEmail);
          
          results.push({
            email: invitation.email,
            status: 'success',
            message: 'Invitation sent successfully'
          });
          successfulUsers++;
        } catch (error: any) {
          results.push({
            email: invitation.email,
            status: 'failed',
            error: error.message
          });
          
          errors.push({
            email: invitation.email,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
          });
          failedUsers++;
        }

        processedUsers++;
        const progress = Math.round((processedUsers / invitations.length) * 100);

        // Update operation progress
        await operationRef.update({
          processedUsers,
          successfulUsers,
          failedUsers,
          progress,
          results,
          errors
        });
      }

      // Mark operation as completed
      await operationRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now()
      });

    } catch (error: any) {
      console.error('Error processing bulk invitations:', error);
      
      await operationRef.update({
        status: 'failed',
        completedAt: admin.firestore.Timestamp.now(),
        errors: [...errors, {
          error: 'Bulk operation failed',
          code: 'BULK_OPERATION_FAILED'
        }]
      });
    }
  }

  /**
   * Add existing user to company
   */
  private async addExistingUserToCompany(
    userId: string,
    companyId: string,
    request: InviteUserRequest,
    inviterUserId: string
  ): Promise<UserActionResponse> {
    const userDoc = await this.db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedCompanyAccess = [...(userData.companyAccess || []), companyId];
    
    await this.db.collection('users').doc(userId).update({
      companyAccess: updatedCompanyAccess,
      companyRole: request.role,
      permissions: this.getDefaultPermissions(request.role, request.permissions),
      departmentId: request.departmentId,
      position: request.position,
      manager: request.manager,
      joinedCompanyAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    return {
      success: true,
      userId,
      message: 'Existing user added to company successfully'
    };
  }

  /**
   * Update existing invitation
   */
  private async updateExistingInvitation(
    invitationId: string,
    request: InviteUserRequest,
    inviterUserId: string
  ): Promise<UserActionResponse> {
    await this.db.collection('user-invitations').doc(invitationId).update({
      role: request.role,
      permissions: this.getDefaultPermissions(request.role, request.permissions),
      'metadata.personalMessage': request.personalMessage,
      'metadata.departmentId': request.departmentId,
      'metadata.position': request.position,
      'metadata.manager': request.manager,
      updatedAt: admin.firestore.Timestamp.now()
    });

    return {
      success: true,
      userId: invitationId,
      message: 'Existing invitation updated successfully'
    };
  }

  /**
   * Generate invitation token
   */
  private generateInvitationToken(): string {
    return uuidv4().replace(/-/g, '');
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(invitation: UserInvitation, token: string): Promise<void> {
    // This would integrate with your email service
    // For now, just log the invitation details
    console.log('Sending invitation email:', {
      to: invitation.email,
      companyId: invitation.companyId,
      role: invitation.role,
      token,
      personalMessage: invitation.metadata.personalMessage
    });

    // TODO: Implement actual email sending
    // await emailService.sendInvitationEmail({
    //   to: invitation.email,
    //   token,
    //   companyId: invitation.companyId,
    //   inviterEmail: invitation.inviterEmail,
    //   role: invitation.role,
    //   personalMessage: invitation.metadata.personalMessage
    // });
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: CompanyRole, customPermissions?: Partial<UserPermissions>): UserPermissions {
    const defaultPermissions: Record<CompanyRole, UserPermissions> = {
      owner: {
        canCreateAssessments: true,
        canViewAllCandidates: true,
        canManageUsers: true,
        canModifySettings: true,
        canViewBilling: true,
        canExportData: true,
        canManageIntegrations: true,
        canViewReports: true,
        canManagePositions: true,
        canScheduleInterviews: true
      },
      admin: {
        canCreateAssessments: true,
        canViewAllCandidates: true,
        canManageUsers: true,
        canModifySettings: true,
        canViewBilling: true,
        canExportData: true,
        canManageIntegrations: true,
        canViewReports: true,
        canManagePositions: true,
        canScheduleInterviews: true
      },
      recruiter: {
        canCreateAssessments: true,
        canViewAllCandidates: true,
        canManageUsers: false,
        canModifySettings: false,
        canViewBilling: false,
        canExportData: true,
        canManageIntegrations: false,
        canViewReports: true,
        canManagePositions: true,
        canScheduleInterviews: true
      },
      hiring_manager: {
        canCreateAssessments: true,
        canViewAllCandidates: false,
        canManageUsers: false,
        canModifySettings: false,
        canViewBilling: false,
        canExportData: false,
        canManageIntegrations: false,
        canViewReports: true,
        canManagePositions: false,
        canScheduleInterviews: true
      },
      interviewer: {
        canCreateAssessments: false,
        canViewAllCandidates: false,
        canManageUsers: false,
        canModifySettings: false,
        canViewBilling: false,
        canExportData: false,
        canManageIntegrations: false,
        canViewReports: false,
        canManagePositions: false,
        canScheduleInterviews: true
      },
      viewer: {
        canCreateAssessments: false,
        canViewAllCandidates: false,
        canManageUsers: false,
        canModifySettings: false,
        canViewBilling: false,
        canExportData: false,
        canManageIntegrations: false,
        canViewReports: true,
        canManagePositions: false,
        canScheduleInterviews: false
      }
    };

    return {
      ...defaultPermissions[role],
      ...customPermissions
    };
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): any {
    return {
      theme: 'light',
      language: 'en',
      emailNotifications: {
        assessmentUpdates: true,
        candidateUpdates: true,
        systemUpdates: true,
        weeklyDigest: true,
        marketingEmails: false,
        frequency: 'instant'
      },
      uiSettings: {
        density: 'comfortable',
        sidebarCollapsed: false,
        defaultView: 'dashboard',
        itemsPerPage: 25
      },
      privacy: {
        profileVisibility: 'company',
        shareActivityStatus: true,
        allowAnalytics: true
      }
    };
  }

  /**
   * Get default user security settings
   */
  private getDefaultSecurity(): any {
    return {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 5
      },
      sessionSettings: {
        maxSessions: 5,
        sessionTimeout: 480, // 8 hours
        requireReauth: false
      },
      auditTrail: true
    };
  }

  /**
   * Log invitation activity
   */
  private async logInvitationActivity(activity: {
    action: string;
    invitationId: string;
    inviterUserId?: string;
    userId?: string;
    resentBy?: string;
    cancelledBy?: string;
    email: string;
    companyId: string;
    details: any;
  }): Promise<void> {
    try {
      const activityData = {
        ...activity,
        timestamp: admin.firestore.Timestamp.now(),
        ipAddress: '0.0.0.0',
        userAgent: 'server',
        sessionId: 'server-session',
        result: 'success'
      };

      await this.db.collection('invitation-activities').add(activityData);
    } catch (error) {
      console.error('Failed to log invitation activity:', error);
    }
  }
}

export const invitationService = new InvitationService();