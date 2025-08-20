// Production build - v1.0.1
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration
// Note: These are client-side keys and are safe to be public
// Security is enforced through Firebase Security Rules and domain restrictions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ellaai-platform-prod.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ellaai-platform-prod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ellaai-platform-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "461280362624",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:461280362624:web:883037632b2125776c2665",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase App Check
// This provides additional security by verifying requests come from your app
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Ldu26orAAAAAP79H7arcyg473Oz_e1AA6Sc71NE';

// Always initialize App Check when we have a key
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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Initialize Analytics (only in production and if supported)
export const initAnalytics = async () => {
  if (import.meta.env.PROD && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Connect to emulators ONLY in development with explicit check
if (import.meta.env.MODE === 'development' && import.meta.env.DEV === true) {
  // Extra safety check - ensure we're really in dev mode
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.startsWith('192.168.'));
  
  if (isLocalhost && !((globalThis as any).__FIREBASE_EMULATORS_CONNECTED__)) {
    // Prevent multiple connections in hot reload
    (globalThis as any).__FIREBASE_EMULATORS_CONNECTED__ = true;
    
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('Connected to Firebase emulators');
    } catch (error) {
      console.warn('Failed to connect to emulators:', error);
    }
  }
}

// Log environment for debugging
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase Configuration:');
  console.log('  - Environment:', import.meta.env.MODE);
  console.log('  - Project ID:', firebaseConfig.projectId);
  console.log('  - Auth Domain:', firebaseConfig.authDomain);
  console.log('  - API Key configured:', !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY');
  console.log('  - Using emulators:', import.meta.env.MODE === 'development');
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