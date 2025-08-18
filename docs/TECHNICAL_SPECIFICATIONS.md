# EllaAI ATS - Technical Specifications & Implementation Details

## Table of Contents
1. [Technology Stack](#1-technology-stack)
2. [Database Schema Design](#2-database-schema-design)
3. [API Specifications](#3-api-specifications)
4. [Security Implementation](#4-security-implementation)
5. [Performance Requirements](#5-performance-requirements)
6. [Integration Specifications](#6-integration-specifications)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Monitoring & Observability](#8-monitoring--observability)

---

## 1. Technology Stack

### Frontend Stack
```typescript
// Core Framework
React: ^18.2.0
TypeScript: ^5.0.0
React Router: ^6.8.0

// UI Framework  
Material-UI: ^5.11.0
Emotion: ^11.10.0
Framer Motion: ^10.0.0

// State Management
React Query: ^4.24.0
Zustand: ^4.3.0
React Hook Form: ^7.43.0

// Build & Dev Tools
Vite: ^4.1.0
ESLint: ^8.35.0
Prettier: ^2.8.0
Vitest: ^0.28.0
```

### Backend Stack
```typescript
// Runtime & Framework
Node.js: ^18.14.0
Express.js: ^4.18.0
TypeScript: ^5.0.0

// Database & Cache
Firebase Firestore: ^9.17.0
Redis: ^4.6.0
Firebase Storage: ^0.20.0

// Authentication & Security
Firebase Auth: ^9.17.0
jsonwebtoken: ^9.0.0
bcrypt: ^5.1.0
helmet: ^6.0.0

// Utilities
Zod: ^3.20.0
winston: ^3.8.0
express-rate-limit: ^6.7.0
```

### Infrastructure Stack
```yaml
# Hosting & CDN
Firebase Hosting: Web application
Firebase Functions: API endpoints
CloudFlare: CDN and DDoS protection

# Database & Storage
Firestore: Primary database
Firebase Storage: File storage
Redis Cloud: Caching layer

# Monitoring & Analytics
Google Analytics 4: User analytics
Firebase Performance: Performance monitoring
Sentry: Error tracking
LogRocket: Session replay

# CI/CD
GitHub Actions: Continuous integration
Firebase CLI: Deployment automation
```

---

## 2. Database Schema Design

### Firestore Collections Structure

#### Platform-Level Collections
```typescript
// /platform/config
interface PlatformConfig {
  features: {
    [featureName: string]: {
      enabled: boolean;
      rolloutPercentage: number;
      allowedPlans: string[];
    };
  };
  emailTemplates: {
    [templateId: string]: {
      subject: string;
      htmlBody: string;
      textBody: string;
      variables: string[];
    };
  };
  systemSettings: {
    maxCompaniesPerAdmin: number;
    sessionTimeoutMinutes: number;
    auditRetentionDays: number;
  };
}

// /companies/{companyId}
interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    branding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
    };
    features: string[];
    customDomain?: string;
  };
  billing: {
    customerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: Timestamp;
    trialEnd?: Timestamp;
  };
  usage: {
    activeUsers: number;
    assessments: number;
    candidates: number;
    storageUsed: number;
  };
}

// /users/{userId}
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'system_admin' | 'ella_recruiter' | 'company_admin' | 'company_recruiter' | 'hiring_manager' | 'candidate';
  companyId?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    timezone: string;
  };
  permissions: string[];
}
```

#### Company-Specific Collections
```typescript
// /companies/{companyId}/jobs/{jobId}
interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'active' | 'paused' | 'closed';
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary: {
    min?: number;
    max?: number;
    currency: string;
    equity?: boolean;
  };
  hiringManagerId: string;
  recruiterId: string;
  assessmentIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metrics: {
    applications: number;
    assessmentsCompleted: number;
    interviewsScheduled: number;
    offersExtended: number;
    hires: number;
  };
}

// /companies/{companyId}/assessments/{assessmentId}
interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'behavioral' | 'cognitive' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedMinutes: number;
  passingScore: number;
  status: 'draft' | 'active' | 'archived';
  questions: AssessmentQuestion[];
  scoringCriteria: {
    automated: boolean;
    rubric?: string;
    weights: {
      [questionId: string]: number;
    };
  };
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  analytics: {
    totalAttempts: number;
    completionRate: number;
    averageScore: number;
    averageTimeMinutes: number;
  };
}

interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'code_challenge' | 'essay' | 'system_design';
  title: string;
  content: string;
  options?: string[];
  correctAnswer?: string | string[];
  codeTemplate?: string;
  expectedOutput?: string;
  testCases?: TestCase[];
  maxPoints: number;
  timeLimit?: number;
}

// /companies/{companyId}/candidates/{candidateId}
interface Candidate {
  id: string;
  userId?: string; // Reference to user if they have an account
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  resume?: {
    fileUrl: string;
    parsedData?: ParsedResume;
  };
  linkedin?: string;
  github?: string;
  portfolio?: string;
  status: 'applied' | 'screening' | 'assessment' | 'interview' | 'offer' | 'hired' | 'rejected';
  jobId: string;
  source: 'career_page' | 'linkedin' | 'referral' | 'recruiter' | 'other';
  notes: CandidateNote[];
  assessmentResults: AssessmentResult[];
  interviews: Interview[];
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AssessmentResult {
  assessmentId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  status: 'not_started' | 'in_progress' | 'completed' | 'timeout';
  score?: number;
  timeSpentMinutes?: number;
  answers: {
    [questionId: string]: {
      answer: any;
      timeSpent: number;
      score?: number;
    };
  };
  aiAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
    confidence: number;
  };
}
```

#### Audit & Session Collections
```typescript
// /audit_logs/{logId}
interface AuditLog {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  companyId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId?: string;
}

// /sessions/{sessionId}
interface Session {
  id: string;
  userId: string;
  type: 'normal' | 'acting_as';
  originalUserId?: string; // For acting as sessions
  targetCompanyId?: string; // For acting as sessions
  startedAt: Timestamp;
  expiresAt: Timestamp;
  lastActivityAt: Timestamp;
  ipAddress: string;
  userAgent: string;
  status: 'active' | 'expired' | 'terminated';
  metadata: {
    reason?: string; // For acting as sessions
    customerNotified?: boolean;
    emergencyExit?: boolean;
  };
}
```

---

## 3. API Specifications

### Authentication Endpoints
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  permissions: string[];
  company?: Company;
}

// POST /api/auth/acting-as
interface ActingAsRequest {
  companyId: string;
  reason: string;
  maxDurationHours?: number;
}

interface ActingAsResponse {
  sessionId: string;
  token: string;
  expiresAt: string;
  targetCompany: Company;
}
```

### Company Management Endpoints
```typescript
// POST /api/admin/companies
interface CreateCompanyRequest {
  name: string;
  domain: string;
  industry: string;
  size: Company['size'];
  plan: Company['plan'];
  adminUser: {
    email: string;
    firstName: string;
    lastName: string;
  };
  settings?: Partial<Company['settings']>;
}

interface CreateCompanyResponse {
  company: Company;
  adminUser: User;
  temporaryPassword: string;
}

// DELETE /api/admin/companies/{companyId}
interface CloseCompanyRequest {
  reason: string;
  dataExportRequired: boolean;
  effectiveDate?: string;
}

interface CloseCompanyResponse {
  closureId: string;
  dataExportUrl?: string;
  finalBillingAmount?: number;
}
```

### Assessment Endpoints
```typescript
// POST /api/companies/{companyId}/assessments
interface CreateAssessmentRequest {
  title: string;
  description: string;
  type: Assessment['type'];
  difficulty: Assessment['difficulty'];
  estimatedMinutes: number;
  questions: AssessmentQuestion[];
  scoringCriteria: Assessment['scoringCriteria'];
}

// POST /api/assessments/{assessmentId}/submit
interface SubmitAssessmentRequest {
  answers: {
    [questionId: string]: {
      answer: any;
      timeSpent: number;
    };
  };
  totalTimeSpent: number;
}

interface SubmitAssessmentResponse {
  resultId: string;
  score?: number;
  passed: boolean;
  feedback?: string;
  nextSteps?: string;
}
```

### Candidate Pipeline Endpoints
```typescript
// GET /api/companies/{companyId}/candidates
interface GetCandidatesRequest {
  jobId?: string;
  status?: Candidate['status'];
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: 'name' | 'date' | 'score';
  order?: 'asc' | 'desc';
}

interface GetCandidatesResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
  filters: {
    statuses: { status: string; count: number }[];
    sources: { source: string; count: number }[];
    tags: { tag: string; count: number }[];
  };
}

// PATCH /api/candidates/{candidateId}/status
interface UpdateCandidateStatusRequest {
  status: Candidate['status'];
  reason?: string;
  nextAction?: string;
  scheduleInterview?: {
    type: string;
    duration: number;
    interviewers: string[];
    availableSlots: string[];
  };
}
```

---

## 4. Security Implementation

### Authentication & Authorization
```typescript
// JWT Payload Structure
interface JWTPayload {
  sub: string; // userId
  email: string;
  role: string;
  companyId?: string;
  permissions: string[];
  sessionId: string;
  actingAs?: {
    originalUserId: string;
    targetCompanyId: string;
    sessionId: string;
  };
  iat: number;
  exp: number;
}

// Permission System
enum Permission {
  // Company Management
  COMPANY_CREATE = 'company:create',
  COMPANY_READ = 'company:read',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',
  
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_IMPERSONATE = 'user:impersonate',
  
  // Assessment Management
  ASSESSMENT_CREATE = 'assessment:create',
  ASSESSMENT_READ = 'assessment:read',
  ASSESSMENT_UPDATE = 'assessment:update',
  ASSESSMENT_DELETE = 'assessment:delete',
  ASSESSMENT_TAKE = 'assessment:take',
  
  // Candidate Management
  CANDIDATE_CREATE = 'candidate:create',
  CANDIDATE_READ = 'candidate:read',
  CANDIDATE_UPDATE = 'candidate:update',
  CANDIDATE_DELETE = 'candidate:delete',
}

// Role Permission Mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  system_admin: [
    Permission.COMPANY_CREATE,
    Permission.COMPANY_READ,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,
    Permission.USER_IMPERSONATE,
    // ... all permissions
  ],
  ella_recruiter: [
    Permission.USER_IMPERSONATE,
    Permission.ASSESSMENT_CREATE,
    Permission.ASSESSMENT_READ,
    Permission.ASSESSMENT_UPDATE,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_UPDATE,
  ],
  // ... other roles
};
```

### Security Middleware
```typescript
// Rate Limiting Configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for system health checks
    return req.path === '/health';
  },
};

// Acting As Session Security
interface ActingAsSecurityConfig {
  maxDuration: number; // 4 hours in milliseconds
  idleTimeout: number; // 30 minutes in milliseconds
  requireMFA: boolean;
  auditGranularity: 'all' | 'sensitive' | 'critical';
  customerNotification: boolean;
  emergencyExitAlways: boolean;
}

// Data Encryption
interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyRotationDays: 90;
  encryptPII: boolean;
  encryptAssessmentAnswers: boolean;
  hashPasswords: boolean;
}
```

---

## 5. Performance Requirements

### Response Time Targets
```typescript
interface PerformanceTargets {
  api: {
    p50: 100, // milliseconds
    p95: 250,
    p99: 500,
  };
  pageLoad: {
    firstContentfulPaint: 1500, // milliseconds
    largestContentfulPaint: 2500,
    timeToInteractive: 3000,
  };
  assessment: {
    questionLoad: 200, // milliseconds
    submissionResponse: 500,
    resultGeneration: 2000,
  };
}

// Caching Strategy
interface CacheConfig {
  redis: {
    userSessions: { ttl: 3600 }, // 1 hour
    assessmentQuestions: { ttl: 1800 }, // 30 minutes
    companySettings: { ttl: 3600 }, // 1 hour
    candidateSearchResults: { ttl: 300 }, // 5 minutes
  };
  browser: {
    staticAssets: { maxAge: 31536000 }, // 1 year
    apiResponses: { maxAge: 300 }, // 5 minutes
    userPreferences: { maxAge: 86400 }, // 1 day
  };
}
```

### Database Optimization
```typescript
// Firestore Indexes
interface FirestoreIndexes {
  companies: [
    { fields: ['status', 'createdAt'], orders: ['createdAt:desc'] },
    { fields: ['plan', 'status'], orders: ['createdAt:desc'] },
  ];
  users: [
    { fields: ['companyId', 'role', 'status'] },
    { fields: ['email'], unique: true },
  ];
  candidates: [
    { fields: ['companyId', 'status', 'updatedAt'], orders: ['updatedAt:desc'] },
    { fields: ['companyId', 'jobId', 'status'] },
  ];
  assessments: [
    { fields: ['companyId', 'status', 'createdAt'], orders: ['createdAt:desc'] },
  ];
}

// Query Optimization Patterns
class OptimizedQueries {
  // Use pagination for large datasets
  async getCandidates(companyId: string, options: PaginationOptions) {
    return firestore
      .collection(`companies/${companyId}/candidates`)
      .where('status', 'in', options.statuses)
      .orderBy('updatedAt', 'desc')
      .limit(options.limit)
      .startAfter(options.cursor)
      .get();
  }
  
  // Use denormalized data for frequently accessed info
  async updateCandidateStatus(candidateId: string, status: string) {
    const batch = firestore.batch();
    
    // Update candidate document
    batch.update(candidateRef, { status, updatedAt: FieldValue.serverTimestamp() });
    
    // Update denormalized counter in job document
    batch.update(jobRef, {
      [`metrics.${status}`]: FieldValue.increment(1)
    });
    
    return batch.commit();
  }
}
```

---

## 6. Integration Specifications

### Calendar Integration
```typescript
// Google Calendar Integration
interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'exchange';
  
  createEvent(event: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees: string[];
    location?: string;
  }): Promise<{ eventId: string; meetingUrl?: string }>;
  
  findAvailableSlots(
    participants: string[],
    duration: number,
    timeRange: { start: Date; end: Date }
  ): Promise<{ start: Date; end: Date }[]>;
  
  scheduleInterview(
    candidateId: string,
    interviewers: string[],
    preferredSlots: Date[]
  ): Promise<{ scheduled: boolean; eventId?: string; conflictReason?: string }>;
}

// Implementation Example
class GoogleCalendarService implements CalendarIntegration {
  private calendar: calendar_v3.Calendar;
  
  async createEvent(event: CalendarEvent): Promise<CalendarEventResponse> {
    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        attendees: event.attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: uuidv4(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      conferenceDataVersion: 1,
    });
    
    return {
      eventId: response.data.id!,
      meetingUrl: response.data.hangoutLink,
    };
  }
}
```

### Email Integration
```typescript
// Email Service Interface
interface EmailService {
  sendTemplateEmail(
    templateId: string,
    to: string[],
    variables: Record<string, any>
  ): Promise<{ messageId: string; status: 'sent' | 'queued' | 'failed' }>;
  
  sendAssessmentInvitation(
    candidateEmail: string,
    assessmentId: string,
    expirationDate: Date
  ): Promise<void>;
  
  sendInterviewReminder(
    participants: string[],
    interviewDetails: InterviewDetails
  ): Promise<void>;
}

// SendGrid Implementation
class SendGridEmailService implements EmailService {
  async sendTemplateEmail(templateId: string, to: string[], variables: Record<string, any>) {
    const msg = {
      to,
      from: 'noreply@ellaai.com',
      templateId,
      dynamicTemplateData: variables,
    };
    
    const response = await sgMail.send(msg);
    return {
      messageId: response[0].headers['x-message-id'],
      status: 'sent',
    };
  }
}
```

### Webhook System
```typescript
// Webhook Configuration
interface WebhookConfig {
  url: string;
  events: WebhookEvent[];
  secret: string;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  };
  active: boolean;
}

enum WebhookEvent {
  CANDIDATE_APPLIED = 'candidate.applied',
  ASSESSMENT_COMPLETED = 'assessment.completed',
  INTERVIEW_SCHEDULED = 'interview.scheduled',
  CANDIDATE_HIRED = 'candidate.hired',
  USER_CREATED = 'user.created',
}

// Webhook Delivery System
class WebhookDeliveryService {
  async deliverWebhook(
    webhook: WebhookConfig,
    event: WebhookEvent,
    payload: any
  ): Promise<void> {
    const body = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };
    
    const signature = this.generateSignature(JSON.stringify(body), webhook.secret);
    
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EllaAI-Signature': signature,
          'X-EllaAI-Event': event,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      // Implement retry logic with exponential backoff
      await this.scheduleRetry(webhook, event, payload, 1);
    }
  }
  
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}
```

---

## 7. Deployment Architecture

### Production Environment
```yaml
# Firebase Hosting Configuration
site: ellaai-prod
public: dist
ignore:
  - firebase.json
  - "**/.*"
  - "**/node_modules/**"
rewrites:
  - source: "/api/**"
    function: api
  - source: "**"
    destination: "/index.html"
headers:
  - source: "/static/**"
    headers:
      - key: "Cache-Control"
        value: "public, max-age=31536000, immutable"
  - source: "**"
    headers:
      - key: "X-Frame-Options"
        value: "DENY"
      - key: "X-Content-Type-Options"
        value: "nosniff"

# Cloud Functions Configuration
functions:
  runtime: nodejs18
  memory: 512MB
  timeout: 60s
  env:
    NODE_ENV: production
    LOG_LEVEL: info
```

### CI/CD Pipeline
```yaml
# GitHub Actions Workflow
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
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ellaai-prod
```

### Infrastructure as Code
```typescript
// Terraform Configuration (if using multi-cloud)
const infraConfig = {
  cloudflare: {
    zone: 'ellaai.com',
    settings: {
      ssl: 'full',
      minify: {
        css: true,
        js: true,
        html: true,
      },
      caching: {
        level: 'aggressive',
        ttl: 86400,
      },
    },
  },
  monitoring: {
    uptimeChecks: [
      { url: 'https://app.ellaai.com', interval: '1m' },
      { url: 'https://api.ellaai.com/health', interval: '30s' },
    ],
    alerting: {
      channels: ['email', 'slack', 'pagerduty'],
      thresholds: {
        errorRate: 0.01,
        responseTime: 1000,
        uptime: 0.999,
      },
    },
  },
};
```

---

## 8. Monitoring & Observability

### Application Monitoring
```typescript
// Error Tracking Configuration
interface ErrorTrackingConfig {
  sentry: {
    dsn: string;
    environment: 'development' | 'staging' | 'production';
    sampleRate: number;
    tracesSampleRate: number;
    beforeSend: (event: any) => any;
  };
  customMetrics: {
    assessmentCompletions: 'counter';
    candidateApplications: 'counter';
    actingAsSessionDuration: 'histogram';
    apiResponseTime: 'histogram';
  };
}

// Performance Monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.metrics.set(`api.${endpoint}.duration`, [
      ...(this.metrics.get(`api.${endpoint}.duration`) || []),
      duration,
    ]);
    
    if (status >= 400) {
      this.incrementCounter(`api.${endpoint}.errors`);
    }
  }
  
  trackAssessmentCompletion(assessmentId: string, duration: number): void {
    this.metrics.set(`assessment.${assessmentId}.completion_time`, [
      ...(this.metrics.get(`assessment.${assessmentId}.completion_time`) || []),
      duration,
    ]);
    
    this.incrementCounter('assessment.completions');
  }
  
  private incrementCounter(metric: string): void {
    const current = this.metrics.get(metric) || [0];
    this.metrics.set(metric, [current[0] + 1]);
  }
}
```

### Health Check Endpoints
```typescript
// Health Check Implementation
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    cache: HealthStatus;
    email: HealthStatus;
    storage: HealthStatus;
  };
}

interface HealthStatus {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  error?: string;
}

class HealthCheckService {
  async performHealthCheck(): Promise<HealthCheckResponse> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkEmailService(),
      this.checkStorage(),
    ]);
    
    const [database, cache, email, storage] = checks.map(
      result => result.status === 'fulfilled' ? result.value : { status: 'fail', error: 'Check failed' }
    );
    
    const overallStatus = this.determineOverallStatus([database, cache, email, storage]);
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      uptime: process.uptime(),
      checks: { database, cache, email, storage },
    };
  }
  
  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      await firestore.collection('health').doc('check').get();
      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
```

### Logging Strategy
```typescript
// Structured Logging Configuration
interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'simple';
  outputs: ('console' | 'file' | 'remote')[];
  sampling: {
    debug: 0.1,
    info: 1.0,
    warn: 1.0,
    error: 1.0,
  };
}

// Logger Implementation
class StructuredLogger {
  constructor(private config: LogConfig) {}
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
  
  private log(level: string, message: string, metadata?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'ellaai-api',
      version: process.env.APP_VERSION,
      requestId: this.getRequestId(),
      userId: this.getUserId(),
      companyId: this.getCompanyId(),
      ...metadata,
    };
    
    // Apply sampling
    if (Math.random() > this.config.sampling[level]) {
      return;
    }
    
    console.log(JSON.stringify(logEntry));
  }
}
```

This technical specification provides the detailed implementation guidance needed to build a robust, scalable, and secure EllaAI ATS platform that meets enterprise requirements while maintaining high performance and reliability standards.