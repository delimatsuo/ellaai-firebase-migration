import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis)
const store: RateLimitStore = {};

export const rateLimiter = (options: RateLimitOptions = { windowMs: 60000, max: 60 }) => {
  const {
    windowMs,
    max,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    skip = () => false,
    message = 'Too many requests, please try again later'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(store).forEach(storeKey => {
      if (store[storeKey].resetTime < now) {
        delete store[storeKey];
      }
    });

    // Initialize or get current count
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    const current = store[key];
    const remaining = Math.max(0, max - current.count);
    const resetTime = Math.ceil(current.resetTime / 1000);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
    });

    if (current.count > max) {
      res.set('Retry-After', Math.ceil(windowMs / 1000).toString());
      throw new RateLimitError(message);
    }

    next();
  };
};

// Predefined rate limiters for different endpoints
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

export const assessmentRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

// User-specific rate limiter
export const userRateLimit = (options: RateLimitOptions) => {
  return rateLimiter({
    ...options,
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      return user ? `user:${user.uid}` : req.ip || 'unknown';
    },
  });
};