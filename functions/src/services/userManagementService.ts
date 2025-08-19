import * as admin from 'firebase-admin';
import { AppError } from '../utils/errors';
import {
  CompanyUser,
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
  UserListResponse,
  UserActionResponse,
  UserPermissions,
  CompanyRole,
  UserMetadata,
  UserPreferences,
  UserSecurity,
  PasswordResetRequest,
  ForceLogoutRequest,
  UserActivity
} from '../types/user';

export class UserManagementService {
  private db = admin.firestore();

  /**
   * Get paginated list of users with filtering
   */
  async getUserList(query: UserListQuery): Promise<UserListResponse> {
    try {
      let queryRef: admin.firestore.Query = this.db.collection('users');

      // Apply company filter
      if (query.companyId) {
        queryRef = queryRef.where('companyAccess', 'array-contains', query.companyId);
      }

      // Apply role filter
      if (query.role) {
        queryRef = queryRef.where('companyRole', '==', query.role);
      }

      // Apply status filter
      if (query.status) {
        queryRef = queryRef.where('status', '==', query.status);
      }

      // Apply department filter
      if (query.departmentId) {
        queryRef = queryRef.where('departmentId', '==', query.departmentId);
      }

      // Apply sorting
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      let sortedQuery = queryRef.orderBy(sortBy, sortOrder);

      // Get total count
      const totalSnapshot = await queryRef.get();
      const total = totalSnapshot.size;

      // Apply pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;
      
      if (offset > 0) {
        const startAfterSnapshot = await queryRef
          .orderBy(sortBy, sortOrder)
          .limit(offset)
          .get();
        
        if (!startAfterSnapshot.empty) {
          const lastDoc = startAfterSnapshot.docs[startAfterSnapshot.docs.length - 1];
          sortedQuery = sortedQuery.startAfter(lastDoc);
        }
      }

      const snapshot = await sortedQuery.limit(limit).get();

      let users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CompanyUser));

      // Apply text search filter (client-side for now)
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        users = users.filter(user => 
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.lastName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.displayName.toLowerCase().includes(searchTerm)
        );
      }

      return {
        users,
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + users.length < total
        },
        filters: {
          companyId: query.companyId,
          role: query.role,
          status: query.status,
          departmentId: query.departmentId,
          search: query.search
        }
      };
    } catch (error: any) {
      console.error('Error getting user list:', error);
      throw new AppError('Failed to get user list', 500, 'GET_USER_LIST_FAILED');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<CompanyUser> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return {
        id: userDoc.id,
        ...userDoc.data()
      } as CompanyUser;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting user by ID:', error);
      throw new AppError('Failed to get user', 500, 'GET_USER_FAILED');
    }
  }

  /**
   * Create new user
   */
  async createUser(request: CreateUserRequest, createdBy: string): Promise<UserActionResponse> {
    try {
      // Check if user already exists
      const existingUserQuery = await this.db.collection('users')
        .where('email', '==', request.email.toLowerCase())
        .limit(1)
        .get();

      if (!existingUserQuery.empty) {
        throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
      }

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: request.email,
        displayName: `${request.firstName} ${request.lastName}`,
        emailVerified: false,
        disabled: false
      });

      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: request.role,
        companyId: request.companyId,
        companyAccess: [request.companyId]
      });

      // Create user document
      const now = admin.firestore.Timestamp.now();
      const userData: Omit<CompanyUser, 'id'> = {
        uid: userRecord.uid,
        email: request.email.toLowerCase(),
        firstName: request.firstName,
        lastName: request.lastName,
        displayName: `${request.firstName} ${request.lastName}`,
        phone: request.phone,
        role: 'candidate', // Default Firebase role
        companyRole: request.role,
        companyId: request.companyId,
        status: 'invited',
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false,
        departmentId: request.departmentId,
        position: request.position,
        manager: request.manager,
        companyAccess: [request.companyId],
        permissions: this.getDefaultPermissions(request.role, request.permissions),
        createdAt: now,
        updatedAt: now,
        joinedCompanyAt: now,
        createdBy,
        invitedBy: createdBy,
        invitedAt: now,
        metadata: this.getDefaultMetadata(),
        preferences: this.getDefaultPreferences(),
        security: this.getDefaultSecurity()
      };

      const userRef = await this.db.collection('users').add(userData);

      // Log activity
      await this.logUserActivity({
        userId: createdBy,
        action: 'CREATE_USER',
        resource: 'USER',
        resourceId: userRef.id,
        details: {
          targetUserId: userRef.id,
          targetEmail: request.email,
          companyId: request.companyId,
          role: request.role
        }
      });

      return {
        success: true,
        userId: userRef.id,
        message: 'User created successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error creating user:', error);
      throw new AppError('Failed to create user', 500, 'CREATE_USER_FAILED');
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string, 
    request: UpdateUserRequest, 
    updatedBy: string
  ): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const currentData = userDoc.data() as CompanyUser;
      
      // Build update data
      const updateData: Partial<CompanyUser> = {
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (request.firstName) updateData.firstName = request.firstName;
      if (request.lastName) updateData.lastName = request.lastName;
      if (request.phone !== undefined) updateData.phone = request.phone;
      if (request.departmentId !== undefined) updateData.departmentId = request.departmentId;
      if (request.position !== undefined) updateData.position = request.position;
      if (request.manager !== undefined) updateData.manager = request.manager;

      // Update display name if first or last name changed
      if (request.firstName || request.lastName) {
        const firstName = request.firstName || currentData.firstName;
        const lastName = request.lastName || currentData.lastName;
        updateData.displayName = `${firstName} ${lastName}`;
        
        // Update Firebase Auth display name
        await admin.auth().updateUser(currentData.uid, {
          displayName: updateData.displayName
        });
      }

      // Update permissions
      if (request.permissions) {
        updateData.permissions = {
          ...currentData.permissions,
          ...request.permissions
        };
      }

      // Update preferences
      if (request.preferences) {
        updateData.preferences = {
          ...currentData.preferences,
          ...request.preferences
        };
      }

      // Update metadata
      if (request.metadata) {
        updateData.metadata = {
          ...currentData.metadata,
          ...request.metadata
        };
      }

      await this.db.collection('users').doc(userId).update(updateData);

      // Log activity
      await this.logUserActivity({
        userId: updatedBy,
        action: 'UPDATE_USER',
        resource: 'USER',
        resourceId: userId,
        details: {
          changes: updateData,
          previousData: currentData
        }
      });

      return {
        success: true,
        userId,
        message: 'User updated successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating user:', error);
      throw new AppError('Failed to update user', 500, 'UPDATE_USER_FAILED');
    }
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId: string, deletedBy: string, reason?: string): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      // Update user status to deleted
      await this.db.collection('users').doc(userId).update({
        status: 'deleted',
        deletedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Disable Firebase Auth user
      await admin.auth().updateUser(userData.uid, {
        disabled: true
      });

      // Revoke all sessions
      await admin.auth().revokeRefreshTokens(userData.uid);

      // Log activity
      await this.logUserActivity({
        userId: deletedBy,
        action: 'DELETE_USER',
        resource: 'USER',
        resourceId: userId,
        details: {
          targetUserId: userId,
          targetEmail: userData.email,
          reason: reason || 'No reason provided'
        }
      });

      return {
        success: true,
        userId,
        message: 'User deleted successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting user:', error);
      throw new AppError('Failed to delete user', 500, 'DELETE_USER_FAILED');
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, suspendedBy: string, reason?: string): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      // Update user status
      await this.db.collection('users').doc(userId).update({
        status: 'suspended',
        suspendedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Disable Firebase Auth user
      await admin.auth().updateUser(userData.uid, {
        disabled: true
      });

      // Revoke all sessions
      await admin.auth().revokeRefreshTokens(userData.uid);

      // Log activity
      await this.logUserActivity({
        userId: suspendedBy,
        action: 'SUSPEND_USER',
        resource: 'USER',
        resourceId: userId,
        details: {
          targetUserId: userId,
          targetEmail: userData.email,
          reason: reason || 'No reason provided'
        }
      });

      return {
        success: true,
        userId,
        message: 'User suspended successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error suspending user:', error);
      throw new AppError('Failed to suspend user', 500, 'SUSPEND_USER_FAILED');
    }
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string, reactivatedBy: string): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      // Update user status
      await this.db.collection('users').doc(userId).update({
        status: 'active',
        suspendedAt: admin.firestore.FieldValue.delete(),
        activatedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Enable Firebase Auth user
      await admin.auth().updateUser(userData.uid, {
        disabled: false
      });

      // Log activity
      await this.logUserActivity({
        userId: reactivatedBy,
        action: 'REACTIVATE_USER',
        resource: 'USER',
        resourceId: userId,
        details: {
          targetUserId: userId,
          targetEmail: userData.email
        }
      });

      return {
        success: true,
        userId,
        message: 'User reactivated successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error reactivating user:', error);
      throw new AppError('Failed to reactivate user', 500, 'REACTIVATE_USER_FAILED');
    }
  }

  /**
   * Force password reset
   */
  async forcePasswordReset(request: PasswordResetRequest, requestedBy: string): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(request.userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      if (request.sendEmail) {
        // Generate password reset link
        await admin.auth().generatePasswordResetLink(userData.email);
      }

      // Revoke all refresh tokens to force re-authentication
      await admin.auth().revokeRefreshTokens(userData.uid);

      // Update password change metadata
      await this.db.collection('users').doc(request.userId).update({
        'metadata.passwordLastChanged': admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Log activity
      await this.logUserActivity({
        userId: requestedBy,
        action: 'FORCE_PASSWORD_RESET',
        resource: 'USER',
        resourceId: request.userId,
        details: {
          targetUserId: request.userId,
          targetEmail: userData.email,
          reason: request.reason,
          emailSent: request.sendEmail
        }
      });

      return {
        success: true,
        userId: request.userId,
        message: request.sendEmail ? 
          'Password reset email sent and all sessions revoked' : 
          'All user sessions revoked, user must reset password'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error forcing password reset:', error);
      throw new AppError('Failed to force password reset', 500, 'FORCE_PASSWORD_RESET_FAILED');
    }
  }

  /**
   * Force logout all sessions
   */
  async forceLogout(request: ForceLogoutRequest, requestedBy: string): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(request.userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      // Revoke all refresh tokens
      await admin.auth().revokeRefreshTokens(userData.uid);

      // Update last logout time
      await this.db.collection('users').doc(request.userId).update({
        'metadata.lastForcedLogout': admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Log activity
      await this.logUserActivity({
        userId: requestedBy,
        action: 'FORCE_LOGOUT',
        resource: 'USER',
        resourceId: request.userId,
        details: {
          targetUserId: request.userId,
          targetEmail: userData.email,
          reason: request.reason
        }
      });

      return {
        success: true,
        userId: request.userId,
        message: 'All user sessions terminated successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error forcing logout:', error);
      throw new AppError('Failed to force logout', 500, 'FORCE_LOGOUT_FAILED');
    }
  }

  /**
   * Update user role in company
   */
  async updateUserRole(
    userId: string, 
    companyId: string, 
    newRole: CompanyRole, 
    updatedBy: string
  ): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      // Verify user has access to this company
      if (!userData.companyAccess.includes(companyId)) {
        throw new AppError('User does not have access to this company', 403, 'NO_COMPANY_ACCESS');
      }

      const oldRole = userData.companyRole;

      // Update role and permissions
      const newPermissions = this.getDefaultPermissions(newRole);
      
      await this.db.collection('users').doc(userId).update({
        companyRole: newRole,
        permissions: newPermissions,
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Update Firebase custom claims
      const customClaims = {
        ...userData,
        role: newRole,
        companyId: userData.companyId || companyId
      };
      await admin.auth().setCustomUserClaims(userData.uid, customClaims);

      // Log activity
      await this.logUserActivity({
        userId: updatedBy,
        action: 'UPDATE_USER_ROLE',
        resource: 'USER',
        resourceId: userId,
        details: {
          targetUserId: userId,
          targetEmail: userData.email,
          companyId,
          oldRole,
          newRole
        }
      });

      return {
        success: true,
        userId,
        message: `User role updated from ${oldRole} to ${newRole}`
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating user role:', error);
      throw new AppError('Failed to update user role', 500, 'UPDATE_USER_ROLE_FAILED');
    }
  }

  /**
   * Remove user from company
   */
  async removeUserFromCompany(
    userId: string, 
    companyId: string, 
    removedBy: string
  ): Promise<UserActionResponse> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userData = userDoc.data() as CompanyUser;

      // Verify user has access to this company
      if (!userData.companyAccess.includes(companyId)) {
        throw new AppError('User is not a member of this company', 404, 'NOT_COMPANY_MEMBER');
      }

      // Remove company from access list
      const updatedCompanyAccess = userData.companyAccess.filter(id => id !== companyId);
      
      await this.db.collection('users').doc(userId).update({
        companyAccess: updatedCompanyAccess,
        leftCompanyAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });

      // If this was their only company, set status to inactive
      if (updatedCompanyAccess.length === 0) {
        await this.db.collection('users').doc(userId).update({
          status: 'suspended'
        });
      }

      // Log activity
      await this.logUserActivity({
        userId: removedBy,
        action: 'REMOVE_USER_FROM_COMPANY',
        resource: 'USER',
        resourceId: userId,
        details: {
          targetUserId: userId,
          targetEmail: userData.email,
          companyId
        }
      });

      return {
        success: true,
        userId,
        message: 'User removed from company successfully'
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error removing user from company:', error);
      throw new AppError('Failed to remove user from company', 500, 'REMOVE_USER_FROM_COMPANY_FAILED');
    }
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
   * Get default user metadata
   */
  private getDefaultMetadata(): UserMetadata {
    return {
      loginCount: 0,
      failedLoginAttempts: 0,
      profileCompleted: false,
      onboardingCompleted: false,
      source: 'direct_signup',
      tags: []
    };
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
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
  private getDefaultSecurity(): UserSecurity {
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
   * Log user activity
   */
  private async logUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'sessionId' | 'result'>): Promise<void> {
    try {
      const activityData: Omit<UserActivity, 'id'> = {
        ...activity,
        timestamp: admin.firestore.Timestamp.now(),
        ipAddress: '0.0.0.0', // Should be passed from request
        userAgent: 'server', // Should be passed from request
        sessionId: 'server-session',
        result: 'success'
      };

      await this.db.collection('user-activities').add(activityData);
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw error for logging failures
    }
  }
}

export const userManagementService = new UserManagementService();