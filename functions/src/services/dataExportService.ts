import * as admin from 'firebase-admin';
import { 
  CompanyDataExportRequest,
  CompanyDataExportStatus,
  ExportMetadata,
  ExportFormat,
  ExportPhase,
  DataRetentionCertificate
} from '../types/closure';
import { Company } from '../types/company';

export class DataExportService {
  private db: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor() {
    this.db = admin.firestore();
    this.storage = admin.storage();
  }

  /**
   * Initiate company data export
   */
  async initiateDataExport(request: CompanyDataExportRequest): Promise<{
    success: boolean;
    exportId?: string;
    error?: string;
  }> {
    try {
      // Validate company exists
      const companyDoc = await this.db.collection('companies').doc(request.companyId).get();
      if (!companyDoc.exists) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      // const companyData = companyDoc.data() as Company;

      // Check if export is already in progress
      const existingExportQuery = await this.db
        .collection('data-exports')
        .where('companyId', '==', request.companyId)
        .where('status', 'in', ['queued', 'in_progress'])
        .limit(1)
        .get();

      if (!existingExportQuery.empty) {
        return {
          success: false,
          error: 'Data export is already in progress for this company'
        };
      }

      const exportRef = this.db.collection('data-exports').doc();
      const exportId = exportRef.id;
      const now = admin.firestore.Timestamp.now();

      // Gather metadata about what will be exported
      const metadata = await this.gatherExportMetadata(request);

      const exportStatus: CompanyDataExportStatus = {
        exportId,
        companyId: request.companyId,
        status: 'queued',
        format: request.format,
        requestedBy: request.requestedBy,
        requestedAt: now,
        progress: {
          phase: 'preparation',
          completedTables: [],
          totalTables: this.getTotalTables(request),
          recordsProcessed: 0,
          totalRecords: 0,
          percentage: 0,
          lastUpdated: now
        },
        metadata
      };

      await exportRef.set(exportStatus);

      // Start the export process asynchronously
      this.processDataExport(exportId).catch(error => {
        console.error(`Error processing data export ${exportId}:`, error);
        this.markExportFailed(exportId, error.message);
      });

      return {
        success: true,
        exportId
      };

    } catch (error: any) {
      console.error('Error initiating data export:', error);
      return {
        success: false,
        error: `Failed to initiate export: ${error.message}`
      };
    }
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<{
    success: boolean;
    status?: CompanyDataExportStatus;
    error?: string;
  }> {
    try {
      const exportDoc = await this.db.collection('data-exports').doc(exportId).get();
      
      if (!exportDoc.exists) {
        return {
          success: false,
          error: 'Export not found'
        };
      }

      const status = exportDoc.data() as CompanyDataExportStatus;

      return {
        success: true,
        status
      };

    } catch (error: any) {
      console.error('Error getting export status:', error);
      return {
        success: false,
        error: `Failed to get export status: ${error.message}`
      };
    }
  }

  /**
   * Generate download link for completed export
   */
  async getDownloadLink(exportId: string, userId: string): Promise<{
    success: boolean;
    downloadUrl?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const exportDoc = await this.db.collection('data-exports').doc(exportId).get();
      
      if (!exportDoc.exists) {
        return {
          success: false,
          error: 'Export not found'
        };
      }

      const exportData = exportDoc.data() as CompanyDataExportStatus;

      if (exportData.status !== 'completed') {
        return {
          success: false,
          error: 'Export is not completed yet'
        };
      }

      // Check if user has access to this export
      if (!await this.hasExportAccess(userId, exportData.companyId)) {
        return {
          success: false,
          error: 'Access denied to this export'
        };
      }

      // Check if download link is still valid
      if (exportData.downloadExpires && exportData.downloadExpires.toDate() < new Date()) {
        return {
          success: false,
          error: 'Download link has expired'
        };
      }

      if (exportData.downloadUrl) {
        return {
          success: true,
          downloadUrl: exportData.downloadUrl,
          expiresAt: exportData.downloadExpires?.toDate()
        };
      }

      // Generate new download link
      const fileName = `company-export-${exportData.companyId}-${exportId}.${this.getFileExtension(exportData.format)}`;
      const file = this.storage.bucket().file(`exports/${fileName}`);
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expiresAt
      });

      // Update export record with download URL
      await this.db.collection('data-exports').doc(exportId).update({
        downloadUrl,
        downloadExpires: admin.firestore.Timestamp.fromDate(expiresAt)
      });

      return {
        success: true,
        downloadUrl,
        expiresAt
      };

    } catch (error: any) {
      console.error('Error generating download link:', error);
      return {
        success: false,
        error: `Failed to generate download link: ${error.message}`
      };
    }
  }

  /**
   * Process the actual data export
   */
  private async processDataExport(exportId: string): Promise<void> {
    const exportRef = this.db.collection('data-exports').doc(exportId);
    
    try {
      // Update status to in_progress
      await exportRef.update({
        status: 'in_progress',
        startedAt: admin.firestore.Timestamp.now()
      });

      const exportDoc = await exportRef.get();
      const exportData = exportDoc.data() as CompanyDataExportStatus;
      const request = this.reconstructRequest(exportData);

      // Phase 1: Preparation
      await this.updateExportProgress(exportId, 'preparation', 0, 0);
      
      const totalRecords = await this.countTotalRecords(request);
      
      // Phase 2: Extract data based on request
      const extractedData: Record<string, any[]> = {};
      let recordsProcessed = 0;

      if (request.includeUserData) {
        await this.updateExportProgress(exportId, 'user_data', recordsProcessed, totalRecords);
        const userData = await this.extractUserData(request.companyId, request.dateRange);
        extractedData.users = userData;
        recordsProcessed += userData.length;
      }

      if (request.includeAssessmentData) {
        await this.updateExportProgress(exportId, 'assessment_data', recordsProcessed, totalRecords);
        const assessmentData = await this.extractAssessmentData(request.companyId, request.dateRange);
        extractedData.assessments = assessmentData.assessments;
        extractedData.assessment_attempts = assessmentData.attempts;
        recordsProcessed += assessmentData.assessments.length + assessmentData.attempts.length;
      }

      if (request.includeCandidateData) {
        await this.updateExportProgress(exportId, 'candidate_data', recordsProcessed, totalRecords);
        const candidateData = await this.extractCandidateData(request.companyId, request.dateRange);
        extractedData.candidates = candidateData;
        recordsProcessed += candidateData.length;
      }

      if (request.includeSystemLogs) {
        await this.updateExportProgress(exportId, 'system_logs', recordsProcessed, totalRecords);
        const logData = await this.extractSystemLogs(request.companyId, request.dateRange);
        extractedData.audit_logs = logData;
        recordsProcessed += logData.length;
      }

      // Phase 3: Package data
      await this.updateExportProgress(exportId, 'packaging', recordsProcessed, totalRecords);
      const packagedData = await this.packageData(extractedData, request.format);

      // Phase 4: Encrypt if necessary
      await this.updateExportProgress(exportId, 'encryption', recordsProcessed, totalRecords);
      const { encryptedData, encryptionKey } = await this.encryptData(packagedData);

      // Phase 5: Upload to storage
      await this.updateExportProgress(exportId, 'upload', recordsProcessed, totalRecords);
      await this.uploadToStorage(exportId, request.companyId, encryptedData, request.format);

      // Phase 6: Cleanup and finalize
      await this.updateExportProgress(exportId, 'cleanup', recordsProcessed, totalRecords);
      
      const checksum = await this.generateChecksum(encryptedData);

      await exportRef.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
        fileSize: encryptedData.length,
        checksum,
        encryptionKey,
        'progress.percentage': 100,
        'metadata.autoDeleteAt': admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        )
      });

      // Generate data retention certificate if this is for closure
      if (request.purpose === 'closure') {
        await this.generateRetentionCertificate(request.companyId, exportId);
      }

    } catch (error: any) {
      console.error(`Error processing export ${exportId}:`, error);
      await this.markExportFailed(exportId, error.message);
    }
  }

  /**
   * Extract user data for export
   */
  private async extractUserData(
    companyId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<any[]> {
    let query = this.db.collection('users').where('companyId', '==', companyId);

    if (dateRange) {
      query = query
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.startDate))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.endDate));
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.sanitizeUserData(doc.data())
    }));
  }

  /**
   * Extract assessment data for export
   */
  private async extractAssessmentData(
    companyId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{ assessments: any[]; attempts: any[] }> {
    let assessmentQuery = this.db.collection('assessments').where('companyId', '==', companyId);
    let attemptQuery = this.db.collection('assessment-attempts').where('companyId', '==', companyId);

    if (dateRange) {
      const startTimestamp = admin.firestore.Timestamp.fromDate(dateRange.startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(dateRange.endDate);
      
      assessmentQuery = assessmentQuery
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp);
      
      attemptQuery = attemptQuery
        .where('startedAt', '>=', startTimestamp)
        .where('startedAt', '<=', endTimestamp);
    }

    const [assessmentSnapshot, attemptSnapshot] = await Promise.all([
      assessmentQuery.get(),
      attemptQuery.get()
    ]);

    return {
      assessments: assessmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      attempts: attemptSnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.sanitizeAttemptData(doc.data())
      }))
    };
  }

  /**
   * Extract candidate data for export
   */
  private async extractCandidateData(
    companyId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<any[]> {
    let query = this.db.collection('candidates').where('companyId', '==', companyId);

    if (dateRange) {
      query = query
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dateRange.startDate))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(dateRange.endDate));
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.sanitizeCandidateData(doc.data())
    }));
  }

  /**
   * Extract system logs for export
   */
  private async extractSystemLogs(
    companyId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<any[]> {
    let query = this.db.collection('audit-logs')
      .where('details.companyId', '==', companyId);

    if (dateRange) {
      query = query
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(dateRange.startDate))
        .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(dateRange.endDate));
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Package data in the requested format
   */
  private async packageData(data: Record<string, any[]>, format: ExportFormat): Promise<Buffer> {
    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
      
      case 'csv':
        return this.packageAsCSV(data);
      
      case 'xlsx':
        return this.packageAsExcel(data);
      
      case 'sql':
        return this.packageAsSQL(data);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Package data as CSV (multiple files in a zip)
   */
  private async packageAsCSV(data: Record<string, any[]>): Promise<Buffer> {
    // Implementation would use a CSV library to create multiple CSV files
    // and zip them together
    throw new Error('CSV export not yet implemented');
  }

  /**
   * Package data as Excel file
   */
  private async packageAsExcel(data: Record<string, any[]>): Promise<Buffer> {
    // Implementation would use a library like xlsx to create Excel file
    throw new Error('Excel export not yet implemented');
  }

  /**
   * Package data as SQL dump
   */
  private async packageAsSQL(data: Record<string, any[]>): Promise<Buffer> {
    // Implementation would generate SQL INSERT statements
    throw new Error('SQL export not yet implemented');
  }

  /**
   * Encrypt exported data
   */
  private async encryptData(data: Buffer): Promise<{
    encryptedData: Buffer;
    encryptionKey: string;
  }> {
    // In a real implementation, use proper encryption
    // For now, we'll just return the data as-is with a placeholder key
    return {
      encryptedData: data,
      encryptionKey: 'placeholder-encryption-key'
    };
  }

  /**
   * Upload data to cloud storage
   */
  private async uploadToStorage(
    exportId: string,
    companyId: string,
    data: Buffer,
    format: ExportFormat
  ): Promise<{ uploadPath: string }> {
    const fileName = `company-export-${companyId}-${exportId}.${this.getFileExtension(format)}`;
    const filePath = `exports/${fileName}`;
    
    const file = this.storage.bucket().file(filePath);
    
    await file.save(data, {
      metadata: {
        contentType: this.getContentType(format),
        metadata: {
          exportId,
          companyId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    return { uploadPath: filePath };
  }

  /**
   * Generate checksum for data integrity
   */
  private async generateChecksum(data: Buffer): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate data retention certificate
   */
  private async generateRetentionCertificate(
    companyId: string,
    exportId: string
  ): Promise<void> {
    const companyDoc = await this.db.collection('companies').doc(companyId).get();
    const companyData = companyDoc.data() as Company;

    const certificate: DataRetentionCertificate = {
      certificateId: this.db.collection('temp').doc().id,
      companyId,
      companyName: companyData.name,
      dataTypes: ['user_data', 'assessment_data', 'candidate_data', 'audit_logs'],
      retentionPeriod: 36, // 3 years
      destructionDate: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000),
      issuedAt: admin.firestore.Timestamp.now(),
      issuedBy: 'EllaAI Data Protection Officer',
      legalBasis: 'GDPR Article 6(1)(f) - Legitimate interests',
      contactEmail: 'privacy@ellaai.com'
    };

    await this.db.collection('data-retention-certificates').add(certificate);
  }

  /**
   * Utility methods
   */
  private getFileExtension(format: ExportFormat): string {
    const extensions = {
      json: 'json',
      csv: 'zip',
      xlsx: 'xlsx',
      sql: 'sql'
    };
    return extensions[format];
  }

  private getContentType(format: ExportFormat): string {
    const contentTypes = {
      json: 'application/json',
      csv: 'application/zip',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sql: 'application/sql'
    };
    return contentTypes[format];
  }

  private getTotalTables(request: CompanyDataExportRequest): number {
    let count = 0;
    if (request.includeUserData) count++;
    if (request.includeAssessmentData) count += 2; // assessments + attempts
    if (request.includeCandidateData) count++;
    if (request.includeSystemLogs) count++;
    return count;
  }

  private reconstructRequest(exportData: CompanyDataExportStatus): CompanyDataExportRequest {
    // Reconstruct request from export status (simplified)
    return {
      companyId: exportData.companyId,
      format: exportData.format,
      includeUserData: true,
      includeAssessmentData: true,
      includeCandidateData: true,
      includeSystemLogs: true,
      requestedBy: exportData.requestedBy,
      purpose: 'backup'
    };
  }

  private async countTotalRecords(request: CompanyDataExportRequest): Promise<number> {
    let total = 0;
    
    if (request.includeUserData) {
      const users = await this.db.collection('users').where('companyId', '==', request.companyId).get();
      total += users.size;
    }
    
    if (request.includeAssessmentData) {
      const [assessments, attempts] = await Promise.all([
        this.db.collection('assessments').where('companyId', '==', request.companyId).get(),
        this.db.collection('assessment-attempts').where('companyId', '==', request.companyId).get()
      ]);
      total += assessments.size + attempts.size;
    }
    
    if (request.includeCandidateData) {
      const candidates = await this.db.collection('candidates').where('companyId', '==', request.companyId).get();
      total += candidates.size;
    }
    
    if (request.includeSystemLogs) {
      const logs = await this.db.collection('audit-logs').where('details.companyId', '==', request.companyId).get();
      total += logs.size;
    }
    
    return total;
  }

  private async updateExportProgress(
    exportId: string,
    phase: ExportPhase,
    recordsProcessed: number,
    totalRecords: number
  ): Promise<void> {
    const percentage = totalRecords > 0 ? Math.round((recordsProcessed / totalRecords) * 100) : 0;
    
    await this.db.collection('data-exports').doc(exportId).update({
      'progress.phase': phase,
      'progress.recordsProcessed': recordsProcessed,
      'progress.totalRecords': totalRecords,
      'progress.percentage': percentage,
      'progress.lastUpdated': admin.firestore.Timestamp.now()
    });
  }

  private async markExportFailed(exportId: string, errorMessage: string): Promise<void> {
    await this.db.collection('data-exports').doc(exportId).update({
      status: 'failed',
      errorMessage,
      'progress.lastUpdated': admin.firestore.Timestamp.now()
    });
  }

  private async hasExportAccess(userId: string, companyId: string): Promise<boolean> {
    // Check if user has access to the company's export
    const userDoc = await this.db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data();
    return userData?.role === 'admin' || 
           userData?.companyId === companyId ||
           userData?.companyAccess?.includes(companyId);
  }

  private async gatherExportMetadata(request: CompanyDataExportRequest): Promise<ExportMetadata> {
    const tablesCounts: Record<string, number> = {};
    const dataTypes: string[] = [];
    
    if (request.includeUserData) {
      const users = await this.db.collection('users').where('companyId', '==', request.companyId).get();
      tablesCounts.users = users.size;
      dataTypes.push('user_data');
    }
    
    if (request.includeAssessmentData) {
      const [assessments, attempts] = await Promise.all([
        this.db.collection('assessments').where('companyId', '==', request.companyId).get(),
        this.db.collection('assessment-attempts').where('companyId', '==', request.companyId).get()
      ]);
      tablesCounts.assessments = assessments.size;
      tablesCounts.assessment_attempts = attempts.size;
      dataTypes.push('assessment_data');
    }
    
    if (request.includeCandidateData) {
      const candidates = await this.db.collection('candidates').where('companyId', '==', request.companyId).get();
      tablesCounts.candidates = candidates.size;
      dataTypes.push('candidate_data');
    }
    
    if (request.includeSystemLogs) {
      const logs = await this.db.collection('audit-logs').where('details.companyId', '==', request.companyId).get();
      tablesCounts.audit_logs = logs.size;
      dataTypes.push('system_logs');
    }

    return {
      tablesCounts,
      dataTypes,
      sensitiveDataIncluded: request.includeUserData || request.includeCandidateData,
      complianceFlags: ['GDPR', 'CCPA'],
      retentionPeriod: 30, // 30 days
      autoDeleteAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    };
  }

  private sanitizeUserData(data: any): any {
    // Remove sensitive fields or hash them
    const sanitized = { ...data };
    delete sanitized.passwordHash;
    delete sanitized.socialSecurityNumber;
    return sanitized;
  }

  private sanitizeAttemptData(data: any): any {
    // Remove or hash sensitive assessment data
    const sanitized = { ...data };
    // Keep structure but remove actual answers for privacy
    if (sanitized.answers) {
      sanitized.answers = '[REDACTED]';
    }
    return sanitized;
  }

  private sanitizeCandidateData(data: any): any {
    // Remove or hash sensitive candidate information
    const sanitized = { ...data };
    // Keep professional info but remove personal details
    delete sanitized.personalIdNumber;
    delete sanitized.emergencyContact;
    return sanitized;
  }
}