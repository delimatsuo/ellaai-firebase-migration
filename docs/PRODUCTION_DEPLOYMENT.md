# Production Deployment Guide

This comprehensive guide covers deploying the EllaAI platform to production environments with enterprise-grade security, scalability, and reliability.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Environment Configuration](#environment-configuration)
- [Security Configuration](#security-configuration)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring Setup](#monitoring-setup)
- [Backup and Recovery](#backup-and-recovery)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

### System Requirements

**Development Environment:**
- Node.js 18+ LTS
- npm 9+ or yarn 1.22+
- Firebase CLI 12.4.0+
- Git 2.34+
- Docker 20+ (for local testing)

**Production Environment:**
- Google Cloud Platform account with billing enabled
- Firebase project with Blaze (Pay-as-you-go) plan
- Custom domain with SSL certificate
- CDN provider (Google Cloud CDN recommended)
- Monitoring tools (Sentry, Datadog, or similar)

### Access Requirements

**Required Permissions:**
- Firebase Project Owner or Editor
- Google Cloud Platform Project Owner
- Domain DNS management access
- CI/CD pipeline configuration access

**Service Accounts:**
- Firebase Admin SDK service account
- Google Cloud Storage access
- Monitoring service integration

## Infrastructure Setup

### 1. Google Cloud Platform Setup

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Initialize and authenticate
gcloud init
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudfunctions.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

### 2. Firebase Project Configuration

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Authenticate with Firebase
firebase login

# Initialize project
firebase init

# Select services:
# ✅ Firestore
# ✅ Functions
# ✅ Hosting
# ✅ Storage
# ✅ Emulators
```

### 3. Domain and SSL Setup

```bash
# Add custom domain to Firebase Hosting
firebase hosting:sites:create YOUR_SITE_ID

# Connect domain (follow Firebase console instructions)
# This will automatically provision SSL certificates
```

## Environment Configuration

### 1. Production Environment Variables

Create `.env.production` file:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=ellaai-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ellaai-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[PRODUCTION_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://ellaai-production-default-rtdb.firebaseio.com/

# Next.js Configuration
NEXTAUTH_SECRET=your-production-secret-64-chars-minimum-for-security
NEXTAUTH_URL=https://app.ellaai.com

# Security Configuration
CSRF_SECRET_KEY=your-production-csrf-secret-32-chars
SECURITY_SALT=your-production-security-salt-32-chars
SECURITY_HEADERS_STRICT=true
ENABLE_CSRF_PROTECTION=true
ENABLE_RATE_LIMITING=true

# Database Configuration
DATABASE_URL=postgresql://username:password@production-db:5432/ellaai

# Redis Configuration (for caching and rate limiting)
REDIS_URL=redis://production-redis:6379
REDIS_PASSWORD=your-production-redis-password

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Third-party APIs
OPENAI_API_KEY=sk-production-openai-key
STRIPE_SECRET_KEY=sk_live_your-production-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret

# Monitoring and Logging
LOG_LEVEL=warn
SENTRY_DSN=https://your-production-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production

# Performance Configuration
NODE_ENV=production
ALLOWED_ORIGINS=https://app.ellaai.com,https://admin.ellaai.com

# Feature Flags
FEATURE_AUDIT_LOGGING=true
FEATURE_ADVANCED_SECURITY=true
FEATURE_PERFORMANCE_MONITORING=true
FEATURE_MAINTENANCE_MODE=false
```

### 2. Google Secret Manager Configuration

Store sensitive configuration in Google Secret Manager:

```bash
# Store Firebase private key
echo -n "YOUR_FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-private-key --data-file=-

# Store database credentials
echo -n "YOUR_DATABASE_PASSWORD" | gcloud secrets create database-password --data-file=-

# Store API keys
echo -n "YOUR_OPENAI_API_KEY" | gcloud secrets create openai-api-key --data-file=-
echo -n "YOUR_STRIPE_SECRET_KEY" | gcloud secrets create stripe-secret-key --data-file=-

# Grant access to Cloud Functions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Function Configuration

Update `functions/src/config/production.ts`:

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClient = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/${secretName}/versions/latest`,
  });
  
  return version.payload?.data?.toString() || '';
}

export const productionConfig = {
  // Security settings
  security: {
    enableStrictHeaders: true,
    enableCSRFProtection: true,
    enableRateLimiting: true,
    maxRequestsPerWindow: 100,
    windowDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Performance settings
  performance: {
    enableCaching: true,
    cacheMaxAge: 300, // 5 minutes
    enableCompression: true,
    enableCDN: true,
  },
  
  // Logging settings
  logging: {
    level: 'warn',
    enableStructuredLogging: true,
    enableAuditLogging: true,
  },
};
```

## Security Configuration

### 1. Firestore Security Rules

Deploy production-ready security rules (`firestore.rules.secure`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && isValidUser();
    }
    
    // Company data access control
    match /companies/{companyId} {
      allow read, write: if request.auth != null
        && hasCompanyAccess(companyId)
        && isValidCompanyData();
    }
    
    // Assessment access control
    match /assessments/{assessmentId} {
      allow read: if request.auth != null
        && (hasCompanyAccess(getAssessmentCompany(assessmentId))
           || isCandidateAssessment(assessmentId));
      allow write: if request.auth != null
        && hasCompanyAccess(getAssessmentCompany(assessmentId))
        && hasRole(['admin', 'recruiter']);
    }
    
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null
        && hasRole(['admin']);
    }
    
    // Audit logs - read-only for admins
    match /audit_logs/{logId} {
      allow read: if request.auth != null
        && hasRole(['admin']);
      allow write: if false; // Only server can write
    }
  }
  
  // Helper functions
  function isValidUser() {
    return request.auth.token.email_verified == true;
  }
  
  function hasCompanyAccess(companyId) {
    return request.auth.token.companyId == companyId;
  }
  
  function hasRole(allowedRoles) {
    return request.auth.token.role in allowedRoles;
  }
  
  function getAssessmentCompany(assessmentId) {
    return get(/databases/$(database)/documents/assessments/$(assessmentId)).data.companyId;
  }
  
  function isCandidateAssessment(assessmentId) {
    return request.auth.uid in get(/databases/$(database)/documents/assessments/$(assessmentId)).data.candidates;
  }
  
  function isValidCompanyData() {
    return request.resource.data.keys().hasAll(['name', 'email']) 
      && request.resource.data.name is string
      && request.resource.data.email is string;
  }
}
```

### 2. Function Security Configuration

Update `functions/src/middleware/security.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.ellaai.com"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }),
  
  // CORS configuration
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }),
  
  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(req.rateLimit.resetTime! / 1000)
      });
    }
  }),
];
```

### 3. Authentication Security

Configure secure authentication in `functions/src/middleware/auth.ts`:

```typescript
import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email: string;
    role: string;
    companyId?: string;
    emailVerified: boolean;
  };
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    
    // Verify email is confirmed
    if (!decodedToken.email_verified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }

    // Get user record for additional validation
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    if (userRecord.disabled) {
      res.status(403).json({ error: 'User account is disabled' });
      return;
    }

    (req as AuthenticatedRequest).user = {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      role: decodedToken.role || 'candidate',
      companyId: decodedToken.companyId,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
```

## Database Setup

### 1. Firestore Indexes

Deploy production indexes (`firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "companyId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "candidates",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "companyId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "action", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "assessments",
      "fieldPath": "questions",
      "indexes": [
        {"order": "ASCENDING", "queryScope": "COLLECTION"}
      ]
    }
  ]
}
```

### 2. Data Migration

Run production data migration:

```bash
# Backup existing data
node scripts/backup-data.js --env=production

# Run migration with validation
node scripts/migrate-data.js --env=production --validate

# Verify migration
node scripts/verify-migration.js --env=production
```

### 3. Database Performance Optimization

```typescript
// functions/src/config/firestore.ts
import { getFirestore } from 'firebase-admin/firestore';

export function configureFirestore() {
  const db = getFirestore();
  
  // Configure performance settings
  db.settings({
    ignoreUndefinedProperties: true,
    timestampsInSnapshots: true,
  });

  // Enable offline persistence for client
  return db;
}

// Optimize queries with proper indexing
export class OptimizedQueries {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async getAssessmentsByCompany(companyId: string, limit = 50) {
    return this.db
      .collection('assessments')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
  }

  async getCandidatesByStatus(status: string, limit = 100) {
    return this.db
      .collection('candidates')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
  }
}
```

## Application Deployment

### 1. Pre-deployment Validation

```bash
# Run comprehensive tests
npm run test:all
npm run test:security
npm run test:performance

# Validate environment configuration
node scripts/validate-config.js --env=production

# Check security vulnerabilities
npm audit --production
npm run security:scan

# Validate Firebase rules
firebase firestore:rules:test --test-suite=tests/firestore.rules.test.js
```

### 2. Build and Deployment Process

```bash
# Set production environment
export NODE_ENV=production

# Build all components
npm run build

# Deploy to staging first
firebase use ellaai-staging
npm run deploy

# Run staging validation
npm run test:staging

# Deploy to production
firebase use ellaai-production
npm run deploy:production

# Verify deployment
npm run verify:production
```

### 3. Deployment Script

Create `scripts/deploy-production.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run test:all
npm run lint
npm run typecheck
npm audit --production

# Build process
echo "🔨 Building application..."
npm run build

# Backup current deployment
echo "💾 Creating deployment backup..."
node scripts/backup-deployment.js

# Deploy functions first
echo "⚡ Deploying Cloud Functions..."
firebase deploy --only functions --project production

# Deploy hosting
echo "🌐 Deploying hosting..."
firebase deploy --only hosting --project production

# Deploy Firestore rules and indexes
echo "🔒 Deploying Firestore configuration..."
firebase deploy --only firestore --project production

# Verify deployment
echo "✅ Verifying deployment..."
node scripts/verify-deployment.js --env=production

# Update monitoring
echo "📊 Updating monitoring configuration..."
node scripts/update-monitoring.js --env=production

echo "🎉 Production deployment completed successfully!"
echo "📈 Monitor deployment: https://console.firebase.google.com/project/ellaai-production"
```

### 4. Zero-Downtime Deployment

Configure blue-green deployment:

```bash
# Deploy to staging slot
firebase hosting:clone ellaai-production:live ellaai-production:staging

# Deploy new version to staging
firebase deploy --only hosting --project ellaai-production --channel staging

# Validate staging deployment
npm run test:staging-live

# Promote staging to live
firebase hosting:channel:deploy production --project ellaai-production

# Cleanup old version
firebase hosting:channel:delete staging --project ellaai-production
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Application health
curl -f https://app.ellaai.com/api/health

# Database connectivity
curl -f https://app.ellaai.com/api/health/database

# External services
curl -f https://app.ellaai.com/api/health/services

# Performance check
curl -w "@curl-format.txt" https://app.ellaai.com/api/health
```

### 2. Functional Testing

Run automated production tests:

```bash
# E2E tests against production
npm run test:e2e:production

# API integration tests
npm run test:api:production

# Performance regression tests
npm run test:performance:production

# Security validation
npm run test:security:production
```

### 3. Monitoring Validation

```bash
# Verify monitoring is active
node scripts/verify-monitoring.js --env=production

# Test alerting
node scripts/test-alerts.js --env=production

# Validate logs
node scripts/verify-logs.js --env=production
```

## Monitoring Setup

### 1. Application Monitoring

Configure comprehensive monitoring:

```typescript
// functions/src/monitoring/setup.ts
import { monitoring } from '@google-cloud/monitoring';
import { logging } from '@google-cloud/logging';

export class ProductionMonitoring {
  private metricClient = new monitoring.MetricServiceClient();
  private loggingClient = new logging.Logging();

  async setupMetrics() {
    // Custom metrics for business KPIs
    const metrics = [
      'assessment_completion_rate',
      'user_authentication_success',
      'api_response_time',
      'error_rate_by_endpoint',
      'concurrent_assessments'
    ];

    for (const metric of metrics) {
      await this.createCustomMetric(metric);
    }
  }

  async createCustomMetric(name: string) {
    const request = {
      name: `projects/${process.env.FIREBASE_PROJECT_ID}`,
      metricDescriptor: {
        type: `custom.googleapis.com/${name}`,
        metricKind: 'GAUGE',
        valueType: 'INT64',
        displayName: name,
      },
    };

    await this.metricClient.createMetricDescriptor(request);
  }

  async recordMetric(metricName: string, value: number, labels: Record<string, string> = {}) {
    const request = {
      name: `projects/${process.env.FIREBASE_PROJECT_ID}`,
      timeSeries: [
        {
          metric: {
            type: `custom.googleapis.com/${metricName}`,
            labels,
          },
          resource: {
            type: 'gce_instance',
            labels: {
              instance_id: process.env.INSTANCE_ID || 'unknown',
              zone: process.env.ZONE || 'unknown',
            },
          },
          points: [
            {
              interval: {
                endTime: {
                  seconds: Date.now() / 1000,
                },
              },
              value: {
                int64Value: value,
              },
            },
          ],
        },
      ],
    };

    await this.metricClient.createTimeSeries(request);
  }
}
```

### 2. Error Tracking

Setup Sentry for production:

```typescript
// functions/src/monitoring/sentry.ts
import * as Sentry from '@sentry/node';

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    release: process.env.DEPLOYMENT_VERSION,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });
}

export function captureException(error: Error, context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}
```

### 3. Performance Monitoring

Setup performance tracking:

```typescript
// functions/src/middleware/performance.ts
import { Request, Response, NextFunction } from 'express';

export function performanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path;
      
      // Log performance metrics
      console.log(JSON.stringify({
        type: 'performance',
        method: req.method,
        route,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
        userAgent: req.get('user-agent'),
        ip: req.ip,
      }));

      // Record custom metrics
      recordMetric('api_response_time', duration, {
        method: req.method,
        route,
        status: res.statusCode.toString(),
      });
    });

    next();
  };
}
```

## Backup and Recovery

### 1. Database Backup Strategy

```bash
# Automated daily backups
gcloud firestore export gs://ellaai-backups/$(date +%Y-%m-%d) \
  --project=ellaai-production

# Weekly full system backup
node scripts/backup-system.js --type=full --retention=4weeks

# Real-time backup to secondary region
node scripts/setup-replication.js --target-region=us-west1
```

### 2. Recovery Procedures

```bash
# Point-in-time recovery
gcloud firestore import gs://ellaai-backups/2024-01-01 \
  --project=ellaai-production

# Application recovery
node scripts/recover-system.js --backup-date=2024-01-01 --verify

# Database rollback
node scripts/rollback-database.js --to-version=v1.2.3 --confirm
```

## Rollback Procedures

### 1. Application Rollback

```bash
# Quick rollback to previous version
firebase hosting:channel:clone live previous --project ellaai-production

# Rollback functions
firebase functions:delete --project ellaai-production
firebase deploy --only functions --project ellaai-production --version=previous

# Verify rollback
npm run verify:production
```

### 2. Database Rollback

```bash
# Restore from backup
node scripts/restore-database.js --backup-id=backup-20240101 --confirm

# Verify data integrity
node scripts/verify-data-integrity.js --post-rollback
```

### 3. Emergency Procedures

```bash
# Enable maintenance mode
node scripts/maintenance-mode.js --enable --message="Emergency maintenance"

# Emergency rollback
./scripts/emergency-rollback.sh

# Disable maintenance mode
node scripts/maintenance-mode.js --disable
```

## Troubleshooting

Common deployment issues and solutions:

### Function Deployment Failures
```bash
# Check function logs
firebase functions:log --project ellaai-production

# Redeploy specific function
firebase deploy --only functions:api --project ellaai-production
```

### Database Connection Issues
```bash
# Test connectivity
node scripts/test-db-connection.js --env=production

# Check security rules
firebase firestore:rules:test --project ellaai-production
```

### Performance Issues
```bash
# Check resource usage
gcloud monitoring metrics list --project ellaai-production

# Analyze slow queries
node scripts/analyze-slow-queries.js --env=production
```

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

**Production deployment checklist complete! 🚀**

Monitor your deployment at:
- Firebase Console: https://console.firebase.google.com/project/ellaai-production
- Google Cloud Console: https://console.cloud.google.com/project/ellaai-production
- Application: https://app.ellaai.com