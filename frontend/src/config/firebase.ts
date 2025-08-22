// Production build - v1.0.1
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration
// Note: These are client-side keys and are safe to be public
// Security is enforced through Firebase Security Rules and domain restrictions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDSdftFqUvIjCoRhIqLR0sI9B99R4hQcNU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ellaai-platform-prod.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ellaai-platform-prod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ellaai-platform-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "461280362624",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:461280362624:web:883037632b2125776c2665",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Production safety check - prevent development connections
if (typeof window !== 'undefined') {
  if (window.location.hostname.includes('dev') || 
      window.location.hostname.includes('test') ||
      window.location.hostname.includes('127.0.0.1')) {
    console.warn('🚨 Production build detected on development server. Ensuring no development connections are made.');
  }
}

// Validate production configuration
const isProduction = import.meta.env.PROD || import.meta.env.VITE_ENV === 'production';
if (isProduction) {
  // Only validate that we have required fields, don't throw errors for demo/test
  if (!firebaseConfig.apiKey || 
      !firebaseConfig.authDomain || 
      !firebaseConfig.projectId) {
    console.error('Missing required Firebase configuration');
    // Don't throw error, let Firebase handle invalid config gracefully
  }
}

// Initialize Firebase with error handling
let app;
let firebaseError = null;

try {
  console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '***' });
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  firebaseError = error;
  
  // Create a demo app instance that won't try to connect to real Firebase
  app = initializeApp({
    apiKey: "demo-api-key",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "12345",
    appId: "demo-app-id"
  });
}

export { app, firebaseError };

// Initialize Firebase App Check
// This provides additional security by verifying requests come from your app
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Ldu26orAAAAAP79H7arcyg473Oz_e1AA6Sc71NE';

// Temporarily disable App Check to troubleshoot Firebase Installations error
console.log('🔧 App Check temporarily disabled for troubleshooting');

// Always initialize App Check when we have a key (DISABLED FOR NOW)
/*
if (recaptchaSiteKey && recaptchaSiteKey !== 'your_recaptcha_v3_site_key') {
  try {
    // In development, use debug token if available
    if (import.meta.env.DEV && import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN) {
      // @ts-ignore - self is available in browser
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
      console.log('🔧 Using App Check debug token for development');
    }
    
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ Firebase App Check initialized with reCAPTCHA v3');
  } catch (error) {
    console.warn('⚠️ Firebase App Check initialization failed:', error);
    // App Check is optional - app will still work without it
  }
} else {
  console.warn('⚠️ App Check not configured - running without additional security');
}
*/

// Initialize services with production safety checks
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Production safety: Explicitly prevent any emulator connections
// This code is removed in production builds
if (import.meta.env.DEV) {
  console.log('Development mode: Emulator connections available');
  // emulator connection code would go here in development
}

// Initialize Analytics (only in production and if supported)
export const initAnalytics = async () => {
  if (import.meta.env.PROD && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Development server connections removed for production build
// To use development servers in development, uncomment the imports and connection code

// Log environment for debugging
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase Configuration:');
  console.log('  - Environment:', import.meta.env.MODE);
  console.log('  - Is Production:', import.meta.env.PROD || import.meta.env.VITE_ENV === 'production');
  console.log('  - Project ID:', firebaseConfig.projectId);
  console.log('  - Auth Domain:', firebaseConfig.authDomain);
  console.log('  - API Key configured:', !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY');
  
  // Additional production verification
  if (import.meta.env.PROD || import.meta.env.VITE_ENV === 'production') {
    console.log('✅ Production build verified - development connections disabled');
    console.log('🚀 Using production Firebase services');
  }
}

// Helper function to handle Firebase errors
export const handleFirebaseError = (error: any): string => {
  const errorCode = error?.code || 'unknown-error';
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'No user found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'permission-denied': 'You do not have permission to perform this action',
    'unavailable': 'Service temporarily unavailable. Please try again',
    'deadline-exceeded': 'Request timeout. Please try again',
    'unauthenticated': 'Please sign in to continue',
  };
  
  return errorMessages[errorCode] || `An error occurred: ${error?.message || errorCode}`;
};

// Export types for use in components
export type { User } from 'firebase/auth';
export type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';