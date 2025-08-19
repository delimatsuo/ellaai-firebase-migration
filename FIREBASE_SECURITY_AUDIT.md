# 🔒 Firebase Security Audit & Configuration Guide

## Current Security Analysis

### ✅ Firestore Rules Analysis
Your current `firestore.rules` file shows **GOOD security practices**:
- ✅ Authentication required for all operations
- ✅ Role-based access control implemented
- ✅ Multi-tenant isolation (company-based access)
- ✅ Support session validation for "Acting As" mode
- ✅ Immutable audit logs
- ✅ Default deny rule at the end

### ⚠️ Potential Issues to Address:

1. **Support Session Function Vulnerability**
   - The `getActiveSupportSession()` function uses a predictable pattern
   - Consider using a more secure session lookup method

2. **Missing Rate Limiting**
   - No rate limiting rules visible
   - Could lead to abuse/DoS attacks

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Configure Domain Restrictions in Firebase Console

**Steps to follow:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **EllaAI Platform Production**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. **REMOVE** these domains if present:
   - `localhost`
   - `127.0.0.1`
   - Any development domains
5. **KEEP ONLY** these domains:
   - `ellaai-platform-prod.firebaseapp.com`
   - `ellaai-platform-prod.web.app`
   - `ellatechtalent.com` (if you own it)

### 2. Enable Firebase App Check

**In Firebase Console:**
1. Go to **App Check** section
2. Click **Get started**
3. Register your web app
4. Choose **reCAPTCHA v3** as provider
5. Get your site key

**In your frontend code:**
```javascript
// frontend/src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

// Initialize App Check - ADD THIS
if (process.env.NODE_ENV === 'production') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
```

### 3. Review Storage Security Rules

**Check Firebase Storage Rules:**
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Company assets
    match /companies/{companyId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.companyId == companyId &&
                   request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Set Up Budget Alerts

**In Google Cloud Console:**
1. Go to **Billing** → **Budgets & alerts**
2. Create a budget for your project
3. Set threshold alerts at:
   - 50% - Warning
   - 80% - Critical
   - 100% - Immediate action
4. Add your email for notifications

### 5. Enhanced Firestore Rules (Recommended Improvements)

```javascript
// Enhanced firestore.rules with rate limiting and better session management
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Rate limiting helper
    function rateLimit(requests, seconds) {
      return request.time > resource.data.lastWrite + duration.value(seconds, 's');
    }
    
    // Improved support session check
    function isActingAsCompany(companyId) {
      return exists(/databases/$(database)/documents/support-sessions/$(request.auth.token.supportSessionId)) &&
             get(/databases/$(database)/documents/support-sessions/$(request.auth.token.supportSessionId)).data.targetCompanyId == companyId &&
             get(/databases/$(database)/documents/support-sessions/$(request.auth.token.supportSessionId)).data.status == 'active' &&
             get(/databases/$(database)/documents/support-sessions/$(request.auth.token.supportSessionId)).data.expiresAt > request.time;
    }
    
    // Add IP-based rate limiting for sensitive operations
    match /assessment-attempts/{attemptId} {
      allow create: if request.auth != null && 
                    request.resource.data.candidateId == request.auth.uid &&
                    rateLimit(1, 60); // One attempt per minute
    }
    
    // Rest of your existing rules...
  }
}
```

## 📊 Security Monitoring Dashboard

### Set up these monitors in Firebase Console:

1. **Authentication Monitor**
   - Failed login attempts > 10 per hour → Alert
   - New user registrations > 100 per day → Alert
   - Password reset requests > 50 per hour → Alert

2. **Firestore Monitor**
   - Reads > 50,000 per day → Warning
   - Reads > 100,000 per day → Critical
   - Writes > 20,000 per day → Warning
   - Deletes > 1,000 per day → Critical

3. **Cloud Functions Monitor**
   - Invocations > 10,000 per day → Warning
   - Error rate > 1% → Alert
   - Execution time > 10 seconds → Warning

## 🛡️ Additional Security Measures

### 1. Enable Security Headers
Add to your `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com"
          }
        ]
      }
    ]
  }
}
```

### 2. Implement Custom Claims for Roles
```javascript
// In your Cloud Function
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles');
  }
  
  // Set custom claims
  await admin.auth().setCustomUserClaims(data.userId, {
    role: data.role,
    companyId: data.companyId,
    permissions: data.permissions
  });
  
  return { success: true };
});
```

### 3. Implement Session Management
```javascript
// Force token refresh after role changes
await firebase.auth().currentUser.getIdToken(true);
```

## 📋 Security Checklist

### Immediate (Do Right Now):
- [ ] Remove localhost from authorized domains
- [ ] Check Firebase usage dashboard for anomalies
- [ ] Enable budget alerts ($100 initial limit recommended)
- [ ] Review recent authentication logs

### Today:
- [ ] Enable Firebase App Check
- [ ] Update Storage security rules
- [ ] Add security headers to firebase.json
- [ ] Test all security rules with Firebase emulator

### This Week:
- [ ] Implement rate limiting in security rules
- [ ] Set up monitoring alerts
- [ ] Create security runbook for team
- [ ] Schedule regular security audits

## 🔍 How to Check Current Settings

### 1. Check Authorized Domains:
```bash
firebase auth:export users.json --project ellaai-platform-prod
# Review the authorized domains in Firebase Console
```

### 2. Test Security Rules:
```bash
# Use Firebase emulator to test rules
firebase emulators:start
# Run your security rule tests
npm run test:security
```

### 3. Monitor Current Usage:
- Firebase Console → Usage and billing
- Look for:
  - Unusual spikes in reads/writes
  - High error rates
  - Unexpected geographic distribution

## 🚨 Signs of Abuse to Watch For

1. **Sudden spike in Firestore operations**
   - Normal: ~1000 reads/day
   - Suspicious: >10,000 reads/hour

2. **Mass user registrations**
   - Normal: <50 users/day
   - Suspicious: >100 users/hour

3. **Unusual geographic access**
   - Check Firebase Analytics for unexpected countries

4. **High bandwidth usage**
   - Check Storage bandwidth metrics

## 📞 Emergency Response Plan

If you detect abuse:

1. **Immediate Actions:**
   ```bash
   # Disable new user registration temporarily
   firebase auth:import --disable-auto-verify-email
   
   # Enable stricter security rules
   firebase deploy --only firestore:rules
   ```

2. **Investigate:**
   - Check audit logs
   - Review recent user registrations
   - Analyze traffic patterns

3. **Remediate:**
   - Block suspicious IPs in Cloud Armor
   - Delete spam accounts
   - Tighten security rules

## 📚 Resources

- [Firebase Security Checklist](https://firebase.google.com/docs/projects/security-checklist)
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [Security Rules Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [Firebase Pricing Calculator](https://firebase.google.com/pricing)

---

**Remember:** The API key exposure itself isn't critical for Firebase, but proper domain restrictions and security rules are ESSENTIAL to prevent abuse and unexpected charges.