// Use Firebase from CDN (loaded in index.html) to bypass bundling issues
declare global {
  interface Window {
    firebase: any;
    firebaseApp: any;
    firebaseAuth: any;
    firebaseDb: any;
  }
}

let app: any;
let auth: any;
let db: any;

/**
 * A promise that resolves when Firebase is initialized from the CDN.
 * This is the core of the fix to the race condition.
 */
const firebaseInitializationPromise = new Promise<void>((resolve, reject) => {
  const timeout = 10000; // 10-second timeout for initialization
  const interval = 50; // Check every 50ms
  let elapsedTime = 0;

  const checkInterval = setInterval(() => {
    // Wait for the Firebase global object to be available from the CDN script
    if (typeof window !== 'undefined' && window.firebase) {
      clearInterval(checkInterval);

      // Initialize Firebase only if it hasn't been initialized already
      if (!window.firebase.apps.length) {
        console.log('Initializing Firebase app...');
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
        window.firebase.initializeApp(firebaseConfig);
      } else {
        console.log('Firebase app already initialized.');
      }

      // Assign the services from the global window object
      app = window.firebase.app();
      auth = window.firebase.auth();
      db = window.firebase.firestore();

      console.log('Firebase services are ready.');
      resolve();
    } else {
      elapsedTime += interval;
      if (elapsedTime >= timeout) {
        clearInterval(checkInterval);
        console.error('Firebase CDN script loading timed out.');
        reject(new Error('Firebase CDN script loading timed out.'));
      }
    }
  }, interval);
});


// Export the promise and the (currently uninitialized) services.
// The application's entry point (`main.tsx`) will await the promise,
// ensuring that `auth` and `db` are populated before the app renders.
export { app, auth, db, firebaseInitializationPromise };

// The default export is maintained for compatibility.
export default app;