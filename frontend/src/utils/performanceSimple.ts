// Simplified performance monitoring utilities

// Performance monitoring class
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

  // Get Core Web Vitals
  async getCoreWebVitals(): Promise<{
    lcp: number;
    fid: number;
    cls: number;
  }> {
    const vitals = { lcp: 0, fid: 0, cls: 0 };
    
    // Simplified measurement - in production, use web-vitals library
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      vitals.lcp = navigation.loadEventEnd - navigation.loadEventStart;
    }
    
    return vitals;
  }
}

// Simple error boundary (as function)
export function createErrorBoundary(fallbackComponent: () => any) {
  return fallbackComponent;
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalResources = [
    '/api/auth/profile',
    '/api/assessments',
    '/api/dashboard/stats',
  ];
  
  criticalResources.forEach(url => {
    fetch(url, { 
      method: 'HEAD',
      credentials: 'include' 
    }).catch(() => {
      // Silently fail - this is just preloading
    });
  });
}

// Simple asset optimizer
export class AssetOptimizer {
  static preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  }
}

export default PerformanceMonitor;