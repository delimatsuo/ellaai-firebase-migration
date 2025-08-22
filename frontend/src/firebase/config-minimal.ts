// Minimal Firebase configuration without installations
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSdftFgUvJCoRhIqLRDsI9R99R4hQcNU",
  authDomain: "ellaai-platform-prod.firebaseapp.com",
  projectId: "ellaai-platform-prod",
  storageBucket: "ellaai-platform-prod.firebasestorage.app",
  messagingSenderId: "461280362624",
  appId: "1:461280362624:web:883037632b2125776c2665"
};

// Initialize Firebase app only
const app = initializeApp(firebaseConfig);

export default app;