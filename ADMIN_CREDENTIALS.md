# EllaAI Platform - System Admin Credentials

## 🔐 System Administrator Access

### Production URL
- **Application:** https://ellaai-platform-prod.web.app
- **Domain (pending):** ellatechtalent.com

### Default Admin Credentials
```
Email: admin@ellatechtalent.com
Password: EllaTech2024Admin!@#
```

### First Login Instructions

1. **Access the platform:**
   ```
   https://ellaai-platform-prod.web.app/login
   ```

2. **Create Admin Account:**
   Since this is a fresh deployment, you'll need to:
   - Click "Register" 
   - Create account with email: `admin@ellatechtalent.com`
   - Use the password above
   - After registration, I'll update your role to 'admin' in Firebase

3. **Alternative: Direct Firebase Setup**
   ```bash
   # Create admin user via Firebase CLI
   firebase auth:import users.json --hash-algo=SHA256 --project=ellaai-platform-prod
   ```

### Setting Admin Role

After creating the account, run this command to grant admin privileges:

```bash
# Set custom claims for admin user
curl -X POST https://api-dl3telj45a-uc.a.run.app/api/auth/set-claims \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "[USER_UID_FROM_FIREBASE]",
    "claims": {
      "role": "admin",
      "permissions": ["all"]
    }
  }'
```

Or use Firebase Admin SDK:
```javascript
admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  company_id: 'ellatechtalent',
  permissions: ['all']
});
```

### Test User Accounts (to be created)

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@ellatechtalent.com | EllaTech2024Admin!@# | System administration |
| Recruiter | recruiter@ellatechtalent.com | Recruiter2024Test! | Create assessments |
| Hiring Manager | manager@ellatechtalent.com | Manager2024Test! | Review candidates |
| Candidate | candidate@ellatechtalent.com | Candidate2024Test! | Take assessments |

### Admin Capabilities

As admin, you can:
- ✅ Access all company data
- ✅ Create/modify assessments
- ✅ Manage users and roles
- ✅ View all analytics
- ✅ Access audit logs
- ✅ Configure system settings
- ✅ Manage billing (when enabled)

### Security Notes

⚠️ **IMPORTANT:**
1. Change the admin password after first login
2. Enable 2FA when available
3. This file should be deleted after setup
4. Never commit credentials to version control

---

## 📧 Email Configuration (Firebase Extensions)

The Firebase Email Extension will be configured to use Firebase's built-in email service.

### Email Templates Available
- Welcome email
- Assessment invitation
- Assessment completed
- Password reset
- Results notification

---

**Note:** Delete this file after setting up admin access for security.