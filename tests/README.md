# EllaAI Assessment Execution System - Testing Suite

This comprehensive testing suite provides extensive coverage for the EllaAI assessment execution system, including frontend components, backend services, security validation, performance testing, and integration tests.

## Overview

The testing strategy follows industry best practices with:
- **Unit Tests** - Individual component/service testing
- **Integration Tests** - End-to-end workflow testing
- **Security Tests** - Vulnerability and malicious code detection
- **Performance Tests** - Load testing and performance benchmarks
- **>80% Code Coverage** - Comprehensive test coverage requirements

## Test Structure

```
tests/
├── unit/
│   ├── frontend/           # React component tests
│   └── backend/            # Service and utility tests
├── integration/            # API and workflow tests
├── security/              # Security validation tests
├── performance/           # Performance and load tests
├── helpers/               # Test utilities and mocks
└── setup/                 # Test configuration
```

## Frontend Testing (Vitest + React Testing Library)

### Components Tested
- **CodeEditor.tsx** - Monaco editor integration, language switching, auto-save
- **TestCaseRunner.tsx** - Test execution, results display, status indicators
- **AssessmentExecution.tsx** - Complete assessment workflow, timer, submission

### Key Features Tested
- User interactions (typing, clicking, form submission)
- Component state management
- Props validation and edge cases
- Accessibility (ARIA labels, keyboard navigation)
- Error handling and loading states
- Timer functionality and auto-submission
- Auto-save and manual save operations

### Running Frontend Tests
```bash
# Run all frontend tests
npm run test:frontend

# Watch mode for development
npm run test:frontend:watch

# UI mode for interactive testing
npm run test:frontend:ui

# Generate coverage report
npm run test:frontend:coverage
```

## Backend Testing (Jest)

### Services Tested
- **CodeExecutionService** - Code execution, validation, scoring
- **Security validation** - Malicious code detection
- **Database operations** - Result storage and retrieval

### Key Features Tested
- Code execution simulation for multiple languages
- Security pattern detection (file system access, process execution)
- Input validation and sanitization
- Error handling and timeout protection
- Memory usage and resource management
- Weighted scoring and test result calculation

### Running Backend Tests
```bash
# Run all backend tests
npm run test:backend

# Watch mode for development
npm run test:backend:watch

# Generate coverage report
npm run test:backend:coverage
```

## Integration Testing

Tests complete workflows from API endpoints to database storage:
- Code execution API endpoints
- Request validation and error handling
- Concurrent request processing
- Database integration
- End-to-end assessment taking flow

### Running Integration Tests
```bash
npm run test:integration
```

## Security Testing

Comprehensive security validation including:

### Code Injection Prevention
- File system access attempts (`fs.readFileSync`, `open()`, etc.)
- Network access (`fetch`, `requests.get`, etc.)
- Process execution (`exec`, `subprocess`, etc.)
- Dynamic code execution (`eval`, `Function`, etc.)

### Resource Exhaustion Prevention
- Infinite loop detection
- Memory bomb prevention
- Execution time limits
- Concurrent execution limits

### Input Validation
- XSS attack prevention
- SQL injection handling
- Command injection protection
- Path traversal attempts
- Buffer overflow protection

### Running Security Tests
```bash
npm run test:security
```

## Performance Testing

Benchmarks and load testing for:

### Execution Performance
- Simple vs complex algorithm performance
- Scaling with number of test cases
- Language-specific execution times
- Memory usage patterns

### Concurrency Testing
- Multiple simultaneous executions
- Performance under continuous load
- Resource cleanup efficiency
- Database operation performance

### Running Performance Tests
```bash
npm run test:performance
```

## Test Configuration

### Frontend (Vitest)
- **Environment**: jsdom for DOM simulation
- **Setup**: `vitest.setup.ts` with React Testing Library configuration
- **Mocks**: Firebase, Monaco Editor, React Router
- **Coverage**: >80% lines, functions, branches, statements

### Backend (Jest)
- **Environment**: Node.js
- **Setup**: `jest.setup.js` with Firebase Admin mocks
- **Mocks**: Firebase Admin, Winston logger, external services
- **Coverage**: >80% lines, functions, branches, statements

## Test Utilities and Mocks

### Frontend Test Utils (`test-utils.tsx`)
- Custom render function with providers (Theme, Router, Query Client)
- Mock data factories for components
- User event helpers
- Async operation utilities

### Backend Test Utils (`backend-mocks.ts`)
- Firebase Admin service mocks
- Express request/response mocks
- Test data generators
- Security pattern definitions
- Performance test cases

## Running All Tests

```bash
# Run complete test suite
npm run test:all

# Run with CI configuration
npm run test:ci

# Generate merged coverage report
npm run coverage:merge && npm run coverage:report
```

## Coverage Requirements

All modules must maintain minimum coverage thresholds:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Coverage reports are generated in:
- Frontend: `coverage/frontend/`
- Backend: `coverage/backend/`
- Merged: `coverage/merged/`

## Test Execution in CI/CD

The test suite is designed for continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm ci
    npm run test:ci
    npm run coverage:report

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    directory: ./coverage/merged
```

## Best Practices

### Writing Tests
1. **Follow AAA Pattern** - Arrange, Act, Assert
2. **One Assertion Per Test** - Focus on single behavior
3. **Descriptive Test Names** - Explain what and why
4. **Mock External Dependencies** - Keep tests isolated
5. **Test Edge Cases** - Empty inputs, errors, timeouts

### Test Data
1. **Use Factories** - Create consistent test data
2. **Avoid Hard-coded Values** - Use constants and generators
3. **Test Real Scenarios** - Use realistic input data
4. **Include Edge Cases** - Null, empty, large values

### Performance Considerations
1. **Parallel Execution** - Tests run concurrently where possible
2. **Resource Cleanup** - Proper teardown and memory management
3. **Timeout Handling** - Appropriate timeouts for different test types
4. **Mocking Strategy** - Mock expensive operations

## Debugging Tests

### Frontend Tests
```bash
# Debug with UI
npm run test:frontend:ui

# Debug specific test
npx vitest run CodeEditor.test.tsx

# Debug with browser devtools
npx vitest run --reporter=verbose
```

### Backend Tests
```bash
# Debug specific test
npx jest codeExecutionService.test.ts

# Debug with verbose output
npx jest --verbose

# Debug with coverage
npx jest --coverage --collectCoverageFrom="functions/src/**/*.ts"
```

## Security Considerations

The test suite itself follows security best practices:
- No sensitive data in test files
- Secure mock implementations
- Proper cleanup of test resources
- Isolated test environments
- Validation of security features

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Maintain coverage thresholds
3. Include security validation tests
4. Add performance benchmarks for critical paths
5. Update documentation and examples

## Monitoring and Metrics

Test execution metrics are tracked:
- Execution time per test suite
- Coverage trends over time
- Performance regression detection
- Security test effectiveness
- Flaky test identification

For questions or issues with the testing suite, please refer to the project documentation or create an issue in the repository.