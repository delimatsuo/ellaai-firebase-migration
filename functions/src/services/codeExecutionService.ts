/**
 * Code Execution Service
 * Handles safe execution of candidate code submissions in sandboxed environments
 */

import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

export interface TestCase {
  id: string;
  name: string;
  input: any;
  expectedOutput: any;
  isVisible: boolean;
  weight: number;
  timeLimit?: number;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: any;
  executionTime: number;
  memoryUsed?: number;
  error?: string;
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  timeLimit?: number; // in milliseconds
  memoryLimit?: number; // in MB
}

export interface CodeExecutionResult {
  success: boolean;
  testResults: TestResult[];
  totalPassed: number;
  totalTests: number;
  score: number;
  executionTime: number;
  error?: string;
  consoleOutput?: string;
  compilationError?: string;
}

interface LanguageConfig {
  id: string;
  name: string;
  extension: string;
  dockerImage: string;
  command: string;
  timeout: number;
  memoryLimit: number;
}

const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    dockerImage: 'node:18-alpine',
    command: 'node',
    timeout: 10000, // 10 seconds
    memoryLimit: 128, // 128MB
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    dockerImage: 'python:3.11-alpine',
    command: 'python',
    timeout: 15000, // 15 seconds
    memoryLimit: 256, // 256MB
  },
  {
    id: 'java',
    name: 'Java',
    extension: 'java',
    dockerImage: 'openjdk:17-alpine',
    command: 'java',
    timeout: 20000, // 20 seconds (includes compilation)
    memoryLimit: 512, // 512MB
  },
  {
    id: 'go',
    name: 'Go',
    extension: 'go',
    dockerImage: 'golang:1.21-alpine',
    command: 'go run',
    timeout: 15000, // 15 seconds
    memoryLimit: 256, // 256MB
  },
];

export class CodeExecutionService {
  private db = admin.firestore();

  /**
   * Execute code against test cases
   */
  async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Executing code', { 
        language: request.language, 
        testCases: request.testCases.length 
      });

      const languageConfig = LANGUAGE_CONFIGS.find(config => config.id === request.language);
      if (!languageConfig) {
        throw new Error(`Unsupported language: ${request.language}`);
      }

      // For MVP, we'll simulate code execution
      // In production, this would use Docker containers or cloud functions
      const result = await this.simulateCodeExecution(request, languageConfig);
      
      const totalExecutionTime = Date.now() - startTime;
      logger.info('Code execution completed', {
        language: request.language,
        totalTime: totalExecutionTime,
        testsPassed: result.totalPassed,
        totalTests: result.totalTests,
      });

      return {
        ...result,
        executionTime: totalExecutionTime,
      };

    } catch (error: any) {
      logger.error('Code execution failed', { 
        error: error.message,
        language: request.language 
      });
      
      return {
        success: false,
        testResults: [],
        totalPassed: 0,
        totalTests: request.testCases.length,
        score: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Simulate code execution for MVP
   * In production, this would be replaced with actual Docker execution
   */
  private async simulateCodeExecution(
    request: CodeExecutionRequest,
    languageConfig: LanguageConfig
  ): Promise<Omit<CodeExecutionResult, 'executionTime'>> {
    const testResults: TestResult[] = [];
    let consoleOutput = '';

    // Basic code validation
    if (request.code.trim().length === 0) {
      throw new Error('Code cannot be empty');
    }

    // Check for potentially malicious code patterns
    const dangerousPatterns = [
      /import\s+os/i,
      /import\s+subprocess/i,
      /import\s+sys/i,
      /require\s*\(\s*['"`]fs['"`]/i,
      /require\s*\(\s*['"`]child_process['"`]/i,
      /System\s*\./i,
      /Runtime\s*\./i,
      /process\s*\./i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(request.code)) {
        throw new Error('Code contains potentially unsafe operations');
      }
    }

    // Simulate test execution
    for (const testCase of request.testCases) {
      const testStart = Date.now();
      
      try {
        // Simulate code execution logic based on language
        const result = await this.simulateLanguageExecution(
          request.code,
          request.language,
          testCase.input
        );

        const executionTime = Date.now() - testStart;
        const passed = this.compareOutputs(result.output, testCase.expectedOutput);

        testResults.push({
          testCaseId: testCase.id,
          passed,
          actualOutput: result.output,
          executionTime,
          error: result.error,
        });

        if (result.consoleOutput) {
          consoleOutput += `Test ${testCase.name}:\n${result.consoleOutput}\n\n`;
        }

        // Simulate timeout protection
        if (executionTime > (testCase.timeLimit || languageConfig.timeout)) {
          testResults[testResults.length - 1].error = 'Time limit exceeded';
          testResults[testResults.length - 1].passed = false;
        }

      } catch (error: any) {
        testResults.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: null,
          executionTime: Date.now() - testStart,
          error: error.message,
        });
      }
    }

    // Calculate score
    const totalPassed = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const weightedScore = this.calculateWeightedScore(testResults, request.testCases);

    return {
      success: totalPassed > 0,
      testResults,
      totalPassed,
      totalTests,
      score: weightedScore,
      consoleOutput: consoleOutput || undefined,
    };
  }

  /**
   * Simulate language-specific code execution
   */
  private async simulateLanguageExecution(
    code: string,
    language: string,
    input: any
  ): Promise<{ output: any; error?: string; consoleOutput?: string }> {
    // This is a simplified simulation
    // In production, this would execute actual code in containers

    const delay = Math.random() * 100 + 50; // 50-150ms delay
    await new Promise(resolve => setTimeout(resolve, delay));

    switch (language) {
      case 'javascript':
        return this.simulateJavaScriptExecution(code, input);
      
      case 'python':
        return this.simulatePythonExecution(code, input);
      
      case 'java':
        return this.simulateJavaExecution(code, input);
      
      case 'go':
        return this.simulateGoExecution(code, input);
      
      default:
        throw new Error(`Language ${language} not supported`);
    }
  }

  private simulateJavaScriptExecution(code: string, input: any): { output: any; consoleOutput?: string } {
    // Simple pattern matching for basic solutions
    let output;
    let consoleOutput = '';

    // Look for common programming patterns
    if (code.includes('function solve') || code.includes('const solve') || code.includes('let solve')) {
      // Simulate function execution
      if (typeof input === 'number') {
        if (code.includes('* 2') || code.includes('*2')) {
          output = input * 2;
        } else if (code.includes('+ 1') || code.includes('+1')) {
          output = input + 1;
        } else if (code.includes('return input') || code.includes('return n')) {
          output = input;
        } else {
          output = Math.floor(Math.random() * 100); // Random for unknown logic
        }
      } else if (Array.isArray(input)) {
        if (code.includes('.length')) {
          output = input.length;
        } else if (code.includes('.reverse')) {
          output = [...input].reverse();
        } else if (code.includes('.sort')) {
          output = [...input].sort();
        } else {
          output = input; // Default return input
        }
      } else {
        output = input;
      }
      
      consoleOutput = `Input: ${JSON.stringify(input)}\nOutput: ${JSON.stringify(output)}`;
    } else {
      // Simple expression evaluation simulation
      output = input;
    }

    return { output, consoleOutput };
  }

  private simulatePythonExecution(code: string, input: any): { output: any; consoleOutput?: string } {
    let output;
    let consoleOutput = '';

    // Look for Python patterns
    if (code.includes('def solve') || code.includes('def main')) {
      // Simulate function execution
      if (typeof input === 'number') {
        if (code.includes('* 2') || code.includes('*2')) {
          output = input * 2;
        } else if (code.includes('+ 1') || code.includes('+1')) {
          output = input + 1;
        } else if (code.includes('str(')) {
          output = String(input);
        } else {
          output = input;
        }
      } else if (Array.isArray(input)) {
        if (code.includes('len(')) {
          output = input.length;
        } else if (code.includes('.reverse') || code.includes('[::-1]')) {
          output = [...input].reverse();
        } else if (code.includes('sorted(')) {
          output = [...input].sort();
        } else {
          output = input;
        }
      } else {
        output = input;
      }

      consoleOutput = `Input: ${JSON.stringify(input)}\nOutput: ${JSON.stringify(output)}`;
    } else {
      output = input;
    }

    return { output, consoleOutput };
  }

  private simulateJavaExecution(code: string, input: any): { output: any; consoleOutput?: string } {
    let output;
    let consoleOutput = '';

    // Look for Java patterns
    if (code.includes('public static') && (code.includes('solve') || code.includes('main'))) {
      // Simulate Java execution
      if (typeof input === 'number') {
        if (code.includes('* 2')) {
          output = input * 2;
        } else if (code.includes('+ 1')) {
          output = input + 1;
        } else {
          output = input;
        }
      } else if (Array.isArray(input)) {
        if (code.includes('.length')) {
          output = input.length;
        } else {
          output = input;
        }
      } else {
        output = input;
      }

      consoleOutput = `Input: ${JSON.stringify(input)}\nOutput: ${JSON.stringify(output)}`;
    } else {
      output = input;
    }

    return { output, consoleOutput };
  }

  private simulateGoExecution(code: string, input: any): { output: any; consoleOutput?: string } {
    let output;
    let consoleOutput = '';

    // Look for Go patterns
    if (code.includes('func solve') || code.includes('func main')) {
      // Simulate Go execution
      if (typeof input === 'number') {
        if (code.includes('* 2')) {
          output = input * 2;
        } else if (code.includes('+ 1')) {
          output = input + 1;
        } else {
          output = input;
        }
      } else if (Array.isArray(input)) {
        if (code.includes('len(')) {
          output = input.length;
        } else {
          output = input;
        }
      } else {
        output = input;
      }

      consoleOutput = `Input: ${JSON.stringify(input)}\nOutput: ${JSON.stringify(output)}`;
    } else {
      output = input;
    }

    return { output, consoleOutput };
  }

  /**
   * Compare actual vs expected output
   */
  private compareOutputs(actual: any, expected: any): boolean {
    // Handle different types
    if (typeof actual !== typeof expected) {
      return false;
    }

    // Handle arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((item, index) => this.compareOutputs(item, expected[index]));
    }

    // Handle objects
    if (typeof actual === 'object' && actual !== null && expected !== null) {
      const actualKeys = Object.keys(actual).sort();
      const expectedKeys = Object.keys(expected).sort();
      
      if (actualKeys.length !== expectedKeys.length) return false;
      if (!actualKeys.every((key, index) => key === expectedKeys[index])) return false;
      
      return actualKeys.every(key => this.compareOutputs(actual[key], expected[key]));
    }

    // Handle primitives
    return actual === expected;
  }

  /**
   * Calculate weighted score based on test case weights
   */
  private calculateWeightedScore(testResults: TestResult[], testCases: TestCase[]): number {
    let totalWeight = 0;
    let passedWeight = 0;

    testResults.forEach(result => {
      const testCase = testCases.find(tc => tc.id === result.testCaseId);
      if (testCase) {
        totalWeight += testCase.weight;
        if (result.passed) {
          passedWeight += testCase.weight;
        }
      }
    });

    return totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Store execution result for analysis
   */
  async storeExecutionResult(
    attemptId: string,
    result: CodeExecutionResult
  ): Promise<void> {
    try {
      await this.db.collection('execution-results').doc(attemptId).set({
        ...result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to store execution result', { attemptId, error });
      // Non-critical error, don't throw
    }
  }
}

export const codeExecutionService = new CodeExecutionService();