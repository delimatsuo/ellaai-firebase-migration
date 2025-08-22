// Load testing utilities for performance validation

interface LoadTestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  concurrency: number;
  duration: number; // in seconds
  rampUp?: number; // ramp up time in seconds
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
  timeline: Array<{
    timestamp: number;
    responseTime: number;
    status: number;
    success: boolean;
  }>;
}

export class LoadTester {
  private abortController?: AbortController;
  private results: LoadTestResult = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    p50ResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    requestsPerSecond: 0,
    errors: [],
    timeline: [],
  };

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    this.abortController = new AbortController();
    this.resetResults();

    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const rampUpEndTime = startTime + ((config.rampUp || 0) * 1000);

    const workers: Promise<void>[] = [];

    // Create concurrent workers
    for (let i = 0; i < config.concurrency; i++) {
      const worker = this.createWorker(
        config,
        startTime,
        endTime,
        rampUpEndTime,
        i,
        config.concurrency
      );
      workers.push(worker);
    }

    // Wait for all workers to complete
    await Promise.allSettled(workers);

    // Calculate final statistics
    this.calculateStatistics(Date.now() - startTime);

    return this.results;
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async createWorker(
    config: LoadTestConfig,
    startTime: number,
    endTime: number,
    rampUpEndTime: number,
    workerIndex: number,
    totalWorkers: number
  ): Promise<void> {
    // Calculate worker start time during ramp-up period
    const workerStartDelay = config.rampUp 
      ? (config.rampUp * 1000 * workerIndex) / totalWorkers
      : 0;

    const workerStartTime = startTime + workerStartDelay;

    // Wait for worker start time
    if (workerStartTime > Date.now()) {
      await new Promise(resolve => 
        setTimeout(resolve, workerStartTime - Date.now())
      );
    }

    // Keep making requests until test ends
    while (Date.now() < endTime && !this.abortController?.signal.aborted) {
      try {
        await this.makeRequest(config);
      } catch (error) {
        // Individual request errors are already handled in makeRequest
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async makeRequest(config: LoadTestConfig): Promise<void> {
    const requestStart = Date.now();
    let success = false;
    let status = 0;
    let errorMessage = '';

    try {
      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: this.abortController?.signal,
      });

      status = response.status;
      success = response.ok;

      if (!response.ok) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Test was stopped
      }
      
      errorMessage = error.message || 'Unknown error';
      success = false;
    }

    const responseTime = Date.now() - requestStart;

    // Record results
    this.results.totalRequests++;
    
    if (success) {
      this.results.successfulRequests++;
    } else {
      this.results.failedRequests++;
      this.results.errors.push(`${new Date().toISOString()}: ${errorMessage}`);
    }

    this.results.timeline.push({
      timestamp: requestStart,
      responseTime,
      status,
      success,
    });
  }

  private resetResults(): void {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errors: [],
      timeline: [],
    };
  }

  private calculateStatistics(testDurationMs: number): void {
    if (this.results.timeline.length === 0) return;

    const responseTimes = this.results.timeline.map(r => r.responseTime);
    responseTimes.sort((a, b) => a - b);

    this.results.averageResponseTime = 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    this.results.minResponseTime = responseTimes[0] || 0;
    this.results.maxResponseTime = responseTimes[responseTimes.length - 1] || 0;

    this.results.p50ResponseTime = this.percentile(responseTimes, 50);
    this.results.p95ResponseTime = this.percentile(responseTimes, 95);
    this.results.p99ResponseTime = this.percentile(responseTimes, 99);

    this.results.requestsPerSecond = 
      (this.results.totalRequests / testDurationMs) * 1000;
  }

  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }
}

// Predefined load test scenarios
export const loadTestScenarios = {
  // Light load - simulating normal usage
  light: {
    concurrency: 10,
    duration: 60,
    rampUp: 10,
  },

  // Moderate load - peak business hours
  moderate: {
    concurrency: 50,
    duration: 300,
    rampUp: 30,
  },

  // Heavy load - stress testing
  heavy: {
    concurrency: 100,
    duration: 600,
    rampUp: 60,
  },

  // Spike testing - sudden load increase
  spike: {
    concurrency: 200,
    duration: 120,
    rampUp: 10,
  },

  // Endurance testing - sustained load
  endurance: {
    concurrency: 25,
    duration: 3600, // 1 hour
    rampUp: 120,
  },
};

// Common API endpoints to test
export const testEndpoints = {
  auth: {
    login: '/api/auth/login',
    profile: '/api/auth/profile',
    refresh: '/api/auth/refresh',
  },
  
  assessments: {
    list: '/api/assessments',
    create: '/api/assessments',
    get: '/api/assessments/{id}',
    execute: '/api/assessments/{id}/execute',
    results: '/api/assessments/{id}/results',
  },

  dashboard: {
    stats: '/api/dashboard/stats',
    recent: '/api/dashboard/recent',
    notifications: '/api/dashboard/notifications',
  },

  admin: {
    users: '/api/admin/users',
    companies: '/api/admin/companies',
    audit: '/api/admin/audit',
    health: '/api/admin/health',
  },
};

// Performance budget checker
export class PerformanceBudget {
  private budgets: Map<string, number> = new Map();

  setBudget(metric: string, threshold: number): void {
    this.budgets.set(metric, threshold);
  }

  checkBudget(results: LoadTestResult): {
    passed: boolean;
    violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      severity: 'warning' | 'error';
    }>;
  } {
    const violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      severity: 'warning' | 'error';
    }> = [];

    // Check average response time
    if (this.budgets.has('averageResponseTime')) {
      const budget = this.budgets.get('averageResponseTime')!;
      if (results.averageResponseTime > budget) {
        violations.push({
          metric: 'averageResponseTime',
          actual: results.averageResponseTime,
          budget,
          severity: results.averageResponseTime > budget * 1.5 ? 'error' : 'warning',
        });
      }
    }

    // Check P95 response time
    if (this.budgets.has('p95ResponseTime')) {
      const budget = this.budgets.get('p95ResponseTime')!;
      if (results.p95ResponseTime > budget) {
        violations.push({
          metric: 'p95ResponseTime',
          actual: results.p95ResponseTime,
          budget,
          severity: results.p95ResponseTime > budget * 1.5 ? 'error' : 'warning',
        });
      }
    }

    // Check error rate
    if (this.budgets.has('errorRate')) {
      const budget = this.budgets.get('errorRate')!;
      const errorRate = (results.failedRequests / results.totalRequests) * 100;
      if (errorRate > budget) {
        violations.push({
          metric: 'errorRate',
          actual: errorRate,
          budget,
          severity: errorRate > budget * 2 ? 'error' : 'warning',
        });
      }
    }

    // Check requests per second
    if (this.budgets.has('requestsPerSecond')) {
      const budget = this.budgets.get('requestsPerSecond')!;
      if (results.requestsPerSecond < budget) {
        violations.push({
          metric: 'requestsPerSecond',
          actual: results.requestsPerSecond,
          budget,
          severity: results.requestsPerSecond < budget * 0.7 ? 'error' : 'warning',
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

// Default performance budgets
export const defaultPerformanceBudgets = {
  averageResponseTime: 200, // 200ms
  p95ResponseTime: 500, // 500ms
  errorRate: 1, // 1%
  requestsPerSecond: 100, // 100 RPS minimum
};

// Utility function to run a quick performance test
export async function quickPerformanceTest(
  endpoint: string,
  headers: Record<string, string> = {}
): Promise<{
  responseTime: number;
  success: boolean;
  status: number;
  recommendations: string[];
}> {
  const start = Date.now();
  let success = false;
  let status = 0;
  const recommendations: string[] = [];

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    status = response.status;
    success = response.ok;

  } catch (error) {
    console.error('Quick performance test failed:', error);
  }

  const responseTime = Date.now() - start;

  // Generate recommendations
  if (responseTime > 1000) {
    recommendations.push('Response time is very slow (>1s). Consider optimizing queries or adding caching.');
  } else if (responseTime > 500) {
    recommendations.push('Response time is slow (>500ms). Consider optimization.');
  }

  if (!success) {
    recommendations.push('Request failed. Check server health and endpoint availability.');
  }

  return {
    responseTime,
    success,
    status,
    recommendations,
  };
}