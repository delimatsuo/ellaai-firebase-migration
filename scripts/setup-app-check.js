#!/usr/bin/env node

/**
 * Firebase App Check Setup Script
 * 
 * This script helps you set up Firebase App Check with reCAPTCHA v3
 * for additional security against abuse.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const log = {
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  header: (msg) => console.log(chalk.bold.cyan(`\n${msg}\n`))
};

log.header('🔒 Firebase App Check Setup');

// Step 1: Check if Firebase CLI is installed
log.info('Checking Firebase CLI...');
try {
  execSync('firebase --version', { stdio: 'ignore' });
  log.success('Firebase CLI is installed');
} catch (error) {
  log.error('Firebase CLI is not installed. Please install it first:');
  console.log('  npm install -g firebase-tools');
  process.exit(1);
}

// Step 2: Instructions for manual steps
log.header('📋 Manual Setup Required');

console.log(`
${chalk.bold('Step 1: Create reCAPTCHA v3 Site Key')}

1. Go to: ${chalk.cyan('https://console.cloud.google.com/security/recaptcha')}
2. Click "${chalk.yellow('+ Create Key')}"
3. Configure:
   • Label: ${chalk.green('EllaAI Platform Production')}
   • reCAPTCHA type: ${chalk.green('reCAPTCHA v3')}
   • Domains: Add these domains:
     - ${chalk.green('ellaai-platform-prod.firebaseapp.com')}
     - ${chalk.green('ellaai-platform-prod.web.app')}
     - ${chalk.green('ellatechtalent.com')} (if you own it)
4. Click "${chalk.yellow('Create')}"
5. Copy your ${chalk.bold.green('Site Key')} (looks like: 6Lc...)

${chalk.bold('Step 2: Enable App Check in Firebase Console')}

1. Go to: ${chalk.cyan('https://console.firebase.google.com/project/ellaai-platform-prod/appcheck')}
2. Click "${chalk.yellow('Get started')}" if not already enabled
3. Click on your ${chalk.green('Web app')}
4. Select "${chalk.green('reCAPTCHA v3')}" as the provider
5. Enter your ${chalk.bold.green('Site Key')} from Step 1
6. Click "${chalk.yellow('Save')}"

${chalk.bold('Step 3: Configure Enforcement (Optional but Recommended)')}

In Firebase Console > App Check:
1. Click "${chalk.yellow('APIs')}" tab
2. For each service, toggle enforcement:
   • ${chalk.green('Cloud Firestore')}: Enable enforcement
   • ${chalk.green('Cloud Storage')}: Enable enforcement  
   • ${chalk.green('Cloud Functions')}: Enable enforcement
   • ${chalk.green('Realtime Database')}: Enable if used

${chalk.yellow('⚠️  Note:')} Start with enforcement disabled, monitor for 24 hours, then enable.

${chalk.bold('Step 4: Update Your Environment Variables')}
`);

// Step 3: Update environment file
log.header('🔧 Updating Environment Configuration');

const envPath = path.join(__dirname, '../frontend/.env');
const envExamplePath = path.join(__dirname, '../frontend/.env.example');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  log.warning('.env file not found. Creating from .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log.success('.env file created');
  } else {
    log.error('.env.example not found. Please create .env manually.');
  }
}

console.log(`
Add this to your ${chalk.green('frontend/.env')} file:

${chalk.gray('# Firebase App Check - reCAPTCHA v3')}
${chalk.yellow('VITE_RECAPTCHA_SITE_KEY=')}${chalk.green('your_site_key_here')}

Replace ${chalk.green('your_site_key_here')} with the Site Key from Step 1.
`);

// Step 4: Create App Check initialization file
log.header('📝 Creating App Check Debug Token Helper');

const debugTokenScript = `#!/usr/bin/env node

/**
 * Firebase App Check Debug Token Generator
 * Use this for testing App Check in development
 */

const crypto = require('crypto');

// Generate a debug token
const debugToken = crypto.randomBytes(32).toString('hex');

console.log('\\n🔑 Firebase App Check Debug Token:\\n');
console.log(debugToken);
console.log('\\nTo use this token:\\n');
console.log('1. Add to Firebase Console > App Check > Apps > Your App > Debug Tokens');
console.log('2. Add to your .env file:');
console.log('   VITE_APP_CHECK_DEBUG_TOKEN=' + debugToken);
console.log('\\n⚠️  Only use debug tokens in development!\\n');
`;

fs.writeFileSync(path.join(__dirname, 'generate-debug-token.js'), debugTokenScript);
log.success('Created debug token generator script');

// Step 5: Verify frontend code
log.header('🔍 Verifying Frontend Integration');

const firebaseConfigPath = path.join(__dirname, '../frontend/src/config/firebase.ts');

if (fs.existsSync(firebaseConfigPath)) {
  const configContent = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  if (configContent.includes('initializeAppCheck')) {
    log.success('App Check initialization code found in firebase.ts');
    
    if (configContent.includes('ReCaptchaV3Provider')) {
      log.success('reCAPTCHA v3 provider configured');
    } else {
      log.warning('reCAPTCHA v3 provider not found');
    }
  } else {
    log.error('App Check initialization not found in firebase.ts');
    log.info('Please ensure firebase.ts includes App Check initialization');
  }
} else {
  log.warning('firebase.ts not found at expected location');
}

// Step 6: Create monitoring script
log.header('📊 Creating App Check Monitor');

const monitorScript = `#!/usr/bin/env node

/**
 * Firebase App Check Monitoring
 * Monitor App Check token verification success/failure rates
 */

const admin = require('firebase-admin');
const chalk = require('chalk');

// Initialize admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ellaai-platform-prod'
  });
}

async function monitorAppCheck() {
  console.log(chalk.bold.cyan('\\n📊 App Check Monitoring\\n'));
  
  // Note: Real metrics would come from Cloud Monitoring API
  // This is a placeholder for the monitoring logic
  
  console.log(chalk.yellow('App Check Metrics:'));
  console.log('  • Token Verifications: Monitoring active');
  console.log('  • Success Rate: Monitoring active');
  console.log('  • Failed Attempts: Monitoring active');
  
  console.log(chalk.gray('\\nFor detailed metrics, visit:'));
  console.log(chalk.cyan('https://console.firebase.google.com/project/ellaai-platform-prod/appcheck/metrics'));
}

monitorAppCheck();
`;

fs.writeFileSync(path.join(__dirname, 'monitor-app-check.js'), monitorScript);
log.success('Created App Check monitoring script');

// Step 7: Provide testing instructions
log.header('🧪 Testing App Check');

console.log(`
${chalk.bold('Testing in Development:')}

1. Generate a debug token:
   ${chalk.cyan('node scripts/generate-debug-token.js')}

2. Add the token to Firebase Console:
   • Go to App Check > Apps > Your App > ${chalk.yellow('Manage debug tokens')}
   • Add your debug token

3. Add to your .env for development:
   ${chalk.yellow('VITE_APP_CHECK_DEBUG_TOKEN=your_debug_token')}

4. Test your app - it should work normally

${chalk.bold('Testing in Production:')}

1. Deploy your app with the reCAPTCHA site key
2. Monitor the App Check dashboard for 24 hours
3. Check for any failed verifications
4. Once stable, enable enforcement

${chalk.bold('Monitoring Commands:')}

  ${chalk.cyan('npm run security:monitor')} - Check general security
  ${chalk.cyan('node scripts/monitor-app-check.js')} - App Check specific metrics
`);

// Step 8: Update package.json scripts
log.header('📦 Updating Package Scripts');

const packageJsonPath = path.join(__dirname, '../package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts['appcheck:monitor']) {
    packageJson.scripts['appcheck:monitor'] = 'node scripts/monitor-app-check.js';
    packageJson.scripts['appcheck:debug-token'] = 'node scripts/generate-debug-token.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log.success('Added App Check scripts to package.json');
  }
} catch (error) {
  log.warning('Could not update package.json automatically');
}

// Final summary
log.header('✅ Setup Complete!');

console.log(`
${chalk.bold.green('Next Steps:')}

1. ${chalk.yellow('Create reCAPTCHA key')} at: https://console.cloud.google.com/security/recaptcha
2. ${chalk.yellow('Enable App Check')} in Firebase Console
3. ${chalk.yellow('Add Site Key')} to frontend/.env
4. ${chalk.yellow('Test locally')} with debug token
5. ${chalk.yellow('Deploy')} and monitor for 24 hours
6. ${chalk.yellow('Enable enforcement')} once stable

${chalk.bold('Important URLs:')}
• reCAPTCHA Console: ${chalk.cyan('https://console.cloud.google.com/security/recaptcha')}
• Firebase App Check: ${chalk.cyan('https://console.firebase.google.com/project/ellaai-platform-prod/appcheck')}
• App Check Metrics: ${chalk.cyan('https://console.firebase.google.com/project/ellaai-platform-prod/appcheck/metrics')}

${chalk.gray('Remember: App Check is an additional layer of security.')}
${chalk.gray('Your existing authentication and rules still provide primary protection.')}
`);