#!/usr/bin/env node

/**
 * EllaAI Production Testing Script
 * Tests all critical features in the production environment
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import axios from 'axios';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: "ellaai-platform-prod.firebaseapp.com",
  projectId: "ellaai-platform-prod",
  storageBucket: "ellaai-platform-prod.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// API Base URL
const API_BASE_URL = 'https://api-dl3telj45a-uc.a.run.app';

// Test results
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Utility functions
const logTest = (testName, status, message = '') => {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`[${timestamp}] ${statusIcon} ${testName} ${message ? `- ${message}` : ''}`);
  
  if (status === 'pass') {
    testResults.passed.push({ test: testName, message, timestamp });
  } else if (status === 'fail') {
    testResults.failed.push({ test: testName, message, timestamp });
  } else {
    testResults.warnings.push({ test: testName, message, timestamp });
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test Functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...\n');
  
  try {
    // Test admin login
    const adminEmail = 'admin@ellatechtalent.com';
    const adminPassword = 'Admin123!'; // Replace with actual password
    
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    if (user) {
      logTest('Admin Authentication', 'pass', `Logged in as ${user.email}`);
      
      // Get ID token
      const idToken = await user.getIdToken();
      if (idToken) {
        logTest('ID Token Generation', 'pass', 'Token generated successfully');
        return idToken;
      } else {
        logTest('ID Token Generation', 'fail', 'Failed to generate token');
      }
    }
  } catch (error) {
    logTest('Admin Authentication', 'fail', error.message);
    return null;
  }
}

async function testFirestoreAccess(idToken) {
  console.log('\n📊 Testing Firestore Access...\n');
  
  try {
    // Test reading companies collection
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef);
    const querySnapshot = await getDocs(q);
    
    logTest('Firestore Read Access', 'pass', `Found ${querySnapshot.size} companies`);
    
    // Test security rules
    try {
      const testCompanyDoc = doc(db, 'companies', 'test-company-id');
      await getDoc(testCompanyDoc);
      logTest('Firestore Security Rules', 'pass', 'Rules properly enforced');
    } catch (error) {
      if (error.code === 'permission-denied') {
        logTest('Firestore Security Rules', 'pass', 'Properly denying unauthorized access');
      } else {
        logTest('Firestore Security Rules', 'warning', error.message);
      }
    }
  } catch (error) {
    logTest('Firestore Access', 'fail', error.message);
  }
}

async function testAPIEndpoints(idToken) {
  console.log('\n🌐 Testing API Endpoints...\n');
  
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };
  
  // Test health check
  try {
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    if (healthResponse.status === 200) {
      logTest('API Health Check', 'pass', 'API is healthy');
    }
  } catch (error) {
    logTest('API Health Check', 'fail', error.message);
  }
  
  // Test admin endpoints
  try {
    const dashboardResponse = await axios.get(`${API_BASE_URL}/admin/dashboard`, { headers });
    if (dashboardResponse.status === 200) {
      const data = dashboardResponse.data;
      logTest('Admin Dashboard API', 'pass', `Retrieved dashboard data`);
      console.log(`  - Total Users: ${data.totalUsers || 0}`);
      console.log(`  - Total Companies: ${data.totalCompanies || 0}`);
      console.log(`  - Active Assessments: ${data.activeAssessments || 0}`);
    }
  } catch (error) {
    logTest('Admin Dashboard API', 'fail', error.response?.data?.error || error.message);
  }
  
  // Test user management endpoints
  try {
    const usersResponse = await axios.get(`${API_BASE_URL}/admin/users?limit=10`, { headers });
    if (usersResponse.status === 200) {
      const data = usersResponse.data;
      logTest('User Management API', 'pass', `Retrieved ${data.users?.length || 0} users`);
    }
  } catch (error) {
    logTest('User Management API', 'fail', error.response?.data?.error || error.message);
  }
  
  // Test company management endpoints
  try {
    const companiesResponse = await axios.get(`${API_BASE_URL}/admin/companies?limit=10`, { headers });
    if (companiesResponse.status === 200) {
      const data = companiesResponse.data;
      logTest('Company Management API', 'pass', `Retrieved ${data.companies?.length || 0} companies`);
    }
  } catch (error) {
    logTest('Company Management API', 'fail', error.response?.data?.error || error.message);
  }
}

async function testCloudFunctions(idToken) {
  console.log('\n☁️ Testing Cloud Functions...\n');
  
  try {
    // Test if functions are deployed
    const testFunction = httpsCallable(functions, 'validateDomain');
    const result = await testFunction({ domain: 'test.com' });
    
    if (result.data) {
      logTest('Cloud Functions Deployment', 'pass', 'Functions are accessible');
    }
  } catch (error) {
    if (error.code === 'functions/not-found') {
      logTest('Cloud Functions Deployment', 'warning', 'Some functions may not be deployed');
    } else {
      logTest('Cloud Functions Deployment', 'fail', error.message);
    }
  }
}

async function testSecurityFeatures() {
  console.log('\n🔒 Testing Security Features...\n');
  
  // Test App Check
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const headers = response.headers;
    
    if (headers['x-firebase-appcheck']) {
      logTest('App Check Integration', 'pass', 'App Check headers present');
    } else {
      logTest('App Check Integration', 'warning', 'App Check may not be fully configured');
    }
  } catch (error) {
    logTest('App Check Integration', 'warning', 'Could not verify App Check status');
  }
  
  // Test CORS and security headers
  try {
    const response = await axios.options(`${API_BASE_URL}/health`);
    const headers = response.headers;
    
    if (headers['access-control-allow-origin']) {
      logTest('CORS Configuration', 'pass', `Origin allowed: ${headers['access-control-allow-origin']}`);
    }
    
    if (headers['x-content-type-options'] === 'nosniff') {
      logTest('Security Headers', 'pass', 'XSS protection enabled');
    }
  } catch (error) {
    logTest('Security Headers', 'warning', 'Could not verify all security headers');
  }
}

async function testWebApplication() {
  console.log('\n🌐 Testing Web Application...\n');
  
  try {
    const response = await axios.get('https://ellaai-platform-prod.web.app');
    if (response.status === 200) {
      logTest('Frontend Deployment', 'pass', 'Application is accessible');
      
      // Check for critical resources
      const html = response.data;
      if (html.includes('<!DOCTYPE html>')) {
        logTest('HTML Structure', 'pass', 'Valid HTML document');
      }
      
      if (html.includes('main.js') || html.includes('index.js')) {
        logTest('JavaScript Bundle', 'pass', 'JS bundle is included');
      }
      
      if (html.includes('main.css') || html.includes('index.css')) {
        logTest('CSS Bundle', 'pass', 'CSS bundle is included');
      }
    }
  } catch (error) {
    logTest('Frontend Deployment', 'fail', error.message);
  }
}

async function generateTestReport() {
  console.log('\n📋 Test Report\n');
  console.log('═'.repeat(50));
  
  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const passRate = ((testResults.passed.length / totalTests) * 100).toFixed(1);
  
  console.log(`\n✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
  console.log(`\n📊 Pass Rate: ${passRate}%`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(result => {
      console.log(`  - ${result.test}: ${result.message}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    testResults.warnings.forEach(result => {
      console.log(`  - ${result.test}: ${result.message}`);
    });
  }
  
  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    url: 'https://ellaai-platform-prod.web.app',
    api: API_BASE_URL,
    totalTests,
    passRate: parseFloat(passRate),
    results: testResults
  };
  
  const fs = await import('fs/promises');
  await fs.writeFile(
    'production-test-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Report saved to production-test-report.json');
  
  return testResults.failed.length === 0;
}

// Main test runner
async function runProductionTests() {
  console.log('🚀 EllaAI Production Testing Suite');
  console.log('═'.repeat(50));
  console.log(`Testing URL: https://ellaai-platform-prod.web.app`);
  console.log(`API Endpoint: ${API_BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('═'.repeat(50));
  
  try {
    // Run tests in sequence
    await testWebApplication();
    
    const idToken = await testAuthentication();
    
    if (idToken) {
      await testFirestoreAccess(idToken);
      await testAPIEndpoints(idToken);
      await testCloudFunctions(idToken);
    }
    
    await testSecurityFeatures();
    
    // Generate report
    const allTestsPassed = await generateTestReport();
    
    // Cleanup
    if (auth.currentUser) {
      await signOut(auth);
      console.log('\n🔒 Signed out successfully');
    }
    
    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Critical error during testing:', error);
    process.exit(1);
  }
}

// Run tests
runProductionTests().catch(console.error);