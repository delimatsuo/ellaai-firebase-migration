# EllaAI Troubleshooting Guide

This comprehensive troubleshooting guide provides solutions to common issues encountered in the EllaAI platform across development, staging, and production environments.

## Table of Contents

- [Quick Diagnostic Commands](#quick-diagnostic-commands)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Frontend Issues](#frontend-issues)
- [Infrastructure Issues](#infrastructure-issues)
- [API Issues](#api-issues)
- [Deployment Issues](#deployment-issues)
- [Monitoring and Alerting Issues](#monitoring-and-alerting-issues)
- [Emergency Procedures](#emergency-procedures)
- [Diagnostic Tools](#diagnostic-tools)

## Quick Diagnostic Commands

### System Health Check
```bash
# Check overall system health
curl -f https://api.ellaai.com/api/health

# Check detailed health status
curl -f https://api.ellaai.com/api/health/detailed

# Check Firebase Functions status
firebase functions:log --limit 50

# Check Firestore connectivity
gcloud firestore databases list --project=ellaai-production
```

### Log Analysis
```bash
# Get recent application logs
gcloud logging read "resource.type=cloud_function" --limit=100 --format=json

# Filter error logs
gcloud logging read "severity=ERROR" --limit=50 --format=table

# Get function-specific logs
gcloud logging read "resource.labels.function_name=api" --limit=50
```

### Performance Check
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.ellaai.com/api/health

# Monitor resource usage
gcloud monitoring metrics list --filter="metric.type:compute.googleapis.com" --project=ellaai-production
```

## Common Issues and Solutions

### Issue 1: "Function deployment failed"

**Symptoms:**
- Firebase Functions deployment fails
- Error: "Build failed" or "Timeout"
- Functions not updating after deployment

**Diagnostic Steps:**
```bash
# Check function logs
firebase functions:log --project=ellaai-production

# Check deployment status
firebase deploy --only functions --project=ellaai-production --debug

# Validate function configuration
firebase functions:config:get --project=ellaai-production
```

**Solutions:**

1. **Memory/Timeout Issues:**
```javascript
// functions/src/index.ts - Increase memory and timeout
export const api = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 540
  })
  .https
  .onRequest(app);
```

2. **Build Dependencies:**
```bash
# Clear node_modules and rebuild
cd functions
rm -rf node_modules package-lock.json
npm install
npm run build
firebase deploy --only functions
```

3. **Configuration Issues:**
```bash
# Set required environment variables
firebase functions:config:set \
  api.key="your-api-key" \
  database.url="your-database-url" \
  --project=ellaai-production
```

### Issue 2: "Database connection timeout"

**Symptoms:**
- Firestore operations timeout
- Error: "Deadline exceeded"
- Slow query performance

**Diagnostic Steps:**
```bash
# Check Firestore status
gcloud firestore operations list --project=ellaai-production

# Monitor database metrics
gcloud monitoring metrics list --filter="metric.type:firestore.googleapis.com" --project=ellaai-production

# Check security rules
firebase firestore:rules:get --project=ellaai-production
```

**Solutions:**

1. **Query Optimization:**
```typescript
// Before: Inefficient query
const badQuery = db.collection('assessments')
  .where('status', '==', 'active')
  .where('createdAt', '>', yesterday); // Missing index

// After: Optimized query
const goodQuery = db.collection('assessments')
  .where('companyId', '==', companyId)
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(50);
```

2. **Connection Pooling:**
```typescript
// Implement connection pooling
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: admin.firestore.Firestore;
  
  private constructor() {
    this.db = admin.firestore();
    this.db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });
  }
  
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}
```

3. **Index Creation:**
```bash
# Create required indexes
firebase deploy --only firestore:indexes --project=ellaai-production
```

### Issue 3: "Authentication failed"

**Symptoms:**
- Users cannot log in
- JWT token verification fails
- "Invalid token" errors

**Diagnostic Steps:**
```bash
# Check Firebase Auth status
firebase auth:import --help

# Verify JWT token
curl -H "Authorization: Bearer TOKEN" https://api.ellaai.com/api/auth/verify

# Check auth configuration
firebase functions:config:get auth --project=ellaai-production
```

**Solutions:**

1. **Token Validation:**
```typescript
// Proper token validation
export async function verifyAuthToken(token: string): Promise<DecodedIdToken> {
  try {
    // Verify token with checkRevoked: true
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    
    // Check email verification
    if (!decodedToken.email_verified) {
      throw new Error('Email not verified');
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
}
```

2. **CORS Configuration:**
```typescript
// Fix CORS issues
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

3. **Clock Skew Issues:**
```bash
# Sync system clock
sudo ntpdate -s time.google.com

# Check token expiration with buffer
const CLOCK_SKEW_BUFFER = 5 * 60; // 5 minutes
if (token.exp < (Date.now() / 1000) - CLOCK_SKEW_BUFFER) {
  throw new Error('Token expired');
}
```

### Issue 4: "High API response times"

**Symptoms:**
- API responses > 2 seconds
- Timeout errors
- Poor user experience

**Diagnostic Steps:**
```bash
# Monitor API performance
curl -w "@curl-format.txt" https://api.ellaai.com/api/assessments

# Check function cold starts
gcloud logging read "textPayload:\"Function execution took\"" --limit=20

# Analyze slow queries
gcloud logging read "severity=WARNING AND textPayload:\"Slow query\"" --limit=10
```

**Solutions:**

1. **Implement Caching:**
```typescript
// Redis caching implementation
import Redis from 'ioredis';

class CacheService {
  private redis = new Redis(process.env.REDIS_URL);
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in API endpoints
app.get('/api/assessments', async (req, res) => {
  const cacheKey = `assessments:${req.user.companyId}`;
  
  // Try cache first
  let assessments = await cache.get(cacheKey);
  if (!assessments) {
    assessments = await getAssessmentsFromDB(req.user.companyId);
    await cache.set(cacheKey, assessments, 300); // 5 minutes
  }
  
  res.json(assessments);
});
```

2. **Database Query Optimization:**
```typescript
// Before: Multiple queries
async function getAssessmentWithDetails(id: string) {
  const assessment = await db.collection('assessments').doc(id).get();
  const questions = await db.collection('questions')
    .where('assessmentId', '==', id).get();
  const attempts = await db.collection('attempts')
    .where('assessmentId', '==', id).get();
  
  return { assessment, questions, attempts };
}

// After: Batch operations
async function getAssessmentWithDetailsBatch(id: string) {
  const batch = db.batch();
  const refs = [
    db.collection('assessments').doc(id),
    db.collection('questions').where('assessmentId', '==', id),
    db.collection('attempts').where('assessmentId', '==', id)
  ];
  
  const snapshots = await Promise.all(refs.map(ref => ref.get()));
  return {
    assessment: snapshots[0],
    questions: snapshots[1],
    attempts: snapshots[2]
  };
}
```

3. **Reduce Cold Starts:**
```typescript
// Keep functions warm
const functions = require('firebase-functions');

export const keepWarm = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const endpoints = [
      'https://api.ellaai.com/api/health',
      'https://api.ellaai.com/api/assessments'
    ];
    
    await Promise.all(
      endpoints.map(url => fetch(url).catch(console.error))
    );
  });
```

### Issue 5: "Frontend not loading"

**Symptoms:**
- White screen of death
- JavaScript errors in console
- Build failures

**Diagnostic Steps:**
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Check console errors
# Open browser dev tools and check Console tab

# Check network requests
# Open browser dev tools and check Network tab

# Verify deployment
firebase hosting:sites:list --project=ellaai-production
```

**Solutions:**

1. **Build Issues:**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
rm -rf dist/
npm ci
npm run build

# Check for TypeScript errors
npm run typecheck

# Fix dependency conflicts
npm audit fix --force
```

2. **Environment Variables:**
```bash
# Check environment variables are loaded
echo $VITE_FIREBASE_CONFIG

# Verify .env files
cat .env.local
cat .env.production
```

3. **Routing Issues:**
```typescript
// Fix React Router issues
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assessments/*" element={<Assessments />} />
        {/* Add catch-all route for 404s */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Performance Issues

### Memory Leaks

**Detection:**
```bash
# Monitor memory usage
node --expose-gc --inspect app.js

# Use Chrome DevTools Memory tab
# Look for increasing heap size over time
```

**Solutions:**
```typescript
// Fix common memory leaks

// 1. Remove event listeners
class ComponentWithCleanup {
  private intervalId?: NodeJS.Timeout;
  
  componentDidMount() {
    this.intervalId = setInterval(this.updateData, 1000);
  }
  
  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// 2. Clear timers and subscriptions
const useEffect(() => {
  const subscription = dataStream.subscribe(handleData);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// 3. Avoid global variables
// Instead of:
let globalData = [];

// Use:
const DataContext = createContext();
```

### Slow Database Queries

**Optimization Strategies:**
```typescript
// 1. Use compound indexes
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "companyId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}

// 2. Implement pagination
async function getPaginatedAssessments(
  companyId: string,
  pageSize: number,
  lastDoc?: DocumentSnapshot
) {
  let query = db.collection('assessments')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .limit(pageSize);
    
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return query.get();
}

// 3. Use select() for specific fields
const lightweightQuery = db.collection('assessments')
  .select('title', 'status', 'createdAt')
  .where('companyId', '==', companyId)
  .get();
```

### High CPU Usage

**Diagnosis:**
```bash
# Check CPU usage
top -p $(pgrep -f "node")

# Profile with Node.js
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

**Solutions:**
```typescript
// 1. Optimize loops
// Before: Inefficient
const processLargeArray = (items: any[]) => {
  const results = [];
  for (const item of items) {
    const processed = expensiveOperation(item);
    results.push(processed);
  }
  return results;
};

// After: Efficient with batching
const processLargeArrayOptimized = async (items: any[]) => {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => expensiveOperation(item))
    );
    results.push(...batchResults);
    
    // Allow event loop to process other tasks
    await new Promise(resolve => setImmediate(resolve));
  }
  
  return results;
};

// 2. Use caching for expensive operations
const memoize = (fn: Function) => {
  const cache = new Map();
  return (...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const expensiveOperationCached = memoize(expensiveOperation);
```

## Security Issues

### CSRF Token Validation Failures

**Symptoms:**
- Form submissions fail with 403 errors
- "Invalid CSRF token" messages

**Solutions:**
```typescript
// 1. Ensure token is included in requests
// Frontend
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

fetch('/api/assessments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});

// 2. Fix token generation
// Backend
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(sessionToken: string, requestToken: string): boolean {
  if (!sessionToken || !requestToken) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(sessionToken, 'hex'),
    Buffer.from(requestToken, 'hex')
  );
}
```

### JWT Token Issues

**Common Problems and Solutions:**
```typescript
// 1. Token expiration handling
export class TokenManager {
  private refreshThreshold = 5 * 60 * 1000; // 5 minutes
  
  async getValidToken(): Promise<string> {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token) {
      throw new Error('No token found');
    }
    
    const decoded = this.decodeToken(token);
    const now = Date.now() / 1000;
    
    // Refresh if token expires in less than 5 minutes
    if (decoded.exp - now < this.refreshThreshold / 1000) {
      return this.refreshToken(refreshToken);
    }
    
    return token;
  }
  
  private async refreshToken(refreshToken: string): Promise<string> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const { token } = await response.json();
    localStorage.setItem('token', token);
    return token;
  }
}

// 2. Handle clock skew
const CLOCK_SKEW_TOLERANCE = 30; // 30 seconds

function isTokenValid(token: any): boolean {
  const now = Math.floor(Date.now() / 1000);
  return token.exp > (now - CLOCK_SKEW_TOLERANCE) && 
         token.iat < (now + CLOCK_SKEW_TOLERANCE);
}
```

## Database Issues

### Firestore Security Rules Blocking Requests

**Debugging Rules:**
```bash
# Test security rules
firebase firestore:rules:test --test-suite=tests/firestore.rules.test.js

# Check rule evaluation
gcloud logging read "protoPayload.serviceName=firestore.googleapis.com AND protoPayload.methodName=google.firestore.v1.Firestore.RunQuery" --limit=10
```

**Common Rule Fixes:**
```javascript
// Fix: Allow proper company access
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check company membership
    function belongsToCompany(companyId) {
      return request.auth != null 
        && request.auth.token.companyId == companyId;
    }
    
    // Fix: Ensure user can access their company's data
    match /assessments/{assessmentId} {
      allow read, write: if belongsToCompany(resource.data.companyId)
        && hasRole(['admin', 'recruiter']);
      
      // Allow candidates to read assigned assessments
      allow read: if request.auth != null
        && request.auth.uid in resource.data.candidates;
    }
    
    // Fix: Add proper validation
    function isValidAssessment() {
      return request.resource.data.keys().hasAll(['title', 'companyId'])
        && request.resource.data.title is string
        && request.resource.data.title.size() > 0;
    }
    
    match /assessments/{assessmentId} {
      allow create: if belongsToCompany(request.resource.data.companyId)
        && hasRole(['admin', 'recruiter'])
        && isValidAssessment();
    }
  }
}
```

### Data Consistency Issues

**Solutions:**
```typescript
// 1. Use transactions for atomic updates
export async function updateAssessmentWithAttempts(
  assessmentId: string,
  updates: any,
  newAttempt: any
) {
  const db = admin.firestore();
  
  await db.runTransaction(async (transaction) => {
    const assessmentRef = db.collection('assessments').doc(assessmentId);
    const attemptRef = db.collection('attempts').doc();
    
    // Read current data
    const assessmentDoc = await transaction.get(assessmentRef);
    if (!assessmentDoc.exists) {
      throw new Error('Assessment not found');
    }
    
    // Perform atomic updates
    transaction.update(assessmentRef, updates);
    transaction.set(attemptRef, {
      ...newAttempt,
      assessmentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

// 2. Implement retry logic for temporary failures
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries && isRetryableError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

function isRetryableError(error: any): boolean {
  return error.code === 'UNAVAILABLE' ||
         error.code === 'DEADLINE_EXCEEDED' ||
         error.code === 'RESOURCE_EXHAUSTED';
}
```

## Emergency Procedures

### System Outage Response

**Immediate Actions (First 5 minutes):**
```bash
# 1. Check system status
curl -f https://api.ellaai.com/api/health

# 2. Check recent deployments
firebase deploy:history --project=ellaai-production

# 3. Check error rates
gcloud logging read "severity=ERROR" --limit=20 --format=table

# 4. Notify team
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 SYSTEM OUTAGE DETECTED - EllaAI API is down"}' \
  $SLACK_WEBHOOK_URL
```

**Rollback Procedure:**
```bash
#!/bin/bash
# Emergency rollback script

echo "🚨 Starting emergency rollback..."

# 1. Get last known good deployment
LAST_GOOD_VERSION=$(firebase deploy:history --project=ellaai-production --limit=5 | grep "success" | head -1 | awk '{print $1}')

echo "Rolling back to version: $LAST_GOOD_VERSION"

# 2. Rollback functions
firebase deploy --only functions --project=ellaai-production --version=$LAST_GOOD_VERSION

# 3. Rollback hosting
firebase deploy --only hosting --project=ellaai-production --version=$LAST_GOOD_VERSION

# 4. Verify rollback
sleep 30
if curl -f https://api.ellaai.com/api/health > /dev/null 2>&1; then
  echo "✅ Rollback successful"
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Emergency rollback completed successfully"}' \
    $SLACK_WEBHOOK_URL
else
  echo "❌ Rollback failed"
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"❌ Emergency rollback failed - manual intervention required"}' \
    $SLACK_WEBHOOK_URL
fi
```

### Data Recovery

**Database Backup Recovery:**
```bash
# 1. List available backups
gcloud firestore operations list --project=ellaai-production

# 2. Restore from backup
gcloud firestore import gs://ellaai-backups/2024-01-01 \
  --project=ellaai-production

# 3. Verify data integrity
node scripts/verify-data-integrity.js --post-restore
```

**Point-in-Time Recovery:**
```bash
# If using additional database backups
mongorestore --host localhost:27017 \
  --db ellaai \
  --drop \
  /path/to/backup/2024-01-01

# Verify specific collections
mongosh ellaai --eval "db.assessments.count()"
mongosh ellaai --eval "db.users.count()"
```

### Security Incident Response

**Breach Response Checklist:**
```bash
# 1. Immediate containment
# Disable affected user accounts
firebase auth:import disabled-users.json --project=ellaai-production

# 2. Revoke all sessions
# Force all users to re-authenticate
node scripts/revoke-all-sessions.js

# 3. Change all secrets
# Rotate API keys
firebase functions:config:set api.key="NEW_SECRET" --project=ellaai-production

# 4. Enable additional logging
firebase functions:config:set security.enhanced_logging=true --project=ellaai-production

# 5. Deploy security updates
firebase deploy --only functions --project=ellaai-production
```

## Diagnostic Tools

### Log Analysis Scripts

```bash
#!/bin/bash
# log-analyzer.sh - Analyze application logs for common issues

# Function to analyze error patterns
analyze_errors() {
  echo "🔍 Analyzing error patterns..."
  gcloud logging read "severity=ERROR" \
    --limit=100 \
    --format="value(timestamp, jsonPayload.error.type, jsonPayload.error.message)" \
    --project=ellaai-production | \
    sort | uniq -c | sort -nr | head -10
}

# Function to analyze slow queries
analyze_slow_queries() {
  echo "🐌 Analyzing slow queries..."
  gcloud logging read "jsonPayload.type=\"slow_query\"" \
    --limit=50 \
    --format="value(timestamp, jsonPayload.collection, jsonPayload.duration)" \
    --project=ellaai-production
}

# Function to analyze API performance
analyze_api_performance() {
  echo "📊 Analyzing API performance..."
  gcloud logging read "jsonPayload.type=\"api_request\"" \
    --limit=100 \
    --format="value(jsonPayload.endpoint, jsonPayload.duration, jsonPayload.statusCode)" \
    --project=ellaai-production | \
    awk '{
      endpoint=$1; duration=$2; status=$3
      sum[endpoint] += duration
      count[endpoint]++
      if (status >= 400) errors[endpoint]++
    } 
    END {
      for (e in sum) {
        avg = sum[e]/count[e]
        error_rate = (errors[e] ? errors[e] : 0) / count[e] * 100
        printf "%-50s | Avg: %6.0fms | Calls: %4d | Error Rate: %5.1f%%\n", e, avg, count[e], error_rate
      }
    }' | sort -k4 -nr
}

# Run all analyses
echo "🏥 EllaAI Health Check - $(date)"
echo "================================"
analyze_errors
echo ""
analyze_slow_queries
echo ""
analyze_api_performance
```

### Performance Monitoring Script

```typescript
// performance-monitor.ts - Monitor system performance
import { MonitoringServiceClient } from '@google-cloud/monitoring';

export class PerformanceMonitor {
  private monitoring = new MonitoringServiceClient();
  private projectPath = this.monitoring.projectPath(process.env.GOOGLE_CLOUD_PROJECT!);

  async checkSystemHealth(): Promise<HealthReport> {
    const [
      cpuMetrics,
      memoryMetrics,
      latencyMetrics,
      errorRateMetrics
    ] = await Promise.all([
      this.getCPUMetrics(),
      this.getMemoryMetrics(),
      this.getLatencyMetrics(),
      this.getErrorRateMetrics()
    ]);

    const health: HealthReport = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuMetrics.current,
        threshold: 80,
        status: cpuMetrics.current < 80 ? 'healthy' : 'warning'
      },
      memory: {
        usage: memoryMetrics.current,
        threshold: 85,
        status: memoryMetrics.current < 85 ? 'healthy' : 'critical'
      },
      latency: {
        p95: latencyMetrics.p95,
        threshold: 2000,
        status: latencyMetrics.p95 < 2000 ? 'healthy' : 'warning'
      },
      errorRate: {
        rate: errorRateMetrics.rate,
        threshold: 0.05,
        status: errorRateMetrics.rate < 0.05 ? 'healthy' : 'critical'
      }
    };

    // Generate alerts if needed
    await this.generateAlertsIfNeeded(health);

    return health;
  }

  private async generateAlertsIfNeeded(health: HealthReport) {
    const criticalIssues = Object.entries(health)
      .filter(([key, value]) => typeof value === 'object' && value.status === 'critical')
      .map(([key]) => key);

    if (criticalIssues.length > 0) {
      await this.sendCriticalAlert(criticalIssues, health);
    }
  }
}

// Usage
const monitor = new PerformanceMonitor();
const healthReport = await monitor.checkSystemHealth();
console.log('System Health:', healthReport);
```

### Database Diagnostic Tool

```typescript
// database-diagnostics.ts
export class DatabaseDiagnostics {
  private db = admin.firestore();

  async runDiagnostics(): Promise<DiagnosticsReport> {
    const results = await Promise.allSettled([
      this.checkConnectivity(),
      this.analyzeQueryPerformance(),
      this.checkIndexUsage(),
      this.analyzeBillingUsage()
    ]);

    return {
      connectivity: results[0].status === 'fulfilled' ? results[0].value : null,
      queryPerformance: results[1].status === 'fulfilled' ? results[1].value : null,
      indexUsage: results[2].status === 'fulfilled' ? results[2].value : null,
      billing: results[3].status === 'fulfilled' ? results[3].value : null,
      timestamp: new Date().toISOString()
    };
  }

  private async checkConnectivity(): Promise<ConnectivityResult> {
    const startTime = Date.now();
    
    try {
      await this.db.collection('_health_check').limit(1).get();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime,
        healthy: responseTime < 1000
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        healthy: false,
        error: error.message
      };
    }
  }

  private async analyzeQueryPerformance(): Promise<QueryPerformanceResult> {
    // This would require custom implementation based on your logging
    // For demonstration, we'll simulate analysis
    const collections = ['assessments', 'users', 'companies', 'candidates'];
    const results: QueryStats[] = [];

    for (const collection of collections) {
      const startTime = Date.now();
      try {
        const snapshot = await this.db.collection(collection).limit(1).get();
        const responseTime = Date.now() - startTime;
        
        results.push({
          collection,
          responseTime,
          documentCount: snapshot.size,
          healthy: responseTime < 500
        });
      } catch (error) {
        results.push({
          collection,
          responseTime: Date.now() - startTime,
          documentCount: 0,
          healthy: false,
          error: error.message
        });
      }
    }

    return {
      collections: results,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      healthyCollections: results.filter(r => r.healthy).length
    };
  }
}
```

---

## Getting Help

### Internal Support

- **Development Issues**: Create GitHub issue with `bug` label
- **Production Incidents**: Contact on-call engineer via PagerDuty
- **Security Issues**: Email security@ellaai.com immediately

### External Resources

- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Support**: https://cloud.google.com/support
- **Community Forums**: Stack Overflow with `ellaai` tag

### Emergency Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Security Team**: security@ellaai.com
- **Infrastructure Team**: infra@ellaai.com

Remember to always follow the incident response procedures and document any issues for future reference.