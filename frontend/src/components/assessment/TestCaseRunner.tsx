import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  PlayArrow,
  Timer,
  Memory,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const TestCaseContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ConsoleOutput = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: '0.875rem',
  lineHeight: 1.4,
  overflow: 'auto',
  maxHeight: '300px',
}));

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  input: any;
  expectedOutput: any;
  isVisible: boolean;
  weight: number;
  timeLimit?: number; // in milliseconds
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

interface TestCaseRunnerProps {
  testCases: TestCase[];
  executionResult?: ExecutionResult;
  onRunTests: () => void;
  isRunning: boolean;
  language: string;
}

export const TestCaseRunner: React.FC<TestCaseRunnerProps> = ({
  testCases,
  executionResult,
  onRunTests,
  isRunning,
  language,
}) => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const getTestCaseStatus = (testCaseId: string) => {
    if (!executionResult) return null;
    
    const result = executionResult.testResults.find(r => r.testCaseId === testCaseId);
    if (!result) return null;
    
    return result.passed;
  };

  const getStatusIcon = (testCaseId: string) => {
    const status = getTestCaseStatus(testCaseId);
    if (status === null) return null;
    
    return status ? (
      <CheckCircle color="success" />
    ) : (
      <Error color="error" />
    );
  };

  const getStatusColor = (testCaseId: string): 'default' | 'success' | 'error' => {
    const status = getTestCaseStatus(testCaseId);
    if (status === null) return 'default';
    return status ? 'success' : 'error';
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatExecutionTime = (timeMs: number): string => {
    if (timeMs < 1000) return `${timeMs.toFixed(0)}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
  };

  // Only show visible test cases to candidates
  const visibleTestCases = testCases.filter(tc => tc.isVisible);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Test Cases
        </Typography>
        
        <Button
          variant="contained"
          startIcon={isRunning ? <Timer /> : <PlayArrow />}
          onClick={onRunTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </Stack>

      {isRunning && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Executing your {language} code against test cases...
          </Typography>
        </Box>
      )}

      {executionResult && (
        <TestCaseContainer elevation={1} sx={{ mb: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                Execution Summary
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`${executionResult.totalPassed}/${executionResult.totalTests} Passed`}
                  color={executionResult.totalPassed === executionResult.totalTests ? 'success' : 'warning'}
                  variant="outlined"
                />
                <Chip
                  label={`Score: ${Math.round(executionResult.score)}%`}
                  color={executionResult.score >= 70 ? 'success' : executionResult.score >= 50 ? 'warning' : 'error'}
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={4}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Timer fontSize="small" color="action" />
                <Typography variant="caption">
                  {formatExecutionTime(executionResult.executionTime)}
                </Typography>
              </Box>
              {executionResult.testResults.length > 0 && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Memory fontSize="small" color="action" />
                  <Typography variant="caption">
                    Avg: {formatExecutionTime(
                      executionResult.testResults.reduce((sum, r) => sum + r.executionTime, 0) / 
                      executionResult.testResults.length
                    )} per test
                  </Typography>
                </Box>
              )}
            </Stack>

            {executionResult.error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Execution Error
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {executionResult.error}
                </Typography>
              </Alert>
            )}

            {executionResult.compilationError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Compilation Error
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {executionResult.compilationError}
                </Typography>
              </Alert>
            )}
          </Stack>
        </TestCaseContainer>
      )}

      {visibleTestCases.map((testCase, index) => {
        const testResult = executionResult?.testResults.find(r => r.testCaseId === testCase.id);
        
        return (
          <Accordion
            key={testCase.id}
            expanded={expandedPanel === testCase.id}
            onChange={handleAccordionChange(testCase.id)}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                {getStatusIcon(testCase.id)}
                <Typography fontWeight={500}>
                  Test Case {index + 1}: {testCase.name}
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1}>
                {testResult && (
                  <Chip
                    size="small"
                    label={formatExecutionTime(testResult.executionTime)}
                    color={getStatusColor(testCase.id)}
                    variant="outlined"
                  />
                )}
                <Chip
                  size="small"
                  label={`Weight: ${testCase.weight}%`}
                  variant="outlined"
                />
              </Stack>
            </AccordionSummary>
            
            <AccordionDetails>
              <Stack spacing={2}>
                {testCase.description && (
                  <Typography variant="body2" color="text.secondary">
                    {testCase.description}
                  </Typography>
                )}

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Input:
                  </Typography>
                  <ConsoleOutput>
                    {formatValue(testCase.input)}
                  </ConsoleOutput>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Expected Output:
                  </Typography>
                  <ConsoleOutput>
                    {formatValue(testCase.expectedOutput)}
                  </ConsoleOutput>
                </Box>

                {testResult && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Your Output:
                      </Typography>
                      <ConsoleOutput>
                        {testResult.error ? (
                          <Typography color="error.main">
                            Error: {testResult.error}
                          </Typography>
                        ) : (
                          formatValue(testResult.actualOutput)
                        )}
                      </ConsoleOutput>
                    </Box>

                    {!testResult.passed && !testResult.error && (
                      <Alert severity="warning">
                        <Typography variant="body2">
                          Expected: <strong>{formatValue(testCase.expectedOutput)}</strong>
                          <br />
                          Got: <strong>{formatValue(testResult.actualOutput)}</strong>
                        </Typography>
                      </Alert>
                    )}

                    {testResult.passed && (
                      <Alert severity="success">
                        Test passed! Execution time: {formatExecutionTime(testResult.executionTime)}
                      </Alert>
                    )}
                  </>
                )}

                {testCase.timeLimit && (
                  <Typography variant="caption" color="text.secondary">
                    Time limit: {formatExecutionTime(testCase.timeLimit)}
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {executionResult?.consoleOutput && (
        <TestCaseContainer elevation={1} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Console Output
          </Typography>
          <ConsoleOutput>
            {executionResult.consoleOutput}
          </ConsoleOutput>
        </TestCaseContainer>
      )}

      {visibleTestCases.length === 0 && (
        <Alert severity="info">
          No test cases available for preview. Your solution will be tested against hidden test cases when submitted.
        </Alert>
      )}
    </Box>
  );
};

export default TestCaseRunner;