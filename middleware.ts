/**
 * Next.js Middleware for EllaAI Platform Security
 * Implements comprehensive security controls at the edge
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware, applySecurityHeaders, setCSRFCookie, generateCSRFToken } from './lib/middleware/security';
import { requireAdmin, requireAuth, requireRoles, logSecurityEvent } from './lib/middleware/auth';

// Define protected routes and their requirements
const routeProtections = {
  '/api/admin': { type: 'admin' },
  '/api/proctor': { type: 'roles', roles: ['admin', 'recruiter'] },
  '/api/ops': { type: 'roles', roles: ['admin', 'recruiter'] },
  '/api/assessments': { type: 'auth' },
  '/api/candidates': { type: 'auth' },
  '/api/companies': { type: 'auth' },
  '/admin': { type: 'admin' },
  '/ops': { type: 'roles', roles: ['admin', 'recruiter'] },
  '/dashboard': { type: 'auth' }
};

// Routes that don't require CSRF protection
const csrfExemptRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/api/webhooks'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/health',
  '/api/public'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }
  
  try {
    // 1. Apply general security middleware (rate limiting, CSRF, etc.)
    const securityResponse = await securityMiddleware(request);
    if (securityResponse) {
      await logSecurityEvent(
        null,
        'SECURITY_BLOCK',
        pathname,
        { reason: 'Security middleware blocked request' },
        request
      );
      return securityResponse;
    }
    
    // 2. Check if route requires authentication
    const routeProtection = Object.entries(routeProtections).find(([route]) => 
      pathname.startsWith(route)
    )?.[1];
    
    let authResponse: NextResponse | null = null;
    
    if (routeProtection) {
      switch (routeProtection.type) {
        case 'admin':
          authResponse = await requireAdmin(request);
          break;
        case 'roles':
          authResponse = await requireRoles(request, routeProtection.roles || []);
          break;
        case 'auth':
          authResponse = await requireAuth(request);
          break;
      }
      
      if (authResponse) {
        await logSecurityEvent(
          null,
          'AUTH_FAILURE',
          pathname,
          { 
            reason: 'Authentication/authorization failed',
            requiredAccess: routeProtection 
          },
          request
        );
        return authResponse;
      }
    }
    
    // 3. Log successful access for protected routes
    if (routeProtection && (request as any).user) {
      await logSecurityEvent(
        (request as any).user,
        'ACCESS_GRANTED',
        pathname,
        { requiredAccess: routeProtection },
        request
      );
    }
    
    // 4. Create response and apply security headers
    const response = NextResponse.next();
    const secureResponse = applySecurityHeaders(response);
    
    // 5. Set CSRF token for routes that need it
    if (!csrfExemptRoutes.some(route => pathname.startsWith(route))) {
      const csrfToken = generateCSRFToken();
      setCSRFCookie(secureResponse, csrfToken);
      secureResponse.headers.set('X-CSRF-Token', csrfToken);
    }
    
    // 6. Add user context to response headers (for client-side access)
    if ((request as any).user) {
      const user = (request as any).user;
      secureResponse.headers.set('X-User-Role', user.role);
      secureResponse.headers.set('X-User-ID', user.uid);
      if (user.companyId) {
        secureResponse.headers.set('X-User-Company', user.companyId);
      }
    }
    
    return secureResponse;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Log security incident
    await logSecurityEvent(
      null,
      'MIDDLEWARE_ERROR',
      pathname,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      request
    );
    
    // Return secure error response
    const errorResponse = new NextResponse(
      JSON.stringify({ 
        error: 'Internal security error',
        requestId: crypto.randomUUID()
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return applySecurityHeaders(errorResponse);
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};