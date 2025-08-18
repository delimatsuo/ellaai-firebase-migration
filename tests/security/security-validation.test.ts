/**
 * Security Validation Tests for EllaAI Platform
 * Comprehensive testing of security measures and vulnerabilities
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/testing-library/jest-dom';
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateCSRFToken, 
  verifyCSRFToken, 
  sanitizeInput, 
  validateOrigin,
  securityConfig
} from '../../config/security';
import { 
  securityMiddleware, 
  applySecurityHeaders, 
  csrfProtection,
  rateLimitMiddleware
} from '../../lib/middleware/security';
import { 
  verifyAuthToken, 
  hasRole, 
  hasPermission, 
  hasCompanyAccess,
  requireAdmin
} from '../../lib/middleware/auth';

// Mock Firebase Admin
jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: jest.fn()
  })
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        get: jest.fn(),
        add: jest.fn()
      })
    })
  })
}));

// Test data
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  role: 'recruiter' as const,
  companyId: 'company-123',
  companyAccess: ['company-123', 'company-456'],
  permissions: ['read:assessments', 'write:assessments']
};

const mockAdminUser = {
  uid: 'admin-user-123',
  email: 'admin@example.com',
  role: 'admin' as const,
  companyId: undefined,
  companyAccess: [],
  permissions: ['*']
};

describe('Security Configuration', () => {
  test('should have secure CSP headers', () => {
    expect(securityConfig.headers.csp).toContain("default-src 'self'");
    expect(securityConfig.headers.csp).toContain("object-src 'none'");
    expect(securityConfig.headers.csp).toContain("upgrade-insecure-requests");
  });

  test('should have proper HSTS configuration', () => {
    expect(securityConfig.headers.hsts).toBe('max-age=31536000; includeSubDomains; preload');
  });

  test('should deny frame embedding', () => {
    expect(securityConfig.headers.xFrame).toBe('DENY');
  });
});

describe('CSRF Protection', () => {
  test('should generate valid CSRF tokens', () => {
    const token = generateCSRFToken();
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);
    expect(verifyCSRFToken(token)).toBe(true);
  });

  test('should reject invalid CSRF tokens', () => {
    expect(verifyCSRFToken('invalid-token')).toBe(false);
    expect(verifyCSRFToken('invalid.token.format')).toBe(false);
    expect(verifyCSRFToken('')).toBe(false);
  });

  test('should reject expired CSRF tokens', () => {
    // Create token with old timestamp
    const oldTimestamp = (Date.now() - 7200000).toString(); // 2 hours ago
    const invalidToken = `${oldTimestamp}.randomBytes.signature`;
    expect(verifyCSRFToken(invalidToken)).toBe(false);
  });

  test('should validate CSRF in requests', () => {
    const token = generateCSRFToken();
    
    // Mock POST request with valid CSRF
    const validRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': token,
        'Cookie': `__Host-csrf=${token}`
      }
    });

    const result = csrfProtection(validRequest);
    expect(result.isValid).toBe(true);
  });
});

describe('Input Sanitization', () => {
  test('should sanitize XSS attempts', () => {
    const maliciousInput = '<script>alert("xss")</script>hello';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    expect(sanitized).toBe('hello');
  });

  test('should remove javascript: URLs', () => {
    const maliciousInput = 'javascript:alert("xss")';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('javascript:');
  });

  test('should remove event handlers', () => {
    const maliciousInput = 'hello onclick=alert("xss") world';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('onclick=');
  });

  test('should sanitize nested objects', () => {
    const maliciousObject = {
      name: '<script>alert("xss")</script>John',
      description: 'javascript:alert("xss")',
      nested: {
        value: 'onclick=alert("xss")'
      }
    };
    
    const sanitized = sanitizeInput(maliciousObject);
    expect(sanitized.name).toBe('John');
    expect(sanitized.description).toBe('');
    expect(sanitized.nested.value).toBe('');
  });

  test('should sanitize arrays', () => {
    const maliciousArray = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      'safe-value'
    ];
    
    const sanitized = sanitizeInput(maliciousArray);
    expect(sanitized[0]).toBe('');
    expect(sanitized[1]).toBe('');
    expect(sanitized[2]).toBe('safe-value');
  });
});

describe('Origin Validation', () => {
  test('should accept valid origins', () => {
    const validRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'origin': 'http://localhost:3000'
      }
    });
    
    expect(validateOrigin(validRequest)).toBe(true);
  });

  test('should reject invalid origins', () => {
    const invalidRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'origin': 'http://malicious-site.com'
      }
    });
    
    expect(validateOrigin(invalidRequest)).toBe(false);
  });

  test('should handle missing origin headers', () => {
    const requestWithoutOrigin = new NextRequest('http://localhost:3000/api/test', {
      headers: {}
    });
    
    // Should allow requests without origin (same-origin requests)
    expect(validateOrigin(requestWithoutOrigin)).toBe(true);
  });
});

describe('Rate Limiting', () => {
  test('should allow requests within limit', () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    });
    
    const result = rateLimitMiddleware(request);
    expect(result.allowed).toBe(true);
    expect(result.headers).toBeDefined();
  });

  test('should block requests exceeding limit', () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.100' // Different IP to avoid conflicts
      }
    });
    
    // Simulate many requests
    for (let i = 0; i <= securityConfig.rateLimit.maxRequests; i++) {
      rateLimitMiddleware(request);
    }
    
    const result = rateLimitMiddleware(request);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe('Rate limit exceeded');
  });
});

describe('Authentication and Authorization', () => {
  test('should validate user roles correctly', () => {
    expect(hasRole(mockUser, ['recruiter'])).toBe(true);
    expect(hasRole(mockUser, ['admin'])).toBe(false);
    expect(hasRole(mockAdminUser, ['admin'])).toBe(true);
  });

  test('should validate user permissions correctly', () => {
    expect(hasPermission(mockUser, 'read:assessments')).toBe(true);
    expect(hasPermission(mockUser, 'delete:users')).toBe(false);
    expect(hasPermission(mockAdminUser, 'delete:users')).toBe(true); // Admin has all permissions
  });

  test('should validate company access correctly', () => {
    expect(hasCompanyAccess(mockUser, 'company-123')).toBe(true);
    expect(hasCompanyAccess(mockUser, 'company-456')).toBe(true);
    expect(hasCompanyAccess(mockUser, 'company-789')).toBe(false);
    expect(hasCompanyAccess(mockAdminUser, 'company-789')).toBe(true); // Admin has all access
  });
});

describe('Security Headers', () => {
  test('should apply all required security headers', () => {
    const response = new NextResponse();
    const secureResponse = applySecurityHeaders(response);
    
    expect(secureResponse.headers.get('Content-Security-Policy')).toBeDefined();
    expect(secureResponse.headers.get('Strict-Transport-Security')).toBeDefined();
    expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
    expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(secureResponse.headers.get('Referrer-Policy')).toBeDefined();
    expect(secureResponse.headers.get('Permissions-Policy')).toBeDefined();
  });

  test('should remove server information headers', () => {
    const response = new NextResponse();
    response.headers.set('Server', 'nginx');
    response.headers.set('X-Powered-By', 'Express');
    
    const secureResponse = applySecurityHeaders(response);
    
    expect(secureResponse.headers.get('Server')).toBeNull();
    expect(secureResponse.headers.get('X-Powered-By')).toBeNull();
  });
});

describe('Security Middleware Integration', () => {
  test('should block requests with security violations', async () => {
    const maliciousRequest = new NextRequest('http://malicious-site.com/api/test', {
      method: 'POST',
      headers: {
        'origin': 'http://malicious-site.com',
        'x-forwarded-for': '192.168.1.200'
      },
      body: JSON.stringify({
        malicious: '<script>alert("xss")</script>'
      })
    });
    
    const response = await securityMiddleware(maliciousRequest);
    expect(response).toBeDefined();
    expect(response?.status).toBe(403);
  });

  test('should allow valid requests to pass through', async () => {
    const validRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'origin': 'http://localhost:3000'
      }
    });
    
    const response = await securityMiddleware(validRequest);
    expect(response).toBeNull(); // Null means continue processing
  });
});

describe('Vulnerability Prevention', () => {
  test('should prevent SQL injection attempts', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    const sanitized = sanitizeInput(sqlInjection);
    // Should remove dangerous SQL characters
    expect(sanitized).not.toContain("';");
    expect(sanitized).not.toContain("DROP TABLE");
    expect(sanitized).not.toContain("--");
  });

  test('should prevent NoSQL injection attempts', () => {
    const noSqlInjection = { $where: "this.username == 'admin'" };
    const sanitized = sanitizeInput(noSqlInjection);
    // Should not contain MongoDB operators
    expect(JSON.stringify(sanitized)).not.toContain('$where');
  });

  test('should prevent prototype pollution', () => {
    const pollutionAttempt = {
      '__proto__': { isAdmin: true },
      'constructor': { prototype: { isAdmin: true } }
    };
    
    const sanitized = sanitizeInput(pollutionAttempt);
    expect(sanitized).not.toHaveProperty('__proto__');
    expect(sanitized).not.toHaveProperty('constructor');
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle null and undefined inputs safely', () => {
    expect(sanitizeInput(null)).toBeNull();
    expect(sanitizeInput(undefined)).toBeUndefined();
    expect(sanitizeInput('')).toBe('');
  });

  test('should handle large input sizes', () => {
    const largeInput = 'a'.repeat(10000);
    const sanitized = sanitizeInput(largeInput);
    expect(sanitized).toBe(largeInput); // Should handle large strings
  });

  test('should handle circular references safely', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;
    
    // Should not throw error
    expect(() => sanitizeInput(circular)).not.toThrow();
  });
});