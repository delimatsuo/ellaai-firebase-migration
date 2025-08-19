// Performance Tests for Assessment Execution System
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import { CodeExecutionService } from '../../functions/src/services/codeExecutionService';
import { createMockFirestore, performanceTestCases } from '../helpers/backend-mocks';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: () => createMockFirestore(),
  FieldValue: {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn()
  }
}));

// Mock logger
jest.mock('../../functions/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Performance Tests', () => {
  let service: CodeExecutionService;
  const performanceMetrics: {
    [key: string]: {
      duration: number;
      memoryUsed: number;
      testName: string;
    }[]
  } = {};

  beforeAll(() => {
    // Enable high-resolution time measurements
    if (typeof performance === 'undefined') {
      global.performance = require('perf_hooks').performance;
    }
  });

  beforeEach(() => {
    service = new CodeExecutionService();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Log performance summary
    console.log('\n=== PERFORMANCE TEST SUMMARY ===');
    Object.entries(performanceMetrics).forEach(([category, metrics]) => {
      console.log(`\n${category}:`);
      metrics.forEach(metric => {
        console.log(`  ${metric.testName}: ${metric.duration.toFixed(2)}ms (${(metric.memoryUsed / 1024 / 1024).toFixed(2)}MB)`);
      });
    });
  });

  const measurePerformance = async (
    testName: string,
    category: string,
    fn: () => Promise<any>
  ) => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const result = await fn();
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const duration = endTime - startTime;
    const memoryUsed = Math.max(0, endMemory - startMemory);
    
    if (!performanceMetrics[category]) {
      performanceMetrics[category] = [];
    }
    
    performanceMetrics[category].push({
      duration,
      memoryUsed,
      testName
    });
    
    return { result, duration, memoryUsed };
  };

  describe('Code Execution Performance', () => {
    it('should execute simple JavaScript code within time limits', async () => {
      const simpleCode = 'function solve(n) { return n * 2; }';
      const testCases = [
        {
          id: 'simple-test',
          name: 'Simple Test',
          input: 5,
          expectedOutput: 10,
          isVisible: true,
          weight: 100
        }
      ];

      const { result, duration } = await measurePerformance(
        'Simple JavaScript',
        'Basic Execution',
        () => service.executeCode({
          code: simpleCode,
          language: 'javascript',
          testCases
        })
      );

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });

    it('should handle complex algorithms efficiently', async () => {
      const complexCode = `
        function solve(n) {
          // Fibonacci with memoization
          const memo = {};
          function fib(num) {
            if (num in memo) return memo[num];
            if (num <= 1) return num;
            memo[num] = fib(num - 1) + fib(num - 2);
            return memo[num];
          }
          return fib(n);
        }
      `;

      const testCases = [
        {
          id: 'complex-test',
          name: 'Complex Algorithm',
          input: 30,
          expectedOutput: 832040, // 30th Fibonacci number
          isVisible: true,
          weight: 100
        }
      ];

      const { result, duration } = await measurePerformance(
        'Complex Algorithm',
        'Advanced Execution',
        () => service.executeCode({
          code: complexCode,
          language: 'javascript',
          testCases
        })
      );

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should scale with number of test cases', async () => {
      const scaleCode = 'function solve(n) { return n * n; }';
      
      // Test with different numbers of test cases
      const testSizes = [1, 5, 10, 25, 50];
      const scalingResults: { size: number; duration: number }[] = [];

      for (const size of testSizes) {
        const testCases = Array.from({ length: size }, (_, i) => ({
          id: `scale-test-${i}`,
          name: `Scale Test ${i}`,
          input: i + 1,
          expectedOutput: (i + 1) * (i + 1),
          isVisible: true,
          weight: 100 / size
        }));

        const { duration } = await measurePerformance(
          `${size} Test Cases`,
          'Scaling Tests',
          () => service.executeCode({
            code: scaleCode,
            language: 'javascript',
            testCases
          })
        );

        scalingResults.push({ size, duration });
      }

      // Check that execution time scales reasonably (not exponentially)
      const maxDuration = Math.max(...scalingResults.map(r => r.duration));
      const minDuration = Math.min(...scalingResults.map(r => r.duration));
      const scalingFactor = maxDuration / minDuration;

      expect(scalingFactor).toBeLessThan(10); // Scaling should be reasonable
    });
  });

  describe('Memory Usage Tests', () => {
    it('should handle large input arrays efficiently', async () => {
      const largeArrayCode = `
        function solve(arr) {
          return arr.reduce((sum, num) => sum + num, 0);
        }
      `;

      for (const testCase of performanceTestCases) {
        const { result, duration, memoryUsed } = await measurePerformance(
          testCase.name,
          'Memory Usage',
          () => service.executeCode({
            code: largeArrayCode,
            language: 'javascript',
            testCases: [{
              id: 'large-array-test',
              name: testCase.name,
              input: testCase.input,
              expectedOutput: testCase.input.reduce((sum: number, num: number) => sum + num, 0),
              isVisible: true,
              weight: 100
            }]
          })
        );

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(testCase.expectedMaxTime);
        expect(memoryUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    });

    it('should not leak memory between executions', async () => {
      const code = 'function solve(n) { return new Array(n).fill(1); }';
      const initialMemory = process.memoryUsage().heapUsed;

      // Run multiple executions
      for (let i = 0; i < 10; i++) {
        await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: `memory-leak-test-${i}`,
            name: `Memory Leak Test ${i}`,
            input: 1000,
            expectedOutput: new Array(1000).fill(1),
            isVisible: true,
            weight: 100
          }]
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Execution Performance', () => {
    it('should handle multiple simultaneous executions', async () => {
      const concurrentCount = 10;
      const code = 'function solve(n) { return Math.sqrt(n * n); }';

      const { duration } = await measurePerformance(
        `${concurrentCount} Concurrent Executions`,
        'Concurrency',
        async () => {
          const promises = Array.from({ length: concurrentCount }, (_, i) =>
            service.executeCode({
              code,
              language: 'javascript',
              testCases: [{
                id: `concurrent-test-${i}`,
                name: `Concurrent Test ${i}`,
                input: i + 1,
                expectedOutput: i + 1,
                isVisible: true,
                weight: 100
              }]
            })
          );

          return Promise.all(promises);
        }
      );

      // Concurrent executions should not take significantly longer than sequential
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 concurrent executions
    });

    it('should maintain performance under load', async () => {
      const loadTestResults: number[] = [];
      const iterations = 20;
      const code = 'function solve(n) { return n * 2; }';

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: `load-test-${i}`,
            name: `Load Test ${i}`,
            input: i,
            expectedOutput: i * 2,
            isVisible: true,
            weight: 100
          }]
        });

        const duration = performance.now() - startTime;
        loadTestResults.push(duration);
      }

      // Calculate performance metrics
      const averageDuration = loadTestResults.reduce((sum, d) => sum + d, 0) / loadTestResults.length;
      const maxDuration = Math.max(...loadTestResults);
      const minDuration = Math.min(...loadTestResults);

      expect(averageDuration).toBeLessThan(1000); // Average under 1 second
      expect(maxDuration).toBeLessThan(2000); // Max under 2 seconds
      expect(maxDuration / minDuration).toBeLessThan(5); // Consistent performance
    });
  });

  describe('Database Performance', () => {
    it('should store execution results efficiently', async () => {
      const mockResult = {
        success: true,
        testResults: [{
          testCaseId: 'test-1',
          passed: true,
          actualOutput: 10,
          executionTime: 150
        }],
        totalPassed: 1,
        totalTests: 1,
        score: 100,
        executionTime: 200
      };

      const { duration } = await measurePerformance(
        'Store Execution Result',
        'Database Operations',
        () => service.storeExecutionResult('performance-test-attempt', mockResult)
      );

      expect(duration).toBeLessThan(500); // Database write should be fast
    });

    it('should handle batch storage operations', async () => {
      const batchSize = 100;
      const mockResults = Array.from({ length: batchSize }, (_, i) => ({
        attemptId: `batch-attempt-${i}`,
        result: {
          success: true,
          testResults: [{
            testCaseId: 'test-1',
            passed: true,
            actualOutput: i * 2,
            executionTime: 150
          }],
          totalPassed: 1,
          totalTests: 1,
          score: 100,
          executionTime: 200
        }
      }));

      const { duration } = await measurePerformance(
        `Batch Store ${batchSize} Results`,
        'Database Operations',
        async () => {
          const promises = mockResults.map(({ attemptId, result }) =>
            service.storeExecutionResult(attemptId, result)
          );
          return Promise.all(promises);
        }
      );

      expect(duration).toBeLessThan(5000); // Batch operations should complete in under 5 seconds
    });
  });

  describe('Language-specific Performance', () => {
    const languages = ['javascript', 'python', 'java', 'go'];
    const testCode = {
      javascript: 'function solve(n) { return n * 2; }',
      python: 'def solve(n):\n    return n * 2',
      java: 'public static int solve(int n) { return n * 2; }',
      go: 'func solve(n int) int { return n * 2 }'
    };

    languages.forEach(language => {
      it(`should execute ${language} code efficiently`, async () => {
        const { result, duration } = await measurePerformance(
          `${language} Execution`,
          'Language Performance',
          () => service.executeCode({
            code: testCode[language as keyof typeof testCode],
            language,
            testCases: [{
              id: `${language}-performance-test`,
              name: `${language} Performance Test`,
              input: 5,
              expectedOutput: 10,
              isVisible: true,
              weight: 100
            }]
          })
        );

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(1000); // Each language should execute in under 1 second
      });
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle malicious code detection efficiently', async () => {
      const maliciousCode = 'require("fs").readFileSync("/etc/passwd");';

      const { result, duration } = await measurePerformance(
        'Malicious Code Detection',
        'Security Performance',
        () => service.executeCode({
          code: maliciousCode,
          language: 'javascript',
          testCases: [{
            id: 'security-test',
            name: 'Security Test',
            input: 1,
            expectedOutput: 1,
            isVisible: true,
            weight: 100
          }]
        })
      );

      expect(result.success).toBe(false);
      expect(duration).toBeLessThan(100); // Security checks should be very fast
    });

    it('should handle compilation errors quickly', async () => {
      const invalidCode = 'function solve(n { return n * 2; }'; // Missing closing parenthesis

      const { result, duration } = await measurePerformance(
        'Compilation Error Handling',
        'Error Performance',
        () => service.executeCode({
          code: invalidCode,
          language: 'javascript',
          testCases: [{
            id: 'compilation-error-test',
            name: 'Compilation Error Test',
            input: 5,
            expectedOutput: 10,
            isVisible: true,
            weight: 100
          }]
        })
      );

      // Should handle error gracefully and quickly
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Stress Testing', () => {
    it('should handle stress test with many test cases', async () => {
      const stressTestSize = 200;
      const code = 'function solve(n) { return n % 2 === 0; }';
      
      const testCases = Array.from({ length: stressTestSize }, (_, i) => ({
        id: `stress-test-${i}`,
        name: `Stress Test ${i}`,
        input: i,
        expectedOutput: i % 2 === 0,
        isVisible: true,
        weight: 1
      }));

      const { result, duration } = await measurePerformance(
        `Stress Test (${stressTestSize} cases)`,
        'Stress Testing',
        () => service.executeCode({
          code,
          language: 'javascript',
          testCases
        })
      );

      expect(result.success).toBe(true);
      expect(result.testResults).toHaveLength(stressTestSize);
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
    });

    it('should maintain stability under continuous load', async () => {
      const continuousLoadDuration = 30; // seconds
      const executionsPerSecond = 2;
      const totalExecutions = continuousLoadDuration * executionsPerSecond;
      
      const code = 'function solve(n) { return Math.random() > 0.5; }';
      let successfulExecutions = 0;
      let failedExecutions = 0;

      const { duration } = await measurePerformance(
        `Continuous Load (${totalExecutions} executions)`,
        'Stress Testing',
        async () => {
          const promises: Promise<any>[] = [];
          
          for (let i = 0; i < totalExecutions; i++) {
            const executionPromise = service.executeCode({
              code,
              language: 'javascript',
              testCases: [{
                id: `continuous-test-${i}`,
                name: `Continuous Test ${i}`,
                input: i,
                expectedOutput: true, // Random result, we just care about execution
                isVisible: true,
                weight: 100
              }]
            }).then(result => {
              if (result.success) successfulExecutions++;
              else failedExecutions++;
              return result;
            }).catch(() => {
              failedExecutions++;
            });

            promises.push(executionPromise);
            
            // Space out executions to avoid overwhelming the system
            if (i % executionsPerSecond === 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          return Promise.all(promises);
        }
      );

      // Most executions should succeed
      const successRate = successfulExecutions / totalExecutions;
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan((continuousLoadDuration + 10) * 1000); // Allow 10 seconds buffer
    });
  });

  describe('Resource Cleanup Performance', () => {
    it('should clean up resources quickly after execution', async () => {
      const cleanupCode = `
        function solve(n) {
          // Create some temporary resources
          const tempArray = new Array(10000).fill(Math.random());
          const tempObject = {};
          for (let i = 0; i < 1000; i++) {
            tempObject[\`key_\${i}\`] = Math.random();
          }
          return tempArray.length + Object.keys(tempObject).length;
        }
      `;

      const initialMemory = process.memoryUsage().heapUsed;

      await measurePerformance(
        'Resource Cleanup',
        'Cleanup Performance',
        async () => {
          // Execute multiple times to test cleanup
          for (let i = 0; i < 5; i++) {
            await service.executeCode({
              code: cleanupCode,
              language: 'javascript',
              testCases: [{
                id: `cleanup-test-${i}`,
                name: `Cleanup Test ${i}`,
                input: 100,
                expectedOutput: 11000, // 10000 + 1000
                isVisible: true,
                weight: 100
              }]
            });
          }
        }
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory should not increase significantly
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB increase
    });
  });
});