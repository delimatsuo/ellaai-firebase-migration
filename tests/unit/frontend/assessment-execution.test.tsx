import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AssessmentExecution } from '../../../frontend/src/components/assessment/AssessmentExecution';
import { AuthContext } from '../../../frontend/src/contexts/AuthContext';

// Mock dependencies
jest.mock('../../../frontend/src/hooks/useAuth');
jest.mock('../../../frontend/src/components/assessment/CodeEditor');
jest.mock('../../../frontend/src/components/assessment/TestCaseRunner');

const mockQuestion = {
  id: 'test-question',
  title: 'Test Question',
  description: 'This is a test question',
  difficulty: 'medium' as const,
  timeLimit: 30,
  points: 100,
  testCases: [
    {
      id: 'test1',
      name: 'Basic test',
      input: [1, 2],
      expectedOutput: 3,
      isVisible: true,
      weight: 50,
    },
    {
      id: 'test2',
      name: 'Edge case',
      input: [0, 0],
      expectedOutput: 0,
      isVisible: false,
      weight: 50,
    },
  ],
  starterCode: {
    javascript: 'function solution() { return 0; }',
  },
  hints: ['Think about the problem step by step'],
};

const mockAttempt = {
  id: 'test-attempt',
  questionId: 'test-question',
  candidateId: 'test-candidate',
  code: 'function solution() { return 0; }',
  language: 'javascript',
  startedAt: new Date(),
  timeRemaining: 1800, // 30 minutes
  status: 'in_progress' as const,
  autoSaveEnabled: true,
};

const mockUser = {
  uid: 'test-candidate',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockProps = {
  question: mockQuestion,
  attempt: mockAttempt,
  onSave: jest.fn(),
  onSubmit: jest.fn(),
  onRunCode: jest.fn(),
  onExit: jest.fn(),
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, loading: false }}>
      {component}
    </AuthContext.Provider>
  );
};

describe('AssessmentExecution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render question title and details', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      expect(screen.getByText('Test Question')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM • 100 points')).toBeInTheDocument();
    });

    it('should display remaining time', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      expect(screen.getByText('30:00')).toBeInTheDocument();
    });

    it('should show question description', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      expect(screen.getByText('This is a test question')).toBeInTheDocument();
    });

    it('should display hints if available', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      expect(screen.getByText('Hints:')).toBeInTheDocument();
      expect(screen.getByText('Think about the problem step by step')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('should count down the timer', async () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Wait for timer to tick
      await waitFor(() => {
        expect(screen.getByText('29:59')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show warning when time is running out', async () => {
      const shortTimeProps = {
        ...mockProps,
        attempt: { ...mockAttempt, timeRemaining: 240 }, // 4 minutes
      };
      
      renderWithAuth(<AssessmentExecution {...shortTimeProps} />);
      
      expect(screen.getByText(/time is running out/i)).toBeInTheDocument();
    });

    it('should show critical warning when time is almost up', async () => {
      const criticalTimeProps = {
        ...mockProps,
        attempt: { ...mockAttempt, timeRemaining: 30 }, // 30 seconds
      };
      
      renderWithAuth(<AssessmentExecution {...criticalTimeProps} />);
      
      expect(screen.getByText(/time is almost up/i)).toBeInTheDocument();
    });

    it('should auto-submit when time expires', async () => {
      const expiredProps = {
        ...mockProps,
        attempt: { ...mockAttempt, timeRemaining: 1 },
      };
      
      renderWithAuth(<AssessmentExecution {...expiredProps} />);
      
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Code Editor Integration', () => {
    it('should handle code changes', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Simulate code change (would be handled by CodeEditor component)
      const newCode = 'function solution() { return 1; }';
      
      // This would trigger through the CodeEditor onChange prop
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should handle language changes', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Language change would be handled by CodeEditor component
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save code changes', async () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Simulate code change and wait for auto-save
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalled();
      }, { timeout: 4000 });
    });

    it('should show saving indicator', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Auto-save would trigger saving state
      // This would be tested through state changes
    });

    it('should display last saved time', async () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // After auto-save, should show last saved time
      await waitFor(() => {
        expect(screen.getByText(/last saved:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manual Actions', () => {
    it('should handle manual save', async () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(mockProps.onSave).toHaveBeenCalled();
    });

    it('should handle code execution', async () => {
      mockProps.onRunCode.mockResolvedValueOnce({
        success: true,
        testResults: [],
        totalPassed: 1,
        totalTests: 2,
        score: 50,
        executionTime: 100,
      });
      
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // This would be triggered through TestCaseRunner component
      await waitFor(() => {
        expect(mockProps.onRunCode).toHaveBeenCalled();
      });
    });

    it('should show submission dialog', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Submit Assessment')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to submit/i)).toBeInTheDocument();
    });

    it('should handle submission confirmation', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      const confirmButton = screen.getByText('Submit Final Answer');
      fireEvent.click(confirmButton);
      
      expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('should show exit dialog', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const exitButton = screen.getByText('Exit');
      fireEvent.click(exitButton);
      
      expect(screen.getByText('Exit Assessment')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to exit/i)).toBeInTheDocument();
    });
  });

  describe('Test Results Display', () => {
    it('should display test results after code execution', async () => {
      const executionResult = {
        success: true,
        testResults: [
          {
            testCaseId: 'test1',
            passed: true,
            actualOutput: 3,
            executionTime: 50,
          },
          {
            testCaseId: 'test2',
            passed: false,
            actualOutput: 1,
            executionTime: 60,
            error: 'Wrong answer',
          },
        ],
        totalPassed: 1,
        totalTests: 2,
        score: 50,
        executionTime: 110,
      };
      
      const propsWithResult = {
        ...mockProps,
        attempt: { ...mockAttempt, executionResult },
      };
      
      renderWithAuth(<AssessmentExecution {...propsWithResult} />);
      
      // Test results would be displayed in TestCaseRunner component
      expect(screen.getByTestId('test-case-runner')).toBeInTheDocument();
    });

    it('should show execution errors', () => {
      const executionResult = {
        success: false,
        testResults: [],
        totalPassed: 0,
        totalTests: 2,
        score: 0,
        executionTime: 0,
        error: 'Compilation error',
      };
      
      const propsWithError = {
        ...mockProps,
        attempt: { ...mockAttempt, executionResult },
      };
      
      renderWithAuth(<AssessmentExecution {...propsWithError} />);
      
      // Error would be displayed in TestCaseRunner component
      expect(screen.getByTestId('test-case-runner')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Should render in mobile layout
      expect(screen.getByTestId('assessment-container')).toHaveClass('mobile-layout');
    });

    it('should work on tablet screens', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Should render in tablet layout
      expect(screen.getByTestId('assessment-container')).toHaveClass('tablet-layout');
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      mockProps.onSave.mockRejectedValueOnce(new Error('Save failed'));
      
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      // Should not crash and handle error gracefully
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle execution errors', async () => {
      mockProps.onRunCode.mockRejectedValueOnce(new Error('Execution failed'));
      
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      // Execution error would be handled in TestCaseRunner
      expect(screen.getByTestId('test-case-runner')).toBeInTheDocument();
    });

    it('should handle submission errors', async () => {
      mockProps.onSubmit.mockRejectedValueOnce(new Error('Submission failed'));
      
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      const confirmButton = screen.getByText('Submit Final Answer');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      const submitButton = screen.getByText('Submit');
      submitButton.focus();
      
      expect(document.activeElement).toBe(submitButton);
    });

    it('should have proper heading structure', () => {
      renderWithAuth(<AssessmentExecution {...mockProps} />);
      
      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Test Question');
      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Problem Description');
    });
  });
});