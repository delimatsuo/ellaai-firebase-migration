import * as admin from 'firebase-admin';
import {
  ClosureNotification,
  SuspensionNotification,
  NotificationType,
  ClosureReason,
  SuspensionReason
} from '../types/closure';
import { Company, CompanyUser } from '../types/company';

export class NotificationService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Send closure notifications to all company users
   */
  async sendClosureNotifications(
    companyId: string,
    closureId: string,
    reason: ClosureReason,
    gracePeriodEnds: Date,
    customReason?: string
  ): Promise<void> {
    try {
      const [companyDoc, usersSnapshot] = await Promise.all([
        this.db.collection('companies').doc(companyId).get(),
        this.db.collection('users').where('companyId', '==', companyId).get()
      ]);

      if (!companyDoc.exists) {
        throw new Error('Company not found');
      }

      const companyData = companyDoc.data() as Company;
      const users = usersSnapshot.docs.map(doc => doc.data() as CompanyUser);

      // Send notifications to all users
      const notifications = await Promise.all(
        users.map(user => this.createClosureNotification(
          user,
          companyData,
          'closure_initiated',
          reason,
          gracePeriodEnds,
          customReason
        ))
      );

      // Store notifications in closure record
      await this.db.collection('company-closures').doc(closureId).update({
        notifications: admin.firestore.FieldValue.arrayUnion(...notifications)
      });

      // Send actual emails (would integrate with email service)
      await Promise.all(
        notifications.map(notification => this.sendEmail(notification))
      );

    } catch (error: any) {
      console.error('Error sending closure notifications:', error);
      throw error;
    }
  }

  /**
   * Send grace period ending notifications
   */
  async sendGracePeriodEndingNotifications(
    companyId: string,
    closureId: string,
    daysRemaining: number
  ): Promise<void> {
    try {
      const [companyDoc, usersSnapshot] = await Promise.all([
        this.db.collection('companies').doc(companyId).get(),
        this.db.collection('users')
          .where('companyId', '==', companyId)
          .where('role', 'in', ['admin', 'owner'])
          .get()
      ]);

      if (!companyDoc.exists) {
        throw new Error('Company not found');
      }

      const companyData = companyDoc.data() as Company;
      const adminUsers = usersSnapshot.docs.map(doc => doc.data() as CompanyUser);

      const notifications = await Promise.all(
        adminUsers.map(user => this.createGracePeriodNotification(
          user,
          companyData,
          daysRemaining
        ))
      );

      // Send emails
      await Promise.all(
        notifications.map(notification => this.sendEmail(notification))
      );

    } catch (error: any) {
      console.error('Error sending grace period notifications:', error);
      throw error;
    }
  }

  /**
   * Send suspension notifications
   */
  async sendSuspensionNotifications(
    companyId: string,
    suspensionId: string,
    reason: SuspensionReason,
    suspendUntil?: Date,
    customReason?: string
  ): Promise<void> {
    try {
      const [companyDoc, usersSnapshot] = await Promise.all([
        this.db.collection('companies').doc(companyId).get(),
        this.db.collection('users').where('companyId', '==', companyId).get()
      ]);

      if (!companyDoc.exists) {
        throw new Error('Company not found');
      }

      const companyData = companyDoc.data() as Company;
      const users = usersSnapshot.docs.map(doc => doc.data() as CompanyUser);

      const notifications = await Promise.all(
        users.map(user => this.createSuspensionNotification(
          user,
          companyData,
          reason,
          suspendUntil,
          customReason
        ))
      );

      // Store notifications in suspension record
      await this.db.collection('company-suspensions').doc(suspensionId).update({
        userNotifications: admin.firestore.FieldValue.arrayUnion(...notifications)
      });

      // Send emails
      await Promise.all(
        notifications.map(notification => this.sendSuspensionEmail(notification))
      );

    } catch (error: any) {
      console.error('Error sending suspension notifications:', error);
      throw error;
    }
  }

  /**
   * Send reactivation notifications
   */
  async sendReactivationNotifications(companyId: string): Promise<void> {
    try {
      const [companyDoc, usersSnapshot] = await Promise.all([
        this.db.collection('companies').doc(companyId).get(),
        this.db.collection('users').where('companyId', '==', companyId).get()
      ]);

      if (!companyDoc.exists) {
        throw new Error('Company not found');
      }

      const companyData = companyDoc.data() as Company;
      const users = usersSnapshot.docs.map(doc => doc.data() as CompanyUser);

      const notifications = await Promise.all(
        users.map(user => this.createReactivationNotification(user, companyData))
      );

      // Send emails
      await Promise.all(
        notifications.map(notification => this.sendSuspensionEmail(notification))
      );

    } catch (error: any) {
      console.error('Error sending reactivation notifications:', error);
      throw error;
    }
  }

  /**
   * Send data export ready notifications
   */
  async sendDataExportReadyNotification(
    companyId: string,
    exportId: string,
    downloadUrl: string,
    expiresAt: Date,
    requestedBy: string
  ): Promise<void> {
    try {
      const [companyDoc, userDoc] = await Promise.all([
        this.db.collection('companies').doc(companyId).get(),
        this.db.collection('users').doc(requestedBy).get()
      ]);

      if (!companyDoc.exists || !userDoc.exists) {
        throw new Error('Company or user not found');
      }

      const companyData = companyDoc.data() as Company;
      const userData = userDoc.data() as CompanyUser;

      const notification = await this.createDataExportNotification(
        userData,
        companyData,
        exportId,
        downloadUrl,
        expiresAt
      );

      await this.sendEmail(notification);

    } catch (error: any) {
      console.error('Error sending data export notification:', error);
      throw error;
    }
  }

  /**
   * Create closure notification
   */
  private async createClosureNotification(
    user: CompanyUser,
    company: Company,
    type: NotificationType,
    reason: ClosureReason,
    gracePeriodEnds: Date,
    customReason?: string
  ): Promise<ClosureNotification> {
    const reasonText = customReason || this.getReasonText(reason);
    const actionRequired = ['admin', 'owner'].includes(user.role);

    return {
      id: this.db.collection('temp').doc().id,
      type,
      recipient: user.email,
      status: 'pending',
      retryCount: 0,
      content: {
        subject: `URGENT: ${company.name} Account Closure Notice`,
        message: this.getClosureNotificationTemplate(
          user.firstName,
          company.name,
          reasonText,
          gracePeriodEnds,
          actionRequired
        ),
        actionRequired,
        deadlineDate: gracePeriodEnds
      }
    };
  }

  /**
   * Create grace period notification
   */
  private async createGracePeriodNotification(
    user: CompanyUser,
    company: Company,
    daysRemaining: number
  ): Promise<ClosureNotification> {
    return {
      id: this.db.collection('temp').doc().id,
      type: 'grace_period_ending',
      recipient: user.email,
      status: 'pending',
      retryCount: 0,
      content: {
        subject: `URGENT: ${company.name} Account Closure in ${daysRemaining} Days`,
        message: this.getGracePeriodTemplate(
          user.firstName,
          company.name,
          daysRemaining
        ),
        actionRequired: true,
        deadlineDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
      }
    };
  }

  /**
   * Create suspension notification
   */
  private async createSuspensionNotification(
    user: CompanyUser,
    company: Company,
    reason: SuspensionReason,
    suspendUntil?: Date,
    customReason?: string
  ): Promise<SuspensionNotification> {
    const reasonText = customReason || this.getSuspensionReasonText(reason);

    return {
      id: this.db.collection('temp').doc().id,
      type: 'suspension_notice',
      recipient: user.email,
      sentAt: admin.firestore.Timestamp.now(),
      content: {
        subject: `${company.name} Account Suspended`,
        message: this.getSuspensionNotificationTemplate(
          user.firstName,
          company.name,
          reasonText,
          suspendUntil
        ),
        supportContact: 'support@ellaai.com'
      }
    };
  }

  /**
   * Create reactivation notification
   */
  private async createReactivationNotification(
    user: CompanyUser,
    company: Company
  ): Promise<SuspensionNotification> {
    return {
      id: this.db.collection('temp').doc().id,
      type: 'reactivation_notice',
      recipient: user.email,
      sentAt: admin.firestore.Timestamp.now(),
      content: {
        subject: `${company.name} Account Reactivated`,
        message: this.getReactivationNotificationTemplate(
          user.firstName,
          company.name
        ),
        supportContact: 'support@ellaai.com'
      }
    };
  }

  /**
   * Create data export notification
   */
  private async createDataExportNotification(
    user: CompanyUser,
    company: Company,
    exportId: string,
    downloadUrl: string,
    expiresAt: Date
  ): Promise<ClosureNotification> {
    return {
      id: this.db.collection('temp').doc().id,
      type: 'data_export_ready',
      recipient: user.email,
      status: 'pending',
      retryCount: 0,
      content: {
        subject: `${company.name} Data Export Ready`,
        message: this.getDataExportTemplate(
          user.firstName,
          company.name,
          downloadUrl,
          expiresAt
        ),
        actionRequired: true,
        deadlineDate: expiresAt
      }
    };
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: ClosureNotification): Promise<void> {
    try {
      // In a real implementation, integrate with email service (SendGrid, SES, etc.)
      console.log(`Sending email to ${notification.recipient}:`);
      console.log(`Subject: ${notification.content.subject}`);
      console.log(`Message: ${notification.content.message}`);

      // Mark as sent
      notification.status = 'sent';
      notification.sentAt = admin.firestore.Timestamp.now();

    } catch (error: any) {
      console.error('Error sending email:', error);
      notification.status = 'failed';
      notification.retryCount++;
      throw error;
    }
  }

  /**
   * Send suspension email notification
   */
  private async sendSuspensionEmail(notification: SuspensionNotification): Promise<void> {
    try {
      console.log(`Sending suspension email to ${notification.recipient}:`);
      console.log(`Subject: ${notification.content.subject}`);
      console.log(`Message: ${notification.content.message}`);

    } catch (error: any) {
      console.error('Error sending suspension email:', error);
      throw error;
    }
  }

  /**
   * Email templates
   */
  private getClosureNotificationTemplate(
    firstName: string,
    companyName: string,
    reason: string,
    gracePeriodEnds: Date,
    actionRequired: boolean
  ): string {
    return `
Dear ${firstName},

We are writing to inform you that ${companyName}'s EllaAI account has been scheduled for closure.

Reason: ${reason}

Important Information:
- Grace Period Ends: ${gracePeriodEnds.toLocaleDateString()}
- All data will be archived/deleted after the grace period
- Users will lose access to the platform

${actionRequired ? `
ACTION REQUIRED:
As an administrator, you can:
1. Contact our support team to resolve any issues
2. Export your data before the grace period ends
3. Cancel the closure if this was initiated in error

Please contact support@ellaai.com immediately if you need assistance.
` : `
If you have any questions, please contact your company administrator or our support team at support@ellaai.com.
`}

Best regards,
EllaAI Team
    `.trim();
  }

  private getGracePeriodTemplate(
    firstName: string,
    companyName: string,
    daysRemaining: number
  ): string {
    return `
Dear ${firstName},

URGENT: ${companyName}'s EllaAI account will be permanently closed in ${daysRemaining} day(s).

This is your final notice. After the grace period expires:
- All data will be permanently deleted
- Users will lose access to the platform
- This action cannot be undone

IMMEDIATE ACTION REQUIRED:
1. Export any important data immediately
2. Contact support if you need to cancel the closure
3. Ensure all team members are notified

Contact: support@ellaai.com
Phone: [Support Phone Number]

Best regards,
EllaAI Team
    `.trim();
  }

  private getSuspensionNotificationTemplate(
    firstName: string,
    companyName: string,
    reason: string,
    suspendUntil?: Date
  ): string {
    const suspensionText = suspendUntil 
      ? `until ${suspendUntil.toLocaleDateString()}`
      : 'indefinitely';

    return `
Dear ${firstName},

${companyName}'s EllaAI account has been suspended ${suspensionText}.

Reason: ${reason}

During suspension:
- Users cannot access the platform
- Assessments are paused
- Data remains secure and intact

To resolve this suspension, please contact our support team at support@ellaai.com.

Best regards,
EllaAI Team
    `.trim();
  }

  private getReactivationNotificationTemplate(
    firstName: string,
    companyName: string
  ): string {
    return `
Dear ${firstName},

Great news! ${companyName}'s EllaAI account has been reactivated.

You can now:
- Access the platform normally
- Resume assessments
- Continue using all features

If you experience any issues, please contact support@ellaai.com.

Welcome back!
EllaAI Team
    `.trim();
  }

  private getDataExportTemplate(
    firstName: string,
    companyName: string,
    downloadUrl: string,
    expiresAt: Date
  ): string {
    return `
Dear ${firstName},

Your data export for ${companyName} is ready for download.

Download Link: ${downloadUrl}
Expires: ${expiresAt.toLocaleDateString()}

Important:
- The download link expires in 7 days
- The file is encrypted for security
- Please store the data securely

If you need assistance, contact support@ellaai.com.

Best regards,
EllaAI Team
    `.trim();
  }

  /**
   * Helper methods for reason text
   */
  private getReasonText(reason: ClosureReason): string {
    const reasons = {
      non_payment: 'Outstanding payment issues',
      policy_violation: 'Terms of service violation',
      company_requested: 'Company requested closure',
      inactivity: 'Account inactivity',
      data_breach: 'Security incident',
      legal_requirement: 'Legal compliance requirement',
      business_closure: 'Business closure',
      migration: 'Data migration',
      other: 'Administrative decision'
    };
    return reasons[reason] || 'Administrative decision';
  }

  private getSuspensionReasonText(reason: SuspensionReason): string {
    const reasons = {
      payment_overdue: 'Overdue payment',
      policy_violation: 'Policy violation',
      security_concern: 'Security concern',
      investigation: 'Under investigation',
      maintenance: 'System maintenance',
      company_requested: 'Company requested',
      legal_requirement: 'Legal requirement',
      other: 'Administrative decision'
    };
    return reasons[reason] || 'Administrative decision';
  }
}