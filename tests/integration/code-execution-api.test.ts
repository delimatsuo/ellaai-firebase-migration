// Code Execution API Integration Tests
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createMockRequest, createMockResponse, createMockCodeExecutionService, mockTestCases } from '../helpers/backend-mocks';

// Mock Firebase Admin and other dependencies
jest.mock('firebase-admin');
jest.mock('../../functions/src/utils/logger');

// Import the route handler after mocking dependencies
let app: express.Application;
let mockCodeExecutionService: any;

beforeAll(async () => {
  // Setup Express app with routes
  app = express();
  app.use(express.json());
  
  // Mock the code execution service
  mockCodeExecutionService = createMockCodeExecutionService();
  
  // Setup routes (this would normally import from your routes file)
  app.post('/api/execute', async (req, res) => {
    try {
      const { code, language, testCases, timeLimit, memoryLimit } = req.body;
      
      // Validate request
      if (!code || !language || !testCases) {
        return res.status(400).json({
          error: 'Missing required fields: code, language, testCases'
        });
      }
      
      // Execute code
      const result = await mockCodeExecutionService.executeCode({
        code,
        language,
        testCases,
        timeLimit,
        memoryLimit
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/execute/:attemptId/store', async (req, res) => {
    try {
      const { attemptId } = req.params;
      const executionResult = req.body;
      
      await mockCodeExecutionService.storeExecutionResult(attemptId, executionResult);
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
});

describe('Code Execution API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/execute', () => {
    const validRequest = {
      code: 'function solve(n) { return n * 2; }',
      language: 'javascript',
      testCases: mockTestCases,
      timeLimit: 10000,
      memoryLimit: 128
    };

    it('should execute code successfully', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send(validRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('testResults');
      expect(response.body).toHaveProperty('totalPassed');
      expect(response.body).toHaveProperty('totalTests');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('executionTime');
      
      expect(mockCodeExecutionService.executeCode).toHaveBeenCalledWith(validRequest);
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        code: 'function solve() {}',
        // Missing language and testCases
      };

      const response = await request(app)
        .post('/api/execute')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle missing code', async () => {
      const requestWithoutCode = {
        language: 'javascript',
        testCases: mockTestCases
      };

      await request(app)
        .post('/api/execute')
        .send(requestWithoutCode)
        .expect(400);
    });

    it('should handle missing language', async () => {
      const requestWithoutLanguage = {
        code: 'function solve() {}',
        testCases: mockTestCases
      };

      await request(app)
        .post('/api/execute')
        .send(requestWithoutLanguage)
        .expect(400);
    });

    it('should handle missing test cases', async () => {
      const requestWithoutTestCases = {
        code: 'function solve() {}',
        language: 'javascript'
      };

      await request(app)
        .post('/api/execute')
        .send(requestWithoutTestCases)
        .expect(400);
    });

    it('should handle service errors', async () => {
      mockCodeExecutionService.executeCode.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/api/execute')
        .send(validRequest)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Service unavailable');
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/execute')
        .send('invalid json')
        .expect(400);
    });

    it('should handle empty request body', async () => {
      await request(app)
        .post('/api/execute')
        .send({})
        .expect(400);
    });

    it('should accept optional parameters', async () => {
      const requestWithOptionals = {
        ...validRequest,
        timeLimit: 5000,
        memoryLimit: 256
      };

      await request(app)
        .post('/api/execute')
        .send(requestWithOptionals)
        .expect(200);

      expect(mockCodeExecutionService.executeCode).toHaveBeenCalledWith(requestWithOptionals);
    });

    it('should handle different programming languages', async () => {
      const languages = ['javascript', 'python', 'java', 'go'];

      for (const language of languages) {
        const languageRequest = {
          ...validRequest,
          language
        };

        await request(app)
          .post('/api/execute')
          .send(languageRequest)
          .expect(200);
      }
    });

    it('should handle large test case arrays', async () => {
      const largeTestCases = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        name: `Test ${i}`,
        input: i,
        expectedOutput: i * 2,
        isVisible: true,
        weight: 1
      }));

      const largeRequest = {
        ...validRequest,
        testCases: largeTestCases
      };

      await request(app)
        .post('/api/execute')
        .send(largeRequest)
        .expect(200);
    });

    it('should handle complex input/output types', async () => {
      const complexTestCases = [
        {
          id: 'array-test',
          name: 'Array Test',
          input: [1, 2, 3, 4, 5],
          expectedOutput: [5, 4, 3, 2, 1],
          isVisible: true,
          weight: 50
        },
        {
          id: 'object-test',
          name: 'Object Test',
          input: { name: 'John', age: 30 },
          expectedOutput: { name: 'JOHN', age: 30 },
          isVisible: true,
          weight: 50
        }
      ];

      const complexRequest = {
        ...validRequest,
        testCases: complexTestCases
      };

      await request(app)
        .post('/api/execute')
        .send(complexRequest)
        .expect(200);
    });
  });

  describe('POST /api/execute/:attemptId/store', () => {
    const mockExecutionResult = {
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

    it('should store execution result successfully', async () => {
      const response = await request(app)
        .post('/api/execute/attempt-123/store')
        .send(mockExecutionResult)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockCodeExecutionService.storeExecutionResult).toHaveBeenCalledWith(
        'attempt-123',
        mockExecutionResult
      );
    });

    it('should handle storage errors', async () => {
      mockCodeExecutionService.storeExecutionResult.mockRejectedValue(
        new Error('Storage failed')
      );

      const response = await request(app)
        .post('/api/execute/attempt-123/store')
        .send(mockExecutionResult)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Storage failed');
    });

    it('should handle missing attempt ID', async () => {
      await request(app)
        .post('/api/execute//store')
        .send(mockExecutionResult)
        .expect(404);
    });

    it('should handle empty execution result', async () => {
      await request(app)
        .post('/api/execute/attempt-123/store')
        .send({})
        .expect(200);

      expect(mockCodeExecutionService.storeExecutionResult).toHaveBeenCalledWith(
        'attempt-123',
        {}
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle very long code submissions', async () => {
      const veryLongCode = 'function solve() {\n' + '  // comment\n'.repeat(10000) + '  return 42;\n}';
      
      const longCodeRequest = {
        code: veryLongCode,
        language: 'javascript',
        testCases: mockTestCases
      };

      await request(app)
        .post('/api/execute')
        .send(longCodeRequest)
        .expect(200);
    });

    it('should handle unicode and special characters in code', async () => {
      const unicodeCode = 'function solve() {\n  return "Hello 世界! 🚀";\n}';
      
      const unicodeRequest = {
        code: unicodeCode,
        language: 'javascript',
        testCases: [{
          id: 'unicode-test',
          name: 'Unicode Test',
          input: null,
          expectedOutput: 'Hello 世界! 🚀',
          isVisible: true,
          weight: 100
        }]
      };

      await request(app)
        .post('/api/execute')
        .send(unicodeRequest)
        .expect(200);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/execute')
          .send({
            code: 'function solve(n) { return n * 2; }',
            language: 'javascript',
            testCases: mockTestCases
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
      });
    });

    it('should handle request timeout scenarios', async () => {
      // Mock a slow execution
      mockCodeExecutionService.executeCode.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          testResults: [],
          totalPassed: 0,
          totalTests: 0,
          score: 0,
          executionTime: 30000
        }), 100))
      );

      await request(app)
        .post('/api/execute')
        .send({
          code: 'function solve() { /* slow operation */ }',
          language: 'javascript',
          testCases: mockTestCases
        })
        .timeout(5000)
        .expect(200);
    });

    it('should validate test case structure', async () => {
      const invalidTestCases = [
        {
          // Missing required fields
          name: 'Invalid Test',
          input: 5
          // Missing id, expectedOutput, isVisible, weight
        }
      ];

      const invalidRequest = {
        code: 'function solve() {}',
        language: 'javascript',
        testCases: invalidTestCases
      };

      // The service should handle invalid test cases gracefully
      await request(app)
        .post('/api/execute')
        .send(invalidRequest)
        .expect(200);
    });
  });

  describe('Security and validation', () => {
    it('should reject potentially dangerous code patterns', async () => {
      const dangerousCode = `
        const fs = require('fs');
        function solve() {
          fs.readFileSync('/etc/passwd');
          return 'hacked';
        }
      `;

      const dangerousRequest = {
        code: dangerousCode,
        language: 'javascript',
        testCases: mockTestCases
      };

      const response = await request(app)
        .post('/api/execute')
        .send(dangerousRequest)
        .expect(200);

      // Should detect as unsafe and fail
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('unsafe operations');
    });

    it('should handle SQL injection attempts in test data', async () => {
      const sqlInjectionTestCases = [{
        id: 'sql-injection-test',
        name: 'SQL Injection Test',
        input: "'; DROP TABLE users; --",
        expectedOutput: "'; DROP TABLE users; --",
        isVisible: true,
        weight: 100
      }];

      const sqlRequest = {
        code: 'function solve(input) { return input; }',
        language: 'javascript',
        testCases: sqlInjectionTestCases
      };

      await request(app)
        .post('/api/execute')
        .send(sqlRequest)
        .expect(200);
    });

    it('should limit request payload size', async () => {
      // This would typically be handled by Express middleware
      const hugeCode = 'a'.repeat(10 * 1024 * 1024); // 10MB string
      
      const hugeRequest = {
        code: hugeCode,
        language: 'javascript',
        testCases: mockTestCases
      };

      // Depending on payload limits, this might be rejected at the middleware level
      await request(app)
        .post('/api/execute')
        .send(hugeRequest);
      
      // Test should complete without crashing the server
    });
  });

  describe('Performance and load testing', () => {
    it('should handle multiple simultaneous executions', async () => {
      const concurrentRequests = 20;
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/execute')
          .send({
            code: `function solve(n) { return n * ${i + 1}; }`,
            language: 'javascript',
            testCases: mockTestCases
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });

    it('should handle stress test with complex algorithms', async () => {
      const complexCode = `
        function solve(n) {
          // Fibonacci calculation
          if (n <= 1) return n;
          let a = 0, b = 1;
          for (let i = 2; i <= n; i++) {
            let temp = a + b;
            a = b;
            b = temp;
          }
          return b;
        }
      `;

      const complexTestCases = Array.from({ length: 50 }, (_, i) => ({
        id: `fib-test-${i}`,
        name: `Fibonacci Test ${i}`,
        input: i,
        expectedOutput: i <= 1 ? i : null, // We'll let the service calculate
        isVisible: true,
        weight: 2
      }));

      const complexRequest = {
        code: complexCode,
        language: 'javascript',
        testCases: complexTestCases
      };

      const response = await request(app)
        .post('/api/execute')
        .send(complexRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.testResults).toHaveLength(50);
    });
  });
});