# Firebase API Key Security Guide

## Understanding Firebase API Keys

The key `AIzaSyDSdftFqUvIjCoRhIqLR0sI9B99R4hQcNU` is a **Firebase Web API Key**, not a traditional Google Cloud API key. This is important to understand:

### Key Facts About Firebase API Keys:
1. **They are meant to be public** - Firebase API keys are designed to identify your project, not authenticate users
2. **They cannot be regenerated** - Unlike Google Cloud API keys, Firebase Web API keys are permanent
3. **Security comes from Firebase Security Rules** - Not from keeping the key secret

## How to Find Your Firebase API Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **EllaAI Platform Production**
3. Click the **Settings gear** ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. You'll see your Web app with the API key

## How to Secure Your Firebase Project

Since Firebase API keys are meant to be public, security is implemented differently:

### 1. ✅ Add Domain Restrictions (MOST IMPORTANT)
In Firebase Console:
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add ONLY your production domains:
   - `ellaai-platform-prod.firebaseapp.com`
   - `ellaai-platform-prod.web.app`
   - `ellatechtalent.com` (if using custom domain)
3. Remove `localhost` and any development domains

### 2. ✅ Implement Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all reads/writes
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Company-specific rules
    match /companies/{companyId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.companyId == companyId;
    }
  }
}
```

### 3. ✅ Enable Firebase App Check
This adds an additional layer of security by verifying requests come from your app:

```javascript
// In your frontend app
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

// Initialize App Check
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

### 4. ✅ Monitor Usage
1. Go to Firebase Console → **Usage and billing**
2. Set up **Budget alerts**
3. Monitor for unusual spikes in:
   - Authentication requests
   - Firestore reads/writes
   - Cloud Function invocations

### 5. ✅ Review and Restrict Google Cloud APIs
Even though the Firebase key is meant to be public, you can still restrict which APIs it can access:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find "Browser key (auto created by Firebase)"
4. Click to edit and add restrictions:
   - **Application restrictions**: HTTP referrers
   - Add your domains only
   - **API restrictions**: Select APIs to restrict
   - Choose only Firebase-related APIs

## What About the Exposed Key?

Since Firebase API keys are designed to be public:
- **The exposure itself is not a security breach**
- **However**, without proper security rules and domain restrictions, your project could be abused
- The key identifies your project but doesn't grant access by itself

## Immediate Actions Checklist

### Critical (Do Now):
- [ ] Add domain restrictions in Firebase Authentication settings
- [ ] Review and tighten Firestore Security Rules
- [ ] Check Firebase Usage dashboard for any unusual activity
- [ ] Enable budget alerts

### Important (Do Today):
- [ ] Implement Firebase App Check
- [ ] Review all Firebase Security Rules
- [ ] Audit user permissions and roles
- [ ] Set up monitoring alerts

### Good Practice (Do This Week):
- [ ] Use environment variables for configuration (even though the key is public)
- [ ] Document your security configuration
- [ ] Train team on Firebase security best practices

## The setup-admin.html File

For the `setup-admin.html` file specifically:
1. **Don't deploy it to production** - It's meant for initial setup only
2. **Use Firebase Admin SDK** for creating admin users programmatically
3. **Delete the file** after initial setup is complete

## Alternative: Secure Admin Creation

Instead of using setup-admin.html, create admin users securely:

```bash
# Use Firebase CLI
firebase auth:import users.json --hash-algo=SHA256 --rounds=8

# Or use Admin SDK in a secure server environment
const admin = require('firebase-admin');
admin.initializeApp();

async function createAdminUser() {
  const user = await admin.auth().createUser({
    email: 'admin@ellatechtalent.com',
    password: 'temporary-password',
    emailVerified: true
  });
  
  await admin.auth().setCustomUserClaims(user.uid, {
    role: 'admin',
    isSystemAdmin: true
  });
}
```

## Summary

**Your Firebase API key being public is normal**, but your project must be secured through:
1. Domain restrictions ✅
2. Security Rules ✅
3. App Check ✅
4. Monitoring ✅

The real security comes from these measures, not from hiding the API key.

## Resources
- [Firebase Security Checklist](https://firebase.google.com/docs/projects/security-checklist)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Understanding Firebase API Keys](https://firebase.google.com/docs/projects/api-keys)