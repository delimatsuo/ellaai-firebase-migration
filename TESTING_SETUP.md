# EllaAI Platform - Testing Setup Guide

## 🚀 Quick Start for Testing

### Step 1: Access the Application
Visit: **https://ellaai-platform-prod.web.app**

### Step 2: Create Admin Account

1. **Go to the registration page:**
   ```
   https://ellaai-platform-prod.web.app/register
   ```

2. **Register with these details:**
   - Email: `admin@ellatechtalent.com`
   - Password: `EllaTech2024Admin!@#`
   - Display Name: `System Administrator`
   - Role: Select "Company" (we'll upgrade to admin after)

3. **After registration, you'll need admin privileges set up**

### Step 3: Grant Admin Privileges

Since you need admin access to fully test, use the Firebase Console:

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/ellaai-platform-prod/authentication/users
   ```

2. **Find your user** (admin@ellatechtalent.com)

3. **Copy the User UID**

4. **Set custom claims using Firebase Admin SDK or Functions:**
   
   Option A: Use the API endpoint (if available):
   ```bash
   curl -X POST https://api-dl3telj45a-uc.a.run.app/api/auth/set-claims \
     -H "Content-Type: application/json" \
     -d '{
       "uid": "YOUR_USER_UID",
       "claims": {
         "role": "admin",
         "company_id": "ellatechtalent",
         "permissions": ["all"]
       }
     }'
   ```

   Option B: Use Firebase Console Custom Claims (if extension installed)

### Step 4: Create Test Data

Once logged in as admin, you can create test data:

1. **Test Companies:**
   - TechCorp (Enterprise)
   - StartupHub (SMB)
   - InnovateLabs (Startup)

2. **Test Users:**
   | Email | Password | Role |
   |-------|----------|------|
   | recruiter@test.com | Test2024! | Recruiter |
   | manager@test.com | Test2024! | Hiring Manager |
   | candidate1@test.com | Test2024! | Candidate |
   | candidate2@test.com | Test2024! | Candidate |

3. **Test Assessments:**
   - JavaScript Developer Assessment
   - Python Full Stack Assessment
   - System Design Challenge
   - Behavioral Interview Questions

---

## 📧 Email Configuration (Firebase Extensions)

### To Enable Email Notifications:

1. **Install Firebase Email Extension:**
   ```bash
   firebase deploy --only extensions
   ```

2. **Configure SMTP (for Gmail):**
   - SMTP Server: `smtp.gmail.com`
   - Port: `587` (TLS) or `465` (SSL)
   - Username: Your Gmail address
   - Password: App-specific password (not regular password)

3. **For Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate app-specific password
   - Use this password in Firebase Extension configuration

4. **Alternative: Use Firebase's built-in email**
   - No SMTP configuration needed
   - Limited to 100 emails/day on free tier
   - Upgrade to Blaze plan for more

---

## 🧪 Testing Checklist

### Authentication Testing
- [ ] Register new account
- [ ] Login with email/password
- [ ] Password reset flow
- [ ] Logout functionality
- [ ] Session persistence

### Company Features
- [ ] Create new assessment
- [ ] Edit assessment questions
- [ ] Invite candidates
- [ ] View candidate results
- [ ] Export results (CSV)

### Candidate Features
- [ ] View available assessments
- [ ] Start assessment
- [ ] Answer questions
- [ ] Submit assessment
- [ ] View results

### Admin Features
- [ ] View all companies
- [ ] Manage users
- [ ] View audit logs
- [ ] System analytics
- [ ] User role management

### Security Testing
- [ ] Try accessing admin routes without admin role
- [ ] Test rate limiting (make many requests quickly)
- [ ] Verify CORS is working
- [ ] Check authentication on API endpoints
- [ ] Test input validation

### Performance Testing
- [ ] Page load times (< 3 seconds)
- [ ] API response times (< 1 second)
- [ ] Large data handling (100+ records)
- [ ] Concurrent user testing
- [ ] Mobile responsiveness

---

## 🔍 Testing Tools

### Browser Testing
1. **Chrome DevTools** - Network, Performance, Security tabs
2. **React Developer Tools** - Component inspection
3. **Redux DevTools** (if using Redux)

### API Testing
```bash
# Test API health
curl https://api-dl3telj45a-uc.a.run.app/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-dl3telj45a-uc.a.run.app/api/assessments
```

### Load Testing (Optional)
```bash
# Install Apache Bench
apt-get install apache2-utils

# Simple load test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://ellaai-platform-prod.web.app/
```

---

## 🐛 Bug Reporting

When you find issues, document them with:

1. **Description:** What went wrong?
2. **Steps to Reproduce:** How to recreate the issue
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happened
5. **Screenshots:** If applicable
6. **Browser/Device:** Chrome, Firefox, Safari, Mobile?
7. **Priority:** Critical, High, Medium, Low

### Bug Report Template
```markdown
**Bug Title:** [Brief description]

**Environment:** Production / Staging
**Browser:** Chrome 120 / Firefox / Safari
**User Role:** Admin / Company / Candidate

**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach if applicable]

**Priority:** Critical / High / Medium / Low
```

---

## 🌐 Domain Configuration (ellatechtalent.com)

### To connect your domain:

1. **In Firebase Console:**
   - Go to Hosting
   - Click "Add custom domain"
   - Enter: `ellatechtalent.com` and `www.ellatechtalent.com`

2. **DNS Configuration:**
   Add these records to your domain registrar:

   **For root domain (ellatechtalent.com):**
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
   
   Type: A
   Name: @
   Value: 151.101.65.195
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: ellaai-platform-prod.web.app
   ```

3. **SSL Certificate:**
   - Firebase automatically provisions SSL
   - Takes 24-48 hours to propagate

---

## 📞 Support During Testing

### Quick Links
- **Application:** https://ellaai-platform-prod.web.app
- **API Health:** https://api-dl3telj45a-uc.a.run.app/health
- **Firebase Console:** https://console.firebase.google.com/project/ellaai-platform-prod
- **GitHub:** https://github.com/delimatsuo/ellaai-firebase-migration

### Common Issues & Solutions

**Can't login?**
- Check email/password
- Clear browser cache
- Check browser console for errors

**API not responding?**
- Check if Cloud Functions are deployed
- Verify CORS settings
- Check authentication token

**Emails not sending?**
- Verify Firebase Extension is installed
- Check SMTP configuration
- Verify email templates exist

---

## ✅ Ready to Test!

1. Create your admin account
2. Set up test data
3. Run through the testing checklist
4. Document any issues found
5. Domain will be configured once DNS is updated

**Happy Testing! 🎉**