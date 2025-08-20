// Backend performance optimization utilities

import { firestore } from 'firebase-admin';
import { logger } from './logger';

// Query optimization utilities
export class FirestoreOptimizer {
  private static instance: FirestoreOptimizer;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private db: firestore.Firestore;

  constructor() {
    this.db = firestore();
  }

  static getInstance(): FirestoreOptimizer {
    if (!FirestoreOptimizer.instance) {
      FirestoreOptimizer.instance = new FirestoreOptimizer();
    }
    return FirestoreOptimizer.instance;
  }

  // Optimized query with caching and pagination
  async optimizedQuery(
    collection: string,
    filters: Array<{
      field: string;
      operator: firestore.WhereFilterOp;
      value: any;
    }> = [],
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit: number = 50,
    cacheKey?: string,
    cacheTTL: number = 300000 // 5 minutes default
  ): Promise<any[]> {
    // Generate cache key if not provided
    const key = cacheKey || this.generateCacheKey(collection, filters, orderBy, limit);
    
    // Check cache first
    const cached = this.getFromCache(key);
    if (cached) {
      logger.info(`Query cache hit for key: ${key}`);
      return cached;
    }

    const startTime = Date.now();
    
    try {
      let query: firestore.Query = this.db.collection(collection);

      // Apply filters
      filters.forEach(filter => {
        query = query.where(filter.field, filter.operator, filter.value);
      });

      // Apply ordering
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction);
      }

      // Apply limit
      query = query.limit(limit);

      const snapshot = await query.get();
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const queryTime = Date.now() - startTime;

      // Log slow queries
      if (queryTime > 1000) {
        logger.warn(`Slow Firestore query detected: ${key} took ${queryTime}ms`);
      }

      // Cache results
      this.setCache(key, results, cacheTTL);

      logger.info(`Firestore query completed: ${key} (${queryTime}ms, ${results.length} docs)`);
      
      return results;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error(`Firestore query failed: ${key} (${queryTime}ms)`, error);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: any;
  }>): Promise<void> {
    const batch = this.db.batch();
    const maxBatchSize = 500; // Firestore batch limit
    
    // Process in chunks
    for (let i = 0; i < operations.length; i += maxBatchSize) {
      const chunk = operations.slice(i, i + maxBatchSize);
      const chunkBatch = this.db.batch();
      
      chunk.forEach(operation => {
        const docRef = this.db.collection(operation.collection).doc(operation.docId);
        
        switch (operation.type) {
          case 'create':
            chunkBatch.create(docRef, operation.data);
            break;
          case 'update':
            chunkBatch.update(docRef, operation.data);
            break;
          case 'delete':
            chunkBatch.delete(docRef);
            break;
        }
      });

      await chunkBatch.commit();
      logger.info(`Batch write completed: ${chunk.length} operations`);
    }

    // Invalidate relevant caches
    this.invalidateCache();
  }

  // Optimized aggregation queries
  async aggregateQuery(
    collection: string,
    aggregations: Array<{
      type: 'count' | 'sum' | 'avg';
      field?: string;
    }>,
    filters: Array<{
      field: string;
      operator: firestore.WhereFilterOp;
      value: any;
    }> = [],
    cacheKey?: string,
    cacheTTL: number = 600000 // 10 minutes for aggregations
  ): Promise<Record<string, number>> {
    const key = cacheKey || `agg_${collection}_${JSON.stringify(aggregations)}_${JSON.stringify(filters)}`;
    
    const cached = this.getFromCache(key);
    if (cached) {
      return cached;
    }

    let query: firestore.Query = this.db.collection(collection);
    
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });

    const snapshot = await query.get();
    const docs = snapshot.docs.map(doc => doc.data());
    
    const results: Record<string, number> = {};

    aggregations.forEach(agg => {
      switch (agg.type) {
        case 'count':
          results.count = docs.length;
          break;
        case 'sum':
          if (agg.field) {
            results[`sum_${agg.field}`] = docs.reduce((sum, doc) => 
              sum + (Number(doc[agg.field]) || 0), 0
            );
          }
          break;
        case 'avg':
          if (agg.field) {
            const sum = docs.reduce((sum, doc) => sum + (Number(doc[agg.field]) || 0), 0);
            results[`avg_${agg.field}`] = docs.length > 0 ? sum / docs.length : 0;
          }
          break;
      }
    });

    this.setCache(key, results, cacheTTL);
    return results;
  }

  // Connection pooling for external services
  private connectionPool: Map<string, any> = new Map();

  async getConnection(service: string, connectionFactory: () => Promise<any>): Promise<any> {
    if (!this.connectionPool.has(service)) {
      const connection = await connectionFactory();
      this.connectionPool.set(service, connection);
    }
    return this.connectionPool.get(service);
  }

  // Query performance monitoring
  private queryMetrics: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    slowQueries: number;
  }> = new Map();

  logQueryMetrics(queryKey: string, executionTime: number): void {
    if (!this.queryMetrics.has(queryKey)) {
      this.queryMetrics.set(queryKey, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        slowQueries: 0,
      });
    }

    const metrics = this.queryMetrics.get(queryKey)!;
    metrics.count++;
    metrics.totalTime += executionTime;
    metrics.avgTime = metrics.totalTime / metrics.count;
    
    if (executionTime > 1000) {
      metrics.slowQueries++;
    }

    // Log metrics every 100 queries or if consistently slow
    if (metrics.count % 100 === 0 || metrics.avgTime > 800) {
      logger.info(`Query metrics for ${queryKey}:`, {
        count: metrics.count,
        avgTime: metrics.avgTime,
        slowQueries: metrics.slowQueries,
        slowQueryRate: (metrics.slowQueries / metrics.count) * 100,
      });
    }
  }

  getQueryMetrics(): Record<string, any> {
    return Object.fromEntries(this.queryMetrics);
  }

  // Cache management
  private generateCacheKey(...args: any[]): string {
    return Buffer.from(JSON.stringify(args)).toString('base64').substring(0, 50);
  }

  private getFromCache(key: string): any | null {
    const entry = this.queryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Limit cache size
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.queryCache.clear();
      return;
    }

    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  // Health check for database performance
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      avgQueryTime: number;
      cacheHitRate: number;
      slowQueryRate: number;
      connectionCount: number;
    };
    recommendations: string[];
  }> {
    const metrics = this.getQueryMetrics();
    const totalQueries = Object.values(metrics).reduce((sum: number, m: any) => sum + m.count, 0);
    const totalTime = Object.values(metrics).reduce((sum: number, m: any) => sum + m.totalTime, 0);
    const slowQueries = Object.values(metrics).reduce((sum: number, m: any) => sum + m.slowQueries, 0);

    const avgQueryTime = totalQueries > 0 ? totalTime / totalQueries : 0;
    const slowQueryRate = totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0;
    
    // Calculate cache hit rate (simplified)
    const cacheHitRate = this.queryCache.size > 0 ? 75 : 0; // Placeholder logic

    const recommendations: string[] = [];
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (avgQueryTime > 1000) {
      status = 'unhealthy';
      recommendations.push('Average query time is too high. Consider query optimization or indexing.');
    } else if (avgQueryTime > 500) {
      status = 'degraded';
      recommendations.push('Query performance is degraded. Monitor for optimization opportunities.');
    }

    if (slowQueryRate > 20) {
      status = 'unhealthy';
      recommendations.push('High percentage of slow queries detected. Review query patterns.');
    } else if (slowQueryRate > 10) {
      if (status === 'healthy') status = 'degraded';
      recommendations.push('Elevated slow query rate. Consider performance optimization.');
    }

    if (cacheHitRate < 50) {
      if (status === 'healthy') status = 'degraded';
      recommendations.push('Low cache hit rate. Review caching strategy.');
    }

    return {
      status,
      metrics: {
        avgQueryTime,
        cacheHitRate,
        slowQueryRate,
        connectionCount: this.connectionPool.size,
      },
      recommendations,
    };
  }
}

// Redis-like caching layer for Cloud Functions
export class CloudFunctionCache {
  private static memoryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  static set(key: string, value: any, ttlSeconds: number = 300): void {
    // Clean old entries periodically
    if (this.memoryCache.size > 500) {
      this.cleanup();
    }

    this.memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  static invalidate(pattern: string): void {
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }

  static clear(): void {
    this.memoryCache.clear();
  }

  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  static getStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.memoryCache.size,
      hitRate: 0, // Would need hit tracking for accurate rate
      entries,
    };
  }
}

// Performance monitoring middleware for Cloud Functions
export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data: any) {
      const duration = Date.now() - startTime;
      
      // Log slow requests
      if (duration > 5000) { // 5 seconds
        logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
      }

      // Add performance headers
      res.set('X-Response-Time', `${duration}ms`);
      res.set('X-Cache-Status', req.cacheHit ? 'HIT' : 'MISS');

      // Track metrics
      logRequestMetrics(req.method, req.path, duration, res.statusCode);

      return originalSend.call(this, data);
    };

    next();
  };
}

// Request metrics tracking
const requestMetrics: Map<string, {
  count: number;
  totalTime: number;
  avgTime: number;
  slowRequests: number;
  errors: number;
}> = new Map();

function logRequestMetrics(method: string, path: string, duration: number, statusCode: number): void {
  const key = `${method} ${path}`;
  
  if (!requestMetrics.has(key)) {
    requestMetrics.set(key, {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowRequests: 0,
      errors: 0,
    });
  }

  const metrics = requestMetrics.get(key)!;
  metrics.count++;
  metrics.totalTime += duration;
  metrics.avgTime = metrics.totalTime / metrics.count;
  
  if (duration > 2000) {
    metrics.slowRequests++;
  }

  if (statusCode >= 400) {
    metrics.errors++;
  }
}

export function getRequestMetrics(): Record<string, any> {
  return Object.fromEntries(requestMetrics);
}

// Database connection optimization
export class ConnectionManager {
  private static pools: Map<string, any> = new Map();
  
  static async getPool(connectionString: string, options: any = {}): Promise<any> {
    if (!this.pools.has(connectionString)) {
      // This would be implemented with actual database drivers
      // Example with a hypothetical database connection
      const pool = {
        connectionString,
        maxConnections: options.maxConnections || 10,
        currentConnections: 0,
        // ... other pool configuration
      };
      
      this.pools.set(connectionString, pool);
      logger.info(`Created new connection pool for ${connectionString}`);
    }
    
    return this.pools.get(connectionString);
  }

  static getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [connectionString, pool] of this.pools.entries()) {
      stats[connectionString] = {
        maxConnections: pool.maxConnections,
        currentConnections: pool.currentConnections,
        utilization: (pool.currentConnections / pool.maxConnections) * 100,
      };
    }
    
    return stats;
  }
}