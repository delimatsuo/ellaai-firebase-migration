// Test utilities for React Testing Library
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'light'
  }
});

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0
    },
    mutations: {
      retry: false
    }
  }
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: typeof testTheme;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

const AllTheProviders = ({ 
  children, 
  theme = testTheme, 
  queryClient = createTestQueryClient() 
}: {
  children: React.ReactNode;
  theme?: typeof testTheme;
  queryClient?: QueryClient;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { theme, queryClient, ...renderOptions } = options;
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders theme={theme} queryClient={queryClient}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data factories
export const createMockTestCase = (overrides = {}) => ({
  id: 'test-case-1',
  name: 'Basic Test',
  description: 'A basic test case',
  input: 5,
  expectedOutput: 10,
  isVisible: true,
  weight: 20,
  timeLimit: 1000,
  ...overrides
});

export const createMockExecutionResult = (overrides = {}) => ({
  success: true,
  testResults: [
    {
      testCaseId: 'test-case-1',
      passed: true,
      actualOutput: 10,
      executionTime: 150,
      memoryUsed: 1024
    }
  ],
  totalPassed: 1,
  totalTests: 1,
  score: 100,
  executionTime: 200,
  consoleOutput: 'Test completed successfully',
  ...overrides
});

export const createMockQuestion = (overrides = {}) => ({
  id: 'question-1',
  title: 'Double the Number',
  description: 'Write a function that doubles the input number',
  difficulty: 'easy' as const,
  timeLimit: 30,
  points: 100,
  testCases: [createMockTestCase()],
  starterCode: {
    javascript: 'function solve(n) {\n  // Your code here\n  return n * 2;\n}',
    python: 'def solve(n):\n    # Your code here\n    return n * 2'
  },
  hints: ['Try using multiplication'],
  ...overrides
});

export const createMockAssessmentAttempt = (overrides = {}) => ({
  id: 'attempt-1',
  questionId: 'question-1',
  candidateId: 'candidate-1',
  code: 'function solve(n) { return n * 2; }',
  language: 'javascript',
  startedAt: new Date(),
  timeRemaining: 1800, // 30 minutes
  status: 'in_progress' as const,
  autoSaveEnabled: true,
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  uid: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  ...overrides
});

// Test event helpers
export const createMockChangeEvent = (value: string) => ({
  target: { value },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn()
});

export const createMockSelectEvent = (value: string) => ({
  target: { value },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn()
});

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };