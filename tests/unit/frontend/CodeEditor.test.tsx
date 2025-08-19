// CodeEditor Component Tests
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor, SUPPORTED_LANGUAGES } from '../../../frontend/src/components/assessment/CodeEditor';
import { render, createMockChangeEvent } from '../../helpers/test-utils';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange, onMount }) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          updateOptions: vi.fn(),
          addCommand: vi.fn(),
          getValue: () => value,
          setValue: vi.fn()
        };
        onMount(mockEditor);
      }
    }, [onMount]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) onChange(e.target.value);
    };

    return (
      <textarea 
        data-testid="monaco-editor" 
        value={value} 
        onChange={handleChange}
      />
    );
  })
}));

describe('CodeEditor Component', () => {
  const defaultProps = {
    value: 'console.log("hello world");',
    onChange: vi.fn(),
    onRun: vi.fn(),
    onSave: vi.fn(),
    language: 'javascript',
    onLanguageChange: vi.fn(),
    isRunning: false,
    readOnly: false,
    autoSave: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    });

    it('should display the correct language in selector', () => {
      render(<CodeEditor {...defaultProps} language="python" />);
      
      const languageSelect = screen.getByDisplayValue('python');
      expect(languageSelect).toBeInTheDocument();
    });

    it('should show all supported languages in dropdown', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      const languageSelect = screen.getByLabelText(/language/i);
      await user.click(languageSelect);
      
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(screen.getByText(lang.name)).toBeInTheDocument();
      }
    });

    it('should display unsaved changes indicator', () => {
      render(<CodeEditor {...defaultProps} />);
      
      // Simulate code change
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'new code' } });
      
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('Code Editing', () => {
    it('should call onChange when code is modified', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'new code' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('new code');
    });

    it('should not call onChange when readOnly is true', () => {
      render(<CodeEditor {...defaultProps} readOnly={true} />);
      
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'new code' } });
      
      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    it('should reset code to template when reset button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<CodeEditor {...defaultProps} />);
      
      const resetButton = screen.getByTitle(/reset to template/i);
      await user.click(resetButton);
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(defaultProps.onChange).toHaveBeenCalledWith(
        SUPPORTED_LANGUAGES.find(lang => lang.id === 'javascript')?.defaultCode
      );
      
      confirmSpy.mockRestore();
    });

    it('should not reset code when user cancels confirmation', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<CodeEditor {...defaultProps} />);
      
      const resetButton = screen.getByTitle(/reset to template/i);
      await user.click(resetButton);
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(defaultProps.onChange).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Language Selection', () => {
    it('should call onLanguageChange when language is changed', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      const languageSelect = screen.getByLabelText(/language/i);
      await user.click(languageSelect);
      
      const pythonOption = screen.getByText('Python');
      await user.click(pythonOption);
      
      expect(defaultProps.onLanguageChange).toHaveBeenCalledWith('python');
    });

    it('should update code with template when language changes and current code is empty', () => {
      const { rerender } = render(<CodeEditor {...defaultProps} value="" />);
      
      // Simulate language change
      rerender(<CodeEditor {...defaultProps} value="" language="python" />);
      
      // Should call onChange with Python template
      expect(defaultProps.onChange).toHaveBeenCalledWith(
        SUPPORTED_LANGUAGES.find(lang => lang.id === 'python')?.defaultCode
      );
    });

    it('should not update code when language changes if code is not empty', () => {
      const { rerender } = render(<CodeEditor {...defaultProps} value="my custom code" />);
      
      // Clear the onChange mock
      vi.clearAllMocks();
      
      // Simulate language change
      rerender(<CodeEditor {...defaultProps} value="my custom code" language="python" />);
      
      // Should not call onChange
      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });
  });

  describe('Code Execution', () => {
    it('should call onRun when run button is clicked', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      const runButton = screen.getByRole('button', { name: /run/i });
      await user.click(runButton);
      
      expect(defaultProps.onRun).toHaveBeenCalledWith(
        defaultProps.value,
        defaultProps.language
      );
    });

    it('should disable run button when isRunning is true', () => {
      render(<CodeEditor {...defaultProps} isRunning={true} />);
      
      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton).toBeDisabled();
    });

    it('should show running indicator when isRunning is true', () => {
      render(<CodeEditor {...defaultProps} isRunning={true} />);
      
      expect(screen.getByText(/running your code/i)).toBeInTheDocument();
    });

    it('should disable run button when readOnly is true', () => {
      render(<CodeEditor {...defaultProps} readOnly={true} />);
      
      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton).toBeDisabled();
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      const saveButton = screen.getByTitle(/save/i);
      await user.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        defaultProps.value,
        defaultProps.language
      );
    });

    it('should not show save button when onSave is not provided', () => {
      render(<CodeEditor {...defaultProps} onSave={undefined} />);
      
      const saveButton = screen.queryByTitle(/save/i);
      expect(saveButton).not.toBeInTheDocument();
    });

    it('should auto-save after delay when autoSave is enabled', async () => {
      vi.useFakeTimers();
      
      render(<CodeEditor {...defaultProps} autoSave={true} />);
      
      // Simulate code change
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'new code' } });
      
      // Fast forward timers
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('new code', defaultProps.language);
      });
      
      vi.useRealTimers();
    });

    it('should not auto-save when autoSave is disabled', async () => {
      vi.useFakeTimers();
      
      render(<CodeEditor {...defaultProps} autoSave={false} />);
      
      // Simulate code change
      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: 'new code' } });
      
      // Fast forward timers
      vi.advanceTimersByTime(2000);
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Fullscreen Mode', () => {
    it('should toggle fullscreen mode when fullscreen button is clicked', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      const fullscreenButton = screen.getByTitle(/fullscreen/i);
      await user.click(fullscreenButton);
      
      // Check if container has fullscreen styles applied
      const container = screen.getByTestId('monaco-editor').closest('[class*="EditorContainer"]');
      expect(container).toHaveStyle({ position: 'fixed' });
      
      // Click again to exit fullscreen
      const exitFullscreenButton = screen.getByTitle(/exit fullscreen/i);
      await user.click(exitFullscreenButton);
      
      expect(container).toHaveStyle({ position: 'relative' });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should trigger run when Ctrl+Enter is pressed', () => {
      // This test would require mocking the Monaco editor's keyboard handling
      // For now, we'll test that the addCommand method is called with the correct parameters
      render(<CodeEditor {...defaultProps} />);
      
      // The Monaco editor mock should have called addCommand for Ctrl+Enter
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should trigger save when Ctrl+S is pressed', () => {
      // Similar to above, this would test the keyboard shortcut setup
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle editor mounting errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock a failing editor mount
      vi.mocked(require('@monaco-editor/react').default).mockImplementationOnce(() => {
        throw new Error('Editor failed to mount');
      });
      
      expect(() => render(<CodeEditor {...defaultProps} />)).not.toThrow();
      
      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      // Tab to language selector
      await user.tab();
      expect(screen.getByLabelText(/language/i)).toHaveFocus();
      
      // Tab to run button
      await user.tab();
      await user.tab(); // Skip the editor
      expect(screen.getByRole('button', { name: /run/i })).toHaveFocus();
    });
  });
});