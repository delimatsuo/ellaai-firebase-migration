import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from './auth';

interface AuditLogEntry {
  timestamp: admin.firestore.FieldValue;
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  statusCode?: number;
  duration?: number;
  details?: any;
}

export const auditMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to capture response
  res.json = function(body) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log the audit entry asynchronously
    logAuditEntry(req, res, duration, body).catch(error => {
      console.error('Failed to log audit entry:', error);
    });
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
};

async function logAuditEntry(
  req: AuthenticatedRequest,
  res: Response,
  duration: number,
  responseBody?: any
): Promise<void> {
  try {
    // Only log certain actions
    const shouldLog = shouldLogRequest(req, res);
    
    if (!shouldLog) {
      return;
    }
    
    const db = admin.firestore();
    
    const auditEntry: AuditLogEntry = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: req.user?.uid,
      userRole: req.user?.role,
      action: getActionFromRequest(req),
      resource: getResourceFromPath(req.path),
      resourceId: getResourceId(req),
      method: req.method,
      path: req.path,
      ip: getClientIP(req),
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
    };
    
    // Add additional details for sensitive operations
    if (isSensitiveOperation(req)) {
      auditEntry.details = {
        queryParams: req.query,
        // Don't log sensitive data like passwords or tokens
        body: sanitizeRequestBody(req.body),
      };
    }
    
    await db.collection('audit-logs').add(auditEntry);
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
  }
}

function shouldLogRequest(req: AuthenticatedRequest, res: Response): boolean {
  // Don't log health checks
  if (req.path === '/health') {
    return false;
  }
  
  // Don't log successful GET requests for non-sensitive data
  if (req.method === 'GET' && res.statusCode === 200 && !isSensitiveResource(req.path)) {
    return false;
  }
  
  // Log all POST, PUT, DELETE requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return true;
  }
  
  // Log failed requests
  if (res.statusCode >= 400) {
    return true;
  }
  
  // Log access to sensitive resources
  if (isSensitiveResource(req.path)) {
    return true;
  }
  
  return false;
}

function getActionFromRequest(req: AuthenticatedRequest): string {
  const method = req.method;
  const path = req.path;
  
  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/auth/verify')) return 'VERIFY_SESSION';
  
  switch (method) {
    case 'POST':
      if (path.includes('/assessments/') && path.includes('/start')) return 'START_ASSESSMENT';
      if (path.includes('/assessments/') && path.includes('/complete')) return 'COMPLETE_ASSESSMENT';
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
      return 'READ';
    default:
      return method;
  }
}

function getResourceFromPath(path: string): string {
  const segments = path.split('/').filter(segment => segment);
  
  if (segments.length === 0) return 'ROOT';
  
  // Remove 'api' prefix if present
  const apiIndex = segments.indexOf('api');
  const resourceSegments = apiIndex >= 0 ? segments.slice(apiIndex + 1) : segments;
  
  if (resourceSegments.length === 0) return 'API';
  
  return resourceSegments[0].toUpperCase();
}

function getResourceId(req: AuthenticatedRequest): string | undefined {
  // Try to extract ID from URL parameters
  if (req.params.id) return req.params.id;
  if (req.params.assessmentId) return req.params.assessmentId;
  if (req.params.userId) return req.params.userId;
  if (req.params.companyId) return req.params.companyId;
  
  return undefined;
}

function isSensitiveResource(path: string): boolean {
  const sensitiveResources = [
    '/auth/',
    '/admin/',
    '/users/',
    '/companies/',
  ];
  
  return sensitiveResources.some(resource => path.includes(resource));
}

function isSensitiveOperation(req: AuthenticatedRequest): boolean {
  const sensitiveOperations = [
    'POST',
    'PUT',
    'DELETE',
  ];
  
  return sensitiveOperations.includes(req.method) || isSensitiveResource(req.path);
}

function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  const sanitized = { ...body };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}