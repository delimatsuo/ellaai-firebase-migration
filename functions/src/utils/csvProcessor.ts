import * as admin from 'firebase-admin';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { 
  CSVUserData, 
  CSVImportResult, 
  CSVImportError, 
  CSVImportWarning,
  UserPermissions,
  CompanyRole,
  CreateUserRequest,
  CompanyUser,
  UserExportRequest
} from '../types/user';
import { AppError } from './errors';

export class CSVProcessor {
  private static readonly REQUIRED_FIELDS = ['email', 'firstName', 'lastName', 'role'];
  private static readonly PERMISSION_FIELDS = [
    'canCreateAssessments', 'canViewAllCandidates', 'canManageUsers',
    'canModifySettings', 'canViewBilling', 'canExportData',
    'canManageIntegrations', 'canViewReports', 'canManagePositions',
    'canScheduleInterviews'
  ];

  /**
   * Parse and validate CSV data for user import
   */
  static async parseCSV(csvContent: string, companyId: string): Promise<CSVImportResult> {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relaxColumnCount: true,
      });

      const result: CSVImportResult = {
        totalRows: records.length,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        processedRows: 0,
        errors: [],
        warnings: [],
        preview: []
      };

      const emailsSeen = new Set<string>();
      const existingUsers = await this.getExistingUserEmails(companyId);

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const lineNumber = i + 2; // Account for header row

        try {
          const userData = await this.validateRow(row, lineNumber, emailsSeen, existingUsers);
          
          if (userData) {
            result.validRows++;
            if (result.preview && result.preview.length < 10) {
              result.preview.push(userData);
            }
          } else {
            result.invalidRows++;
          }
        } catch (error: any) {
          result.errors.push({
            line: lineNumber,
            error: error.message,
            code: error.code || 'VALIDATION_ERROR'
          });
          result.invalidRows++;
        }
      }

      return result;
    } catch (error: any) {
      throw new AppError(`Failed to parse CSV: ${error.message}`, 400, 'CSV_PARSE_ERROR');
    }
  }

  /**
   * Process CSV data and return validated user creation requests
   */
  static async processCSVForImport(
    csvContent: string, 
    companyId: string,
    validateOnly: boolean = false
  ): Promise<{
    users: CreateUserRequest[];
    errors: CSVImportError[];
    warnings: CSVImportWarning[];
    stats: {
      total: number;
      valid: number;
      invalid: number;
      duplicates: number;
    };
  }> {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true,
    });

    const users: CreateUserRequest[] = [];
    const errors: CSVImportError[] = [];
    const warnings: CSVImportWarning[] = [];
    const emailsSeen = new Set<string>();
    const existingUsers = await this.getExistingUserEmails(companyId);

    let duplicates = 0;
    let valid = 0;
    let invalid = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i] as any;
      const lineNumber = i + 2;

      try {
        // Validate required fields
        const validationResult = this.validateRequiredFields(row as any, lineNumber);
        if (validationResult.errors.length > 0) {
          errors.push(...validationResult.errors);
          invalid++;
          continue;
        }

        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings);
        }

        const email = row.email.toLowerCase().trim();

        // Check for duplicates in CSV
        if (emailsSeen.has(email)) {
          errors.push({
            line: lineNumber,
            field: 'email',
            value: email,
            error: 'Duplicate email in CSV',
            code: 'DUPLICATE_EMAIL_CSV'
          });
          duplicates++;
          continue;
        }

        // Check for existing users
        if (existingUsers.has(email)) {
          warnings.push({
            line: lineNumber,
            field: 'email',
            value: email,
            warning: 'User with this email already exists',
            suggestion: 'Consider updating existing user instead'
          });
        }

        emailsSeen.add(email);

        // Build user creation request
        const userRequest: CreateUserRequest = {
          email,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          role: this.validateRole(row.role, lineNumber),
          companyId,
          phone: row.phone?.trim() || undefined,
          departmentId: row.departmentId?.trim() || undefined,
          position: row.position?.trim() || undefined,
          manager: row.manager?.trim() || undefined,
          permissions: this.parsePermissions(row, lineNumber, warnings),
          sendInviteEmail: true
        };

        users.push(userRequest);
        valid++;

      } catch (error: any) {
        errors.push({
          line: lineNumber,
          error: error.message,
          code: error.code || 'PROCESSING_ERROR'
        });
        invalid++;
      }
    }

    return {
      users,
      errors,
      warnings,
      stats: {
        total: records.length,
        valid,
        invalid,
        duplicates
      }
    };
  }

  /**
   * Generate CSV template for user import
   */
  static generateTemplate(includePermissions: boolean = false): string {
    const headers = [
      'email',
      'firstName', 
      'lastName',
      'role',
      'phone',
      'departmentId',
      'position',
      'manager'
    ];

    if (includePermissions) {
      headers.push(...this.PERMISSION_FIELDS);
    }

    const sampleRow = [
      'john.doe@company.com',
      'John',
      'Doe', 
      'recruiter',
      '+1234567890',
      'hr',
      'Senior Recruiter',
      'jane.manager@company.com'
    ];

    if (includePermissions) {
      // Add sample permission values (all false by default)
      sampleRow.push(...this.PERMISSION_FIELDS.map(() => 'false'));
    }

    const csvData = [headers, sampleRow];
    
    return stringify(csvData, {
      header: true,
      columns: headers
    });
  }

  /**
   * Export users to CSV format
   */
  static async exportUsersToCSV(
    users: CompanyUser[], 
    exportRequest: UserExportRequest
  ): Promise<string> {
    const fields = exportRequest.includeFields;
    const includePersonalData = exportRequest.includePersonalData;

    // Build headers based on requested fields
    const headers: string[] = [];
    const userRows: any[][] = [];

    // Standard fields
    const standardFields = [
      'email', 'firstName', 'lastName', 'role', 'status', 
      'departmentId', 'position', 'phone', 'manager'
    ];

    // Add requested standard fields
    headers.push(...standardFields.filter(field => fields.includes(field)));

    // Add permission fields if requested
    if (fields.includes('permissions')) {
      headers.push(...this.PERMISSION_FIELDS);
    }

    // Add metadata fields if requested
    if (fields.includes('metadata')) {
      headers.push('createdAt', 'lastSignIn', 'loginCount');
    }

    // Process each user
    for (const user of users) {
      const row: any[] = [];

      for (const header of headers) {
        switch (header) {
          case 'email':
            row.push(includePersonalData ? user.email : this.maskEmail(user.email));
            break;
          case 'firstName':
            row.push(includePersonalData ? user.firstName : 'REDACTED');
            break;
          case 'lastName':
            row.push(includePersonalData ? user.lastName : 'REDACTED');
            break;
          case 'phone':
            row.push(includePersonalData ? (user.phone || '') : 'REDACTED');
            break;
          case 'role':
            row.push(user.companyRole);
            break;
          case 'status':
            row.push(user.status);
            break;
          case 'departmentId':
            row.push(user.departmentId || '');
            break;
          case 'position':
            row.push(user.position || '');
            break;
          case 'manager':
            row.push(user.manager || '');
            break;
          case 'createdAt':
            row.push(user.createdAt.toDate().toISOString());
            break;
          case 'lastSignIn':
            row.push(user.lastSignIn?.toDate().toISOString() || '');
            break;
          case 'loginCount':
            row.push(user.metadata.loginCount);
            break;
          default:
            // Handle permission fields
            if (this.PERMISSION_FIELDS.includes(header)) {
              row.push(user.permissions[header as keyof UserPermissions] ? 'true' : 'false');
            } else {
              row.push('');
            }
        }
      }

      userRows.push(row);
    }

    return stringify([headers, ...userRows], {
      header: false
    });
  }

  /**
   * Validate a single CSV row
   */
  private static async validateRow(
    row: any, 
    lineNumber: number, 
    emailsSeen: Set<string>, 
    existingUsers: Set<string>
  ): Promise<CSVUserData | null> {
    const errors: CSVImportError[] = [];
    const warnings: CSVImportWarning[] = [];

    // Validate required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!row[field] || typeof row[field] !== 'string' || !row[field].trim()) {
        errors.push({
          line: lineNumber,
          field,
          error: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING'
        });
      }
    }

    if (errors.length > 0) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const email = row.email.toLowerCase().trim();

    // Validate email format
    if (!this.isValidEmail(email)) {
      errors.push({
        line: lineNumber,
        field: 'email',
        value: email,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Check for duplicates
    if (emailsSeen.has(email)) {
      errors.push({
        line: lineNumber,
        field: 'email',
        value: email,
        error: 'Duplicate email in CSV',
        code: 'DUPLICATE_EMAIL'
      });
    }

    if (existingUsers.has(email)) {
      warnings.push({
        line: lineNumber,
        field: 'email',
        value: email,
        warning: 'User with this email already exists'
      });
    }

    emailsSeen.add(email);

    // Validate role
    const role = this.validateRole(row.role, lineNumber);

    // Build user data
    const userData: CSVUserData = {
      email,
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      role,
      phone: row.phone?.trim() || undefined,
      departmentId: row.departmentId?.trim() || undefined,
      position: row.position?.trim() || undefined,
      manager: row.manager?.trim() || undefined,
      permissions: this.parsePermissions(row, lineNumber, warnings)
    };

    return userData;
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(
    row: any, 
    lineNumber: number
  ): { errors: CSVImportError[]; warnings: CSVImportWarning[] } {
    const errors: CSVImportError[] = [];
    const warnings: CSVImportWarning[] = [];

    for (const field of this.REQUIRED_FIELDS) {
      if (!row[field] || typeof row[field] !== 'string' || !row[field].trim()) {
        errors.push({
          line: lineNumber,
          field,
          error: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING'
        });
      }
    }

    // Validate email format
    if (row.email && !this.isValidEmail(row.email.trim())) {
      errors.push({
        line: lineNumber,
        field: 'email',
        value: row.email,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate and normalize role
   */
  private static validateRole(role: string, lineNumber: number): CompanyRole {
    const validRoles: CompanyRole[] = ['owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'viewer'];
    const normalizedRole = role.toLowerCase().trim() as CompanyRole;

    if (!validRoles.includes(normalizedRole)) {
      throw new AppError(
        `Invalid role '${role}' at line ${lineNumber}. Valid roles: ${validRoles.join(', ')}`,
        400,
        'INVALID_ROLE'
      );
    }

    return normalizedRole;
  }

  /**
   * Parse permissions from CSV row
   */
  private static parsePermissions(
    row: any, 
    lineNumber: number, 
    warnings: CSVImportWarning[]
  ): Partial<UserPermissions> {
    const permissions: Partial<UserPermissions> = {};

    for (const field of this.PERMISSION_FIELDS) {
      if (row[field] !== undefined) {
        const value = row[field].toString().toLowerCase().trim();
        
        if (['true', '1', 'yes', 'y'].includes(value)) {
          (permissions as any)[field] = true;
        } else if (['false', '0', 'no', 'n', ''].includes(value)) {
          (permissions as any)[field] = false;
        } else {
          warnings.push({
            line: lineNumber,
            field,
            value: row[field],
            warning: `Invalid boolean value for ${field}. Using 'false' as default.`,
            suggestion: "Use 'true' or 'false'"
          });
          (permissions as any)[field] = false;
        }
      }
    }

    return permissions;
  }

  /**
   * Get existing user emails in company
   */
  private static async getExistingUserEmails(companyId: string): Promise<Set<string>> {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users')
      .where('companyAccess', 'array-contains', companyId)
      .select('email')
      .get();

    const emails = new Set<string>();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        emails.add(data.email.toLowerCase());
      }
    });

    return emails;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mask email for privacy
   */
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
  }
}

/**
 * Helper function to generate CSV template download
 */
export function generateCSVTemplate(
  includePermissions: boolean = false,
  customFields: string[] = []
): string {
  return CSVProcessor.generateTemplate(includePermissions);
}

/**
 * Helper function to validate CSV content before processing
 */
export async function validateCSVContent(
  csvContent: string,
  companyId: string
): Promise<CSVImportResult> {
  return CSVProcessor.parseCSV(csvContent, companyId);
}

/**
 * Helper function to process CSV for bulk import
 */
export async function processCSVForBulkImport(
  csvContent: string,
  companyId: string,
  validateOnly: boolean = false
) {
  return CSVProcessor.processCSVForImport(csvContent, companyId, validateOnly);
}