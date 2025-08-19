# EllaAI Production Deployment Guide

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Firebase Project Configuration](#firebase-project-configuration)
- [Security Configuration](#security-configuration)
- [Domain and SSL Setup](#domain-and-ssl-setup)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Backup and Recovery](#backup-and-recovery)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

This guide provides step-by-step instructions for deploying the EllaAI technical assessment platform to production. The platform is built on Firebase/Google Cloud Platform and requires careful configuration of security, monitoring, and operational procedures.

### Architecture Overview

```
Production Environment:
├── Firebase Hosting (Frontend)
├── Cloud Functions (Backend API)
├── Firestore (Database)
├── Cloud Storage (File Storage)
├── Firebase Authentication
├── Cloud CDN
└── Monitoring & Logging
```

## Prerequisites

### Required Accounts and Access
- Google Cloud Platform account with billing enabled
- Firebase project admin access
- Domain name and DNS management access
- SSL certificate management capability

### Required Software
- Node.js 18.x LTS
- Firebase CLI (latest version)
- Git
- Text editor/IDE

### Team Permissions
- At least 2 team members with production deployment access
- Dedicated service account for CI/CD
- Emergency access procedures documented

## Environment Setup

### 1. Install Required Tools

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Firebase CLI
npm install -g firebase-tools

# Verify installations
node --version  # Should be 18.x
firebase --version
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/ellaai-platform.git
cd ellaai-platform
git checkout main
```

### 3. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Verify build process
npm run build
npm run test
```

## Firebase Project Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Project name: `ellaai-production`
4. Enable Google Analytics (recommended)
5. Choose appropriate region (us-central1 recommended)

### 2. Enable Required Services

```bash
# Login to Firebase
firebase login

# Set active project
firebase use --add

# Enable required services
firebase functions:enable
firebase firestore:enable
firebase hosting:enable
firebase storage:enable
firebase auth:enable
```

### 3. Configure Authentication

1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google Sign-in
4. Configure authorized domains:
   - `your-domain.com`
   - `www.your-domain.com`
   - `admin.your-domain.com`

### 4. Set up Firestore Database

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Set up initial data (optional)
npm run seed:data
```

### 5. Configure Cloud Storage

```bash
# Deploy storage rules
firebase deploy --only storage:rules
```

### 6. Environment Variables Setup

Create production environment files:

```bash
# Production environment variables
cat > config/production.env << 'EOF'
NODE_ENV=production
FIREBASE_PROJECT_ID=ellaai-production
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TIMEOUT_HOURS=24
EMAIL_SERVICE_API_KEY=your_email_service_key
PAYMENT_GATEWAY_KEY=your_payment_key
MONITORING_API_KEY=your_monitoring_key
EOF

# Set Firebase environment variables
firebase functions:config:set \
  app.env="production" \
  app.cors_origins="https://your-domain.com,https://www.your-domain.com" \
  email.api_key="your_email_service_key" \
  payment.api_key="your_payment_key" \
  monitoring.api_key="your_monitoring_key"
```

## Security Configuration

### 1. Service Account Setup

```bash
# Create service account
gcloud iam service-accounts create ellaai-production \
    --description="EllaAI Production Service Account" \
    --display-name="EllaAI Production"

# Grant necessary permissions
gcloud projects add-iam-policy-binding ellaai-production \
    --member="serviceAccount:ellaai-production@ellaai-production.iam.gserviceaccount.com" \
    --role="roles/firebase.admin"

# Download service account key
gcloud iam service-accounts keys create ./config/service-account-key.json \
    --iam-account=ellaai-production@ellaai-production.iam.gserviceaccount.com
```

### 2. Security Rules Configuration

#### Firestore Security Rules

```javascript
// firestore.rules - Production rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production security rules with comprehensive access control
    // See firestore.rules file for complete implementation
  }
}
```

#### Storage Security Rules

```javascript
// storage.rules - Production rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Authenticated users only
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Network Security

```bash
# Configure Cloud Armor for DDoS protection
gcloud compute security-policies create ellaai-security-policy \
    --description="EllaAI Production Security Policy"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
    --security-policy=ellaai-security-policy \
    --expression="true" \
    --action="rate-based-ban" \
    --rate-limit-threshold-count=100 \
    --rate-limit-threshold-interval-sec=60 \
    --ban-duration-sec=600
```

## Domain and SSL Setup

### 1. Domain Configuration

```bash
# Add custom domain to Firebase Hosting
firebase hosting:domain:add your-domain.com
firebase hosting:domain:add www.your-domain.com

# Verify domain ownership
firebase hosting:domain:verify your-domain.com
```

### 2. DNS Configuration

Add the following DNS records:

```
Type    Name    Value
A       @       151.101.1.195
A       @       151.101.65.195
CNAME   www     your-domain.com.web.app
```

### 3. SSL Certificate

Firebase Hosting automatically provides SSL certificates for custom domains. Verify certificate issuance:

```bash
# Check SSL certificate status
firebase hosting:domain:list
```

## Deployment Process

### 1. Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup procedures tested
- [ ] Rollback plan prepared
- [ ] Team notifications sent

### 2. Production Build

```bash
# Run complete build and test suite
npm run quality:check

# Build for production
npm run build

# Security check
npm run security:check
```

### 3. Database Migration

```bash
# Apply any pending migrations
npm run migrate:data

# Verify data integrity
npm run verify:data
```

### 4. Deploy to Production

```bash
# Deploy everything
npm run deploy

# Or deploy incrementally
npm run deploy:functions
npm run deploy:hosting

# Verify deployment
firebase hosting:sites:list
firebase functions:list
```

### 5. Post-Deployment Steps

```bash
# Warm up functions
curl https://us-central1-ellaai-production.cloudfunctions.net/api/health

# Verify all services
npm run verify:production

# Update monitoring
npm run monitoring:update
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# API health check
curl -f https://your-domain.com/api/health

# Database connectivity
curl -f https://your-domain.com/api/health/database

# Authentication test
curl -f https://your-domain.com/api/auth/health
```

### 2. Functional Testing

```bash
# Run production smoke tests
npm run test:production

# User journey tests
npm run test:e2e:production
```

### 3. Performance Verification

```bash
# Performance testing
npm run test:performance

# Load testing (if applicable)
npm run test:load
```

### 4. Security Verification

```bash
# Security scanning
npm run security:scan

# SSL certificate verification
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Monitoring and Alerting

### 1. Google Cloud Monitoring Setup

```bash
# Create monitoring workspace
gcloud alpha monitoring workspaces create \
    --display-name="EllaAI Production Monitoring"

# Create notification channels
gcloud alpha monitoring channels create \
    --display-name="Production Alerts" \
    --type=email \
    --channel-labels=email_address=alerts@your-company.com
```

### 2. Custom Metrics

```javascript
// Example custom metrics in Cloud Functions
const monitoring = require('@google-cloud/monitoring');
const client = new monitoring.MetricServiceClient();

// Track assessment completions
await client.createTimeSeries({
  name: 'projects/ellaai-production',
  timeSeries: [{
    metric: {
      type: 'custom.googleapis.com/assessment/completions',
      labels: { status: 'completed' }
    },
    points: [{
      interval: { endTime: { seconds: Date.now() / 1000 } },
      value: { int64Value: 1 }
    }]
  }]
});
```

### 3. Alert Policies

```bash
# Error rate alert
gcloud alpha monitoring policies create \
    --policy-from-file=./monitoring/error-rate-alert.yaml

# Response time alert
gcloud alpha monitoring policies create \
    --policy-from-file=./monitoring/response-time-alert.yaml
```

### 4. Dashboard Configuration

```yaml
# monitoring/dashboard.yaml
displayName: "EllaAI Production Dashboard"
mosaicLayout:
  tiles:
    - widget:
        title: "API Response Time"
        scorecard:
          timeSeriesQuery:
            timeSeriesFilter:
              filter: 'resource.type="cloud_function"'
              aggregation:
                alignmentPeriod: "60s"
                perSeriesAligner: "ALIGN_MEAN"
```

## Backup and Recovery

### 1. Automated Backups

```bash
# Set up Firestore backups
gcloud firestore operations list

# Configure automated exports
gcloud firestore export gs://ellaai-production-backups/$(date +%Y-%m-%d)
```

### 2. Backup Schedule

```yaml
# Cloud Scheduler job for daily backups
name: "daily-firestore-backup"
schedule: "0 2 * * *"  # Daily at 2 AM UTC
timeZone: "UTC"
httpTarget:
  uri: "https://firestore.googleapis.com/v1/projects/ellaai-production/databases/(default):exportDocuments"
  httpMethod: "POST"
  body: |
    {
      "outputUriPrefix": "gs://ellaai-production-backups/scheduled/$(date +%Y-%m-%d)"
    }
```

### 3. Recovery Procedures

```bash
# Restore from backup
gcloud firestore import gs://ellaai-production-backups/2024-01-01/

# Verify restoration
firebase emulators:start --import=./backup-data
```

## Rollback Procedures

### 1. Quick Rollback

```bash
# Rollback to previous deployment
firebase hosting:sites:version:list
firebase hosting:sites:version:rollback --site=ellaai-production

# Rollback Cloud Functions
gcloud functions deploy api --source=./previous-version/
```

### 2. Database Rollback

```bash
# Point-in-time recovery
gcloud firestore restore \
    --destination-database="ellaai-production-restored" \
    --source-backup="projects/ellaai-production/locations/us-central1/backups/backup-id"
```

### 3. Complete Environment Rollback

```bash
# Emergency rollback script
#!/bin/bash
echo "Starting emergency rollback..."

# 1. Rollback hosting
firebase hosting:sites:version:rollback --site=ellaai-production

# 2. Rollback functions
git checkout previous-release-tag
npm run deploy:functions

# 3. Verify rollback
npm run verify:production

echo "Rollback completed. Verify all services."
```

## Troubleshooting

### Common Issues

#### 1. Function Cold Starts

**Symptoms**: High response times on first requests
**Solution**: 
```bash
# Enable minimum instances
firebase functions:config:set runtime.min_instances=2
firebase deploy --only functions
```

#### 2. Firestore Permission Errors

**Symptoms**: Access denied errors in logs
**Solution**: 
```bash
# Check security rules
firebase firestore:rules:get
# Update rules if necessary
firebase deploy --only firestore:rules
```

#### 3. Authentication Issues

**Symptoms**: Login failures or token errors
**Solution**:
```bash
# Verify Firebase Auth configuration
firebase auth:export auth-config.json
# Check authorized domains in Firebase Console
```

#### 4. Build Failures

**Symptoms**: Deployment fails during build
**Solution**:
```bash
# Clear build cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Emergency Contacts

- **Technical Lead**: tech-lead@your-company.com
- **DevOps**: devops@your-company.com
- **On-call Engineer**: +1-555-123-4567
- **Firebase Support**: Firebase Console > Support

### Log Analysis

```bash
# View function logs
firebase functions:log

# Stream real-time logs
firebase functions:log --follow

# Filter by severity
gcloud logging read "severity>=ERROR" --limit=50

# View Firestore audit logs
gcloud logging read "protoPayload.serviceName=firestore.googleapis.com"
```

## Security Compliance

### 1. Data Protection

- All data encrypted at rest and in transit
- PII data properly classified and protected
- Regular security audits and penetration testing
- GDPR compliance procedures implemented

### 2. Access Control

- Multi-factor authentication required for admin access
- Role-based access control (RBAC) implemented
- Regular access reviews and deprovisioning
- Audit logging for all administrative actions

### 3. Incident Response

- Security incident response plan documented
- Automated threat detection and alerting
- Regular security training for team members
- Breach notification procedures established

## Maintenance Windows

### Regular Maintenance

- **Weekly**: Security updates and patches
- **Monthly**: Performance optimization and monitoring review
- **Quarterly**: Security audit and disaster recovery testing
- **Annually**: Comprehensive penetration testing

### Maintenance Procedures

```bash
# Pre-maintenance checklist
1. Notify stakeholders
2. Create backup
3. Prepare rollback plan
4. Update monitoring

# During maintenance
1. Apply updates
2. Monitor system health
3. Verify functionality
4. Update documentation

# Post-maintenance
1. Confirm system stability
2. Update stakeholders
3. Document any issues
4. Schedule next maintenance
```

---

This deployment guide ensures a secure, scalable, and maintainable production environment for the EllaAI platform. Follow all steps carefully and maintain documentation of any customizations or deviations from this guide.