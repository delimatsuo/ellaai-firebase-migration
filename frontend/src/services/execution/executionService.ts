import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

export interface ExecutionResult {
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

export interface ProgrammingLanguage {
  id: string;
  name: string;
  extension: string;
  version: string;
  popular: boolean;
}

class ExecutionService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  /**
   * Execute code against test cases
   */
  async executeCode(
    code: string,
    language: string,
    testCases: TestCase[],
    options?: {
      timeLimit?: number;
      memoryLimit?: number;
    }
  ): Promise<ExecutionResult> {
    try {
      const response = await this.axios.post('/execution/run', {
        code,
        language,
        testCases,
        timeLimit: options?.timeLimit,
        memoryLimit: options?.memoryLimit,
      });
      
      return response.data.result;
    } catch (error: any) {
      console.error('Code execution failed:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to execute code'
      );
    }
  }

  /**
   * Save assessment attempt progress
   */
  async saveProgress(
    attemptId: string,
    code: string,
    language: string
  ): Promise<void> {
    try {
      await this.axios.post(`/execution/attempts/${attemptId}/save`, {
        code,
        language,
      });
    } catch (error: any) {
      console.error('Failed to save progress:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to save progress'
      );
    }
  }

  /**
   * Submit assessment attempt
   */
  async submitAssessment(
    attemptId: string,
    code: string,
    language: string,
    executionResult?: ExecutionResult
  ): Promise<{ submittedAt: string }> {
    try {
      const response = await this.axios.post(`/execution/attempts/${attemptId}/submit`, {
        code,
        language,
        executionResult,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to submit assessment:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to submit assessment'
      );
    }
  }

  /**
   * Get supported programming languages
   */
  async getSupportedLanguages(): Promise<ProgrammingLanguage[]> {
    try {
      const response = await this.axios.get('/execution/languages');
      return response.data.languages;
    } catch (error: any) {
      console.error('Failed to get supported languages:', error);
      
      // Return default languages if API fails
      return [
        {
          id: 'javascript',
          name: 'JavaScript',
          extension: 'js',
          version: 'Node.js 18',
          popular: true,
        },
        {
          id: 'python',
          name: 'Python',
          extension: 'py',
          version: '3.11',
          popular: true,
        },
        {
          id: 'java',
          name: 'Java',
          extension: 'java',
          version: '17',
          popular: true,
        },
        {
          id: 'go',
          name: 'Go',
          extension: 'go',
          version: '1.21',
          popular: false,
        },
      ];
    }
  }

  /**
   * Validate code syntax (client-side basic validation)
   */
  validateCodeSyntax(code: string, language: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!code || code.trim().length === 0) {
      errors.push('Code cannot be empty');
    }

    // Basic language-specific validation
    switch (language) {
      case 'javascript':
        if (!this.hasBasicJSStructure(code)) {
          errors.push('JavaScript code should contain a function or valid statements');
        }
        break;
        
      case 'python':
        if (!this.hasBasicPythonStructure(code)) {
          errors.push('Python code should contain a function definition or valid statements');
        }
        break;
        
      case 'java':
        if (!code.includes('class') || !code.includes('public')) {
          errors.push('Java code should contain a public class');
        }
        break;
        
      case 'go':
        if (!code.includes('func')) {
          errors.push('Go code should contain a function definition');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private hasBasicJSStructure(code: string): boolean {
    return /function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|\w+\s*=>|console\./.test(code);
  }

  private hasBasicPythonStructure(code: string): boolean {
    return /def\s+\w+|class\s+\w+|print\(|if\s+|for\s+|while\s+/.test(code);
  }

  /**
   * Get estimated execution time based on code complexity
   */
  getEstimatedExecutionTime(code: string, language: string): number {
    const baseTime = 1000; // 1 second base
    const codeLength = code.length;
    const complexity = this.calculateCodeComplexity(code);
    
    // Language multipliers (some languages are generally slower)
    const languageMultipliers: Record<string, number> = {
      javascript: 1.0,
      python: 1.2,
      java: 1.5, // includes compilation
      go: 1.1,
    };

    const multiplier = languageMultipliers[language] || 1.0;
    return Math.min(baseTime + (codeLength * 2) + (complexity * 500), 30000) * multiplier;
  }

  private calculateCodeComplexity(code: string): number {
    let complexity = 0;
    
    // Count loops and conditions (rough estimate)
    const patterns = [
      /for\s*\(/g,
      /while\s*\(/g,
      /if\s*\(/g,
      /else\s+if/g,
      /switch\s*\(/g,
      /\.map\s*\(/g,
      /\.filter\s*\(/g,
      /\.reduce\s*\(/g,
    ];
    
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }
}

export const executionService = new ExecutionService();
export default executionService;