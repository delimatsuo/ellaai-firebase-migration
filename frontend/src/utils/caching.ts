import React from 'react';

// Advanced caching utilities for performance optimization

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AdvancedCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    // Clean up expired entries first
    this.cleanup();
    
    // If at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const globalCache = new AdvancedCache(200);

// React Query-like caching for API calls
export class ApiCache {
  private static instance: ApiCache;
  private cache = new AdvancedCache(150);
  private pendingRequests: Map<string, Promise<any>> = new Map();

  static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    return ApiCache.instance;
  }

  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key) as T;
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const request = fetcher()
      .then((data) => {
        this.cache.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  invalidate(key: string): void {
    this.cache.invalidate(key);
    this.pendingRequests.delete(key);
  }

  invalidateByPattern(pattern: string | RegExp): void {
    this.cache.invalidateByPattern(pattern);
    
    // Also clear pending requests that match pattern
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// React hook for cached API calls
export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const apiCache = React.useMemo(() => ApiCache.getInstance(), []);
  
  const fetchData = React.useCallback(async () => {
    if (!options.enabled && options.enabled !== undefined) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCache.fetchWithCache<T>(key, fetcher, options.ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.ttl, options.enabled, apiCache]);

  React.useEffect(() => {
    fetchData();
    
    // Set up refetch interval if specified
    if (options.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options.refetchInterval]);

  const invalidate = React.useCallback(() => {
    apiCache.invalidate(key);
    fetchData();
  }, [key, apiCache, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
  };
}

// Local Storage cache with compression
export class LocalStorageCache {
  private prefix: string;
  
  constructor(prefix: string = 'ellaai_cache_') {
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttl: number = 3600000): void { // Default 1 hour
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to cache data in localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.remove(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  cleanup(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry = JSON.parse(item);
            if (now - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });
  }
}

export const localCache = new LocalStorageCache();

// Automatically cleanup localStorage cache on app start
if (typeof window !== 'undefined') {
  localCache.cleanup();
}