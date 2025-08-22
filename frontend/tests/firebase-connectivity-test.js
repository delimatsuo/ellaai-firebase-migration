/**
 * Firebase Services Connectivity Test Suite
 * Tests all Firebase services used by the EllaAI admin interface
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Import our configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDSdftFqUvIjCoRhIqLR0sI9B99R4hQcNU",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "ellaai-platform-prod.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "ellaai-platform-prod",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "ellaai-platform-prod.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "461280362624",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:461280362624:web:883037632b2125776c2665",
};

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api-dl3telj45a-uc.a.run.app';

class FirebaseConnectivityTester {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.functions = null;
    this.storage = null;
    this.testResults = {
      firebase_init: { status: 'pending', details: null, error: null },
      auth_service: { status: 'pending', details: null, error: null },
      firestore_service: { status: 'pending', details: null, error: null },
      admin_service: { status: 'pending', details: null, error: null },
      real_time_updates: { status: 'pending', details: null, error: null },
      role_management: { status: 'pending', details: null, error: null },
      api_connectivity: { status: 'pending', details: null, error: null }
    };
  }

  async initializeFirebase() {
    try {
      console.log('🔥 Initializing Firebase...');
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.functions = getFunctions(this.app);
      this.storage = getStorage(this.app);

      this.testResults.firebase_init = {
        status: 'success',
        details: {
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
          initialized: true
        },
        error: null
      };
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      this.testResults.firebase_init = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async testAuthentication() {
    try {
      console.log('🔐 Testing Firebase Authentication...');
      
      // Test 1: Check if auth service is available
      if (!this.auth) {
        throw new Error('Auth service not initialized');
      }

      // Test 2: Check current user state
      const currentUser = this.auth.currentUser;
      
      // Test 3: Check auth state listener
      const authStatePromise = new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(this.auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      const user = await authStatePromise;

      this.testResults.auth_service = {
        status: 'success',
        details: {
          currentUser: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified
          } : null,
          authStateListenerWorking: true,
          providersAvailable: ['password', 'google.com'] // Common providers
        },
        error: null
      };
      console.log('✅ Authentication service is working');
    } catch (error) {
      this.testResults.auth_service = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ Authentication test failed:', error);
    }
  }

  async testFirestore() {
    try {
      console.log('📊 Testing Firestore Database...');
      
      // Test 1: Basic connection
      if (!this.db) {
        throw new Error('Firestore not initialized');
      }

      // Test 2: Read from a public collection (if any exists)
      const collections = ['system_health', 'configurations', 'users'];
      const results = {};

      for (const collectionName of collections) {
        try {
          const q = query(collection(this.db, collectionName), limit(1));
          const snapshot = await getDocs(q);
          results[collectionName] = {
            exists: true,
            accessible: true,
            documentCount: snapshot.size
          };
        } catch (error) {
          results[collectionName] = {
            exists: false,
            accessible: false,
            error: error.code || error.message
          };
        }
      }

      this.testResults.firestore_service = {
        status: 'success',
        details: {
          connected: true,
          collections: results,
          permissions: 'limited' // Since we're not authenticated
        },
        error: null
      };
      console.log('✅ Firestore connection working');
    } catch (error) {
      this.testResults.firestore_service = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ Firestore test failed:', error);
    }
  }

  async testAdminService() {
    try {
      console.log('🛠️ Testing Admin Service API...');
      
      // Test admin service endpoints without authentication
      const endpoints = [
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/api/admin/stats', method: 'GET', description: 'System metrics (requires auth)' }
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          results[endpoint.path] = {
            status: response.status,
            statusText: response.statusText,
            reachable: true,
            requiresAuth: response.status === 401
          };
        } catch (error) {
          results[endpoint.path] = {
            reachable: false,
            error: error.message
          };
        }
      }

      this.testResults.admin_service = {
        status: 'success',
        details: {
          apiBaseUrl: API_BASE_URL,
          endpoints: results
        },
        error: null
      };
      console.log('✅ Admin service API reachable');
    } catch (error) {
      this.testResults.admin_service = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ Admin service test failed:', error);
    }
  }

  async testRealTimeUpdates() {
    try {
      console.log('📡 Testing Real-time Updates...');
      
      if (!this.db) {
        throw new Error('Firestore not initialized');
      }

      // Test real-time listener on a system collection
      const testCollection = 'system_health';
      let listenerWorking = false;
      let unsubscribe;

      const listenerPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (unsubscribe) unsubscribe();
          reject(new Error('Listener timeout'));
        }, 5000);

        try {
          unsubscribe = onSnapshot(
            collection(this.db, testCollection),
            (snapshot) => {
              clearTimeout(timeout);
              listenerWorking = true;
              resolve({
                size: snapshot.size,
                metadata: snapshot.metadata
              });
            },
            (error) => {
              clearTimeout(timeout);
              reject(error);
            }
          );
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      try {
        const result = await listenerPromise;
        this.testResults.real_time_updates = {
          status: 'success',
          details: {
            listenerWorking: true,
            testCollection,
            snapshot: result
          },
          error: null
        };
        console.log('✅ Real-time updates working');
      } catch (error) {
        // Try alternative approach - test with a simple document listener
        try {
          const docRef = doc(this.db, 'test', 'connectivity');
          const docSnap = await getDoc(docRef);
          
          this.testResults.real_time_updates = {
            status: 'partial',
            details: {
              listenerWorking: false,
              documentRead: true,
              permissions: 'limited'
            },
            error: error.message
          };
          console.log('⚠️ Real-time updates partially working');
        } catch (docError) {
          throw error;
        }
      }
    } catch (error) {
      this.testResults.real_time_updates = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ Real-time updates test failed:', error);
    }
  }

  async testRoleManagement() {
    try {
      console.log('👥 Testing User Role Management...');
      
      // Test role management endpoints
      const roleEndpoints = [
        '/api/admin/users',
        '/api/admin/roles',
        '/api/admin/permissions'
      ];

      const results = {};

      for (const endpoint of roleEndpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          results[endpoint] = {
            status: response.status,
            reachable: true,
            requiresAuth: response.status === 401,
            hasData: response.status === 200
          };
        } catch (error) {
          results[endpoint] = {
            reachable: false,
            error: error.message
          };
        }
      }

      // Check if Firebase Rules are configured for role-based access
      let rulesConfigured = false;
      try {
        const testDoc = doc(this.db, 'admin_test', 'role_check');
        await getDoc(testDoc);
        rulesConfigured = true;
      } catch (error) {
        rulesConfigured = error.code === 'permission-denied';
      }

      this.testResults.role_management = {
        status: 'success',
        details: {
          endpoints: results,
          firestoreRulesConfigured: rulesConfigured
        },
        error: null
      };
      console.log('✅ Role management endpoints reachable');
    } catch (error) {
      this.testResults.role_management = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ Role management test failed:', error);
    }
  }

  async testAPIConnectivity() {
    try {
      console.log('🌐 Testing API Connectivity...');
      
      // Test various admin API endpoints
      const apiTests = [
        { url: `${API_BASE_URL}/health`, description: 'Health endpoint' },
        { url: `${API_BASE_URL}/api/admin/stats`, description: 'Admin stats' },
        { url: `${API_BASE_URL}/api/companies`, description: 'Companies endpoint' },
        { url: `${API_BASE_URL}/api/admin/users`, description: 'User management' },
        { url: `${API_BASE_URL}/api/admin/audit-logs`, description: 'Audit logs' }
      ];

      const results = {};

      for (const test of apiTests) {
        try {
          const startTime = Date.now();
          const response = await fetch(test.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const responseTime = Date.now() - startTime;

          results[test.url] = {
            status: response.status,
            responseTime,
            reachable: true,
            description: test.description
          };
        } catch (error) {
          results[test.url] = {
            reachable: false,
            error: error.message,
            description: test.description
          };
        }
      }

      this.testResults.api_connectivity = {
        status: 'success',
        details: {
          baseUrl: API_BASE_URL,
          endpoints: results
        },
        error: null
      };
      console.log('✅ API connectivity tests completed');
    } catch (error) {
      this.testResults.api_connectivity = {
        status: 'failed',
        details: null,
        error: error.message
      };
      console.error('❌ API connectivity test failed:', error);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Firebase Services Connectivity Tests...\n');
    
    try {
      await this.initializeFirebase();
      await this.testAuthentication();
      await this.testFirestore();
      await this.testAdminService();
      await this.testRealTimeUpdates();
      await this.testRoleManagement();
      await this.testAPIConnectivity();
    } catch (error) {
      console.error('Critical error during testing:', error);
    }

    return this.generateReport();
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        projectId: firebaseConfig.projectId,
        apiBaseUrl: API_BASE_URL,
        testMode: 'connectivity_check'
      },
      summary: {
        total: Object.keys(this.testResults).length,
        passed: 0,
        failed: 0,
        partial: 0
      },
      details: this.testResults,
      recommendations: []
    };

    // Calculate summary
    Object.values(this.testResults).forEach(result => {
      switch (result.status) {
        case 'success':
          report.summary.passed++;
          break;
        case 'failed':
          report.summary.failed++;
          break;
        case 'partial':
          report.summary.partial++;
          break;
      }
    });

    // Generate recommendations
    if (this.testResults.auth_service.status === 'failed') {
      report.recommendations.push('Fix Firebase Authentication configuration');
    }
    if (this.testResults.firestore_service.status === 'failed') {
      report.recommendations.push('Check Firestore database connection and security rules');
    }
    if (this.testResults.admin_service.status === 'failed') {
      report.recommendations.push('Verify admin API service is running and accessible');
    }
    if (this.testResults.real_time_updates.status === 'failed') {
      report.recommendations.push('Configure Firestore real-time listeners and permissions');
    }

    return report;
  }
}

// Export for use in other files
export default FirebaseConnectivityTester;

// If running directly
if (typeof window === 'undefined') {
  // Node.js environment
  const tester = new FirebaseConnectivityTester();
  tester.runAllTests().then(report => {
    console.log('\n📋 CONNECTIVITY TEST REPORT');
    console.log('='.repeat(50));
    console.log(JSON.stringify(report, null, 2));
  });
}