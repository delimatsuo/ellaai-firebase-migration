import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Toolbar,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Save,
  Fullscreen,
  FullscreenExit,
  RestartAlt,
  Settings,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const EditorContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  height: '100%',
  minHeight: '400px',
}));

const EditorToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: '48px !important',
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  justifyContent: 'space-between',
}));

export interface Language {
  id: string;
  name: string;
  extension: string;
  monacoId: string;
  defaultCode: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    monacoId: 'javascript',
    defaultCode: `// Your solution here
function solve() {
    // TODO: Implement your solution
    return null;
}

// Test your solution
console.log(solve());`,
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    monacoId: 'python',
    defaultCode: `# Your solution here
def solve():
    # TODO: Implement your solution
    pass

# Test your solution
if __name__ == "__main__":
    print(solve())`,
  },
  {
    id: 'java',
    name: 'Java',
    extension: 'java',
    monacoId: 'java',
    defaultCode: `public class Solution {
    // Your solution here
    public static void solve() {
        // TODO: Implement your solution
    }
    
    // Test your solution
    public static void main(String[] args) {
        solve();
    }
}`,
  },
  {
    id: 'go',
    name: 'Go',
    extension: 'go',
    monacoId: 'go',
    defaultCode: `package main

import "fmt"

// Your solution here
func solve() interface{} {
    // TODO: Implement your solution
    return nil
}

// Test your solution
func main() {
    fmt.Println(solve())
}`,
  },
];

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: (code: string, language: string) => void;
  onSave?: (code: string, language: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  isRunning?: boolean;
  readOnly?: boolean;
  autoSave?: boolean;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onRun,
  onSave,
  language,
  onLanguageChange,
  isRunning = false,
  readOnly = false,
  autoSave = true,
  className,
}) => {
  const editorRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'vs' | 'vs-dark'>('vs');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    // Auto-save functionality
    if (autoSave && hasUnsavedChanges) {
      const saveTimer = setTimeout(() => {
        if (onSave) {
          onSave(value, language);
          setHasUnsavedChanges(false);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
    return undefined;
  }, [value, language, hasUnsavedChanges, autoSave, onSave]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: fontSize,
      lineNumbers: 'on',
      automaticLayout: true,
      wordWrap: 'on',
    });

    // Add keyboard shortcuts
    const monaco = (window as any).monaco;
    if (monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        handleRun();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSave();
      });
    }
  };

  const handleCodeChange = (newValue: string | undefined) => {
    if (newValue !== undefined && newValue !== value) {
      onChange(newValue);
      setHasUnsavedChanges(true);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    const langConfig = SUPPORTED_LANGUAGES.find(lang => lang.id === newLanguage);
    if (langConfig) {
      onLanguageChange(newLanguage);
      // Optionally reset to default code when language changes
      if (value.trim() === '' || (currentLanguage && value === currentLanguage.defaultCode)) {
        onChange(langConfig.defaultCode);
      }
    }
  };

  const handleRun = () => {
    if (!isRunning) {
      onRun(value, language);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(value, language);
      setHasUnsavedChanges(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your code? This will restore the template and you will lose your current work.')) {
      onChange(currentLanguage?.defaultCode || '');
      setHasUnsavedChanges(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const editorOptions = {
    readOnly,
    fontSize,
    theme,
    language: currentLanguage?.monacoId || 'javascript',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    folding: true,
    renderLineHighlight: 'line' as const,
    selectOnLineNumbers: true,
    roundedSelection: false,
    cursorStyle: 'line' as const,
    mouseWheelZoom: true,
  };

  return (
    <EditorContainer 
      className={className}
      sx={{ 
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        zIndex: isFullscreen ? 9999 : 'auto',
      }}
    >
      <EditorToolbar>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={readOnly}
              label="Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem key={lang.id} value={lang.id}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasUnsavedChanges && (
            <Chip 
              label="Unsaved changes" 
              color="warning" 
              size="small" 
              variant="outlined" 
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Run Code (Ctrl+Enter)">
            <Button
              variant="contained"
              startIcon={isRunning ? <CircularProgress size={16} /> : <PlayArrow />}
              onClick={handleRun}
              disabled={isRunning || readOnly}
              color="primary"
            >
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </Tooltip>

          {onSave && (
            <Tooltip title="Save (Ctrl+S)">
              <IconButton onClick={handleSave} disabled={readOnly}>
                <Save />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Reset to template">
            <IconButton onClick={handleReset} disabled={readOnly}>
              <RestartAlt />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton>
              <Settings />
            </IconButton>
          </Tooltip>
        </Stack>
      </EditorToolbar>

      <Box sx={{ height: 'calc(100% - 48px)' }}>
        <Editor
          value={value}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          loading={<CircularProgress />}
        />
      </Box>

      {isRunning && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Alert severity="info" icon={<CircularProgress size={20} />}>
            Running your code...
          </Alert>
        </Box>
      )}
    </EditorContainer>
  );
};

export default CodeEditor;