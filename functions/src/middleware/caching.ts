// Advanced caching middleware for Cloud Functions

import { Request, Response, NextFunction } from 'express';
import { CloudFunctionCache } from '../utils/performanceOptimization';
import { logger } from '../utils/logger';

interface CachingOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  varyHeaders?: string[];
  skipCache?: (req: Request) => boolean;
  invalidatePatterns?: string[];
}

// Default cache key generator
function defaultKeyGenerator(req: Request): string {
  const { method, path, query, user } = req;
  const userId = (user as any)?.uid || 'anonymous';
  
  return `${method}:${path}:${JSON.stringify(query)}:${userId}`;
}

// Cache headers middleware
export function cacheHeaders(maxAge: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set cache headers for static resources
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', `public, max-age=${maxAge * 10}`); // 10x longer for static assets
      res.set('ETag', `"${Date.now()}"`);
    } else {
      // API responses
      res.set('Cache-Control', `private, max-age=${maxAge}`);
    }
    
    next();
  };
}

// Memory caching middleware
export function memoryCache(options: CachingOptions = {}) {
  const {
    ttl = 300,
    keyGenerator = defaultKeyGenerator,
    condition = () => true,
    skipCache = () => false,
    invalidatePatterns = [],
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for certain conditions
    if (skipCache(req) || req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    // Try to get from cache
    const cachedResponse = CloudFunctionCache.get(cacheKey);
    if (cachedResponse && condition(req, res)) {
      logger.info(`Cache HIT: ${cacheKey}`);
      
      // Set cache headers
      res.set('X-Cache-Status', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      
      return res.json(cachedResponse);
    }

    // Cache miss - intercept response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && condition(req, res)) {
        CloudFunctionCache.set(cacheKey, data, ttl);
        logger.info(`Cache MISS - Stored: ${cacheKey}`);
        
        // Invalidate related cache entries if needed
        invalidatePatterns.forEach(pattern => {
          CloudFunctionCache.invalidate(pattern);
        });
      }

      res.set('X-Cache-Status', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      
      return originalJson.call(this, data);
    };

    next();
  };
}

// Smart caching based on request patterns
export function smartCache(options: CachingOptions = {}) {
  const requestPatterns: Map<string, { count: number; avgResponseTime: number }> = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const pattern = `${req.method}:${req.route?.path || req.path}`;
    const startTime = Date.now();
    
    // Track request patterns
    if (!requestPatterns.has(pattern)) {
      requestPatterns.set(pattern, { count: 0, avgResponseTime: 0 });
    }
    
    const patternStats = requestPatterns.get(pattern)!;
    patternStats.count++;
    
    // Determine TTL based on request frequency and response time
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      patternStats.avgResponseTime = 
        (patternStats.avgResponseTime * (patternStats.count - 1) + responseTime) / patternStats.count;
      
      // Calculate smart TTL
      let smartTtl = options.ttl || 300;
      
      if (patternStats.count > 10) {
        // High frequency requests get longer cache time
        if (patternStats.count > 100) {
          smartTtl *= 2;
        }
        
        // Fast responses can be cached longer
        if (patternStats.avgResponseTime < 100) {
          smartTtl *= 1.5;
        } else if (patternStats.avgResponseTime > 1000) {
          smartTtl *= 0.5; // Slow responses cached for shorter time
        }
      }
      
      // Apply smart caching
      if (req.method === 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        const cacheKey = (options.keyGenerator || defaultKeyGenerator)(req);
        CloudFunctionCache.set(cacheKey, (res as any).data, smartTtl);
        
        res.set('X-Smart-TTL', smartTtl.toString());
      }
      
      res.set('X-Pattern-Count', patternStats.count.toString());
      res.set('X-Avg-Response-Time', patternStats.avgResponseTime.toString());
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

// Cache warming for predictable data
export class CacheWarmer {
  private static warmingJobs: Map<string, NodeJS.Timeout> = new Map();
  
  static scheduleWarmup(
    key: string,
    dataFetcher: () => Promise<any>,
    interval: number = 240000 // 4 minutes (before 5-minute TTL expires)
  ): void {
    // Clear existing job
    if (this.warmingJobs.has(key)) {
      clearInterval(this.warmingJobs.get(key)!);
    }
    
    // Schedule new warming job
    const job = setInterval(async () => {
      try {
        logger.info(`Cache warming: ${key}`);
        const data = await dataFetcher();
        CloudFunctionCache.set(key, data, 300);
      } catch (error) {
        logger.error(`Cache warming failed for ${key}:`, error);
      }
    }, interval);
    
    this.warmingJobs.set(key, job);
    
    // Initial warming
    dataFetcher().then(data => {
      CloudFunctionCache.set(key, data, 300);
    }).catch(error => {
      logger.error(`Initial cache warming failed for ${key}:`, error);
    });
  }
  
  static stopWarmup(key: string): void {
    const job = this.warmingJobs.get(key);
    if (job) {
      clearInterval(job);
      this.warmingJobs.delete(key);
    }
  }
  
  static getActiveJobs(): string[] {
    return Array.from(this.warmingJobs.keys());
  }
}

// ETags for client-side caching
export function etagCache() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Generate ETag from data
      const dataString = JSON.stringify(data);
      const etag = `"${Buffer.from(dataString).toString('base64').substring(0, 32)}"`;
      
      res.set('ETag', etag);
      
      // Check if client has matching ETag
      const clientETag = req.get('If-None-Match');
      if (clientETag === etag) {
        return res.status(304).end();
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Cache invalidation on data mutations
export function invalidateOnMutation(patterns: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on mutation operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originalEnd = res.end;
      
      res.end = function(chunk?: any, encoding?: any) {
        // Invalidate cache on successful mutations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          patterns.forEach(pattern => {
            CloudFunctionCache.invalidate(pattern);
            logger.info(`Cache invalidated for pattern: ${pattern}`);
          });
        }
        
        return originalEnd.call(this, chunk, encoding);
      };
    }
    
    next();
  };
}

// Compressed response caching
export function compressedCache(compressionLevel: number = 6) {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptsGzip = req.get('Accept-Encoding')?.includes('gzip');
    
    if (!acceptsGzip) {
      return next();
    }
    
    const originalJson = res.json;
    res.json = function(data: any) {
      const dataString = JSON.stringify(data);
      
      // Only compress larger responses
      if (dataString.length > 1000) {
        const zlib = require('zlib');
        const compressed = zlib.gzipSync(dataString, { level: compressionLevel });
        
        res.set('Content-Encoding', 'gzip');
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', compressed.length.toString());
        
        return res.send(compressed);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Cache statistics middleware
export function cacheStats() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/cache-stats' && req.method === 'GET') {
      const stats = CloudFunctionCache.getStats();
      
      return res.json({
        cache: stats,
        warmingJobs: CacheWarmer.getActiveJobs(),
        timestamp: Date.now(),
      });
    }
    
    next();
  };
}

// Health check with cache metrics
export function cacheHealthCheck() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health/cache' && req.method === 'GET') {
      const stats = CloudFunctionCache.getStats();
      
      const health = {
        status: 'healthy',
        cache: {
          size: stats.size,
          hitRate: stats.hitRate,
          uptime: process.uptime(),
        },
        recommendations: [] as string[],
      };
      
      if (stats.size > 400) {
        health.recommendations.push('Cache size is high. Consider increasing cleanup frequency.');
      }
      
      if (stats.hitRate < 30) {
        health.recommendations.push('Low cache hit rate. Review caching strategy.');
      }
      
      return res.json(health);
    }
    
    next();
  };
}