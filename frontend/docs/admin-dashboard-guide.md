# EllaAI System Admin Dashboard

A comprehensive administrative interface for the EllaAI platform, providing system administrators with powerful tools for user management, system monitoring, and platform administration.

## Features

### 🎯 **System Admin Dashboard**
- **Real-time System Metrics**: Active users, response times, error rates, uptime
- **Quick Action Links**: Direct access to common administrative tasks
- **Recent Activity Feed**: Latest admin actions and system events
- **System Health Alerts**: Proactive monitoring and notifications

### 👥 **User Management**
- **Advanced User Search**: Filter by role, status, company, and more
- **User Impersonation**: Secure "Act As" functionality with audit logging
- **Account Lifecycle**: Activate, suspend, or manage user accounts
- **Bulk Operations**: Export user data and perform batch actions
- **Role Management**: Assign and modify user permissions

### 🏢 **Account Management**
- **Company Overview**: Health scores, usage metrics, billing status
- **Account Lifecycle**: Only admins can close accounts (security feature)
- **Usage Analytics**: User count, assessment metrics, activity tracking
- **Account Health**: Automated scoring based on engagement and usage

### 🔍 **Database Query Tool**
- **Visual Query Builder**: Drag-and-drop interface for complex queries
- **Code Editor**: Direct JSON query editing with syntax highlighting
- **Query History**: Track and reuse previous queries
- **Saved Queries**: Store frequently used queries for quick access
- **Export Results**: Download query results in JSON/CSV format
- **Safety Confirmations**: Write operations require confirmation

### 📊 **Audit Log Viewer**
- **Comprehensive Logging**: All admin actions are automatically logged
- **Advanced Filtering**: Search by user, action type, severity, date range
- **Real-time Updates**: Live log streaming for active monitoring
- **Export Capabilities**: Generate audit reports for compliance
- **Detailed Views**: Full context and metadata for each logged action

### 🏥 **System Health Monitor**
- **Service Status**: Database, authentication, storage, API health
- **Performance Metrics**: Response times, error rates, throughput
- **Real-time Charts**: 24-hour performance trends and analytics
- **Alert Management**: Resolve system alerts and incidents
- **Uptime Monitoring**: SLA tracking and availability metrics

## Security Features

### 🔐 **Access Control**
- **Role-based Permissions**: Only admin and system_admin roles can access
- **Security Badges**: Visual indicators for privileged access mode
- **Session Monitoring**: Admin sessions are tracked and logged
- **IP Tracking**: All admin actions include IP address logging

### 🛡️ **Audit Trail**
- **Complete Logging**: Every admin action is automatically logged
- **Immutable Records**: Audit logs cannot be modified or deleted
- **Detailed Context**: Full request/response data and user context
- **Compliance Ready**: Audit trails support regulatory requirements

### ⚠️ **Safety Measures**
- **Confirmation Dialogs**: Destructive actions require confirmation
- **Self-Protection**: Admins cannot perform certain actions on themselves
- **Write Operation Warnings**: Database modifications show clear warnings
- **Session Timeouts**: Admin sessions expire for security

## Technology Stack

### Frontend Components
- **React 18** with TypeScript for type safety
- **Material-UI (MUI)** for professional enterprise UI components
- **Monaco Editor** for advanced code editing capabilities
- **Recharts** for data visualization and metrics charts
- **React Router** for secure routing and navigation

### Styling & Theme
- **Dark Theme**: Professional dark interface distinguishes admin mode
- **Red Accents**: High-contrast colors for destructive actions
- **Security Indicators**: Visual badges and warnings throughout
- **Responsive Design**: Mobile-friendly for on-the-go administration

### API Integration
- **RESTful APIs**: Clean API design for all admin operations
- **Authentication**: Secure session-based authentication
- **Error Handling**: Comprehensive error management and user feedback
- **Real-time Updates**: WebSocket support for live data updates

## Usage Guide

### Getting Started

1. **Access Requirements**
   - Must have `admin` or `system_admin` role
   - Navigate to `/admin` in the application
   - Dashboard loads with current system status

2. **Navigation**
   - Left sidebar provides access to all admin tools
   - Top bar shows system alerts and user context
   - "Exit Admin Mode" returns to main application

### Common Workflows

#### User Management
```typescript
// Search for users
1. Navigate to Admin → User Management
2. Use filters to find specific users
3. Click on user row for detailed actions
4. Available actions: View, Edit, Suspend, Impersonate

// User Impersonation
1. Select "Impersonate User" from user menu
2. Provide business reason for impersonation
3. Set session duration (15min to 2 hours)
4. System logs the impersonation session
```

#### Database Queries
```typescript
// Visual Query Builder
1. Navigate to Admin → Database Query
2. Select collection from dropdown
3. Add filters using visual interface
4. Set ordering and limits
5. Execute with safety confirmation

// Code Editor
1. Switch to "Code" mode
2. Write JSON query directly
3. Use syntax highlighting for validation
4. Execute with confirmation dialog
```

#### System Monitoring
```typescript
// Health Monitoring
1. Navigate to Admin → System Health
2. View real-time service status
3. Check performance metrics and charts
4. Resolve active alerts if any

// Audit Trail
1. Navigate to Admin → Audit Logs
2. Use advanced filters to search logs
3. Click "Details" for full log context
4. Export logs for compliance reporting
```

### Best Practices

#### Security
- **Always provide clear reasons** for impersonation sessions
- **Use shortest possible duration** for impersonation
- **Review audit logs regularly** for suspicious activity
- **Log out of admin mode** when not actively administering

#### Data Management
- **Test queries on small datasets** before running large operations
- **Use visual query builder** for complex filters to avoid errors
- **Export data regularly** for backup and analysis
- **Verify results** before performing write operations

#### Monitoring
- **Check system health daily** for proactive issue detection
- **Set up monitoring alerts** for critical thresholds
- **Review performance trends** to identify capacity needs
- **Monitor user activity** for unusual patterns

## API Endpoints

### Authentication
- `GET /api/admin/session` - Verify admin session
- `POST /api/admin/impersonation/start` - Start user impersonation
- `POST /api/admin/impersonation/end` - End impersonation session

### User Management
- `GET /api/admin/users` - List users with filters
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/unsuspend` - Unsuspend user

### System Health
- `GET /api/admin/health` - Get system health status
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/alerts` - Get active alerts

### Database Operations
- `POST /api/admin/database/query` - Execute database query
- `GET /api/admin/database/history` - Get query history
- `POST /api/admin/database/queries` - Save query

### Audit Logs
- `GET /api/admin/audit` - Get audit logs with filters
- `GET /api/admin/audit/:id` - Get specific audit log entry

## Configuration

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ADMIN_SESSION_TIMEOUT=3600000  # 1 hour
REACT_APP_IMPERSONATION_MAX_DURATION=7200000  # 2 hours
```

### Feature Flags
- `admin_dashboard_enabled` - Enable/disable admin dashboard
- `user_impersonation_enabled` - Enable/disable impersonation
- `database_query_enabled` - Enable/disable query tool
- `audit_log_retention_days` - Audit log retention period

## Troubleshooting

### Common Issues

#### Access Denied
- Verify user has `admin` or `system_admin` role
- Check session is valid and not expired
- Ensure user is not suspended or inactive

#### Query Execution Errors
- Validate JSON syntax in query editor
- Check field names exist in target collection
- Verify user has query permissions
- Test with smaller result sets first

#### Performance Issues
- Monitor system health for bottlenecks
- Check database response times
- Review query complexity and optimization
- Consider pagination for large datasets

### Support Contacts
- **Technical Issues**: dev-support@ellaai.com
- **Security Concerns**: security@ellaai.com
- **Admin Training**: admin-training@ellaai.com

## Compliance & Governance

### Data Privacy
- All admin actions are logged for accountability
- User data access is tracked and auditable
- Impersonation sessions have business justification
- Data export includes privacy controls

### Regulatory Compliance
- SOX compliance through complete audit trails
- GDPR compliance through data access logging
- HIPAA compliance through secure access controls
- Industry-specific compliance through customizable policies

---

**⚠️ Important Security Notice**

This admin dashboard provides privileged access to sensitive data and system controls. All actions are monitored and logged. Use responsibly and in accordance with company policies and legal requirements.