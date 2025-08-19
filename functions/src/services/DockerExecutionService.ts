/**
 * Docker-based Code Execution Service
 * Replaces the simulation with real containerized code execution
 */

import * as admin from 'firebase-admin';
import { Docker } from 'dockerode';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { logger } from '../utils/logger';
import { CodeExecutionRequest, CodeExecutionResult, TestResult, TestCase } from './codeExecutionService';

interface DockerLanguageConfig {
  id: string;
  name: string;
  dockerImage: string;
  extension: string;
  compileCommand?: string;
  runCommand: string;
  timeout: number;
  memoryLimit: number;
  cpuLimit: number;
  allowedImports: string[];
  bannedPatterns: RegExp[];
}

const DOCKER_LANGUAGE_CONFIGS: DockerLanguageConfig[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    dockerImage: 'node:18-alpine',
    extension: 'js',
    runCommand: 'node /app/solution.js',
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5,
    allowedImports: ['fs', 'path', 'util', 'crypto'],
    bannedPatterns: [
      /require\s*\(\s*['"`]child_process['"`]\)/i,
      /require\s*\(\s*['"`]os['"`]\)/i,
      /require\s*\(\s*['"`]cluster['"`]\)/i,
      /require\s*\(\s*['"`]worker_threads['"`]\)/i,
      /process\.exit/i,
      /process\.kill/i,
    ],
  },
  {
    id: 'python',
    name: 'Python',
    dockerImage: 'python:3.11-alpine',
    extension: 'py',
    runCommand: 'python /app/solution.py',
    timeout: 15000,
    memoryLimit: 256 * 1024 * 1024, // 256MB
    cpuLimit: 0.5,
    allowedImports: ['math', 'json', 'random', 're', 'collections', 'itertools', 'functools'],
    bannedPatterns: [
      /import\s+os/i,
      /import\s+subprocess/i,
      /import\s+sys/i,
      /import\s+socket/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /__import__/i,
    ],
  },
  {
    id: 'java',
    name: 'Java',
    dockerImage: 'openjdk:17-alpine',
    extension: 'java',
    compileCommand: 'javac /app/Solution.java',
    runCommand: 'java -cp /app Solution',
    timeout: 20000,
    memoryLimit: 512 * 1024 * 1024, // 512MB
    cpuLimit: 1.0,
    allowedImports: ['java.util.*', 'java.math.*', 'java.lang.*'],
    bannedPatterns: [
      /Runtime\.getRuntime/i,
      /ProcessBuilder/i,
      /System\.exit/i,
      /Thread\./i,
      /Class\.forName/i,
    ],
  },
  {
    id: 'go',
    name: 'Go',
    dockerImage: 'golang:1.21-alpine',
    extension: 'go',
    runCommand: 'go run /app/solution.go',
    timeout: 15000,
    memoryLimit: 256 * 1024 * 1024, // 256MB
    cpuLimit: 0.5,
    allowedImports: ['fmt', 'math', 'sort', 'strings', 'strconv', 'regexp'],
    bannedPatterns: [
      /os\./i,
      /exec\./i,
      /syscall\./i,
      /unsafe\./i,
      /runtime\./i,
    ],
  },
];

export class DockerExecutionService {
  private docker: Docker;
  private db = admin.firestore();
  private tempDir = '/tmp/ella-executions';

  constructor() {
    this.docker = new Docker();
    this.initializeTempDirectory();
  }

  private async initializeTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory', { error });
    }
  }

  /**
   * Execute code in Docker container
   */
  async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const executionId = randomUUID();
    const startTime = Date.now();
    
    try {
      logger.info('Starting Docker code execution', {
        executionId,
        language: request.language,
        testCases: request.testCases.length,
      });

      const languageConfig = DOCKER_LANGUAGE_CONFIGS.find(
        config => config.id === request.language
      );
      
      if (!languageConfig) {
        throw new Error(`Unsupported language: ${request.language}`);
      }

      // Security validation
      await this.validateCodeSecurity(request.code, languageConfig);

      // Execute tests in container
      const testResults = await this.executeTestsInContainer(
        request,
        languageConfig,
        executionId
      );

      // Calculate results
      const totalPassed = testResults.filter(r => r.passed).length;
      const totalTests = testResults.length;
      const score = this.calculateWeightedScore(testResults, request.testCases);
      
      const result: CodeExecutionResult = {
        success: totalPassed > 0,
        testResults,
        totalPassed,
        totalTests,
        score,
        executionTime: Date.now() - startTime,
      };

      logger.info('Docker execution completed', {
        executionId,
        success: result.success,
        score: result.score,
        executionTime: result.executionTime,
      });

      // Store execution result for analysis
      await this.storeExecutionMetrics(executionId, request, result);

      return result;

    } catch (error: any) {
      logger.error('Docker execution failed', {
        executionId,
        error: error.message,
        stack: error.stack,
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
   * Validate code security before execution
   */
  private async validateCodeSecurity(
    code: string,
    config: DockerLanguageConfig
  ): Promise<void> {
    // Check for banned patterns
    for (const pattern of config.bannedPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Code contains potentially unsafe operations: ${pattern.source}`);
      }
    }

    // Check code length
    if (code.length > 50000) {
      throw new Error('Code too long (max 50KB)');
    }

    // Language-specific validation
    switch (config.id) {
      case 'javascript':
        await this.validateJavaScriptSecurity(code);
        break;
      case 'python':
        await this.validatePythonSecurity(code);
        break;
      case 'java':
        await this.validateJavaSecurity(code);
        break;
      case 'go':
        await this.validateGoSecurity(code);
        break;
    }
  }

  private async validateJavaScriptSecurity(code: string): Promise<void> {
    const dangerousPatterns = [
      /require\s*\(\s*['"`].*['"`]\)/g,
      /import\s+.*\s+from/g,
      /eval\s*\(/g,
      /Function\s*\(/g,
      /process\./g,
      /global\./g,
      /console\./g, // Allow console.log but flag for review
    ];

    // Extract all require/import statements
    const requires = code.match(/require\s*\(\s*['"`]([^'"`]*)['"`]\)/g) || [];
    const imports = code.match(/import\s+.*\s+from\s+['"`]([^'"`]*)['"`]/g) || [];

    // Allow only specific modules (none for now to be safe)
    const allowedModules: string[] = [];
    
    for (const req of requires) {
      const module = req.match(/['"`]([^'"`]*)['"`]/)?.[1];
      if (module && !allowedModules.includes(module)) {
        throw new Error(`Module '${module}' is not allowed`);
      }
    }
  }

  private async validatePythonSecurity(code: string): Promise<void> {
    const dangerousImports = [
      'os', 'subprocess', 'sys', 'socket', 'urllib', 'requests',
      'multiprocessing', 'threading', 'asyncio', 'ctypes', 'importlib'
    ];

    // Check for dangerous imports
    for (const module of dangerousImports) {
      const patterns = [
        new RegExp(`import\\s+${module}`, 'i'),
        new RegExp(`from\\s+${module}\\s+import`, 'i'),
        new RegExp(`__import__\\s*\\(\\s*['"]${module}['"]`, 'i'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          throw new Error(`Import of '${module}' module is not allowed`);
        }
      }
    }
  }

  private async validateJavaSecurity(code: string): Promise<void> {
    const dangerousClasses = [
      'Runtime', 'ProcessBuilder', 'Class', 'ClassLoader', 'Thread',
      'File', 'FileInputStream', 'FileOutputStream', 'Socket', 'URL'
    ];

    for (const className of dangerousClasses) {
      if (code.includes(className)) {
        throw new Error(`Use of '${className}' class is not allowed`);
      }
    }
  }

  private async validateGoSecurity(code: string): Promise<void> {
    const dangerousPackages = [
      'os', 'os/exec', 'syscall', 'unsafe', 'runtime', 'net', 'net/http'
    ];

    for (const pkg of dangerousPackages) {
      const patterns = [
        new RegExp(`import\\s+['"]${pkg}['"]`, 'i'),
        new RegExp(`import\\s+\\w+\\s+['"]${pkg}['"]`, 'i'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          throw new Error(`Import of '${pkg}' package is not allowed`);
        }
      }
    }
  }

  /**
   * Execute tests in Docker container
   */
  private async executeTestsInContainer(
    request: CodeExecutionRequest,
    config: DockerLanguageConfig,
    executionId: string
  ): Promise<TestResult[]> {
    const workspaceDir = path.join(this.tempDir, executionId);
    
    try {
      // Create workspace directory
      await fs.mkdir(workspaceDir, { recursive: true });

      // Write code to file
      const codeFile = await this.writeCodeFile(request.code, config, workspaceDir);
      
      // Write test runner
      const testRunnerFile = await this.writeTestRunner(request, config, workspaceDir);

      // Pull Docker image if needed
      await this.ensureDockerImage(config.dockerImage);

      // Execute tests
      const results = await this.runTestsInContainer(
        config,
        workspaceDir,
        executionId
      );

      return results;

    } finally {
      // Clean up workspace
      await this.cleanupWorkspace(workspaceDir);
    }
  }

  private async writeCodeFile(
    code: string,
    config: DockerLanguageConfig,
    workspaceDir: string
  ): Promise<string> {
    const filename = config.id === 'java' ? 'Solution' : 'solution';
    const filepath = path.join(workspaceDir, `${filename}.${config.extension}`);
    
    await fs.writeFile(filepath, code, 'utf8');
    return filepath;
  }

  private async writeTestRunner(
    request: CodeExecutionRequest,
    config: DockerLanguageConfig,
    workspaceDir: string
  ): Promise<string> {
    let testRunnerCode = '';

    switch (config.id) {
      case 'javascript':
        testRunnerCode = this.generateJavaScriptTestRunner(request.testCases);
        break;
      case 'python':
        testRunnerCode = this.generatePythonTestRunner(request.testCases);
        break;
      case 'java':
        testRunnerCode = this.generateJavaTestRunner(request.testCases);
        break;
      case 'go':
        testRunnerCode = this.generateGoTestRunner(request.testCases);
        break;
    }

    const filepath = path.join(workspaceDir, `test_runner.${config.extension}`);
    await fs.writeFile(filepath, testRunnerCode, 'utf8');
    return filepath;
  }

  private generateJavaScriptTestRunner(testCases: TestCase[]): string {
    return `
const fs = require('fs');
const solution = require('./solution.js');

const testCases = ${JSON.stringify(testCases)};
const results = [];

for (const testCase of testCases) {
  const startTime = Date.now();
  let result = {
    testCaseId: testCase.id,
    passed: false,
    actualOutput: null,
    executionTime: 0,
    error: null
  };

  try {
    // Extract function name from test case or use default
    const functionName = testCase.functionName || 'solution';
    const func = solution[functionName];
    
    if (typeof func !== 'function') {
      throw new Error(\`Function '\${functionName}' not found\`);
    }

    // Execute with input
    const actualOutput = Array.isArray(testCase.input) 
      ? func(...testCase.input) 
      : func(testCase.input);
    
    result.actualOutput = actualOutput;
    result.passed = JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput);
    
  } catch (error) {
    result.error = error.message;
  } finally {
    result.executionTime = Date.now() - startTime;
    results.push(result);
  }
}

console.log(JSON.stringify(results));
    `;
  }

  private generatePythonTestRunner(testCases: TestCase[]): string {
    return `
import json
import sys
import traceback
import time
from solution import *

test_cases = ${JSON.stringify(testCases)}
results = []

for test_case in test_cases:
    start_time = time.time()
    result = {
        'testCaseId': test_case['id'],
        'passed': False,
        'actualOutput': None,
        'executionTime': 0,
        'error': None
    }
    
    try:
        function_name = test_case.get('functionName', 'solution')
        func = globals().get(function_name)
        
        if not callable(func):
            raise Exception(f"Function '{function_name}' not found")
        
        input_data = test_case['input']
        if isinstance(input_data, list):
            actual_output = func(*input_data)
        else:
            actual_output = func(input_data)
        
        result['actualOutput'] = actual_output
        result['passed'] = actual_output == test_case['expectedOutput']
        
    except Exception as e:
        result['error'] = str(e)
    finally:
        result['executionTime'] = int((time.time() - start_time) * 1000)
        results.append(result)

print(json.dumps(results))
    `;
  }

  private generateJavaTestRunner(testCases: TestCase[]): string {
    return `
import java.util.*;
import com.google.gson.*;

public class TestRunner {
    public static void main(String[] args) {
        // Test cases would be loaded from file or passed as arguments
        // This is a simplified version
        System.out.println("[]"); // Empty results for now
    }
}
    `;
  }

  private generateGoTestRunner(testCases: TestCase[]): string {
    return `
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type TestResult struct {
    TestCaseID   string      \`json:"testCaseId"\`
    Passed       bool        \`json:"passed"\`
    ActualOutput interface{} \`json:"actualOutput"\`
    ExecutionTime int64      \`json:"executionTime"\`
    Error        *string     \`json:"error"\`
}

func main() {
    results := []TestResult{}
    
    // Test execution would be implemented here
    // This is a simplified version
    
    output, _ := json.Marshal(results)
    fmt.Println(string(output))
}
    `;
  }

  private async ensureDockerImage(imageName: string): Promise<void> {
    try {
      // Check if image exists locally
      const images = await this.docker.listImages();
      const imageExists = images.some(image => 
        image.RepoTags && image.RepoTags.includes(imageName)
      );

      if (!imageExists) {
        logger.info('Pulling Docker image', { imageName });
        await this.docker.pull(imageName);
      }
    } catch (error) {
      logger.error('Failed to ensure Docker image', { imageName, error });
      throw error;
    }
  }

  private async runTestsInContainer(
    config: DockerLanguageConfig,
    workspaceDir: string,
    executionId: string
  ): Promise<TestResult[]> {
    const container = await this.docker.createContainer({
      Image: config.dockerImage,
      Cmd: ['sh', '-c', config.runCommand.replace('/app', '/workspace')],
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: config.memoryLimit,
        CpuQuota: Math.floor(config.cpuLimit * 100000),
        CpuPeriod: 100000,
        NetworkMode: 'none', // No network access
        ReadonlyRootfs: true,
        Binds: [`${workspaceDir}:/workspace:ro`],
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=100m'
        }
      },
      AttachStdout: true,
      AttachStderr: true,
    });

    try {
      await container.start();

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Execution timeout'));
        }, config.timeout);
      });

      // Wait for container to finish or timeout
      const executionPromise = container.wait();
      await Promise.race([executionPromise, timeoutPromise]);

      // Get output
      const logs = await container.logs({
        stdout: true,
        stderr: true,
      });

      const output = logs.toString();
      
      // Parse results from output
      const results = this.parseTestResults(output);
      
      return results;

    } finally {
      // Clean up container
      try {
        await container.kill();
        await container.remove();
      } catch (error) {
        logger.warn('Failed to clean up container', { executionId, error });
      }
    }
  }

  private parseTestResults(output: string): TestResult[] {
    try {
      // Extract JSON from output
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('[') || line.trim().startsWith('{')) {
          return JSON.parse(line.trim());
        }
      }
      
      throw new Error('No valid JSON output found');
    } catch (error) {
      logger.error('Failed to parse test results', { output, error });
      return [];
    }
  }

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

  private async cleanupWorkspace(workspaceDir: string): Promise<void> {
    try {
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to cleanup workspace', { workspaceDir, error });
    }
  }

  private async storeExecutionMetrics(
    executionId: string,
    request: CodeExecutionRequest,
    result: CodeExecutionResult
  ): Promise<void> {
    try {
      await this.db.collection('execution-metrics').doc(executionId).set({
        language: request.language,
        codeLength: request.code.length,
        testCases: request.testCases.length,
        executionTime: result.executionTime,
        success: result.success,
        score: result.score,
        totalPassed: result.totalPassed,
        totalTests: result.totalTests,
        error: result.error || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to store execution metrics', { executionId, error });
      // Non-critical, don't throw
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(timeRange: number = 24 * 60 * 60 * 1000): Promise<any> {
    const startTime = new Date(Date.now() - timeRange);
    
    const snapshot = await this.db
      .collection('execution-metrics')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startTime))
      .get();

    const stats = {
      totalExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      languageBreakdown: {} as any,
      errorTypes: {} as any,
    };

    let totalTime = 0;
    let successCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.totalExecutions++;
      
      if (data.success) successCount++;
      totalTime += data.executionTime;
      
      // Language breakdown
      if (!stats.languageBreakdown[data.language]) {
        stats.languageBreakdown[data.language] = 0;
      }
      stats.languageBreakdown[data.language]++;
      
      // Error types
      if (data.error) {
        if (!stats.errorTypes[data.error]) {
          stats.errorTypes[data.error] = 0;
        }
        stats.errorTypes[data.error]++;
      }
    });

    stats.successRate = stats.totalExecutions > 0 
      ? (successCount / stats.totalExecutions) * 100 
      : 0;
    
    stats.averageExecutionTime = stats.totalExecutions > 0 
      ? totalTime / stats.totalExecutions 
      : 0;

    return stats;
  }
}

export const dockerExecutionService = new DockerExecutionService();