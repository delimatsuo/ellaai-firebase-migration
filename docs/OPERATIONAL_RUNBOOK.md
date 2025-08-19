# EllaAI Operational Runbook

## Table of Contents

- [Overview](#overview)
- [Emergency Contacts](#emergency-contacts)
- [System Health Monitoring](#system-health-monitoring)
- [Common Maintenance Procedures](#common-maintenance-procedures)
- [Incident Response Procedures](#incident-response-procedures)
- [Performance Optimization](#performance-optimization)
- [Security Operations](#security-operations)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Escalation Procedures](#escalation-procedures)
- [Maintenance Windows](#maintenance-windows)

## Overview

This operational runbook provides comprehensive procedures for maintaining, monitoring, and troubleshooting the EllaAI technical assessment platform in production. It serves as the primary reference for operations teams, on-call engineers, and system administrators.

### Platform Overview
- **Technology Stack**: Firebase, Node.js, React, TypeScript
- **Infrastructure**: Google Cloud Platform
- **Deployment Model**: Serverless (Cloud Functions, Firebase Hosting)
- **Database**: Firestore with Redis caching
- **Monitoring**: Cloud Monitoring, Error Reporting

## Emergency Contacts

### Primary Contacts
| Role | Name | Phone | Email | Availability |
|------|------|-------|--------|-------------|
| Technical Lead | John Doe | +1-555-123-4567 | tech-lead@ellaai.com | 24/7 |
| DevOps Engineer | Jane Smith | +1-555-234-5678 | devops@ellaai.com | Business hours |
| Security Officer | Bob Johnson | +1-555-345-6789 | security@ellaai.com | 24/7 |
| Product Manager | Alice Brown | +1-555-456-7890 | product@ellaai.com | Business hours |

### Escalation Chain
1. **Level 1**: On-call Engineer
2. **Level 2**: Technical Lead
3. **Level 3**: Engineering Manager
4. **Level 4**: CTO

### External Vendors
| Service | Contact | Phone | Support Level |
|---------|---------|-------|---------------|
| Google Cloud | support.google.com | 1-855-836-3987 | Enterprise |
| SendGrid | support@sendgrid.com | 1-877-969-8647 | Pro |
| Stripe | support@stripe.com | 1-888-963-8744 | Standard |

## System Health Monitoring

### Key Metrics Dashboard

#### Performance Metrics
```
API Response Time:
- Target: < 200ms (95th percentile)
- Warning: > 500ms
- Critical: > 1000ms

Error Rate:
- Target: < 0.1%
- Warning: > 1%
- Critical: > 5%

Function Invocation Count:
- Normal: 1000-10000/hour
- High: > 10000/hour
- Critical: > 50000/hour
```

#### Infrastructure Metrics
```
CPU Utilization:
- Normal: < 70%
- Warning: > 80%
- Critical: > 90%

Memory Usage:
- Normal: < 80%
- Warning: > 85%
- Critical: > 95%

Database Connections:
- Normal: < 100
- Warning: > 150
- Critical: > 200
```

### Health Check Endpoints

```bash
# API Health Check
curl -f https://api.ellaai.com/health
# Expected: {"status": "healthy", "timestamp": "..."}

# Database Health Check
curl -f https://api.ellaai.com/health/database
# Expected: {"status": "healthy", "latency": "< 50ms"}

# Authentication Health Check
curl -f https://api.ellaai.com/health/auth
# Expected: {"status": "healthy", "service": "firebase-auth"}
```

### Monitoring Commands

```bash
# Check Cloud Function logs
firebase functions:log --filter="ERROR"

# Monitor real-time metrics
gcloud logging tail "resource.type=cloud_function"

# Check Firestore performance
gcloud logging read "resource.type=gce_instance" --limit=50

# Monitor active connections
firebase database:get / --shallow
```

## Common Maintenance Procedures

### 1. Routine System Updates

#### Weekly Security Updates
```bash
# Security update procedure
1. Check for security advisories
2. Update dependencies
3. Run security tests
4. Deploy to staging
5. Verify functionality
6. Deploy to production
7. Monitor for issues
```

#### Monthly Performance Review
```bash
# Performance analysis procedure
1. Generate performance reports
2. Analyze slow queries
3. Review cache hit rates
4. Optimize database indexes
5. Update monitoring thresholds
6. Document improvements
```

### 2. Database Maintenance

#### Firestore Index Optimization
```bash
# Check index usage
gcloud firestore indexes list

# Identify unused indexes
firebase firestore:indexes --help

# Update indexes
firebase deploy --only firestore:indexes
```

#### Data Cleanup Procedures
```bash
# Clean up old audit logs (older than 90 days)
node scripts/cleanup-audit-logs.js --days=90

# Archive completed assessments (older than 1 year)
node scripts/archive-assessments.js --months=12

# Remove expired sessions
node scripts/cleanup-sessions.js
```

### 3. Cache Management

#### Redis Cache Operations
```bash
# Check cache status
redis-cli INFO memory

# Clear specific cache keys
redis-cli DEL "assessments:company123"

# Monitor cache hit rate
redis-cli INFO stats | grep keyspace
```

#### CDN Cache Management
```bash
# Invalidate CDN cache
gcloud compute url-maps invalidate-cdn-cache ellaai-url-map \
    --path="/api/*" --async

# Check cache statistics
gcloud compute backend-services get-health ellaai-backend-service
```

### 4. SSL Certificate Management

```bash
# Check certificate expiration
openssl s_client -connect ellaai.com:443 -servername ellaai.com 2>/dev/null | \
openssl x509 -noout -dates

# Renew certificates (automatic via Firebase)
firebase hosting:domain:verify ellaai.com

# Verify SSL configuration
curl -I https://ellaai.com
```

## Incident Response Procedures

### 1. Incident Classification

#### Severity Levels
- **P0 (Critical)**: Complete service outage affecting all users
- **P1 (High)**: Major functionality impaired, affecting many users
- **P2 (Medium)**: Minor functionality issues, affecting some users
- **P3 (Low)**: Cosmetic issues or minor bugs

#### Response Times
- **P0**: 15 minutes
- **P1**: 1 hour
- **P2**: 4 hours
- **P3**: 24 hours

### 2. Incident Response Workflow

#### Initial Response (First 15 minutes)
```bash
1. Acknowledge the incident
2. Assess severity level
3. Notify appropriate stakeholders
4. Create incident channel (#incident-YYYY-MM-DD)
5. Begin initial investigation
```

#### Investigation Phase
```bash
1. Check system health dashboard
2. Review recent deployments
3. Analyze error logs
4. Identify root cause
5. Implement temporary fix if possible
```

#### Resolution Phase
```bash
1. Deploy permanent fix
2. Verify system recovery
3. Update stakeholders
4. Document incident details
5. Schedule post-incident review
```

### 3. Common Incident Scenarios

#### Scenario: High Error Rate

**Detection**:
```bash
# Check error rate
gcloud logging read "severity>=ERROR" --limit=100 --format=json

# Analyze error patterns
firebase functions:log --filter="ERROR" --lines=50
```

**Response**:
```bash
1. Identify error source
2. Check recent deployments
3. Rollback if deployment-related
4. Scale up resources if capacity issue
5. Fix underlying issue
```

#### Scenario: Database Performance Issues

**Detection**:
```bash
# Check database metrics
gcloud monitoring metrics list --filter="firestore"

# Analyze slow queries
firebase firestore:query-performance
```

**Response**:
```bash
1. Identify slow queries
2. Check index usage
3. Add missing indexes
4. Optimize query patterns
5. Consider data restructuring
```

#### Scenario: Authentication Problems

**Detection**:
```bash
# Check auth service status
curl -f https://api.ellaai.com/health/auth

# Review auth errors
gcloud logging read "resource.type=firebase_auth"
```

**Response**:
```bash
1. Verify Firebase Auth configuration
2. Check API keys and credentials
3. Validate security rules
4. Test authentication flow
5. Update client configurations
```

## Performance Optimization

### 1. Database Query Optimization

#### Query Performance Analysis
```bash
# Analyze query performance
firebase firestore:indexes --help

# Check index usage statistics
gcloud firestore operations list

# Monitor query execution times
gcloud logging read "resource.type=firestore_database" \
  --filter="severity>=WARNING"
```

#### Index Management
```bash
# Add composite index
firebase firestore:indexes:create

# Remove unused indexes
firebase firestore:indexes:delete INDEX_ID

# Update index configuration
firebase deploy --only firestore:indexes
```

### 2. Function Performance Tuning

#### Cold Start Optimization
```bash
# Configure minimum instances
firebase functions:config:set runtime.min_instances=2

# Optimize function memory allocation
# Edit functions with appropriate memory settings:
# - Light functions: 128MB
# - API functions: 256MB
# - Heavy processing: 512MB-1GB
```

#### Function Monitoring
```bash
# Monitor function execution times
gcloud functions logs read FUNCTION_NAME --limit=50

# Check function metrics
gcloud monitoring metrics list --filter="cloud_function"

# Analyze function performance
firebase functions:log --filter="DURATION"
```

### 3. CDN and Caching Optimization

#### Cache Configuration
```bash
# Update cache policies
gcloud compute backend-services update ellaai-backend-service \
    --cache-mode=CACHE_ALL_STATIC

# Configure cache TTL
gcloud compute backend-services update ellaai-backend-service \
    --default-ttl=3600
```

#### Cache Monitoring
```bash
# Check cache hit rates
gcloud compute backend-services get-health ellaai-backend-service

# Monitor CDN performance
gcloud compute url-maps describe ellaai-url-map
```

## Security Operations

### 1. Security Monitoring

#### Access Log Analysis
```bash
# Monitor authentication attempts
gcloud logging read "resource.type=firebase_auth" \
  --filter="severity>=WARNING" --limit=100

# Check failed login attempts
gcloud logging read "protoPayload.methodName=google.firebase.auth.v1.Auth.SignInWithEmailAndPassword" \
  --filter="severity=ERROR"

# Monitor admin actions
gcloud logging read "resource.type=cloud_function" \
  --filter="labels.function_name=admin"
```

#### Security Alerts
```bash
# Check for security violations
gcloud logging read "severity=ERROR" \
  --filter="jsonPayload.security_event=true"

# Monitor rate limiting triggers
gcloud logging read "httpRequest.status=429"

# Review blocked requests
gcloud logging read "httpRequest.status=403"
```

### 2. Access Management

#### User Access Review
```bash
# List all admin users
firebase auth:export admin-users.json --filter="customClaims.role=admin"

# Review company access permissions
node scripts/audit-user-permissions.js

# Check service account permissions
gcloud iam service-accounts get-iam-policy SERVICE_ACCOUNT_EMAIL
```

#### Permission Updates
```bash
# Update user role
firebase auth:set-claims USER_UID '{"role": "recruiter"}'

# Revoke access
firebase auth:delete USER_UID

# Update company permissions
node scripts/update-company-access.js --user=USER_ID --company=COMPANY_ID
```

### 3. Security Incident Response

#### Data Breach Response
```bash
1. Isolate affected systems
2. Preserve evidence
3. Notify security team
4. Document timeline
5. Contact legal/compliance
6. Notify affected users
7. Implement fixes
8. Conduct security review
```

#### Suspicious Activity Response
```bash
1. Analyze activity patterns
2. Check user permissions
3. Review access logs
4. Implement additional monitoring
5. Update security rules
6. Document findings
```

## Backup and Recovery

### 1. Backup Procedures

#### Database Backup
```bash
# Create Firestore backup
gcloud firestore export gs://ellaai-backups/$(date +%Y-%m-%d)

# Verify backup completion
gsutil ls gs://ellaai-backups/$(date +%Y-%m-%d)

# Schedule automated backups
gcloud scheduler jobs create http daily-backup \
    --schedule="0 2 * * *" \
    --uri="https://firestore.googleapis.com/v1/projects/ellaai/databases/(default):exportDocuments" \
    --http-method=POST
```

#### Code and Configuration Backup
```bash
# Backup function source code
git tag backup-$(date +%Y%m%d-%H%M%S)
git push origin --tags

# Export Firebase configuration
firebase projects:list > firebase-projects-backup.json

# Backup environment configuration
firebase functions:config:get > functions-config-backup.json
```

### 2. Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
gcloud firestore import gs://ellaai-backups/BACKUP_DATE

# Verify data integrity
node scripts/verify-data-integrity.js

# Test application functionality
npm run test:integration
```

#### Point-in-Time Recovery
```bash
# Create recovery database
gcloud firestore databases create recovery-db

# Import backup to recovery database
gcloud firestore import gs://ellaai-backups/BACKUP_DATE \
    --database=recovery-db

# Migrate specific data
node scripts/migrate-specific-data.js --source=recovery-db --target=default
```

### 3. Disaster Recovery

#### Complete System Recovery
```bash
1. Assess damage scope
2. Set up new Firebase project
3. Restore database from backup
4. Deploy application code
5. Update DNS records
6. Verify all functionality
7. Monitor system health
```

#### Recovery Testing
```bash
# Monthly recovery drill
1. Create test environment
2. Restore from backup
3. Test all functionality
4. Document issues
5. Update procedures
6. Clean up test environment
```

## Troubleshooting Guide

### 1. Common Issues and Solutions

#### Issue: High Response Times

**Symptoms**:
- API responses > 1000ms
- User complaints about slow loading
- Timeout errors in logs

**Diagnosis**:
```bash
# Check function performance
firebase functions:log --filter="DURATION"

# Analyze database queries
gcloud logging read "resource.type=firestore_database" \
  --filter="severity>=WARNING"

# Check external service latency
curl -w "@curl-format.txt" https://api.ellaai.com/health
```

**Solutions**:
```bash
1. Add database indexes
2. Optimize slow queries
3. Implement caching
4. Scale up function resources
5. Review third-party integrations
```

#### Issue: Authentication Failures

**Symptoms**:
- Users cannot log in
- Token validation errors
- 401/403 HTTP errors

**Diagnosis**:
```bash
# Check Firebase Auth status
firebase auth:export test-auth.json --format=json

# Review authentication logs
gcloud logging read "resource.type=firebase_auth" \
  --filter="severity=ERROR"

# Test token validation
curl -H "Authorization: Bearer TOKEN" https://api.ellaai.com/auth/verify
```

**Solutions**:
```bash
1. Verify Firebase configuration
2. Check API key validity
3. Update security rules
4. Clear user sessions
5. Regenerate service account keys
```

#### Issue: Database Connection Errors

**Symptoms**:
- Firestore timeout errors
- Connection pool exhaustion
- Random database failures

**Diagnosis**:
```bash
# Check Firestore metrics
gcloud monitoring metrics list --filter="firestore"

# Review connection errors
gcloud logging read "resource.type=firestore_database" \
  --filter="severity=ERROR"

# Test database connectivity
node scripts/test-db-connection.js
```

**Solutions**:
```bash
1. Review connection pooling
2. Add retry logic
3. Optimize query patterns
4. Check network connectivity
5. Scale database resources
```

### 2. Performance Troubleshooting

#### Memory Issues
```bash
# Check function memory usage
gcloud functions logs read FUNCTION_NAME \
  --filter="severity=ERROR AND memory"

# Analyze memory patterns
gcloud monitoring metrics list --filter="memory"

# Update memory allocation
firebase functions:config:set runtime.memory=512MB
```

#### CPU Bottlenecks
```bash
# Monitor CPU usage
gcloud monitoring metrics list --filter="cpu"

# Profile function execution
firebase functions:log --filter="execution_time"

# Optimize algorithms
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

### 3. Network Troubleshooting

#### Connectivity Issues
```bash
# Test external connectivity
curl -I https://api.external-service.com

# Check DNS resolution
nslookup ellaai.com

# Test SSL connectivity
openssl s_client -connect ellaai.com:443
```

#### CDN Issues
```bash
# Check CDN status
gcloud compute url-maps describe ellaai-url-map

# Test cache behavior
curl -I https://ellaai.com/static/app.js

# Invalidate CDN cache
gcloud compute url-maps invalidate-cdn-cache ellaai-url-map --path="/*"
```

## Escalation Procedures

### 1. Escalation Triggers

**Automatic Escalation**:
- P0 incidents not resolved in 1 hour
- P1 incidents not resolved in 4 hours
- Multiple related incidents
- Customer escalation

**Manual Escalation**:
- Technical complexity beyond current level
- Need for additional resources
- External vendor involvement required

### 2. Escalation Process

```bash
1. Document current status
2. Contact next level support
3. Provide incident summary
4. Transfer relevant information
5. Continue monitoring
6. Update stakeholders
```

### 3. External Vendor Escalation

#### Google Cloud Support
```bash
1. Create support case in console
2. Provide detailed description
3. Include relevant logs
4. Specify urgency level
5. Follow up regularly
```

#### Third-Party Services
```bash
1. Check service status pages
2. Contact vendor support
3. Escalate through account manager
4. Document interactions
5. Implement workarounds
```

## Maintenance Windows

### 1. Scheduled Maintenance

#### Weekly Maintenance (Sundays 2-4 AM UTC)
```bash
- Security updates
- Dependency updates
- Performance optimizations
- Monitoring updates
- Backup verification
```

#### Monthly Maintenance (First Saturday 6-10 AM UTC)
```bash
- Major updates
- Database maintenance
- SSL certificate renewal
- Security audits
- Disaster recovery testing
```

### 2. Emergency Maintenance

#### Criteria for Emergency Maintenance
- Critical security vulnerabilities
- Data corruption risks
- Service outages
- Performance degradation

#### Emergency Maintenance Process
```bash
1. Assess urgency
2. Notify stakeholders
3. Create maintenance window
4. Implement changes
5. Verify functionality
6. Document actions
```

### 3. Change Management

#### Change Approval Process
```bash
1. Submit change request
2. Technical review
3. Risk assessment
4. Approval from stakeholders
5. Schedule implementation
6. Post-change verification
```

#### Rollback Planning
```bash
1. Document current state
2. Create rollback script
3. Test rollback procedure
4. Define rollback triggers
5. Assign rollback authority
6. Monitor post-rollback
```

---

This operational runbook provides comprehensive procedures for maintaining the EllaAI platform. Regular reviews and updates ensure it remains current with system changes and operational experience.