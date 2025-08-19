# EllaAI Developer Guide

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards and Guidelines](#code-standards-and-guidelines)
- [Testing Strategy](#testing-strategy)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Database Development](#database-development)
- [Security Guidelines](#security-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Deployment and Release Process](#deployment-and-release-process)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before you begin development, ensure you have the following installed:

- **Node.js 18.x LTS** (required for compatibility)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Firebase CLI** (for local development and deployment)
- **VS Code** (recommended IDE with extensions)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/ellaai-platform.git
cd ellaai-platform

# Install dependencies for all components
npm run install:all

# Set up development environment
npm run setup:dev

# Start development servers
npm run dev
```

This will start:
- Frontend development server on `http://localhost:5173`
- Firebase emulators on `http://localhost:4000`
- Backend functions on `http://localhost:5001`

## Development Environment Setup

### 1. Initial Setup

```bash
# Install global dependencies
npm install -g firebase-tools

# Authenticate with Firebase
firebase login

# Select project
firebase use --add
# Choose: ellaai-development (or create new project)
```

### 2. Environment Configuration

Create development environment files:

```bash
# Frontend environment
cat > frontend/.env.development << 'EOF'
VITE_FIREBASE_API_KEY=your_dev_api_key
VITE_FIREBASE_AUTH_DOMAIN=ellaai-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ellaai-dev
VITE_FIREBASE_STORAGE_BUCKET=ellaai-dev.appspot.com
VITE_API_URL=http://localhost:5001/ellaai-dev/us-central1/api
VITE_ENV=development
EOF

# Functions environment
cat > functions/.env.development << 'EOF'
NODE_ENV=development
FIREBASE_PROJECT_ID=ellaai-dev
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EMAIL_SERVICE_API_KEY=your_test_email_key
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
EOF
```

### 3. Firebase Emulator Setup

```bash
# Initialize Firebase emulators
firebase emulators:start --import=./emulator-data --export-on-exit

# The emulators provide:
# - Authentication: http://localhost:9099
# - Firestore: http://localhost:8080  
# - Functions: http://localhost:5001
# - Hosting: http://localhost:5000
# - UI: http://localhost:4000
```

### 4. Development Database Setup

```bash
# Start with clean emulator data
firebase emulators:start --import=./seed-data

# Or seed with test data
npm run seed:development

# Import production data (if authorized)
npm run import:development
```

### 5. VS Code Setup

Install recommended extensions:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "firebase.firebase-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

Configure VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Project Structure

### Repository Layout

```
ellaai-platform/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API integration layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript definitions
│   ├── public/             # Static assets
│   ├── tests/              # Frontend tests
│   └── package.json
├── functions/               # Firebase Cloud Functions
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript definitions
│   ├── tests/              # Backend tests
│   └── package.json
├── tests/                   # Integration and E2E tests
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── config/                  # Configuration files
└── package.json            # Root package configuration
```

### Component Organization

#### Frontend Components
```
src/components/
├── common/                  # Generic UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   └── Modal/
├── assessment/              # Assessment-specific components
│   ├── CodeEditor/
│   ├── QuestionRenderer/
│   └── TimerDisplay/
├── admin/                   # Admin interface components
└── analytics/               # Analytics components
```

#### Backend Services
```
functions/src/
├── services/
│   ├── AssessmentService.ts  # Assessment business logic
│   ├── CandidateService.ts   # Candidate management
│   ├── EmailService.ts       # Email notifications
│   └── AnalyticsService.ts   # Analytics processing
├── routes/
│   ├── assessments.ts        # Assessment API endpoints
│   ├── candidates.ts         # Candidate API endpoints
│   └── auth.ts              # Authentication endpoints
└── middleware/
    ├── auth.ts              # Authentication middleware
    ├── validation.ts        # Request validation
    └── errorHandler.ts      # Error handling
```

## Development Workflow

### 1. Feature Development Process

```bash
# 1. Create feature branch
git checkout -b feature/assessment-timer

# 2. Implement feature
# - Write tests first (TDD approach)
# - Implement functionality
# - Update documentation

# 3. Run tests
npm run test
npm run test:integration

# 4. Code quality checks
npm run lint
npm run typecheck
npm run security:check

# 5. Commit changes
git add .
git commit -m "feat: add assessment timer component"

# 6. Push branch
git push origin feature/assessment-timer

# 7. Create pull request
gh pr create --title "Add assessment timer component"
```

### 2. Code Review Process

#### Pull Request Guidelines
- **Title**: Use conventional commit format
- **Description**: Clear summary of changes and rationale
- **Screenshots**: For UI changes
- **Testing**: Evidence of testing performed
- **Documentation**: Updated if applicable

#### Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered
- [ ] Documentation updated
- [ ] Breaking changes documented

### 3. Git Workflow

#### Branch Naming Convention
```
feature/short-description     # New features
bugfix/issue-description      # Bug fixes
hotfix/critical-issue        # Critical production fixes
refactor/component-name      # Code refactoring
docs/update-section         # Documentation updates
```

#### Commit Message Format
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: component or area affected (optional)
Description: imperative mood, present tense

Examples:
feat(auth): add two-factor authentication
fix(api): resolve assessment submission timeout
docs(readme): update installation instructions
```

## Code Standards and Guidelines

### 1. TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Use type aliases for unions and primitives
type UserRole = 'admin' | 'recruiter' | 'candidate';
type ID = string;

// Use enums for constants
enum AssessmentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}
```

#### Error Handling
```typescript
// Create specific error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Use Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export async function getUser(id: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### 2. React Guidelines

#### Component Structure
```typescript
// Component file structure
import React, { useState, useEffect } from 'react';
import { Button, Card } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { AssessmentService } from '../services/AssessmentService';
import type { Assessment } from '../types/assessment';

interface AssessmentCardProps {
  assessment: Assessment;
  onStart: (id: string) => void;
  className?: string;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onStart,
  className
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await AssessmentService.startAssessment(assessment.id);
      onStart(assessment.id);
    } catch (error) {
      console.error('Failed to start assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      {/* Component JSX */}
    </Card>
  );
};

export default AssessmentCard;
```

#### Custom Hooks
```typescript
// Custom hook example
export function useAssessment(assessmentId: string) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const result = await AssessmentService.getAssessment(assessmentId);
        
        if (!cancelled) {
          setAssessment(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAssessment();

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  return { assessment, loading, error };
}
```

### 3. Backend Guidelines

#### Service Layer Pattern
```typescript
// Service implementation
export class AssessmentService {
  constructor(
    private repository: AssessmentRepository,
    private logger: Logger,
    private eventBus: EventBus
  ) {}

  async createAssessment(
    data: CreateAssessmentData
  ): Promise<Assessment> {
    // Validation
    await this.validateAssessmentData(data);

    // Business logic
    const assessment = this.buildAssessment(data);

    // Persistence
    const savedAssessment = await this.repository.save(assessment);

    // Events
    await this.eventBus.publish(
      new AssessmentCreatedEvent(savedAssessment.id)
    );

    // Logging
    this.logger.info('Assessment created', {
      assessmentId: savedAssessment.id,
      companyId: data.companyId
    });

    return savedAssessment;
  }

  private async validateAssessmentData(
    data: CreateAssessmentData
  ): Promise<void> {
    const schema = Joi.object({
      title: Joi.string().required().min(1).max(200),
      companyId: Joi.string().required(),
      questions: Joi.array().items(Joi.string()).min(1).required()
    });

    const { error } = schema.validate(data);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
  }
}
```

#### API Route Pattern
```typescript
// Route handler implementation
export const assessmentRoutes = Router();

assessmentRoutes.post('/',
  authenticateUser,
  validateRequest(createAssessmentSchema),
  requirePermission('assessments', 'create'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const assessment = await assessmentService.createAssessment({
        ...req.body,
        createdBy: req.user!.uid
      });

      res.status(201).json({
        success: true,
        data: assessment
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### 4. CSS and Styling Guidelines

#### Material-UI Theming
```typescript
// Theme configuration
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});
```

#### Component Styling
```typescript
// Use emotion/styled for custom styling
import styled from '@emotion/styled';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));
```

## Testing Strategy

### 1. Unit Testing

#### Frontend Testing with Vitest
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AssessmentCard } from './AssessmentCard';

const mockAssessment = {
  id: 'test-123',
  title: 'React Developer Assessment',
  description: 'Test your React skills',
  timeLimit: 60,
};

describe('AssessmentCard', () => {
  it('renders assessment title', () => {
    render(
      <AssessmentCard 
        assessment={mockAssessment} 
        onStart={vi.fn()} 
      />
    );
    
    expect(screen.getByText('React Developer Assessment')).toBeInTheDocument();
  });

  it('calls onStart when start button is clicked', () => {
    const mockOnStart = vi.fn();
    
    render(
      <AssessmentCard 
        assessment={mockAssessment} 
        onStart={mockOnStart} 
      />
    );
    
    fireEvent.click(screen.getByText('Start Assessment'));
    
    expect(mockOnStart).toHaveBeenCalledWith('test-123');
  });
});
```

#### Backend Testing with Jest
```typescript
// Service test example
import { AssessmentService } from '../AssessmentService';
import { MockAssessmentRepository } from '../../test/mocks';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mockRepository: MockAssessmentRepository;

  beforeEach(() => {
    mockRepository = new MockAssessmentRepository();
    service = new AssessmentService(mockRepository);
  });

  describe('createAssessment', () => {
    it('creates assessment with valid data', async () => {
      const data = {
        title: 'Test Assessment',
        companyId: 'company-123',
        questions: ['q1', 'q2']
      };

      const result = await service.createAssessment(data);

      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Assessment');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(data)
      );
    });

    it('throws validation error for invalid data', async () => {
      const data = {
        title: '',
        companyId: 'company-123',
        questions: []
      };

      await expect(service.createAssessment(data))
        .rejects
        .toThrow('Title is required');
    });
  });
});
```

### 2. Integration Testing

```typescript
// API integration test
import { request } from 'supertest';
import { app } from '../app';
import { setupTestDatabase, cleanupTestDatabase } from '../test/setup';

describe('Assessment API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/assessments', () => {
    it('creates assessment with valid token', async () => {
      const token = await getTestAuthToken();
      
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Assessment',
          companyId: 'company-123',
          questions: ['q1', 'q2']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Assessment');
    });
  });
});
```

### 3. End-to-End Testing

```typescript
// E2E test with Playwright
import { test, expect } from '@playwright/test';

test.describe('Assessment Flow', () => {
  test('candidate can complete assessment', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'candidate@test.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    // Navigate to assessment
    await page.click('[data-testid=available-assessments]');
    await page.click('[data-testid=start-assessment-button]');

    // Complete assessment
    await expect(page.locator('[data-testid=question-1]')).toBeVisible();
    await page.fill('[data-testid=answer-input]', 'function solution() { return true; }');
    await page.click('[data-testid=submit-answer]');

    // Verify completion
    await expect(page.locator('[data-testid=assessment-completed]')).toBeVisible();
  });
});
```

### 4. Test Data Management

```typescript
// Test data factory
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email: 'test@example.com',
      role: 'candidate',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createAssessment(overrides: Partial<Assessment> = {}): Assessment {
    return {
      id: 'assessment-' + Math.random().toString(36).substr(2, 9),
      title: 'Test Assessment',
      companyId: 'company-123',
      questions: ['q1', 'q2'],
      timeLimit: 60,
      status: 'active',
      createdAt: new Date(),
      ...overrides
    };
  }
}
```

## API Development

### 1. RESTful API Design

#### Endpoint Naming Conventions
```
GET    /api/assessments          # List assessments
POST   /api/assessments          # Create assessment
GET    /api/assessments/{id}     # Get assessment
PUT    /api/assessments/{id}     # Update assessment
DELETE /api/assessments/{id}     # Delete assessment

GET    /api/assessments/{id}/results    # Get assessment results
POST   /api/assessments/{id}/start      # Start assessment
POST   /api/assessments/{id}/submit     # Submit assessment
```

#### Request/Response Format
```typescript
// Standard API response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationInfo;
    timestamp: string;
    requestId: string;
  };
}

// Error response format
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 2. Input Validation

```typescript
// Joi validation schemas
const createAssessmentSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().optional().max(1000),
  companyId: Joi.string().required(),
  questions: Joi.array().items(Joi.string()).min(1).required(),
  timeLimit: Joi.number().integer().min(1).max(180).default(60),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium')
});

// Validation middleware
export function validateRequest(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.details
        }
      });
    }
    
    req.body = value;
    next();
  };
}
```

### 3. Authentication and Authorization

```typescript
// Authentication middleware
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token required'
      }
    });
  }
}

// Authorization middleware
export function requirePermission(resource: string, action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const hasPermission = await checkUserPermission(
      req.user!,
      resource,
      action,
      req.params
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Insufficient permissions for ${action} on ${resource}`
        }
      });
    }

    next();
  };
}
```

## Frontend Development

### 1. Component Development

#### Component Structure
```typescript
// Complete component example
import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Assessment } from '../types/assessment';
import { useAssessment } from '../hooks/useAssessment';
import { formatDuration } from '../utils/time';

const StyledCard = styled(Card)(({ theme }) => ({
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

interface AssessmentCardProps {
  assessmentId: string;
  onStart: (id: string) => void;
  className?: string;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessmentId,
  onStart,
  className
}) => {
  const { assessment, loading, error } = useAssessment(assessmentId);
  const [starting, setStarting] = useState(false);

  const handleStart = useCallback(async () => {
    setStarting(true);
    try {
      await onStart(assessmentId);
    } finally {
      setStarting(false);
    }
  }, [assessmentId, onStart]);

  if (loading) {
    return (
      <StyledCard className={className}>
        <CardContent>
          <CircularProgress />
        </CardContent>
      </StyledCard>
    );
  }

  if (error || !assessment) {
    return (
      <StyledCard className={className}>
        <CardContent>
          <Typography color="error">
            Failed to load assessment
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard className={className}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {assessment.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {assessment.description}
        </Typography>
        <Typography variant="caption">
          Time Limit: {formatDuration(assessment.timeLimit)}
        </Typography>
      </CardContent>
      <CardContent>
        <Button
          variant="contained"
          fullWidth
          onClick={handleStart}
          disabled={starting}
        >
          {starting ? 'Starting...' : 'Start Assessment'}
        </Button>
      </CardContent>
    </StyledCard>
  );
};

export default AssessmentCard;
```

### 2. State Management

#### Zustand Store
```typescript
// Store definition
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uid: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

#### React Query Integration
```typescript
// API queries with React Query
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AssessmentService } from '../services/AssessmentService';

export function useAssessments(companyId: string) {
  return useQuery(
    ['assessments', companyId],
    () => AssessmentService.getAssessments({ companyId }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation(AssessmentService.createAssessment, {
    onSuccess: (newAssessment) => {
      // Invalidate and refetch assessments
      queryClient.invalidateQueries(['assessments']);
      
      // Add the new assessment to the cache
      queryClient.setQueryData(
        ['assessment', newAssessment.id],
        newAssessment
      );
    },
  });
}
```

### 3. Routing and Navigation

```typescript
// App routing configuration
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="assessments/:id" element={<AssessmentDetailPage />} />
          <Route path="assessments/:id/take" element={<TakeAssessmentPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute 
            isAuthenticated={isAuthenticated}
            requiredRole="admin"
          >
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="companies" element={<CompanyManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Database Development

### 1. Firestore Best Practices

#### Document Structure
```typescript
// Optimize document structure for queries
interface Assessment {
  id: string;
  title: string;
  companyId: string;         // For company isolation
  status: 'draft' | 'active' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Denormalized data for performance
  questionCount: number;
  completionCount: number;
  averageScore: number;
  
  // References to subcollections
  questions: string[];       // Question IDs
  
  // Settings
  settings: {
    timeLimit: number;
    difficulty: 'easy' | 'medium' | 'hard';
    allowRetakes: boolean;
  };
}

// Subcollection for detailed data
interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  candidateId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  status: 'in_progress' | 'completed' | 'expired';
  
  // Answers stored as subcollection for performance
  // /assessment-attempts/{id}/answers/{questionId}
}
```

#### Query Optimization
```typescript
// Repository pattern for data access
export class AssessmentRepository {
  constructor(private db: Firestore) {}

  async getActiveAssessmentsByCompany(
    companyId: string,
    limit: number = 20,
    cursor?: DocumentSnapshot
  ): Promise<PaginatedResult<Assessment>> {
    let query = this.db
      .collection('assessments')
      .where('companyId', '==', companyId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    
    return {
      data: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assessment)),
      hasMore: snapshot.docs.length === limit,
      nextCursor: snapshot.docs[snapshot.docs.length - 1]
    };
  }

  async batchGetAssessments(ids: string[]): Promise<Assessment[]> {
    if (ids.length === 0) return [];
    
    // Firestore has a limit of 10 documents per batch
    const chunks = this.chunkArray(ids, 10);
    const promises = chunks.map(chunk =>
      this.db.getAll(...chunk.map(id => 
        this.db.collection('assessments').doc(id)
      ))
    );

    const snapshots = await Promise.all(promises);
    
    return snapshots
      .flat()
      .filter(snap => snap.exists)
      .map(snap => ({ id: snap.id, ...snap.data() } as Assessment));
  }
}
```

### 2. Database Migrations

```typescript
// Migration script example
export class Migration20240101_AddAssessmentSettings {
  async up(db: Firestore): Promise<void> {
    const batch = db.batch();
    const assessments = await db.collection('assessments').get();

    assessments.docs.forEach(doc => {
      const ref = doc.ref;
      batch.update(ref, {
        'settings.allowRetakes': false,
        'settings.randomizeQuestions': true,
        migrationVersion: '20240101'
      });
    });

    await batch.commit();
    console.log(`Updated ${assessments.size} assessments`);
  }

  async down(db: Firestore): Promise<void> {
    const batch = db.batch();
    const assessments = await db.collection('assessments')
      .where('migrationVersion', '==', '20240101')
      .get();

    assessments.docs.forEach(doc => {
      const ref = doc.ref;
      batch.update(ref, {
        'settings.allowRetakes': FieldValue.delete(),
        'settings.randomizeQuestions': FieldValue.delete(),
        migrationVersion: FieldValue.delete()
      });
    });

    await batch.commit();
  }
}
```

### 3. Security Rules Development

```javascript
// Firestore security rules testing
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return isAuthenticated() && 
             request.auth.token.role == role;
    }
    
    function isCompanyMember(companyId) {
      return isAuthenticated() && 
             (request.auth.token.companyId == companyId ||
              hasRole('admin'));
    }

    // Assessment access rules
    match /assessments/{assessmentId} {
      allow read: if isAuthenticated() && 
        (isCompanyMember(resource.data.companyId) ||
         resource.data.candidateId == request.auth.uid);
         
      allow create, update: if isAuthenticated() &&
        isCompanyMember(request.resource.data.companyId) &&
        hasRole('recruiter') || hasRole('admin');
        
      allow delete: if hasRole('admin');
    }
  }
}
```

## Security Guidelines

### 1. Input Validation and Sanitization

```typescript
// XSS prevention
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

// SQL injection prevention (for external databases)
export function sanitizeSQL(query: string, params: any[]): string {
  // Use parameterized queries
  return query.replace(/\?/g, () => {
    const param = params.shift();
    return typeof param === 'string' ? 
      `'${param.replace(/'/g, "''")}'` : 
      String(param);
  });
}
```

### 2. Authentication Security

```typescript
// Secure token handling
export class TokenManager {
  private static readonly TOKEN_EXPIRY = 3600; // 1 hour
  private static readonly REFRESH_THRESHOLD = 300; // 5 minutes

  static shouldRefreshToken(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      const now = Date.now() / 1000;
      const timeToExpiry = decoded.exp - now;
      
      return timeToExpiry < this.REFRESH_THRESHOLD;
    } catch {
      return true;
    }
  }

  static async refreshToken(refreshToken: string): Promise<string> {
    // Implement secure token refresh
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const { token } = await response.json();
    return token;
  }
}
```

### 3. Data Encryption

```typescript
// Client-side encryption for sensitive data
export class EncryptionService {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptData(
    data: string,
    key: CryptoKey
  ): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    return { encrypted, iv };
  }

  static async decryptData(
    encrypted: ArrayBuffer,
    iv: Uint8Array,
    key: CryptoKey
  ): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
```

## Performance Guidelines

### 1. Frontend Performance

#### Code Splitting
```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { CircularProgress } from '@mui/material';

const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));
const TakeAssessmentPage = lazy(() => import('./pages/TakeAssessmentPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

function App() {
  return (
    <Routes>
      <Route path="/assessments" element={
        <Suspense fallback={<CircularProgress />}>
          <AssessmentsPage />
        </Suspense>
      } />
      <Route path="/assessments/:id/take" element={
        <Suspense fallback={<CircularProgress />}>
          <TakeAssessmentPage />
        </Suspense>
      } />
    </Routes>
  );
}
```

#### Memoization
```typescript
// Component memoization
import { memo, useMemo, useCallback } from 'react';

interface ExpensiveComponentProps {
  data: LargeDataSet;
  onUpdate: (id: string, value: any) => void;
}

export const ExpensiveComponent = memo<ExpensiveComponentProps>(({
  data,
  onUpdate
}) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.items.map(item => ({
      ...item,
      calculated: expensiveCalculation(item)
    }));
  }, [data.items]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleUpdate = useCallback((id: string, value: any) => {
    onUpdate(id, value);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
});
```

### 2. Backend Performance

#### Database Query Optimization
```typescript
// Efficient batch operations
export class OptimizedAssessmentService {
  async getAssessmentsWithCandidateCounts(
    companyId: string
  ): Promise<AssessmentWithCounts[]> {
    // Single query instead of N+1 queries
    const [assessments, attempts] = await Promise.all([
      this.db.collection('assessments')
        .where('companyId', '==', companyId)
        .get(),
      this.db.collection('assessment-attempts')
        .where('companyId', '==', companyId)
        .get()
    ]);

    const attemptCounts = new Map<string, number>();
    attempts.docs.forEach(doc => {
      const data = doc.data();
      const count = attemptCounts.get(data.assessmentId) || 0;
      attemptCounts.set(data.assessmentId, count + 1);
    });

    return assessments.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      candidateCount: attemptCounts.get(doc.id) || 0
    })) as AssessmentWithCounts[];
  }
}
```

#### Caching Strategy
```typescript
// Multi-level caching
export class CachedAssessmentService {
  constructor(
    private baseService: AssessmentService,
    private memoryCache: Map<string, any>,
    private redisCache: Redis
  ) {}

  async getAssessment(id: string): Promise<Assessment> {
    // L1: Memory cache
    const memoryKey = `assessment:${id}`;
    if (this.memoryCache.has(memoryKey)) {
      return this.memoryCache.get(memoryKey);
    }

    // L2: Redis cache
    const redisKey = `assessment:${id}`;
    const cached = await this.redisCache.get(redisKey);
    if (cached) {
      const assessment = JSON.parse(cached);
      this.memoryCache.set(memoryKey, assessment);
      return assessment;
    }

    // L3: Database
    const assessment = await this.baseService.getAssessment(id);

    // Cache in both levels
    this.memoryCache.set(memoryKey, assessment);
    await this.redisCache.setex(redisKey, 3600, JSON.stringify(assessment));

    return assessment;
  }
}
```

## Deployment and Release Process

### 1. Environment Management

```bash
# Environment promotion pipeline
development → staging → production

# Development deployment
npm run build:dev
firebase use development
firebase deploy

# Staging deployment
npm run build:staging
firebase use staging
firebase deploy
npm run test:staging

# Production deployment
npm run build:prod
firebase use production
npm run deploy:prod
```

### 2. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: ellaai-production
```

### 3. Release Management

```bash
# Release process
1. Create release branch: git checkout -b release/v1.2.0
2. Update version: npm version 1.2.0
3. Create changelog: npm run changelog
4. Test thoroughly: npm run test:all
5. Create PR to main
6. Deploy to staging: npm run deploy:staging
7. User acceptance testing
8. Merge to main
9. Deploy to production: npm run deploy:prod
10. Create GitHub release
11. Monitor deployment
```

## Troubleshooting

### 1. Development Environment Issues

#### Firebase Emulator Issues
```bash
# Clear emulator data
firebase emulators:start --import=./empty-data

# Reset emulator state
rm -rf ./firebase-debug.log
rm -rf ./.firebase/

# Check port conflicts
lsof -i :4000  # Emulator UI
lsof -i :5001  # Functions
lsof -i :8080  # Firestore
lsof -i :9099  # Auth
```

#### Build Issues
```bash
# Clear all build artifacts
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run typecheck

# Verify environment variables
npm run verify:env
```

### 2. Common Runtime Errors

#### Authentication Errors
```typescript
// Debug authentication issues
export class AuthDebugger {
  static async diagnoseAuthError(error: any): Promise<void> {
    console.log('Auth Error Details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    // Check token validity
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwt.decode(token);
        console.log('Token details:', decoded);
      } catch (e) {
        console.log('Invalid token format');
      }
    }

    // Check network connectivity
    try {
      await fetch('/api/health');
      console.log('API connectivity: OK');
    } catch {
      console.log('API connectivity: FAILED');
    }
  }
}
```

#### Performance Debugging
```typescript
// Performance monitoring
export class PerformanceMonitor {
  static startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      console.log(`${label}: ${end - start}ms`);
    };
  }

  static async measureAsync<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const endTiming = this.startTiming(label);
    try {
      return await operation();
    } finally {
      endTiming();
    }
  }
}

// Usage
const result = await PerformanceMonitor.measureAsync(
  'Fetch assessments',
  () => AssessmentService.getAssessments()
);
```

### 3. Debugging Tools

#### Development Tools Setup
```bash
# Install debugging tools
npm install -g @firebase/rules-unit-testing
npm install -g firebase-tools

# Enable debug logging
export DEBUG=firebase:*
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

#### Logging and Monitoring
```typescript
// Structured logging
export class Logger {
  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  static info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data);
  }

  static error(message: string, error?: Error, data?: any): void {
    console.error(`[ERROR] ${message}`, { error, data });
    
    // Send to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry or similar service
    }
  }
}
```

---

This developer guide provides comprehensive information for contributing to the EllaAI platform. Regular updates ensure it stays current with development practices and project evolution.