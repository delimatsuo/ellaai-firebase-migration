# EllaAI API Documentation

This comprehensive API documentation covers all endpoints, request/response formats, authentication, error handling, and integration examples for the EllaAI platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URLs & Environments](#base-urls--environments)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [Assessment Endpoints](#assessment-endpoints)
- [Candidate Endpoints](#candidate-endpoints)
- [Company Endpoints](#company-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Proctor Endpoints](#proctor-endpoints)
- [Integration Examples](#integration-examples)
- [SDK and Libraries](#sdk-and-libraries)
- [Changelog](#changelog)

## Overview

The EllaAI API is a RESTful API that enables integration with the EllaAI assessment platform. It provides endpoints for managing assessments, candidates, companies, and administrative operations.

### API Features

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON-First**: All requests and responses use JSON format
- **Authentication**: JWT-based authentication with role-based access
- **Rate Limiting**: Built-in protection against abuse
- **Pagination**: Cursor-based pagination for large datasets
- **Versioning**: URL-based versioning for backward compatibility
- **Real-time**: WebSocket support for live updates
- **Comprehensive**: Full CRUD operations for all resources

### API Version

Current API Version: **v1**
- Stable and production-ready
- Backward compatibility guaranteed
- Deprecation notice: 6 months minimum

## Authentication

### Authentication Methods

The EllaAI API supports multiple authentication methods:

1. **JWT Bearer Token** (Primary)
2. **API Key** (For server-to-server integration)
3. **Session Cookie** (For web applications)

### JWT Authentication

All API requests must include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <JWT_TOKEN>
```

#### Obtaining JWT Token

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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "uid": "user123",
      "email": "user@example.com",
      "role": "recruiter",
      "companyId": "company123"
    }
  }
}
```

### API Key Authentication

For server-to-server integration, use API keys:

```http
X-API-Key: your_api_key_here
```

### Role-Based Access Control

The API implements role-based access control (RBAC):

- **admin**: Full system access
- **recruiter**: Company-scoped access for recruitment
- **candidate**: Limited access to own assessments
- **viewer**: Read-only access to company data

## Base URLs & Environments

### Production
```
https://api.ellaai.com/v1
```

### Staging
```
https://staging-api.ellaai.com/v1
```

### Development
```
https://dev-api.ellaai.com/v1
```

## Request/Response Format

### Standard Request Format

```http
POST /api/v1/assessments
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-Request-ID: req_123456789

{
  "title": "Senior React Developer Assessment",
  "description": "Comprehensive React.js evaluation",
  "companyId": "company123",
  "questions": ["q1", "q2", "q3"],
  "settings": {
    "timeLimit": 90,
    "difficulty": "medium"
  }
}
```

### Standard Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": "string",
    "message": "string",
    "details": object
  } | null,
  "meta": {
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "hasNext": boolean,
      "nextCursor": "string"
    } | null,
    "timestamp": "string",
    "requestId": "string",
    "version": "string"
  }
}
```

### Pagination

The API uses cursor-based pagination:

```http
GET /api/v1/assessments?limit=20&cursor=eyJjcmVhdGVkQXQi...
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "limit": 20,
      "total": 150,
      "hasNext": true,
      "nextCursor": "eyJjcmVhdGVkQXQi...",
      "previousCursor": "eyJjcmVhdGVkQXQi..."
    }
  }
}
```

## Error Handling

### HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request format
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `422` - Unprocessable Entity: Validation errors
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

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
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | Missing authentication | 401 |
| `INVALID_TOKEN` | Token expired or invalid | 401 |
| `INSUFFICIENT_PERMISSIONS` | Role lacks required permissions | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | 404 |
| `VALIDATION_ERROR` | Request validation failed | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limiting

### Rate Limits

| Tier | Requests per minute | Burst limit |
|------|-------------------|-------------|
| Free | 60 | 10 |
| Pro | 600 | 50 |
| Enterprise | 6000 | 200 |

### Rate Limit Headers

Response headers include rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and obtain JWT token.

**Request:**
```json
{
  "idToken": "firebase_id_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600,
    "user": {
      "uid": "user123",
      "email": "user@example.com",
      "role": "recruiter"
    }
  }
}
```

### POST /api/auth/refresh

Refresh expired JWT token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

### POST /api/auth/logout

Invalidate current session.

**Request:**
```json
{
  "token": "jwt_token_to_invalidate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

## Assessment Endpoints

### GET /api/assessments

List assessments with filtering and pagination.

**Query Parameters:**
- `companyId` (string): Filter by company
- `status` (string): Filter by status (draft, active, archived)
- `limit` (number): Number of results (max 100)
- `cursor` (string): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "assessment123",
      "title": "Senior React Developer",
      "description": "React.js assessment",
      "companyId": "company123",
      "status": "active",
      "questions": ["q1", "q2"],
      "settings": {
        "timeLimit": 90,
        "difficulty": "medium"
      },
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "limit": 20,
      "total": 50,
      "hasNext": true,
      "nextCursor": "cursor_string"
    }
  }
}
```

### POST /api/assessments

Create a new assessment.

**Request:**
```json
{
  "title": "Senior React Developer Assessment",
  "description": "Comprehensive React.js evaluation",
  "companyId": "company123",
  "questions": ["q1", "q2", "q3"],
  "settings": {
    "timeLimit": 90,
    "difficulty": "medium",
    "allowRetakes": false,
    "randomizeQuestions": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assessment123",
    "title": "Senior React Developer Assessment",
    "status": "draft",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/assessments/{id}

Get assessment details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assessment123",
    "title": "Senior React Developer",
    "description": "React.js assessment",
    "questions": [
      {
        "id": "q1",
        "type": "coding",
        "title": "Implement React Hook",
        "difficulty": "medium",
        "points": 50
      }
    ],
    "analytics": {
      "totalAttempts": 25,
      "averageScore": 78,
      "completionRate": 0.85
    }
  }
}
```

### PUT /api/assessments/{id}

Update assessment.

**Request:**
```json
{
  "title": "Updated Assessment Title",
  "settings": {
    "timeLimit": 120
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assessment123",
    "title": "Updated Assessment Title",
    "updatedAt": "2024-01-01T12:30:00Z"
  }
}
```

### DELETE /api/assessments/{id}

Delete assessment (soft delete).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Assessment deleted successfully"
  }
}
```

### POST /api/assessments/{id}/start

Start assessment attempt.

**Request:**
```json
{
  "candidateId": "candidate123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt123",
    "startedAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2024-01-01T13:30:00Z",
    "questions": [
      {
        "id": "q1",
        "type": "coding",
        "title": "Implement React Hook",
        "description": "Create a custom hook...",
        "timeLimit": 30
      }
    ]
  }
}
```

### POST /api/assessments/{id}/submit

Submit assessment answers.

**Request:**
```json
{
  "attemptId": "attempt123",
  "answers": [
    {
      "questionId": "q1",
      "answer": "function useCustomHook() { ... }",
      "timeSpent": 1800
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "submission123",
    "submittedAt": "2024-01-01T13:30:00Z",
    "status": "submitted",
    "score": {
      "total": 85,
      "breakdown": {
        "q1": 42.5
      }
    }
  }
}
```

## Candidate Endpoints

### GET /api/candidates

List candidates with filtering.

**Query Parameters:**
- `companyId` (string): Filter by company
- `assessmentId` (string): Filter by assessment
- `status` (string): Filter by status
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "invited",
      "companyId": "company123",
      "assessments": [
        {
          "id": "assessment123",
          "status": "pending",
          "invitedAt": "2024-01-01T12:00:00Z"
        }
      ]
    }
  ]
}
```

### POST /api/candidates

Create candidate profile.

**Request:**
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyId": "company123",
  "profile": {
    "phone": "+1234567890",
    "linkedin": "linkedin.com/in/johndoe",
    "experience": 5,
    "skills": ["React", "JavaScript", "TypeScript"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "candidate123",
    "email": "john@example.com",
    "status": "created",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/candidates/{id}

Get candidate details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "candidate123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profile": {
      "phone": "+1234567890",
      "experience": 5,
      "skills": ["React", "JavaScript"]
    },
    "assessments": [
      {
        "id": "assessment123",
        "title": "React Developer",
        "status": "completed",
        "score": 85,
        "completedAt": "2024-01-01T14:00:00Z"
      }
    ]
  }
}
```

### POST /api/candidates/{id}/invite

Send assessment invitation.

**Request:**
```json
{
  "assessmentId": "assessment123",
  "message": "Please complete this assessment",
  "dueDate": "2024-01-07T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitationId": "invite123",
    "sentAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2024-01-07T12:00:00Z"
  }
}
```

## Company Endpoints

### GET /api/companies

List companies (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "company123",
      "name": "Acme Corp",
      "email": "admin@acme.com",
      "plan": "enterprise",
      "status": "active",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/companies

Create company (admin only).

**Request:**
```json
{
  "name": "Acme Corp",
  "email": "admin@acme.com",
  "plan": "pro",
  "settings": {
    "maxAssessments": 100,
    "maxCandidates": 1000,
    "customBranding": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company123",
    "name": "Acme Corp",
    "apiKey": "api_key_here",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/companies/{id}

Get company details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company123",
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "plan": "enterprise",
    "settings": {
      "maxAssessments": 500,
      "maxCandidates": 5000
    },
    "usage": {
      "assessments": 45,
      "candidates": 320,
      "monthlyInvites": 150
    }
  }
}
```

## Admin Endpoints

### GET /api/admin/users

List all users (admin only).

**Query Parameters:**
- `role` (string): Filter by role
- `status` (string): Filter by status
- `companyId` (string): Filter by company

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uid": "user123",
      "email": "user@example.com",
      "role": "recruiter",
      "companyId": "company123",
      "status": "active",
      "lastLoginAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### PUT /api/admin/users/{uid}/role

Update user role (admin only).

**Request:**
```json
{
  "role": "admin",
  "permissions": ["manage_users", "manage_companies"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "role": "admin",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/admin/audit

Get audit logs (admin only).

**Query Parameters:**
- `userId` (string): Filter by user
- `action` (string): Filter by action type
- `dateFrom` (string): Start date (ISO 8601)
- `dateTo` (string): End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit123",
      "userId": "user123",
      "action": "assessment_created",
      "resourceId": "assessment123",
      "details": {
        "title": "React Assessment",
        "companyId": "company123"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### GET /api/admin/metrics

Get system metrics (admin only).

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
    "assessments": {
      "total": 450,
      "active": 320,
      "completedThisMonth": 1250
    },
    "companies": {
      "total": 45,
      "activeSubscriptions": 42
    },
    "performance": {
      "avgResponseTime": 145,
      "errorRate": 0.02,
      "uptime": 0.999
    }
  }
}
```

## Proctor Endpoints

### POST /api/proctor/sessions

Create proctoring session.

**Request:**
```json
{
  "assessmentId": "assessment123",
  "candidateId": "candidate123",
  "settings": {
    "recordVideo": true,
    "recordScreen": true,
    "detectFaceMovement": true,
    "blockNavigation": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session123",
    "token": "proctoring_token",
    "webrtcConfig": {
      "iceServers": [...],
      "constraints": {...}
    }
  }
}
```

### GET /api/proctor/sessions/{id}

Get proctoring session details.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session123",
    "status": "active",
    "startedAt": "2024-01-01T12:00:00Z",
    "events": [
      {
        "type": "face_not_detected",
        "timestamp": "2024-01-01T12:05:00Z",
        "severity": "warning"
      }
    ],
    "recordings": {
      "video": "recording_url",
      "screen": "screen_recording_url"
    }
  }
}
```

### POST /api/proctor/sessions/{id}/events

Report proctoring event.

**Request:**
```json
{
  "type": "face_not_detected",
  "severity": "warning",
  "data": {
    "duration": 5000,
    "timestamp": "2024-01-01T12:05:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "event123",
    "recorded": true
  }
}
```

## Integration Examples

### JavaScript/Node.js

```javascript
const EllaAI = require('@ellaai/api-client');

// Initialize client
const client = new EllaAI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.ellaai.com/v1'
});

// Create assessment
async function createAssessment() {
  try {
    const assessment = await client.assessments.create({
      title: 'React Developer Assessment',
      companyId: 'company123',
      questions: ['q1', 'q2'],
      settings: {
        timeLimit: 90,
        difficulty: 'medium'
      }
    });
    
    console.log('Assessment created:', assessment.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Invite candidate
async function inviteCandidate(candidateId, assessmentId) {
  try {
    const invitation = await client.candidates.invite(candidateId, {
      assessmentId: assessmentId,
      message: 'Please complete this assessment',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    console.log('Invitation sent:', invitation.invitationId);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Python

```python
import requests
from datetime import datetime, timedelta

class EllaAIClient:
    def __init__(self, api_key, base_url='https://api.ellaai.com/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def create_assessment(self, data):
        response = self.session.post(f'{self.base_url}/assessments', json=data)
        response.raise_for_status()
        return response.json()
    
    def get_candidates(self, company_id, **filters):
        params = {'companyId': company_id, **filters}
        response = self.session.get(f'{self.base_url}/candidates', params=params)
        response.raise_for_status()
        return response.json()

# Usage
client = EllaAIClient('your_api_key')

# Create assessment
assessment = client.create_assessment({
    'title': 'Python Developer Assessment',
    'companyId': 'company123',
    'questions': ['python_q1', 'python_q2'],
    'settings': {
        'timeLimit': 120,
        'difficulty': 'hard'
    }
})

print(f"Assessment created: {assessment['data']['id']}")
```

### cURL Examples

```bash
# Authenticate
curl -X POST https://api.ellaai.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "firebase_id_token_here"
  }'

# Create assessment
curl -X POST https://api.ellaai.com/v1/assessments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Developer Assessment",
    "companyId": "company123",
    "questions": ["q1", "q2"],
    "settings": {
      "timeLimit": 90,
      "difficulty": "medium"
    }
  }'

# Get assessment results
curl -X GET "https://api.ellaai.com/v1/assessments/assessment123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## SDK and Libraries

### Official SDKs

- **JavaScript/Node.js**: `@ellaai/api-client`
- **Python**: `ellaai-python`
- **PHP**: `ellaai/php-client`
- **Go**: `github.com/ellaai/go-client`

### Installation

```bash
# Node.js
npm install @ellaai/api-client

# Python
pip install ellaai-python

# PHP
composer require ellaai/php-client

# Go
go get github.com/ellaai/go-client
```

## Changelog

### Version 1.3.0 (2024-01-15)
- Added proctoring endpoints
- Enhanced assessment analytics
- Improved error responses
- Added batch operations support

### Version 1.2.0 (2023-12-01)
- Added real-time WebSocket support
- Enhanced candidate management
- Added custom branding options
- Improved rate limiting

### Version 1.1.0 (2023-10-15)
- Added admin endpoints
- Enhanced security features
- Added audit logging
- Improved pagination

### Version 1.0.0 (2023-09-01)
- Initial stable release
- Core assessment functionality
- Authentication system
- Basic candidate management

---

For additional support or questions about the API, contact our developer support team at api-support@ellaai.com or visit our developer portal at https://developers.ellaai.com.