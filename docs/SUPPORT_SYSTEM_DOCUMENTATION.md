# EllaAI "Acting As" Support System Documentation

## Overview

The EllaAI "Acting As" support system enables Ella Recruiters to securely access and operate within customer company accounts for support purposes, while providing comprehensive audit trails and admin-level database modification capabilities for system administrators.

## Features

### 1. Support Session Management
- **Ella Recruiters** can start/end support sessions to act as any customer company
- **Visual indicators** in all API responses when in support mode
- **Session tracking** with detailed activity logs
- **Automatic session expiration** and cleanup

### 2. System Admin Operations
- **Database record modifications** with full audit trails
- **Advanced audit log viewing** with filtering capabilities
- **Administrative statistics** and monitoring
- **Dry-run validation** for safe operations

### 3. Security & Audit
- **Comprehensive logging** of all support and admin actions
- **Role-based access control** with granular permissions
- **Immutable audit trails** protected from modification
- **Real-time session monitoring**

## API Endpoints

### Support Session Endpoints

#### `POST /api/support/act-as`
Start acting as a customer company.

**Authorization:** `ella_recruiter` or `admin` role required

**Request Body:**
```json
{
  "targetCompanyId": "company-123",
  "reason": "Customer support request - help with assessment setup",
  "estimatedDuration": 30
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "support-session-123",
  "supportContext": {
    "isActingAs": true,
    "targetCompanyId": "company-123",
    "sessionStartTime": "2024-01-15T10:30:00Z"
  },
  "message": "Started acting as company: ACME Corp"
}
```

#### `POST /api/support/end-session`
End the current support session.

**Request Body:**
```json
{
  "sessionId": "support-session-123",
  "summary": "Helped customer set up new assessment and trained on advanced features"
}
```

#### `GET /api/support/active-sessions`
List all active support sessions (admin only).

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)

#### `GET /api/support/my-sessions`
Get current user's support session history.

#### `GET /api/support/current-session`
Get details of the current active support session.

### Admin Database Endpoints

#### `POST /api/admin/modify-record`
Modify database records with audit trail.

**Authorization:** `admin` role required

**Request Body:**
```json
{
  "collection": "companies",
  "documentId": "company-123",
  "action": "update",
  "data": {
    "name": "Updated Company Name",
    "status": "active"
  },
  "reason": "Company name correction per customer request",
  "validateOnly": false
}
```

**Supported Actions:**
- `create` - Create new document
- `update` - Update existing document
- `delete` - Delete document

**Protected Collections:**
- `audit-logs` - Cannot be modified
- `admin-actions` - Cannot be modified

#### `GET /api/admin/audit-logs`
Retrieve audit logs with filtering.

**Query Parameters:**
- `startDate` - Filter from date
- `endDate` - Filter to date
- `userId` - Filter by user
- `action` - Filter by action type
- `resource` - Filter by resource type
- `companyId` - Filter by company
- `supportSessionId` - Filter by support session
- `limit` (default: 100)
- `offset` (default: 0)

#### `GET /api/admin/actions`
View admin action history.

#### `GET /api/admin/stats`
Get administrative statistics.

## Data Models

### SupportSession
```typescript
interface SupportSession {
  id: string;
  ellaRecruiterId: string;
  ellaRecruiterEmail: string;
  targetCompanyId: string;
  targetCompanyName: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  reason: string;
  actions: SupportAction[];
  status: 'active' | 'ended';
  metadata?: {
    originalCompanyId?: string;
    originalRole?: string;
    sessionDuration?: number;
  };
}
```

### AdminAction
```typescript
interface AdminAction {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
  collection: string;
  documentId: string;
  oldData?: any;
  newData?: any;
  timestamp: Timestamp;
  reason: string;
  metadata?: {
    affectedCount?: number;
    batchOperation?: boolean;
    originalRequest?: any;
  };
}
```

### Enhanced User Interface
```typescript
interface SupportUser extends DecodedIdToken {
  role?: string;
  companyId?: string;
  companyAccess?: string[];
  supportPermissions?: {
    canActAs: boolean;
    canModifyRecords: boolean;
    allowedCompanies?: string[];
    restrictions?: string[];
  };
  supportContext?: {
    isActingAs: boolean;
    originalUserId?: string;
    supportSessionId?: string;
    targetCompanyId?: string;
    sessionStartTime?: Timestamp;
  };
}
```

## Security Implementation

### Role-Based Access Control

**Ella Recruiter (`ella_recruiter`)**
- Can start/end support sessions
- Can act as any customer company
- Cannot modify database records directly
- Cannot access admin-only endpoints

**System Admin (`admin`)**
- All Ella Recruiter permissions
- Can modify any database record
- Can view all audit logs
- Can access administrative statistics
- Can perform bulk operations

### Support Mode Restrictions

When in support mode, certain actions are restricted:
- Cannot close company accounts
- Cannot delete users
- Cannot process payments
- Cannot access other admin functions

### Audit Trail Protection

- All audit logs are immutable once created
- Support sessions cannot be deleted
- Admin actions cannot be modified
- Automatic backup of all sensitive operations

## Firestore Security Rules

The system implements custom security rules to support the acting-as functionality:

```javascript
// Helper function to check if user is acting as a company
function isActingAsCompany(companyId) {
  return exists(/databases/$(database)/documents/support-sessions/$(getActiveSupportSession())) &&
         get(/databases/$(database)/documents/support-sessions/$(getActiveSupportSession())).data.targetCompanyId == companyId &&
         get(/databases/$(database)/documents/support-sessions/$(getActiveSupportSession())).data.status == 'active';
}
```

## Middleware Integration

### Support Context Middleware
- Automatically detects active support sessions
- Injects support context into all requests
- Adds visual indicators via response headers
- Handles session state management

### Enhanced Audit Middleware
- Logs all support actions to both audit logs and support sessions
- Captures admin context for database modifications
- Provides detailed action tracking
- Ensures comprehensive audit trails

## Visual Indicators

When a user is in support mode, the following headers are added to all API responses:

```
X-Support-Mode: true
X-Support-Company: company-123
X-Support-Session: support-session-123
```

Frontend applications can use these headers to display visual indicators that the user is operating in support mode.

## Testing

Comprehensive test suite covering:
- Support session lifecycle
- Admin database operations
- Authorization and security
- Audit trail verification
- Error handling and edge cases

Run tests with:
```bash
npm test
```

## Deployment Considerations

### Environment Variables
No additional environment variables required - the system uses existing Firebase configuration.

### Database Collections
The following new collections will be created automatically:
- `support-sessions`
- `admin-actions`

### Firestore Indexes
Consider adding composite indexes for:
- `support-sessions`: `ellaRecruiterId` + `status` + `startedAt`
- `audit-logs`: `timestamp` + `userId` + `action`
- `admin-actions`: `adminUserId` + `timestamp`

### Monitoring and Alerts
Set up monitoring for:
- Active support session count
- Admin action frequency
- Failed authentication attempts
- Unusual access patterns

## Best Practices

### For Ella Recruiters
1. Always provide clear, specific reasons when starting support sessions
2. End sessions promptly when support is complete
3. Document actions taken during support sessions
4. Respect customer privacy and data access policies

### For System Administrators
1. Use descriptive reasons for all database modifications
2. Validate changes using dry-run mode first
3. Monitor audit logs regularly
4. Follow principle of least privilege

### For Developers
1. Always check support context before performing sensitive operations
2. Log all significant actions for audit purposes
3. Handle support mode gracefully in frontend applications
4. Test both normal and support mode workflows

## Support and Maintenance

### Regular Tasks
- Review active support sessions weekly
- Clean up old audit logs (retention policy)
- Monitor system performance and usage patterns
- Update role permissions as needed

### Troubleshooting
- Check audit logs for failed operations
- Verify user roles and permissions
- Monitor support session activities
- Review admin action history

For additional support, refer to the main EllaAI documentation or contact the development team.