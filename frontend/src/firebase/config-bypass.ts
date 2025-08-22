// Firebase configuration with installations bypass
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDSdftFgUvJCoRhIqLRDsI9R99R4hQcNU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ellaai-platform-prod.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ellaai-platform-prod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ellaai-platform-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "461280362624",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:461280362624:web:883037632b2125776c2665"
};

// Initialize Firebase
let app;
const existingApps = getApps();

if (existingApps.length > 0) {
  app = existingApps[0];
} else {
  app = initializeApp(firebaseConfig);
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// IMPORTANT: Only connect to emulators in development
// This prevents WebSocket connections to localhost in production
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulators might already be connected
    console.log('Emulator connection skipped:', error);
  }
}

export { auth, db };
export const analytics = null;
export default app;