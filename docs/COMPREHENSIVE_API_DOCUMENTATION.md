# EllaAI Platform API Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base Configuration](#base-configuration)
- [Common Patterns](#common-patterns)
- [Assessment Management API](#assessment-management-api)
- [Candidate Management API](#candidate-management-api)
- [Company Management API](#company-management-api)
- [Authentication API](#authentication-api)
- [Admin API](#admin-api)
- [Proctoring API](#proctoring-api)
- [Analytics API](#analytics-api)
- [Code Execution API](#code-execution-api)
- [Support API](#support-api)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [SDK and Integration Examples](#sdk-and-integration-examples)

## Overview

The EllaAI Platform API is a comprehensive RESTful API that enables complete integration with the EllaAI technical assessment platform. Built on Firebase Cloud Functions with Express.js, it provides secure, scalable access to all platform features.

### API Characteristics

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON-First**: All requests and responses use JSON format
- **JWT Authentication**: Secure token-based authentication
- **Multi-Tenant**: Secure data isolation between organizations
- **Real-Time**: WebSocket support for live updates
- **Comprehensive**: Full CRUD operations for all resources
- **Versioned**: URL-based versioning for backward compatibility

### Current API Version

**Version**: v1.0  
**Base URL**: `https://api.ellaai.com/v1`  
**Status**: Production Ready

## Authentication

### Authentication Methods

The API supports multiple authentication methods:

1. **Firebase ID Token** (Primary for web/mobile clients)
2. **Custom JWT Token** (For server-to-server integration)
3. **API Key** (For limited access scenarios)

### Firebase Authentication Flow

```http
POST /api/auth/login
Content-Type: application/json

{
  "idToken": "firebase_id_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "uid": "user123",
      "email": "user@example.com",
      "role": "recruiter",
      "companyId": "company123",
      "permissions": ["assessments:create", "candidates:read"]
    }
  }
}
```

### Using the Token

Include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### Role-Based Access Control

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrator | Full system access |
| `ella_recruiter` | EllaAI support staff | Multi-tenant support access |
| `recruiter` | Company recruiter | Company-scoped access |
| `hiring_manager` | Hiring manager | Limited company access |
| `candidate` | Assessment candidate | Own data only |

## Base Configuration

### Environment URLs

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| Production | `https://api.ellaai.com/v1` | Live production API |
| Staging | `https://staging-api.ellaai.com/v1` | Pre-production testing |
| Development | `http://localhost:5001/ellaai-dev/us-central1/api` | Local development |

### Standard Headers

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-Request-ID: <UNIQUE_REQUEST_ID>
X-Client-Version: <CLIENT_VERSION>
```

### Response Format

All API responses follow this standard format:

```typescript
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
    version: string;
  };
}
```

## Common Patterns

### Pagination

Cursor-based pagination for optimal performance:

```http
GET /api/assessments?limit=20&cursor=eyJjcmVhdGVkQXQi...
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "limit": 20,
      "hasNext": true,
      "nextCursor": "eyJjcmVhdGVkQXQi...",
      "previousCursor": "eyJjcmVhdGVkQXQi..."
    }
  }
}
```

### Filtering and Sorting

```http
GET /api/assessments?companyId=company123&status=active&sort=createdAt:desc
```

### Batch Operations

```http
POST /api/assessments/batch
Content-Type: application/json

{
  "operations": [
    {
      "action": "create",
      "data": { "title": "Assessment 1", ... }
    },
    {
      "action": "update",
      "id": "assessment123",
      "data": { "status": "archived" }
    }
  ]
}
```

## Assessment Management API

### Create Assessment

Creates a new technical assessment.

```http
POST /api/assessments
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "title": "Senior React Developer Assessment",
  "description": "Comprehensive React.js evaluation",
  "companyId": "company123",
  "positionId": "position456",
  "questions": ["q1", "q2", "q3"],
  "timeLimit": 90,
  "difficulty": "medium",
  "skills": ["react", "javascript", "typescript"],
  "settings": {
    "allowRetakes": false,
    "randomizeQuestions": true,
    "showResults": true,
    "proctoringEnabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assessment_abc123",
    "title": "Senior React Developer Assessment",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "questionCount": 3,
    "estimatedDuration": 90
  }
}
```

### List Assessments

Retrieves a paginated list of assessments with filtering options.

```http
GET /api/assessments?companyId=company123&status=active&limit=20&cursor=xyz
```

**Query Parameters:**
- `companyId` (string): Filter by company
- `status` (string): Filter by status (draft, active, archived)
- `difficulty` (string): Filter by difficulty level
- `positionId` (string): Filter by position
- `limit` (number): Number of results (max 100, default 20)
- `cursor` (string): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "assessment_abc123",
      "title": "Senior React Developer",
      "description": "React.js assessment",
      "companyId": "company123",
      "status": "active",
      "difficulty": "medium",
      "timeLimit": 90,
      "questionCount": 5,
      "completionCount": 23,
      "averageScore": 78.5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "limit": 20,
      "hasNext": true,
      "nextCursor": "eyJjcmVhdGVkQXQi..."
    }
  }
}
```

### Get Assessment Details

Retrieves detailed information about a specific assessment.

```http
GET /api/assessments/assessment_abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assessment_abc123",
    "title": "Senior React Developer",
    "description": "Comprehensive React.js evaluation",
    "companyId": "company123",
    "positionId": "position456",
    "status": "active",
    "difficulty": "medium",
    "timeLimit": 90,
    "questions": [
      {
        "id": "q1",
        "type": "coding",
        "title": "Implement React Hook",
        "difficulty": "medium",
        "points": 50,
        "timeLimit": 30
      },
      {
        "id": "q2",
        "type": "multiple_choice",
        "title": "React Lifecycle Methods",
        "difficulty": "easy",
        "points": 25,
        "timeLimit": 5
      }
    ],
    "settings": {
      "allowRetakes": false,
      "randomizeQuestions": true,
      "showResults": true,
      "proctoringEnabled": true
    },
    "analytics": {
      "totalAttempts": 25,
      "completedAttempts": 23,
      "averageScore": 78.5,
      "averageTimeSpent": 82,
      "completionRate": 0.92
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

### Update Assessment

Updates an existing assessment.

```http
PUT /api/assessments/assessment_abc123
Content-Type: application/json

{
  "title": "Updated Assessment Title",
  "timeLimit": 120,
  "settings": {
    "allowRetakes": true
  }
}
```

### Start Assessment Attempt

Initiates an assessment attempt for a candidate.

```http
POST /api/assessments/assessment_abc123/start
Content-Type: application/json

{
  "candidateId": "candidate789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt_xyz789",
    "assessmentId": "assessment_abc123",
    "candidateId": "candidate789",
    "startedAt": "2024-01-20T09:00:00Z",
    "expiresAt": "2024-01-20T10:30:00Z",
    "timeRemaining": 5400,
    "status": "in_progress",
    "currentQuestionIndex": 0,
    "questions": [
      {
        "id": "q1",
        "type": "coding",
        "title": "Implement React Hook",
        "description": "Create a custom hook that manages local storage state...",
        "timeLimit": 30,
        "points": 50,
        "template": "function useLocalStorage(key, initialValue) {\n  // Your implementation here\n}"
      }
    ]
  }
}
```

### Submit Answer

Submits an answer for a specific question.

```http
POST /api/assessments/assessment_abc123/submit-answer
Content-Type: application/json

{
  "attemptId": "attempt_xyz789",
  "questionId": "q1",
  "answer": "function useLocalStorage(key, initialValue) {\n  const [value, setValue] = useState(() => {\n    const item = localStorage.getItem(key);\n    return item ? JSON.parse(item) : initialValue;\n  });\n\n  const setStoredValue = (value) => {\n    setValue(value);\n    localStorage.setItem(key, JSON.stringify(value));\n  };\n\n  return [value, setStoredValue];\n}",
  "timeSpent": 1800
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questionId": "q1",
    "status": "submitted",
    "score": 45,
    "maxScore": 50,
    "feedback": "Excellent implementation! Consider adding error handling for invalid JSON.",
    "nextQuestionId": "q2",
    "progressPercentage": 20
  }
}
```

### Complete Assessment

Finalizes an assessment attempt.

```http
POST /api/assessments/assessment_abc123/complete
Content-Type: application/json

{
  "attemptId": "attempt_xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt_xyz789",
    "submittedAt": "2024-01-20T10:15:00Z",
    "status": "completed",
    "totalScore": 168,
    "maxScore": 200,
    "percentage": 84,
    "timeSpent": 4500,
    "breakdown": {
      "q1": { "score": 45, "maxScore": 50 },
      "q2": { "score": 23, "maxScore": 25 },
      "q3": { "score": 100, "maxScore": 125 }
    },
    "ranking": "top_10_percent"
  }
}
```

## Candidate Management API

### Create Candidate

Creates a new candidate profile.

```http
POST /api/candidates
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyId": "company123",
  "positionId": "position456",
  "profile": {
    "phone": "+1-555-123-4567",
    "linkedIn": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe",
    "experience": 5,
    "skills": ["react", "javascript", "typescript", "node.js"],
    "resume": "resume_file_url",
    "location": "San Francisco, CA"
  },
  "source": "linkedin",
  "referredBy": "recruiter@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "candidate_def456",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "invited",
    "inviteToken": "invite_token_here",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### List Candidates

Retrieves candidates with filtering and search capabilities.

```http
GET /api/candidates?companyId=company123&status=invited&search=john&limit=20
```

**Query Parameters:**
- `companyId` (string): Filter by company
- `positionId` (string): Filter by position
- `status` (string): Filter by status (invited, started, completed, reviewed)
- `search` (string): Search by name or email
- `skills` (array): Filter by skills
- `experienceMin` (number): Minimum years of experience
- `experienceMax` (number): Maximum years of experience

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate_def456",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "completed",
      "profile": {
        "experience": 5,
        "skills": ["react", "javascript"],
        "location": "San Francisco, CA"
      },
      "assessments": [
        {
          "id": "assessment_abc123",
          "title": "React Developer Assessment",
          "status": "completed",
          "score": 84,
          "completedAt": "2024-01-20T10:15:00Z"
        }
      ],
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### Get Candidate Details

Retrieves detailed candidate information including assessment history.

```http
GET /api/candidates/candidate_def456
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "candidate_def456",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "completed",
    "companyId": "company123",
    "positionId": "position456",
    "profile": {
      "phone": "+1-555-123-4567",
      "linkedIn": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe",
      "experience": 5,
      "skills": ["react", "javascript", "typescript", "node.js"],
      "resume": "resume_file_url",
      "location": "San Francisco, CA"
    },
    "assessments": [
      {
        "id": "assessment_abc123",
        "title": "React Developer Assessment",
        "status": "completed",
        "score": 84,
        "maxScore": 100,
        "timeSpent": 4500,
        "startedAt": "2024-01-20T09:00:00Z",
        "completedAt": "2024-01-20T10:15:00Z",
        "breakdown": {
          "technical": 88,
          "problemSolving": 82,
          "codeQuality": 86
        }
      }
    ],
    "notes": [
      {
        "id": "note1",
        "content": "Strong React skills, good problem-solving approach",
        "author": "recruiter@company.com",
        "createdAt": "2024-01-20T11:00:00Z"
      }
    ],
    "tags": ["senior", "react-expert", "remote-friendly"],
    "source": "linkedin",
    "referredBy": "recruiter@company.com",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-20T11:00:00Z"
  }
}
```

### Send Assessment Invitation

Sends an assessment invitation to a candidate.

```http
POST /api/candidates/candidate_def456/invite
Content-Type: application/json

{
  "assessmentId": "assessment_abc123",
  "message": "Hi John, please complete this React assessment for the Senior Developer position.",
  "dueDate": "2024-01-25T23:59:59Z",
  "reminderSchedule": {
    "enabled": true,
    "intervals": ["1_day", "1_hour"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitationId": "invitation_ghi789",
    "inviteLink": "https://assess.ellaai.com/take/abc123?token=invite_token",
    "sentAt": "2024-01-15T12:00:00Z",
    "expiresAt": "2024-01-25T23:59:59Z",
    "status": "sent"
  }
}
```

### Update Candidate Status

Updates a candidate's status and adds notes.

```http
PATCH /api/candidates/candidate_def456
Content-Type: application/json

{
  "status": "reviewed",
  "notes": "Excellent technical skills, moving to next round",
  "tags": ["finalist", "technical-strong"],
  "rating": 4.5
}
```

## Company Management API

### Create Company

Creates a new company account (admin only).

```http
POST /api/companies
Content-Type: application/json

{
  "name": "TechCorp Inc.",
  "email": "admin@techcorp.com",
  "domain": "techcorp.com",
  "plan": "enterprise",
  "settings": {
    "maxAssessments": 500,
    "maxCandidates": 5000,
    "customBranding": true,
    "ssoEnabled": true,
    "apiAccess": true
  },
  "billing": {
    "address": {
      "street": "123 Tech Street",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "US"
    },
    "paymentMethod": "stripe_payment_method_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company_jkl012",
    "name": "TechCorp Inc.",
    "domain": "techcorp.com",
    "plan": "enterprise",
    "status": "active",
    "apiKey": "ellaai_ak_1234567890abcdef",
    "createdAt": "2024-01-15T08:00:00Z",
    "setupComplete": false
  }
}
```

### List Companies

Retrieves companies (admin access required).

```http
GET /api/companies?status=active&plan=enterprise&limit=50
```

### Get Company Details

Retrieves detailed company information.

```http
GET /api/companies/company_jkl012
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company_jkl012",
    "name": "TechCorp Inc.",
    "email": "admin@techcorp.com",
    "domain": "techcorp.com",
    "plan": "enterprise",
    "status": "active",
    "settings": {
      "maxAssessments": 500,
      "maxCandidates": 5000,
      "customBranding": true,
      "ssoEnabled": true
    },
    "usage": {
      "assessments": 45,
      "candidates": 324,
      "monthlyInvites": 89,
      "storageUsed": "2.3GB"
    },
    "billing": {
      "nextBillingDate": "2024-02-15T00:00:00Z",
      "lastPayment": {
        "amount": 299.00,
        "date": "2024-01-15T00:00:00Z",
        "status": "paid"
      }
    },
    "members": [
      {
        "userId": "user123",
        "email": "admin@techcorp.com",
        "role": "admin",
        "joinedAt": "2024-01-15T08:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  }
}
```

### Add Company Member

Adds a new member to a company.

```http
POST /api/companies/company_jkl012/members
Content-Type: application/json

{
  "email": "recruiter@techcorp.com",
  "role": "recruiter",
  "permissions": ["assessments:create", "candidates:manage"],
  "sendInvitation": true
}
```

### Update Company Settings

Updates company configuration.

```http
PATCH /api/companies/company_jkl012
Content-Type: application/json

{
  "settings": {
    "customBranding": true,
    "logoUrl": "https://techcorp.com/logo.png",
    "primaryColor": "#1976d2",
    "emailNotifications": true
  }
}
```

## Authentication API

### Login

Authenticates a user and returns JWT tokens.

```http
POST /api/auth/login
Content-Type: application/json

{
  "idToken": "firebase_id_token_here"
}
```

### Logout

Invalidates the current session.

```http
POST /api/auth/logout
Content-Type: application/json

{
  "token": "jwt_token_to_invalidate"
}
```

### Refresh Token

Refreshes an expired JWT token.

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### Verify Token

Verifies token validity (useful for client-side checks).

```http
GET /api/auth/verify
Authorization: Bearer <JWT_TOKEN>
```

### Get Current User

Retrieves current user information.

```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "email": "user@techcorp.com",
    "role": "recruiter",
    "companyId": "company_jkl012",
    "permissions": ["assessments:create", "candidates:manage"],
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": "https://example.com/avatar.jpg",
      "timezone": "America/New_York"
    },
    "lastLoginAt": "2024-01-20T09:00:00Z",
    "createdAt": "2024-01-15T08:30:00Z"
  }
}
```

## Admin API

### Get System Stats

Retrieves system-wide statistics (admin only).

```http
GET /api/admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "active": 1100,
      "newThisMonth": 85
    },
    "companies": {
      "total": 45,
      "active": 42,
      "newThisMonth": 3
    },
    "assessments": {
      "total": 890,
      "active": 320,
      "completedThisMonth": 1250
    },
    "candidates": {
      "total": 5420,
      "activeThisMonth": 890
    },
    "performance": {
      "avgResponseTime": 145,
      "errorRate": 0.02,
      "uptime": 99.9
    }
  }
}
```

### Audit Logs

Retrieves system audit logs.

```http
GET /api/admin/audit?startDate=2024-01-01&endDate=2024-01-31&action=USER_LOGIN&limit=100
```

### User Management

```http
# List all users
GET /api/admin/users

# Update user role
PUT /api/admin/users/user123/role
{
  "role": "admin",
  "permissions": ["*"]
}

# Suspend user
POST /api/admin/users/user123/suspend
{
  "reason": "Policy violation",
  "duration": "30_days"
}
```

### System Configuration

```http
# Update system settings
PUT /api/admin/config
{
  "maintenanceMode": false,
  "maxFileSize": 10485760,
  "allowedDomains": ["@techcorp.com", "@trusted-partner.com"]
}
```

## Proctoring API

### Create Proctoring Session

Initializes a proctoring session for an assessment.

```http
POST /api/proctor/sessions
Content-Type: application/json

{
  "assessmentId": "assessment_abc123",
  "candidateId": "candidate_def456",
  "settings": {
    "recordVideo": true,
    "recordScreen": true,
    "detectFaceMovement": true,
    "blockNavigation": true,
    "lockdownBrowser": false,
    "aiMonitoring": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "proctor_session_mno345",
    "token": "proctoring_jwt_token",
    "webrtcConfig": {
      "iceServers": [
        {
          "urls": "stun:stun.ellaai.com:3478"
        },
        {
          "urls": "turn:turn.ellaai.com:3478",
          "username": "user",
          "credential": "pass"
        }
      ]
    },
    "permissions": {
      "camera": true,
      "microphone": true,
      "screen": true
    },
    "expiresAt": "2024-01-20T12:00:00Z"
  }
}
```

### Get Proctoring Session

Retrieves proctoring session details and events.

```http
GET /api/proctor/sessions/proctor_session_mno345
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "proctor_session_mno345",
    "assessmentId": "assessment_abc123",
    "candidateId": "candidate_def456",
    "status": "active",
    "startedAt": "2024-01-20T09:00:00Z",
    "settings": {
      "recordVideo": true,
      "recordScreen": true,
      "detectFaceMovement": true,
      "blockNavigation": true
    },
    "events": [
      {
        "id": "event1",
        "type": "face_not_detected",
        "timestamp": "2024-01-20T09:15:00Z",
        "severity": "warning",
        "data": {
          "duration": 5000,
          "confidence": 0.85
        }
      },
      {
        "id": "event2",
        "type": "multiple_faces_detected",
        "timestamp": "2024-01-20T09:30:00Z",
        "severity": "high",
        "data": {
          "faceCount": 2,
          "confidence": 0.92
        }
      }
    ],
    "recordings": {
      "video": "https://storage.ellaai.com/recordings/video_xyz.mp4",
      "screen": "https://storage.ellaai.com/recordings/screen_xyz.mp4"
    },
    "riskScore": 0.3,
    "riskLevel": "low"
  }
}
```

### Report Proctoring Event

Reports a proctoring event during the session.

```http
POST /api/proctor/sessions/proctor_session_mno345/events
Content-Type: application/json

{
  "type": "tab_switch",
  "severity": "medium",
  "data": {
    "fromTab": "assessment",
    "toTab": "google.com",
    "duration": 10000
  }
}
```

### End Proctoring Session

Terminates a proctoring session.

```http
POST /api/proctor/sessions/proctor_session_mno345/end
Content-Type: application/json

{
  "reason": "assessment_completed",
  "finalReport": true
}
```

## Analytics API

### Assessment Analytics

Get analytics for specific assessments.

```http
GET /api/analytics/assessments/assessment_abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "assessment_abc123",
    "title": "React Developer Assessment",
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "metrics": {
      "totalInvites": 45,
      "totalStarted": 38,
      "totalCompleted": 32,
      "completionRate": 0.84,
      "averageScore": 78.5,
      "averageTimeSpent": 4200,
      "dropoffRate": 0.16
    },
    "scoreDistribution": {
      "0-20": 1,
      "21-40": 2,
      "41-60": 8,
      "61-80": 15,
      "81-100": 6
    },
    "questionAnalytics": [
      {
        "questionId": "q1",
        "title": "React Hooks Implementation",
        "averageScore": 82.3,
        "averageTimeSpent": 1800,
        "difficultyRating": 0.73,
        "discriminationIndex": 0.45
      }
    ],
    "trends": {
      "scoreImprovement": 0.05,
      "timeSpentTrend": -0.02,
      "completionTrend": 0.03
    }
  }
}
```

### Company Analytics

Get company-wide analytics.

```http
GET /api/analytics/companies/company_jkl012?period=last_30_days
```

### Candidate Performance Analytics

Get analytics for candidate performance across assessments.

```http
GET /api/analytics/candidates/candidate_def456
```

### Skills Analytics

Get analytics for specific skills across assessments.

```http
GET /api/analytics/skills?skills=react,javascript&companyId=company_jkl012
```

## Code Execution API

### Execute Code

Executes code in a secure sandbox environment.

```http
POST /api/execution/run
Content-Type: application/json

{
  "language": "javascript",
  "code": "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}\n\nconsole.log(fibonacci(10));",
  "testCases": [
    {
      "input": "fibonacci(0)",
      "expectedOutput": "0",
      "timeout": 1000
    },
    {
      "input": "fibonacci(10)",
      "expectedOutput": "55",
      "timeout": 1000
    }
  ],
  "timeLimit": 5000,
  "memoryLimit": "128MB"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "exec_pqr678",
    "results": [
      {
        "testCase": 1,
        "status": "passed",
        "output": "0",
        "executionTime": 45,
        "memoryUsed": "2.1MB"
      },
      {
        "testCase": 2,
        "status": "passed",
        "output": "55",
        "executionTime": 123,
        "memoryUsed": "2.3MB"
      }
    ],
    "overallStatus": "passed",
    "totalExecutionTime": 168,
    "codeAnalysis": {
      "complexity": "O(2^n)",
      "suggestions": [
        "Consider using memoization to improve performance",
        "Add input validation for negative numbers"
      ],
      "qualityScore": 7.5
    }
  }
}
```

### Get Execution Result

Retrieves results of a previous code execution.

```http
GET /api/execution/exec_pqr678
```

### Submit Code Solution

Submits a code solution for grading.

```http
POST /api/execution/submit
Content-Type: application/json

{
  "questionId": "q1",
  "attemptId": "attempt_xyz789",
  "language": "python",
  "code": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []"
}
```

## Support API

### Start Support Session

Initiates a support session for acting as a company.

```http
POST /api/support/sessions
Content-Type: application/json

{
  "targetCompanyId": "company_jkl012",
  "reason": "User reported assessment loading issue",
  "ticketId": "SUPPORT-12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "support_session_stu901",
    "targetCompanyId": "company_jkl012",
    "ellaRecruiterId": "user123",
    "status": "active",
    "startedAt": "2024-01-20T14:00:00Z",
    "expiresAt": "2024-01-20T18:00:00Z",
    "permissions": [
      "assessments:read",
      "candidates:read",
      "support:manage"
    ]
  }
}
```

### End Support Session

Terminates an active support session.

```http
POST /api/support/sessions/support_session_stu901/end
Content-Type: application/json

{
  "resolution": "Issue resolved - cleared browser cache",
  "followUpRequired": false
}
```

### List Support Sessions

Retrieves support session history.

```http
GET /api/support/sessions?status=active&companyId=company_jkl012
```

## Webhooks

### Webhook Events

The API supports webhooks for real-time event notifications.

#### Supported Events

- `assessment.completed` - Assessment attempt completed
- `candidate.invited` - Candidate invited to assessment
- `user.created` - New user registered
- `company.created` - New company created
- `proctoring.violation` - Proctoring violation detected

#### Webhook Configuration

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/ellaai",
  "events": ["assessment.completed", "candidate.invited"],
  "secret": "your_webhook_secret"
}
```

#### Webhook Payload Example

```json
{
  "id": "webhook_event_vwx234",
  "type": "assessment.completed",
  "timestamp": "2024-01-20T10:15:00Z",
  "data": {
    "assessmentId": "assessment_abc123",
    "candidateId": "candidate_def456",
    "score": 84,
    "completedAt": "2024-01-20T10:15:00Z"
  },
  "companyId": "company_jkl012"
}
```

#### Webhook Verification

Verify webhook authenticity using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## Error Handling

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `AUTHENTICATION_REQUIRED` | Missing or invalid token | Provide valid JWT token |
| `INSUFFICIENT_PERMISSIONS` | Lack required permissions | Check user role/permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found | Verify resource ID |
| `VALIDATION_ERROR` | Request validation failed | Check request format |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before retry |
| `COMPANY_ACCESS_DENIED` | No access to company data | Verify company membership |

## Rate Limiting

### Rate Limits by Plan

| Plan | Requests/Minute | Burst Limit | Concurrent Requests |
|------|----------------|-------------|-------------------|
| Free | 60 | 10 | 5 |
| Pro | 600 | 50 | 20 |
| Enterprise | 6000 | 200 | 100 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 542
X-RateLimit-Reset: 1642689600
X-RateLimit-Retry-After: 60
```

### Rate Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  },
  "meta": {
    "retryAfter": 60,
    "limit": 600,
    "remaining": 0,
    "resetTime": "2024-01-20T10:01:00Z"
  }
}
```

## SDK and Integration Examples

### JavaScript/Node.js SDK

```javascript
const EllaAI = require('@ellaai/sdk');

const client = new EllaAI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.ellaai.com/v1'
});

// Create assessment
const assessment = await client.assessments.create({
  title: 'React Developer Assessment',
  companyId: 'company123',
  questions: ['q1', 'q2'],
  timeLimit: 90
});

// Invite candidate
const invitation = await client.candidates.invite('candidate123', {
  assessmentId: assessment.id,
  message: 'Please complete this assessment'
});

// Get results
const results = await client.assessments.getResults(assessment.id);
```

### Python SDK

```python
from ellaai import EllaAI

client = EllaAI(api_key='your_api_key')

# Create assessment
assessment = client.assessments.create(
    title='Python Developer Assessment',
    company_id='company123',
    questions=['py1', 'py2'],
    time_limit=120
)

# List candidates
candidates = client.candidates.list(
    company_id='company123',
    status='completed'
)

# Get analytics
analytics = client.analytics.get_assessment(assessment['id'])
```

### cURL Examples

```bash
# Create assessment
curl -X POST https://api.ellaai.com/v1/assessments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Full Stack Developer Assessment",
    "companyId": "company123",
    "questions": ["fs1", "fs2", "fs3"],
    "timeLimit": 120
  }'

# Get assessment results
curl -X GET https://api.ellaai.com/v1/assessments/assessment_abc123/results \
  -H "Authorization: Bearer YOUR_TOKEN"

# Invite candidate
curl -X POST https://api.ellaai.com/v1/candidates/candidate_def456/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "assessment_abc123",
    "message": "Please complete this assessment",
    "dueDate": "2024-01-30T23:59:59Z"
  }'
```

### React Integration Example

```typescript
import { useEffect, useState } from 'react';
import { EllaAIProvider, useEllaAI } from '@ellaai/react';

function AssessmentList() {
  const { assessments, loading, error } = useEllaAI();
  const [assessmentList, setAssessmentList] = useState([]);

  useEffect(() => {
    assessments.list({ companyId: 'company123' })
      .then(setAssessmentList)
      .catch(console.error);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {assessmentList.map(assessment => (
        <div key={assessment.id}>
          <h3>{assessment.title}</h3>
          <p>Completed: {assessment.completionCount}</p>
          <p>Average Score: {assessment.averageScore}%</p>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <EllaAIProvider apiKey="your_api_key">
      <AssessmentList />
    </EllaAIProvider>
  );
}
```

---

This comprehensive API documentation provides complete integration guidance for the EllaAI platform. For additional support, contact our developer support team at api-support@ellaai.com or visit our developer portal.