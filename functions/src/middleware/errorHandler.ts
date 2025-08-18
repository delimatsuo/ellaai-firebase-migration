import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as any;
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  }
  
  // Handle Firebase Auth errors
  else if (error.code?.startsWith('auth/')) {
    statusCode = 401;
    message = getFirebaseAuthErrorMessage(error.code);
    code = 'FIREBASE_AUTH_ERROR';
  }
  
  // Handle Firebase Firestore errors
  else if (error.code?.startsWith('firestore/')) {
    statusCode = 400;
    message = 'Database operation failed';
    code = 'FIRESTORE_ERROR';
  }
  
  // Handle validation errors (Joi)
  else if (error.isJoi) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    error.details = error.details?.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  }
  
  // Handle duplicate key errors
  else if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate resource';
    code = 'DUPLICATE_ERROR';
  }
  
  // Handle cast errors
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
    code = 'CAST_ERROR';
  }

  const errorResponse: ErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId,
  };

  // Add details for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.details = {
      stack: err.stack,
      originalError: error,
    };
  }

  // Add validation details if present
  if (error.details) {
    errorResponse.details = error.details;
  }

  res.status(statusCode).json(errorResponse);
};

function getFirebaseAuthErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-id-token': 'Invalid authentication token',
    'auth/id-token-expired': 'Authentication token has expired',
    'auth/id-token-revoked': 'Authentication token has been revoked',
    'auth/session-cookie-expired': 'Session has expired',
    'auth/session-cookie-revoked': 'Session has been revoked',
    'auth/insufficient-permission': 'Insufficient permissions',
    'auth/user-not-found': 'User not found',
    'auth/user-disabled': 'User account is disabled',
    'auth/email-already-exists': 'Email address is already in use',
    'auth/phone-number-already-exists': 'Phone number is already in use',
    'auth/invalid-email': 'Invalid email address',
    'auth/invalid-password': 'Invalid password',
    'auth/weak-password': 'Password is too weak',
  };

  return errorMessages[code] || 'Authentication error occurred';
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};