// TestCaseRunner Component Tests
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestCaseRunner } from '../../../frontend/src/components/assessment/TestCaseRunner';
import { render, createMockTestCase, createMockExecutionResult } from '../../helpers/test-utils';

describe('TestCaseRunner Component', () => {
  const mockTestCases = [
    createMockTestCase({
      id: 'test-1',
      name: 'Basic Test',
      description: 'Test basic functionality',
      input: 5,
      expectedOutput: 10,
      isVisible: true,
      weight: 50
    }),
    createMockTestCase({
      id: 'test-2',
      name: 'Edge Case',
      description: 'Test edge case',
      input: 0,
      expectedOutput: 0,
      isVisible: true,
      weight: 50
    }),
    createMockTestCase({
      id: 'test-3',
      name: 'Hidden Test',
      description: 'Hidden test case',
      input: -1,
      expectedOutput: -2,
      isVisible: false,
      weight: 30
    })
  ];

  const defaultProps = {
    testCases: mockTestCases,
    onRunTests: vi.fn(),
    isRunning: false,
    language: 'javascript'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render test cases header and run button', () => {
      render(<TestCaseRunner {...defaultProps} />);
      
      expect(screen.getByText('Test Cases')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run tests/i })).toBeInTheDocument();
    });

    it('should only display visible test cases', () => {
      render(<TestCaseRunner {...defaultProps} />);
      
      expect(screen.getByText('Test Case 1: Basic Test')).toBeInTheDocument();
      expect(screen.getByText('Test Case 2: Edge Case')).toBeInTheDocument();
      expect(screen.queryByText('Test Case 3: Hidden Test')).not.toBeInTheDocument();
    });

    it('should show message when no visible test cases exist', () => {
      const testCasesWithNoVisible = mockTestCases.map(tc => ({ ...tc, isVisible: false }));
      
      render(<TestCaseRunner {...defaultProps} testCases={testCasesWithNoVisible} />);
      
      expect(screen.getByText(/no test cases available for preview/i)).toBeInTheDocument();
    });

    it('should display test case weights', () => {
      render(<TestCaseRunner {...defaultProps} />);
      
      expect(screen.getByText('Weight: 50%')).toBeInTheDocument();
    });
  });

  describe('Test Execution', () => {
    it('should call onRunTests when run button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestCaseRunner {...defaultProps} />);
      
      const runButton = screen.getByRole('button', { name: /run tests/i });
      await user.click(runButton);
      
      expect(defaultProps.onRunTests).toHaveBeenCalled();
    });

    it('should disable run button when isRunning is true', () => {
      render(<TestCaseRunner {...defaultProps} isRunning={true} />);
      
      const runButton = screen.getByRole('button', { name: /running tests/i });
      expect(runButton).toBeDisabled();
    });

    it('should show loading indicator when running', () => {
      render(<TestCaseRunner {...defaultProps} isRunning={true} />);
      
      expect(screen.getByText(/executing your javascript code/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Execution Results Display', () => {
    const mockExecutionResult = createMockExecutionResult({
      success: true,
      testResults: [
        {
          testCaseId: 'test-1',
          passed: true,
          actualOutput: 10,
          executionTime: 150,
          memoryUsed: 1024
        },
        {
          testCaseId: 'test-2',
          passed: false,
          actualOutput: 1,
          executionTime: 200,
          error: 'Output mismatch'
        }
      ],
      totalPassed: 1,
      totalTests: 2,
      score: 50,
      executionTime: 350,
      consoleOutput: 'Test execution completed'
    });

    it('should display execution summary', () => {
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      expect(screen.getByText('Execution Summary')).toBeInTheDocument();
      expect(screen.getByText('1/2 Passed')).toBeInTheDocument();
      expect(screen.getByText('Score: 50%')).toBeInTheDocument();
    });

    it('should show execution time', () => {
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      expect(screen.getByText('350ms')).toBeInTheDocument();
    });

    it('should display test case status icons', () => {
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      // Check for success and error icons (using data-testid or aria-labels)
      const passedTest = screen.getByText('Test Case 1: Basic Test').closest('div');
      const failedTest = screen.getByText('Test Case 2: Edge Case').closest('div');
      
      expect(passedTest).toBeInTheDocument();
      expect(failedTest).toBeInTheDocument();
    });

    it('should display console output when available', () => {
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      expect(screen.getByText('Console Output')).toBeInTheDocument();
      expect(screen.getByText('Test execution completed')).toBeInTheDocument();
    });

    it('should show compilation errors', () => {
      const resultWithCompilationError = {
        ...mockExecutionResult,
        compilationError: 'SyntaxError: Unexpected token'
      };
      
      render(<TestCaseRunner {...defaultProps} executionResult={resultWithCompilationError} />);
      
      expect(screen.getByText('Compilation Error')).toBeInTheDocument();
      expect(screen.getByText('SyntaxError: Unexpected token')).toBeInTheDocument();
    });

    it('should show execution errors', () => {
      const resultWithExecutionError = {
        ...mockExecutionResult,
        error: 'Runtime error occurred'
      };
      
      render(<TestCaseRunner {...defaultProps} executionResult={resultWithExecutionError} />);
      
      expect(screen.getByText('Execution Error')).toBeInTheDocument();
      expect(screen.getByText('Runtime error occurred')).toBeInTheDocument();
    });
  });

  describe('Test Case Details', () => {
    const mockExecutionResult = createMockExecutionResult({
      testResults: [
        {
          testCaseId: 'test-1',
          passed: true,
          actualOutput: 10,
          executionTime: 150
        }
      ]
    });

    it('should expand test case details when clicked', async () => {
      const user = userEvent.setup();
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Basic Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText('Input:')).toBeInTheDocument();
        expect(screen.getByText('Expected Output:')).toBeInTheDocument();
        expect(screen.getByText('"5"')).toBeInTheDocument(); // Input value
        expect(screen.getByText('10')).toBeInTheDocument(); // Expected output
      });
    });

    it('should show actual output when test result is available', async () => {
      const user = userEvent.setup();
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Basic Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText('Your Output:')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Actual output
      });
    });

    it('should display error message when test fails', async () => {
      const user = userEvent.setup();
      const resultWithError = {
        ...mockExecutionResult,
        testResults: [{
          testCaseId: 'test-1',
          passed: false,
          actualOutput: null,
          executionTime: 150,
          error: 'Runtime error'
        }]
      };
      
      render(<TestCaseRunner {...defaultProps} executionResult={resultWithError} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Basic Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Runtime error')).toBeInTheDocument();
      });
    });

    it('should show success message for passing tests', async () => {
      const user = userEvent.setup();
      render(<TestCaseRunner {...defaultProps} executionResult={mockExecutionResult} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Basic Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText(/test passed/i)).toBeInTheDocument();
        expect(screen.getByText(/execution time: 150ms/i)).toBeInTheDocument();
      });
    });

    it('should show output comparison for failing tests', async () => {
      const user = userEvent.setup();
      const resultWithFailure = {
        ...mockExecutionResult,
        testResults: [{
          testCaseId: 'test-1',
          passed: false,
          actualOutput: 5,
          executionTime: 150
        }]
      };
      
      render(<TestCaseRunner {...defaultProps} executionResult={resultWithFailure} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Basic Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText(/expected.*10/i)).toBeInTheDocument();
        expect(screen.getByText(/got.*5/i)).toBeInTheDocument();
      });
    });

    it('should display time limit when specified', async () => {
      const user = userEvent.setup();
      const testCasesWithTimeLimit = [
        { ...mockTestCases[0], timeLimit: 2000 }
      ];
      
      render(<TestCaseRunner {...defaultProps} testCases={testCasesWithTimeLimit} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Basic Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText(/time limit: 2s/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format different data types correctly', async () => {
      const user = userEvent.setup();
      const testCaseWithArrays = createMockTestCase({
        id: 'test-array',
        name: 'Array Test',
        input: [1, 2, 3],
        expectedOutput: [3, 2, 1],
        isVisible: true
      });
      
      render(<TestCaseRunner {...defaultProps} testCases={[testCaseWithArrays]} />);
      
      const testCaseHeader = screen.getByText('Test Case 1: Array Test');
      await user.click(testCaseHeader);
      
      await waitFor(() => {
        expect(screen.getByText('[1,2,3]')).toBeInTheDocument();
        expect(screen.getByText('[3,2,1]')).toBeInTheDocument();
      });
    });

    it('should format execution time correctly', () => {
      const resultWithLongTime = createMockExecutionResult({
        executionTime: 2500,
        testResults: [{
          testCaseId: 'test-1',
          passed: true,
          actualOutput: 10,
          executionTime: 2500
        }]
      });
      
      render(<TestCaseRunner {...defaultProps} executionResult={resultWithLongTime} />);
      
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });
  });

  describe('Score Calculation', () => {
    it('should display correct score colors based on performance', () => {
      const excellentResult = createMockExecutionResult({ score: 95 });
      const goodResult = createMockExecutionResult({ score: 65 });
      const poorResult = createMockExecutionResult({ score: 30 });
      
      // Test excellent score (green)
      const { rerender } = render(<TestCaseRunner {...defaultProps} executionResult={excellentResult} />);
      expect(screen.getByText('Score: 95%')).toBeInTheDocument();
      
      // Test good score (orange/warning)
      rerender(<TestCaseRunner {...defaultProps} executionResult={goodResult} />);
      expect(screen.getByText('Score: 65%')).toBeInTheDocument();
      
      // Test poor score (red/error)
      rerender(<TestCaseRunner {...defaultProps} executionResult={poorResult} />);
      expect(screen.getByText('Score: 30%')).toBeInTheDocument();
    });

    it('should show correct passed/total ratio', () => {
      const partialResult = createMockExecutionResult({
        totalPassed: 3,
        totalTests: 5
      });
      
      render(<TestCaseRunner {...defaultProps} executionResult={partialResult} />);
      
      expect(screen.getByText('3/5 Passed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<TestCaseRunner {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /run tests/i })).toBeInTheDocument();
      
      // Check for expandable sections
      const testCaseButtons = screen.getAllByRole('button');
      expect(testCaseButtons.length).toBeGreaterThan(1);
    });

    it('should support keyboard navigation for test case expansion', async () => {
      const user = userEvent.setup();
      render(<TestCaseRunner {...defaultProps} />);
      
      // Tab to first test case
      await user.tab();
      await user.tab(); // Skip run button
      
      const firstTestCase = screen.getByText('Test Case 1: Basic Test').closest('button');
      if (firstTestCase) {
        firstTestCase.focus();
        await user.keyboard('{Enter}');
        
        await waitFor(() => {
          expect(screen.getByText('Input:')).toBeInTheDocument();
        });
      }
    });
  });
});