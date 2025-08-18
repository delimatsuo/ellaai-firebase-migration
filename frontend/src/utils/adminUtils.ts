import { UserProfile } from '../types/admin';

/**
 * Admin utility functions for role checking and security
 */

export const isAdmin = (userProfile: UserProfile | null): boolean => {
  return userProfile?.role === 'admin' || userProfile?.role === 'system_admin';
};

export const isSystemAdmin = (userProfile: UserProfile | null): boolean => {
  return userProfile?.role === 'system_admin';
};

export const canAccessAdminDashboard = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

export const canImpersonateUsers = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

export const canExecuteQueries = (userProfile: UserProfile | null): boolean => {
  return isSystemAdmin(userProfile);
};

export const canManageUsers = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

export const canManageCompanies = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

export const canViewAuditLogs = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

export const canViewSystemHealth = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

export const canCloseAccounts = (userProfile: UserProfile | null): boolean => {
  return isSystemAdmin(userProfile);
};

export const hasElevatedPermissions = (userProfile: UserProfile | null): boolean => {
  return isAdmin(userProfile);
};

/**
 * Format user role for display
 */
export const formatUserRole = (role: string): string => {
  switch (role) {
    case 'system_admin':
      return 'System Admin';
    case 'hiring_manager':
      return 'Hiring Manager';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'system_admin':
      return '#f44336'; // Red
    case 'admin':
      return '#ff9800'; // Orange
    case 'hiring_manager':
      return '#2196f3'; // Blue
    case 'recruiter':
      return '#9c27b0'; // Purple
    case 'candidate':
      return '#4caf50'; // Green
    default:
      return '#757575'; // Gray
  }
};

/**
 * Security validation for admin actions
 */
export const validateAdminAction = (
  userProfile: UserProfile | null,
  action: string,
  targetUserId?: string
): { allowed: boolean; reason?: string } => {
  if (!userProfile) {
    return { allowed: false, reason: 'User not authenticated' };
  }

  if (!isAdmin(userProfile)) {
    return { allowed: false, reason: 'Insufficient permissions' };
  }

  // Prevent self-targeting for certain actions
  const selfTargetingForbidden = ['suspend', 'delete', 'impersonate'];
  if (targetUserId === userProfile.uid && selfTargetingForbidden.includes(action)) {
    return { allowed: false, reason: 'Cannot perform this action on yourself' };
  }

  // System admin only actions
  const systemAdminOnly = ['database_query', 'close_account', 'system_config'];
  if (systemAdminOnly.includes(action) && !isSystemAdmin(userProfile)) {
    return { allowed: false, reason: 'System administrator access required' };
  }

  return { allowed: true };
};

/**
 * Log admin action for audit trail
 */
export const logAdminAction = async (
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    // In a real implementation, this would send to your audit logging service
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      resource,
      resourceId,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Admin action logged:', auditEntry);
    
    // You would typically send this to your backend audit service
    // await adminService.logAction(auditEntry);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

/**
 * Sanitize user input for security
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
};

/**
 * Format timestamp for admin interface
 */
export const formatAdminTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
};

/**
 * Generate CSV export data
 */
export const generateCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV values
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};