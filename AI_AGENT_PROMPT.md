# Prompt for New AI Coding Agent - EllaAI Platform Continuation

## Your Role
You are taking over development of the EllaAI Technical Assessment Platform, a production React/Firebase application for conducting technical assessments and managing recruitment processes. The application is currently deployed and functional at https://ellaai-platform-prod.web.app.

## Project Location
**Primary working directory:** `/Users/delimatsuo/Documents/Coding/EllaAI/firebase-migration/`

## Essential Reading (In Order)

1. **Read the handover document first:**
   ```
   /Users/delimatsuo/Documents/Coding/EllaAI/firebase-migration/HANDOVER_DOCUMENT.md
   ```
   This contains the complete project overview, architecture, and recent fixes.

2. **Review the AI agent instructions:**
   ```
   /Users/delimatsuo/Documents/Coding/EllaAI/CLAUDE.md
   ```
   Contains Claude Flow integration and development patterns.

3. **Check the current application state:**
   ```
   /Users/delimatsuo/Documents/Coding/EllaAI/firebase-migration/frontend/src/App.tsx
   /Users/delimatsuo/Documents/Coding/EllaAI/firebase-migration/frontend/src/main.tsx
   ```

## Current Project Status

### ✅ What's Working
- Production deployment is live and functional
- Authentication system with multi-role support
- Company management and multi-tenancy
- Assessment creation and execution
- Dashboard displays correctly
- React 18 scheduler issues have been resolved

### ⚠️ Recent Critical Fix
The application had a critical React scheduler initialization error that has been fixed. The solution involved:
1. Removing lazy loading from App component
2. Switching from esbuild to Terser minification
3. Ensuring production builds use correct JSX transform
Key files modified: `frontend/src/main.tsx`, `frontend/vite.config.ts`

### 🔍 Current Git Status
- **Branch:** release/v1.0.0-rc1
- **Many modified files** in tests and components (use `git status` to review)
- Application is working but has uncommitted changes

## Development Environment Setup

1. **Navigate to project:**
   ```bash
   cd /Users/delimatsuo/Documents/Coding/EllaAI/firebase-migration/
   ```

2. **Check git status:**
   ```bash
   git status
   ```

3. **Install dependencies if needed:**
   ```bash
   cd frontend
   npm install
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Key Commands

### Development
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production (use NODE_ENV=production)
- `npm run preview` - Preview production build locally
- `npm run test` - Run test suite
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint checking

### Deployment
- `firebase deploy --only hosting` - Deploy frontend only
- `firebase deploy --only functions` - Deploy backend only
- `firebase deploy` - Deploy everything

### Firebase Commands
- `firebase emulators:start` - Start local Firebase emulators
- `firebase functions:log` - View function logs

## Important Configuration Files

1. **Frontend Build Config:** `/frontend/vite.config.ts`
   - Contains React bundling strategy
   - Terser minification settings
   - Manual chunks configuration

2. **TypeScript Config:** `/frontend/tsconfig.json`
   - JSX set to "react-jsx"
   - Module resolution settings

3. **Firebase Config:** `/firebase.json`
   - Hosting headers and MIME types
   - Security headers configuration
   - Emulator ports

4. **Environment Variables:** `/frontend/.env.production`
   - Firebase configuration
   - API endpoints

## Critical Code Sections

### 1. Application Entry Point
**File:** `/frontend/src/main.tsx`
- Lines 6-7: Direct App import (no lazy loading)
- Lines 105-111: React root rendering
- Lines 82-166: React initialization with error handling

### 2. Build Configuration  
**File:** `/frontend/vite.config.ts`
- Lines 48-57: Terser minification config
- Lines 64-112: Manual chunks for React bundling
- Lines 8-16: React plugin configuration

### 3. Authentication Context
**File:** `/frontend/src/contexts/AuthContext.tsx`
- Manages user authentication state
- Role-based access control
- Firebase Auth integration

## Known Issues to Monitor

### Console Warnings (Non-Critical)
1. WebSocket connection failures to localhost:8080 (Firebase emulator attempts)
2. Chrome extension warnings about runtime.lastError
3. These can be ignored but could be cleaned up

### Potential Improvements
1. Bundle sizes exceed 500KB for some chunks
2. Could implement better code splitting
3. Add more comprehensive error boundaries
4. Performance optimizations with React.memo

## Testing the Application

1. **Production URL:** https://ellaai-platform-prod.web.app
2. **Login:** Use system administrator credentials
3. **Key Features to Test:**
   - User authentication
   - Dashboard statistics
   - Assessment creation
   - Company management
   - User management

## Firebase Resources

- **Console:** https://console.firebase.google.com/project/ellaai-platform-prod
- **Hosting:** Check deployment history in Firebase Console
- **Functions:** Monitor logs for API errors
- **Firestore:** Database rules and data

## Immediate Tasks You May Need to Address

1. **Review and commit changes:** There are many uncommitted changes that may need to be reviewed and committed
2. **Clean up console warnings:** Optional but would improve production quality
3. **Monitor production:** Check for any new errors in production
4. **Continue feature development:** Based on user requirements

## Communication Style for User

The user prefers:
- Direct, concise responses
- Focus on solving the immediate problem
- Show progress through actions, not long explanations
- Use TodoWrite tool to track tasks
- Deploy to production when requested (not local testing)

## Special Instructions

1. **NEVER save files to the root folder** - Always use appropriate subdirectories
2. **Prefer editing existing files** over creating new ones
3. **Don't create documentation** unless explicitly requested
4. **When deploying:** Always use `firebase deploy --only hosting` for frontend changes
5. **Build for production:** Always use `NODE_ENV=production npm run build`

## Background Processes

There may be background processes running (npm run dev, npm run serve). Check with:
```bash
ps aux | grep npm
```

## Success Criteria

Your immediate success will be measured by:
1. Maintaining the working production deployment
2. Addressing any critical bugs that arise
3. Implementing requested features
4. Keeping the codebase clean and well-organized

---

**Welcome to the EllaAI Technical Assessment Platform project!** The application is currently working in production. Your primary goal is to maintain stability while implementing any new features or fixes requested by the user. Always test thoroughly before deploying to production.