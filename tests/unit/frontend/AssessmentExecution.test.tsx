// AssessmentExecution Component Tests
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssessmentExecution } from '../../../frontend/src/components/assessment/AssessmentExecution';
import { 
  render, 
  createMockQuestion, 
  createMockAssessmentAttempt, 
  createMockExecutionResult,
  createMockUser 
} from '../../helpers/test-utils';

// Mock the auth hook
vi.mock('../../../frontend/src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn()
  })
}));

// Mock child components
vi.mock('../../../frontend/src/components/assessment/CodeEditor', () => ({
  CodeEditor: vi.fn(({ value, onChange, onRun, language, onLanguageChange }) => (
    <div data-testid="code-editor">
      <textarea 
        data-testid="code-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <select 
        data-testid="language-select"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
      </select>
      <button data-testid="run-button" onClick={() => onRun(value, language)}>
        Run
      </button>
    </div>
  )),
  SUPPORTED_LANGUAGES: [
    { id: 'javascript', name: 'JavaScript', defaultCode: 'function solve() {}' },
    { id: 'python', name: 'Python', defaultCode: 'def solve():' }
  ]
}));

vi.mock('../../../frontend/src/components/assessment/TestCaseRunner', () => ({
  TestCaseRunner: vi.fn(({ onRunTests, isRunning }) => (
    <div data-testid="test-case-runner">
      <button 
        data-testid="run-tests-button" 
        onClick={onRunTests}
        disabled={isRunning}
      >
        {isRunning ? 'Running...' : 'Run Tests'}
      </button>
    </div>
  ))
}));

describe('AssessmentExecution Component', () => {
  const mockQuestion = createMockQuestion();
  const mockAttempt = createMockAssessmentAttempt();
  
  const defaultProps = {
    question: mockQuestion,
    attempt: mockAttempt,
    onSave: vi.fn().mockResolvedValue(undefined),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onRunCode: vi.fn().mockResolvedValue(createMockExecutionResult()),
    onExit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the assessment interface', () => {
      render(<AssessmentExecution {...defaultProps} />);
      
      expect(screen.getByText(mockQuestion.title)).toBeInTheDocument();
      expect(screen.getByText(/easy.*100 points/i)).toBeInTheDocument();
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      expect(screen.getByTestId('test-case-runner')).toBeInTheDocument();
    });

    it('should display question description and hints', () => {
      render(<AssessmentExecution {...defaultProps} />);
      
      expect(screen.getByText('Problem Description')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.description)).toBeInTheDocument();
      
      if (mockQuestion.hints) {
        expect(screen.getByText('Hints:')).toBeInTheDocument();
        mockQuestion.hints.forEach(hint => {
          expect(screen.getByText(hint)).toBeInTheDocument();
        });
      }
    });

    it('should show timer with remaining time', () => {
      render(<AssessmentExecution {...defaultProps} />);
      
      // Should show formatted time (30 minutes = 30:00)
      expect(screen.getByText('30:00')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(<AssessmentExecution {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('should count down the timer', async () => {
      render(<AssessmentExecution {...defaultProps} />);
      
      // Initial time should be 30:00
      expect(screen.getByText('30:00')).toBeInTheDocument();
      
      // Advance timer by 1 second
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('29:59')).toBeInTheDocument();
      });
    });

    it('should show warning when time is running out', async () => {
      const attemptWithLowTime = {
        ...mockAttempt,
        timeRemaining: 300 // 5 minutes
      };
      
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithLowTime} />);
      
      expect(screen.getByText(/time is running out/i)).toBeInTheDocument();
    });

    it('should show critical warning when time is almost up', async () => {
      const attemptWithVeryLowTime = {
        ...mockAttempt,
        timeRemaining: 30 // 30 seconds
      };
      
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithVeryLowTime} />);
      
      expect(screen.getByText(/time is almost up/i)).toBeInTheDocument();
    });

    it('should auto-submit when timer reaches zero', async () => {
      const attemptWithNoTime = {
        ...mockAttempt,
        timeRemaining: 1 // 1 second
      };
      
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithNoTime} />);
      
      // Advance timer to trigger auto-submit
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalled();
      });
    });

    it('should display time in hours:minutes:seconds format for long durations', () => {
      const attemptWithLongTime = {
        ...mockAttempt,
        timeRemaining: 7200 // 2 hours
      };
      
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithLongTime} />);
      
      expect(screen.getByText('2:00:00')).toBeInTheDocument();
    });
  });

  describe('Code Editing', () => {
    it('should update code when user types', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const codeInput = screen.getByTestId('code-input');
      await user.clear(codeInput);
      await user.type(codeInput, 'new code');
      
      expect(codeInput).toHaveValue('new code');
    });

    it('should update language when user changes selection', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const languageSelect = screen.getByTestId('language-select');
      await user.selectOptions(languageSelect, 'python');
      
      expect(languageSelect).toHaveValue('python');
    });

    it('should load starter code when language changes', async () => {
      const user = userEvent.setup();
      const questionWithStarter = {
        ...mockQuestion,
        starterCode: {
          python: 'def solve(): pass'
        }
      };
      
      render(<AssessmentExecution {...defaultProps} question={questionWithStarter} />);
      
      const languageSelect = screen.getByTestId('language-select');
      await user.selectOptions(languageSelect, 'python');
      
      // Code should be updated to starter code
      expect(screen.getByTestId('code-input')).toHaveValue('def solve(): pass');
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save code changes when enabled', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const codeInput = screen.getByTestId('code-input');
      await user.clear(codeInput);
      await user.type(codeInput, 'modified code');
      
      // Advance timer to trigger auto-save
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('modified code', 'javascript');
      });
    });

    it('should not auto-save when disabled', async () => {
      const attemptWithoutAutoSave = {
        ...mockAttempt,
        autoSaveEnabled: false
      };
      
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithoutAutoSave} />);
      
      const codeInput = screen.getByTestId('code-input');
      await user.clear(codeInput);
      await user.type(codeInput, 'modified code');
      
      // Advance timer
      vi.advanceTimersByTime(3000);
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should show last saved time', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      // Trigger manual save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/last saved:/i)).toBeInTheDocument();
      });
    });

    it('should show saving indicator during save', async () => {
      const user = userEvent.setup();
      
      // Mock slow save operation
      const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<AssessmentExecution {...defaultProps} onSave={slowSave} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      // Wait for save to complete
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Code Execution', () => {
    it('should run code when run button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const runButton = screen.getByTestId('run-button');
      await user.click(runButton);
      
      expect(defaultProps.onRunCode).toHaveBeenCalledWith(mockAttempt.code, mockAttempt.language);
    });

    it('should handle code execution errors', async () => {
      const user = userEvent.setup();
      const errorOnRunCode = vi.fn().mockRejectedValue(new Error('Execution failed'));
      
      render(<AssessmentExecution {...defaultProps} onRunCode={errorOnRunCode} />);
      
      const runButton = screen.getByTestId('run-button');
      await user.click(runButton);
      
      await waitFor(() => {
        expect(errorOnRunCode).toHaveBeenCalled();
      });
    });

    it('should show running state during execution', async () => {
      const user = userEvent.setup();
      
      // Mock slow execution
      const slowExecution = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<AssessmentExecution {...defaultProps} onRunCode={slowExecution} />);
      
      const runButton = screen.getByTestId('run-button');
      await user.click(runButton);
      
      // Should show running state
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      // Wait for execution to complete
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.queryByText('Running...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Submission', () => {
    it('should show submit confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      expect(screen.getByText('Submit Assessment')).toBeInTheDocument();
      expect(screen.getByText(/won't be able to make changes/i)).toBeInTheDocument();
    });

    it('should submit when confirmed', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      const confirmButton = screen.getByRole('button', { name: /submit final answer/i });
      await user.click(confirmButton);
      
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        mockAttempt.code,
        mockAttempt.language,
        undefined
      );
    });

    it('should cancel submission when user clicks cancel', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.queryByText('Submit Assessment')).not.toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should disable submit button when time runs out', () => {
      const attemptWithNoTime = {
        ...mockAttempt,
        timeRemaining: 0
      };
      
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithNoTime} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show execution results in submit dialog', async () => {
      const user = userEvent.setup();
      const executionResult = createMockExecutionResult({
        totalPassed: 3,
        totalTests: 5,
        score: 60
      });
      
      // First run code to get results
      render(<AssessmentExecution {...defaultProps} />);
      
      const runButton = screen.getByTestId('run-button');
      await user.click(runButton);
      
      // Wait for execution to complete and set results
      await waitFor(() => {
        expect(defaultProps.onRunCode).toHaveBeenCalled();
      });
      
      // Now click submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Should show current test results info
      expect(screen.getByText(/current test results/i)).toBeInTheDocument();
      expect(screen.getByText(/hidden test cases/i)).toBeInTheDocument();
    });
  });

  describe('Exit Functionality', () => {
    it('should show exit confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const exitButton = screen.getByRole('button', { name: /exit/i });
      await user.click(exitButton);
      
      expect(screen.getByText('Exit Assessment')).toBeInTheDocument();
      expect(screen.getByText(/progress will be saved/i)).toBeInTheDocument();
    });

    it('should exit when confirmed', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const exitButton = screen.getByRole('button', { name: /exit/i });
      await user.click(exitButton);
      
      const confirmExitButton = screen.getByRole('button', { name: /exit assessment/i });
      await user.click(confirmExitButton);
      
      expect(defaultProps.onExit).toHaveBeenCalled();
    });

    it('should cancel exit when user chooses to continue', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      const exitButton = screen.getByRole('button', { name: /exit/i });
      await user.click(exitButton);
      
      const continueButton = screen.getByRole('button', { name: /continue working/i });
      await user.click(continueButton);
      
      expect(screen.queryByText('Exit Assessment')).not.toBeInTheDocument();
      expect(defaultProps.onExit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const failingSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      
      render(<AssessmentExecution {...defaultProps} onSave={failingSave} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(failingSave).toHaveBeenCalled();
      });
      
      // Component should still be functional
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should handle submit errors gracefully', async () => {
      const user = userEvent.setup();
      const failingSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));
      
      render(<AssessmentExecution {...defaultProps} onSubmit={failingSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      const confirmButton = screen.getByRole('button', { name: /submit final answer/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(failingSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AssessmentExecution {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AssessmentExecution {...defaultProps} />);
      
      // Tab through the interface
      await user.tab();
      expect(document.activeElement).toBeTruthy();
    });

    it('should announce time warnings to screen readers', () => {
      const attemptWithLowTime = {
        ...mockAttempt,
        timeRemaining: 300 // 5 minutes
      };
      
      render(<AssessmentExecution {...defaultProps} attempt={attemptWithLowTime} />);
      
      const warningAlert = screen.getByText(/time is running out/i);
      expect(warningAlert).toBeInTheDocument();
    });
  });
});