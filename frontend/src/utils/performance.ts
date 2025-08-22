import React from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureComponentRender(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (!this.metrics.has(componentName)) {
        this.metrics.set(componentName, []);
      }
      
      const componentMetrics = this.metrics.get(componentName)!;
      componentMetrics.push(renderTime);
      
      // Keep only last 100 measurements
      if (componentMetrics.length > 100) {
        componentMetrics.shift();
      }
      
      // Log slow renders (>16ms for 60fps)
      if (renderTime > 16) {
        console.warn(`Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }

  // Get performance metrics
  getMetrics(componentName: string) {
    const metrics = this.metrics.get(componentName) || [];
    if (metrics.length === 0) return null;
    
    const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    
    return { avg, min, max, count: metrics.length };
  }

  // Measure API call performance
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordApiMetric(name, duration, 'success');
      
      // Log slow API calls
      if (duration > 1000) {
        console.warn(`Slow API call detected for ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordApiMetric(name, duration, 'error');
      throw error;
    }
  }

  private recordApiMetric(name: string, duration: number, status: 'success' | 'error') {
    const key = `api_${name}_${status}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const apiMetrics = this.metrics.get(key)!;
    apiMetrics.push(duration);
    
    if (apiMetrics.length > 100) {
      apiMetrics.shift();
    }
  }

  // Get Web Vitals
  getCoreWebVitals(): Promise<{
    lcp: number;
    fid: number;
    cls: number;
  }> {
    return new Promise((resolve) => {
      const vitals = { lcp: 0, fid: 0, cls: 0 };
      
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          vitals.lcp = lastEntry.startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          vitals.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            vitals.cls += entry.value;
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
      
      // Return after 5 seconds or when all metrics are available
      setTimeout(() => resolve(vitals), 5000);
    });
  }

  // Export metrics for analysis
  exportMetrics() {
    const exported = Object.fromEntries(
      Array.from(this.metrics.entries()).map(([key, values]) => [
        key,
        {
          count: values.length,
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p95: this.percentile(values, 95),
          p99: this.percentile(values, 99),
        },
      ])
    );
    
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: exported,
    };
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measureRender: () => monitor.measureComponentRender(componentName),
    measureApi: <T>(name: string, apiCall: () => Promise<T>) => 
      monitor.measureApiCall(name, apiCall),
    getMetrics: () => monitor.getMetrics(componentName),
  };
}

// Error boundary with performance tracking
export class PerformanceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const monitor = PerformanceMonitor.getInstance();
    
    // Track error performance impact
    console.error('Performance Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      url: window.location.href,
    });
    
    // Send to analytics if available
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-boundary' },
        React.createElement('h2', null, 'Something went wrong.'),
        React.createElement('p', null, 'We\'re sorry for the inconvenience. Please refresh the page.'),
        React.createElement('button', 
          { onClick: () => window.location.reload() }, 
          'Refresh Page'
        )
      );
    }

    return this.props.children;
  }
}

// Resource loading optimization
export function preloadCriticalResources() {
  const criticalResources = [
    '/api/auth/profile',
    '/api/assessments',
    '/api/dashboard/stats',
  ];
  
  criticalResources.forEach(url => {
    // Preload critical API endpoints
    fetch(url, { 
      method: 'HEAD',
      credentials: 'include' 
    }).catch(() => {
      // Silently fail - this is just preloading
    });
  });
}

// Lazy loading utility
export function createLazyComponent(importFn: () => Promise<any>) {
  return React.lazy(() => 
    importFn().then((module: any) => ({
      default: module.default || module
    }))
  );
}