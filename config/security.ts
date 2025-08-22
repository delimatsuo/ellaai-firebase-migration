/**
 * Security Configuration for EllaAI Platform
 * Implements comprehensive security measures including CSRF, headers, and authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface SecurityConfig {
  csrf: {
    tokenName: string;
    cookieName: string;
    headerName: string;
    secretKey: string;
  };
  headers: {
    csp: string;
    hsts: string;
    xFrame: string;
    xContentType: string;
    xss: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
}

export const securityConfig: SecurityConfig = {
  csrf: {
    tokenName: 'csrf_token',
    cookieName: '__Host-csrf',
    headerName: 'X-CSRF-Token',
    secretKey: process.env.CSRF_SECRET_KEY || crypto.randomBytes(32).toString('hex')
  },
  headers: {
    csp: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' 
        https://apis.google.com 
        https://www.gstatic.com 
        https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline' 
        https://fonts.googleapis.com;
      font-src 'self' 
        https://fonts.gstatic.com;
      img-src 'self' data: 
        https://*.googleapis.com 
        https://*.gstatic.com;
      connect-src 'self' 
        https://*.firebaseio.com 
        https://*.googleapis.com 
        https://firestore.googleapis.com;
      frame-ancestors 'none';
      base-uri 'self';
      object-src 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim(),
    hsts: 'max-age=31536000; includeSubDomains; preload',
    xFrame: 'DENY',
    xContentType: 'nosniff',
    xss: '1; mode=block'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false
  },
  cors: {
    allowedOrigins: [
      'https://ella-ai.vercel.app',
      'https://app.ella-ai.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
  }
};

/**
 * Generate CSRF token with timestamp and signature
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const token = `${timestamp}.${randomBytes}`;
  const signature = crypto
    .createHmac('sha256', securityConfig.csrf.secretKey)
    .update(token)
    .digest('hex');
  
  return `${token}.${signature}`;
}

/**
 * Verify CSRF token validity
 */
export function verifyCSRFToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [timestamp, randomBytes, signature] = parts;
    
    if (!timestamp || !randomBytes || !signature) return false;
    
    const tokenWithoutSig = `${timestamp}.${randomBytes}`;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', securityConfig.csrf.secretKey)
      .update(tokenWithoutSig)
      .digest('hex');
    
    if (signature !== expectedSignature) return false;
    
    // Check if token is not older than 1 hour
    const tokenAge = Date.now() - parseInt(timestamp);
    return tokenAge < 3600000; // 1 hour
  } catch {
    return false;
  }
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate request origin against allowed origins
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (!origin && !referer) {
    // Allow requests without origin/referer for same-origin requests
    return true;
  }
  
  const allowedOrigins = securityConfig.cors.allowedOrigins;
  
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }
  
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedOrigins.includes(refererUrl.origin);
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Rate limiting store (in-memory for development, use Redis in production)
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  increment(key: string): { count: number; resetTime: number } {
    const now = Date.now();
    const windowMs = securityConfig.rateLimit.windowMs;
    const current = this.store.get(key);
    
    if (!current || now > current.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    current.count++;
    this.store.set(key, current);
    return current;
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimitStore = new RateLimitStore();

// Cleanup rate limit store every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);