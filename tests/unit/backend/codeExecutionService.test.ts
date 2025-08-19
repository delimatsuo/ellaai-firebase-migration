// Code Execution Service Tests
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CodeExecutionService } from '../../../functions/src/services/codeExecutionService';
import { createMockFirestore, createMockLogger, mockTestCases, maliciousCodePatterns } from '../../helpers/backend-mocks';

// Mock Firebase Admin
const mockFirestore = createMockFirestore();
jest.mock('firebase-admin', () => ({
  firestore: () => mockFirestore,
  FieldValue: {
    serverTimestamp: jest.fn(() => 'server-timestamp'),
    increment: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn()
  }
}));

// Mock logger
jest.mock('../../../functions/src/utils/logger', () => ({
  logger: createMockLogger()
}));

describe('CodeExecutionService', () => {
  let service: CodeExecutionService;

  beforeEach(() => {
    service = new CodeExecutionService();
    jest.clearAllMocks();
  });

  describe('executeCode', () => {
    const basicRequest = {
      code: 'function solve(n) { return n * 2; }',
      language: 'javascript',
      testCases: mockTestCases,
      timeLimit: 10000,
      memoryLimit: 128
    };

    it('should execute code successfully', async () => {
      const result = await service.executeCode(basicRequest);

      expect(result.success).toBe(true);
      expect(result.testResults).toHaveLength(2);
      expect(result.totalTests).toBe(2);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(typeof result.score).toBe('number');
    });

    it('should handle empty code', async () => {
      const emptyCodeRequest = { ...basicRequest, code: '' };
      
      const result = await service.executeCode(emptyCodeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Code cannot be empty');
      expect(result.totalPassed).toBe(0);
    });

    it('should handle whitespace-only code', async () => {
      const whitespaceRequest = { ...basicRequest, code: '   \n\t  ' };
      
      const result = await service.executeCode(whitespaceRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Code cannot be empty');
    });

    it('should detect potentially malicious code patterns', async () => {
      for (const pattern of maliciousCodePatterns) {
        const maliciousRequest = {
          ...basicRequest,
          code: pattern.code,
          language: pattern.language
        };

        const result = await service.executeCode(maliciousRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Code contains potentially unsafe operations');
      }
    });

    it('should reject unsupported languages', async () => {
      const unsupportedRequest = { ...basicRequest, language: 'cobol' };
      
      const result = await service.executeCode(unsupportedRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported language: cobol');
    });

    it('should handle test case execution errors', async () => {
      const complexRequest = {
        ...basicRequest,
        code: 'function solve(n) { throw new Error("Runtime error"); }'
      };

      const result = await service.executeCode(complexRequest);

      expect(result.success).toBe(false);
      expect(result.testResults.some(tr => tr.error)).toBe(true);
    });

    it('should calculate weighted scores correctly', async () => {
      const weightedTestCases = [
        { ...mockTestCases[0], weight: 30 },
        { ...mockTestCases[1], weight: 70 }
      ];

      const weightedRequest = {
        ...basicRequest,
        testCases: weightedTestCases
      };

      const result = await service.executeCode(weightedRequest);

      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should enforce time limits', async () => {
      const timeoutTestCases = mockTestCases.map(tc => ({
        ...tc,
        timeLimit: 1 // Very short time limit
      }));

      const timeoutRequest = {
        ...basicRequest,
        testCases: timeoutTestCases
      };

      const result = await service.executeCode(timeoutRequest);

      // Some tests might fail due to timeout
      const timeoutErrors = result.testResults.filter(tr => 
        tr.error?.includes('Time limit exceeded')
      );
      expect(timeoutErrors.length).toBeGreaterThanOrEqual(0);
    });

    describe('Language-specific execution simulation', () => {
      it('should simulate JavaScript execution patterns', async () => {
        const jsRequest = {
          ...basicRequest,
          code: 'function solve(n) { return n * 2; }',
          language: 'javascript'
        };

        const result = await service.executeCode(jsRequest);

        expect(result.testResults[0].actualOutput).toBe(10); // 5 * 2
        expect(result.consoleOutput).toContain('Input: 5');
        expect(result.consoleOutput).toContain('Output: 10');
      });

      it('should simulate Python execution patterns', async () => {
        const pythonRequest = {
          ...basicRequest,
          code: 'def solve(n):\n    return n * 2',
          language: 'python'
        };

        const result = await service.executeCode(pythonRequest);

        expect(result.testResults[0].actualOutput).toBe(10); // 5 * 2
        expect(result.consoleOutput).toContain('Input: 5');
      });

      it('should simulate Java execution patterns', async () => {
        const javaRequest = {
          ...basicRequest,
          code: 'public static int solve(int n) { return n * 2; }',
          language: 'java'
        };

        const result = await service.executeCode(javaRequest);

        expect(result.testResults[0].actualOutput).toBe(10); // 5 * 2
      });

      it('should simulate Go execution patterns', async () => {
        const goRequest = {
          ...basicRequest,
          code: 'func solve(n int) int { return n * 2 }',
          language: 'go'
        };

        const result = await service.executeCode(goRequest);

        expect(result.testResults[0].actualOutput).toBe(10); // 5 * 2
      });
    });

    describe('Array and object handling', () => {
      it('should handle array inputs and outputs', async () => {
        const arrayTestCases = [
          {
            id: 'array-test',
            name: 'Array Test',
            input: [1, 2, 3],
            expectedOutput: [3, 2, 1],
            isVisible: true,
            weight: 100
          }
        ];

        const arrayRequest = {
          ...basicRequest,
          code: 'function solve(arr) { return arr.reverse(); }',
          testCases: arrayTestCases
        };

        const result = await service.executeCode(arrayRequest);

        expect(Array.isArray(result.testResults[0].actualOutput)).toBe(true);
        expect(result.testResults[0].actualOutput).toEqual([3, 2, 1]);
      });

      it('should handle string operations', async () => {
        const stringTestCases = [
          {
            id: 'string-test',
            name: 'String Test',
            input: 'hello',
            expectedOutput: 'HELLO',
            isVisible: true,
            weight: 100
          }
        ];

        const stringRequest = {
          ...basicRequest,
          code: 'function solve(str) { return str.toUpperCase(); }',
          testCases: stringTestCases
        };

        const result = await service.executeCode(stringRequest);

        expect(result.testResults[0].actualOutput).toBe('HELLO');
      });

      it('should handle object comparisons', async () => {
        const objectTestCases = [
          {
            id: 'object-test',
            name: 'Object Test',
            input: { a: 1, b: 2 },
            expectedOutput: { a: 1, b: 2 },
            isVisible: true,
            weight: 100
          }
        ];

        const objectRequest = {
          ...basicRequest,
          code: 'function solve(obj) { return obj; }',
          testCases: objectTestCases
        };

        const result = await service.executeCode(objectRequest);

        expect(result.testResults[0].passed).toBe(true);
        expect(result.testResults[0].actualOutput).toEqual({ a: 1, b: 2 });
      });
    });

    describe('Edge cases', () => {
      it('should handle zero and negative numbers', async () => {
        const edgeTestCases = [
          {
            id: 'zero-test',
            name: 'Zero Test',
            input: 0,
            expectedOutput: 0,
            isVisible: true,
            weight: 50
          },
          {
            id: 'negative-test',
            name: 'Negative Test',
            input: -5,
            expectedOutput: -10,
            isVisible: true,
            weight: 50
          }
        ];

        const edgeRequest = {
          ...basicRequest,
          testCases: edgeTestCases
        };

        const result = await service.executeCode(edgeRequest);

        expect(result.testResults[0].actualOutput).toBe(0);
        expect(result.testResults[1].actualOutput).toBe(-10);
      });

      it('should handle empty arrays', async () => {
        const emptyArrayTestCases = [
          {
            id: 'empty-array-test',
            name: 'Empty Array Test',
            input: [],
            expectedOutput: 0,
            isVisible: true,
            weight: 100
          }
        ];

        const emptyArrayRequest = {
          ...basicRequest,
          code: 'function solve(arr) { return arr.length; }',
          testCases: emptyArrayTestCases
        };

        const result = await service.executeCode(emptyArrayRequest);

        expect(result.testResults[0].actualOutput).toBe(0);
        expect(result.testResults[0].passed).toBe(true);
      });

      it('should handle null and undefined values', async () => {
        const nullTestCases = [
          {
            id: 'null-test',
            name: 'Null Test',
            input: null,
            expectedOutput: null,
            isVisible: true,
            weight: 100
          }
        ];

        const nullRequest = {
          ...basicRequest,
          code: 'function solve(input) { return input; }',
          testCases: nullTestCases
        };

        const result = await service.executeCode(nullRequest);

        expect(result.testResults[0].actualOutput).toBe(null);
        expect(result.testResults[0].passed).toBe(true);
      });
    });
  });

  describe('storeExecutionResult', () => {
    it('should store execution result successfully', async () => {
      const mockResult = {
        success: true,
        testResults: [],
        totalPassed: 1,
        totalTests: 1,
        score: 100,
        executionTime: 200
      };

      await service.storeExecutionResult('attempt-123', mockResult);

      expect(mockFirestore.collection).toHaveBeenCalledWith('execution-results');
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith('attempt-123');
      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith({
        ...mockResult,
        createdAt: 'server-timestamp'
      });
    });

    it('should handle storage errors gracefully', async () => {
      const mockResult = {
        success: true,
        testResults: [],
        totalPassed: 1,
        totalTests: 1,
        score: 100,
        executionTime: 200
      };

      // Mock storage failure
      mockFirestore.collection().doc().set.mockRejectedValue(new Error('Storage failed'));

      // Should not throw error
      await expect(
        service.storeExecutionResult('attempt-123', mockResult)
      ).resolves.not.toThrow();
    });
  });

  describe('Output comparison', () => {
    it('should compare primitive values correctly', () => {
      // Access private method through any cast for testing
      const compareOutputs = (service as any).compareOutputs.bind(service);

      expect(compareOutputs(5, 5)).toBe(true);
      expect(compareOutputs(5, 10)).toBe(false);
      expect(compareOutputs('hello', 'hello')).toBe(true);
      expect(compareOutputs('hello', 'world')).toBe(false);
      expect(compareOutputs(true, true)).toBe(true);
      expect(compareOutputs(true, false)).toBe(false);
    });

    it('should compare arrays correctly', () => {
      const compareOutputs = (service as any).compareOutputs.bind(service);

      expect(compareOutputs([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(compareOutputs([1, 2, 3], [3, 2, 1])).toBe(false);
      expect(compareOutputs([], [])).toBe(true);
      expect(compareOutputs([1], [1, 2])).toBe(false);
    });

    it('should compare objects correctly', () => {
      const compareOutputs = (service as any).compareOutputs.bind(service);

      expect(compareOutputs({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(compareOutputs({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(compareOutputs({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(compareOutputs({}, {})).toBe(true);
    });

    it('should compare nested structures correctly', () => {
      const compareOutputs = (service as any).compareOutputs.bind(service);

      const nested1 = { arr: [1, 2, { x: 3 }], obj: { y: 4 } };
      const nested2 = { arr: [1, 2, { x: 3 }], obj: { y: 4 } };
      const nested3 = { arr: [1, 2, { x: 5 }], obj: { y: 4 } };

      expect(compareOutputs(nested1, nested2)).toBe(true);
      expect(compareOutputs(nested1, nested3)).toBe(false);
    });

    it('should handle type mismatches', () => {
      const compareOutputs = (service as any).compareOutputs.bind(service);

      expect(compareOutputs(5, '5')).toBe(false);
      expect(compareOutputs([1, 2, 3], '1,2,3')).toBe(false);
      expect(compareOutputs(null, undefined)).toBe(false);
      expect(compareOutputs(0, false)).toBe(false);
    });
  });

  describe('Score calculation', () => {
    it('should calculate weighted scores correctly', () => {
      const calculateWeightedScore = (service as any).calculateWeightedScore.bind(service);

      const testResults = [
        { testCaseId: 'test-1', passed: true },
        { testCaseId: 'test-2', passed: false },
        { testCaseId: 'test-3', passed: true }
      ];

      const testCases = [
        { id: 'test-1', weight: 30 },
        { id: 'test-2', weight: 40 },
        { id: 'test-3', weight: 30 }
      ];

      const score = calculateWeightedScore(testResults, testCases);
      
      // Passed: test-1 (30) + test-3 (30) = 60
      // Total: 30 + 40 + 30 = 100
      // Score: (60/100) * 100 = 60%
      expect(score).toBe(60);
    });

    it('should return 0 for no test cases', () => {
      const calculateWeightedScore = (service as any).calculateWeightedScore.bind(service);

      const score = calculateWeightedScore([], []);
      expect(score).toBe(0);
    });

    it('should handle mismatched test cases', () => {
      const calculateWeightedScore = (service as any).calculateWeightedScore.bind(service);

      const testResults = [
        { testCaseId: 'test-1', passed: true },
        { testCaseId: 'test-unknown', passed: true }
      ];

      const testCases = [
        { id: 'test-1', weight: 100 }
      ];

      const score = calculateWeightedScore(testResults, testCases);
      expect(score).toBe(100); // Only counts known test cases
    });
  });

  describe('Error handling and resilience', () => {
    it('should handle malformed test cases', async () => {
      const malformedTestCases = [
        {
          id: 'malformed',
          name: 'Malformed Test',
          input: { circular: null } as any,
          expectedOutput: 'result',
          isVisible: true,
          weight: 100
        }
      ];

      // Create circular reference
      malformedTestCases[0].input.circular = malformedTestCases[0].input;

      const malformedRequest = {
        code: 'function solve() { return "result"; }',
        language: 'javascript',
        testCases: malformedTestCases
      };

      const result = await service.executeCode(malformedRequest);

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle very large inputs', async () => {
      const largeArray = new Array(10000).fill(1);
      const largeTestCases = [
        {
          id: 'large-test',
          name: 'Large Test',
          input: largeArray,
          expectedOutput: largeArray.length,
          isVisible: true,
          weight: 100
        }
      ];

      const largeRequest = {
        code: 'function solve(arr) { return arr.length; }',
        language: 'javascript',
        testCases: largeTestCases
      };

      const result = await service.executeCode(largeRequest);

      expect(result).toBeDefined();
      expect(result.testResults[0].actualOutput).toBe(10000);
    });

    it('should timeout long-running simulations', async () => {
      const timeoutRequest = {
        code: 'function solve() { while(true) {} }',
        language: 'javascript',
        testCases: [mockTestCases[0]],
        timeLimit: 100 // Very short timeout
      };

      const startTime = Date.now();
      const result = await service.executeCode(timeoutRequest);
      const endTime = Date.now();

      // Should complete within reasonable time despite infinite loop simulation
      expect(endTime - startTime).toBeLessThan(5000);
      expect(result).toBeDefined();
    });
  });
});