// Backend test mocks and utilities
import { Request, Response } from 'express';
import { jest } from '@jest/globals';

// Mock Express Request/Response
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  method: 'GET',
  url: '/',
  ...overrides
});

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res;
};

// Mock Firebase Admin Firestore
export const createMockFirestore = () => {
  const mockDoc = {
    id: 'mock-doc-id',
    exists: true,
    data: jest.fn(() => ({})),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({})
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined)
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
    add: jest.fn().mockResolvedValue(mockDoc),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [mockDoc],
      forEach: jest.fn(),
      size: 1,
      empty: false
    })
  };

  return {
    collection: jest.fn(() => mockCollection),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    })),
    runTransaction: jest.fn()
  };
};

// Mock Code Execution Service
export const createMockCodeExecutionService = () => ({
  executeCode: jest.fn().mockResolvedValue({
    success: true,
    testResults: [{
      testCaseId: 'test-1',
      passed: true,
      actualOutput: 10,
      executionTime: 150,
      memoryUsed: 1024
    }],
    totalPassed: 1,
    totalTests: 1,
    score: 100,
    executionTime: 200,
    consoleOutput: 'Test completed'
  }),
  storeExecutionResult: jest.fn().mockResolvedValue(undefined)
});

// Mock Proctor Service
export const createMockProctorService = () => ({
  initializeSession: jest.fn().mockResolvedValue({
    sessionId: 'session-123',
    proctorUrl: 'https://proctor.example.com/session/123',
    accessToken: 'token-123'
  }),
  validateSession: jest.fn().mockResolvedValue({
    isValid: true,
    violations: []
  }),
  endSession: jest.fn().mockResolvedValue(undefined),
  getSessionReport: jest.fn().mockResolvedValue({
    sessionId: 'session-123',
    violations: [],
    flaggedEvents: [],
    overallScore: 95
  })
});

// Mock Logger
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
});

// Mock Test Data
export const mockTestCases = [
  {
    id: 'test-1',
    name: 'Basic Test',
    input: 5,
    expectedOutput: 10,
    isVisible: true,
    weight: 50,
    timeLimit: 1000
  },
  {
    id: 'test-2',
    name: 'Edge Case',
    input: 0,
    expectedOutput: 0,
    isVisible: false,
    weight: 50,
    timeLimit: 1000
  }
];

export const mockQuestion = {
  id: 'question-1',
  title: 'Double the Number',
  description: 'Write a function that doubles the input',
  difficulty: 'easy',
  timeLimit: 30,
  points: 100,
  testCases: mockTestCases,
  starterCode: {
    javascript: 'function solve(n) { return n * 2; }'
  }
};

export const mockAssessmentAttempt = {
  id: 'attempt-1',
  questionId: 'question-1',
  candidateId: 'candidate-1',
  code: 'function solve(n) { return n * 2; }',
  language: 'javascript',
  startedAt: new Date(),
  timeRemaining: 1800,
  status: 'in_progress',
  autoSaveEnabled: true
};

// Security test patterns
export const maliciousCodePatterns = [
  {
    name: 'File System Access',
    code: 'const fs = require("fs"); fs.readFileSync("/etc/passwd");',
    language: 'javascript'
  },
  {
    name: 'Process Execution',
    code: 'const { exec } = require("child_process"); exec("rm -rf /");',
    language: 'javascript'
  },
  {
    name: 'Python OS Commands',
    code: 'import os; os.system("rm -rf /")',
    language: 'python'
  },
  {
    name: 'Network Access',
    code: 'import urllib.request; urllib.request.urlopen("http://evil.com")',
    language: 'python'
  },
  {
    name: 'Infinite Loop',
    code: 'while(true) { console.log("spam"); }',
    language: 'javascript'
  },
  {
    name: 'Memory Bomb',
    code: 'const arr = []; while(true) arr.push(new Array(1000000));',
    language: 'javascript'
  }
];

// Performance test data
export const performanceTestCases = [
  {
    name: 'Small Input',
    input: Array.from({length: 10}, (_, i) => i),
    expectedMaxTime: 100
  },
  {
    name: 'Medium Input',
    input: Array.from({length: 1000}, (_, i) => i),
    expectedMaxTime: 500
  },
  {
    name: 'Large Input',
    input: Array.from({length: 10000}, (_, i) => i),
    expectedMaxTime: 2000
  }
];