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

// Check if Firebase is loaded from CDN
if (typeof window !== 'undefined' && window.firebaseAuth) {
  console.log('Using Firebase from CDN');
  app = window.firebaseApp;
  auth = window.firebaseAuth;
  db = window.firebaseDb;
} else {
  console.log('Firebase not yet loaded from CDN, creating mock objects');
  
  // Mock implementations until CDN loads
  app = { name: '[DEFAULT]' };
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: Function) => {
      // Wait for Firebase to load from CDN
      const checkInterval = setInterval(() => {
        if (window.firebaseAuth) {
          clearInterval(checkInterval);
          callback(window.firebaseAuth.currentUser);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    },
    signInWithEmailAndPassword: async (email: string, password: string) => {
      // Wait for Firebase to load
      while (!window.firebaseAuth) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return window.firebaseAuth.signInWithEmailAndPassword(email, password);
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      while (!window.firebaseAuth) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return window.firebaseAuth.createUserWithEmailAndPassword(email, password);
    },
    signOut: async () => {
      if (window.firebaseAuth) {
        return window.firebaseAuth.signOut();
      }
      return Promise.resolve();
    }
  };
  db = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          while (!window.firebaseDb) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return window.firebaseDb.collection(name).doc(id).get();
        },
        set: async (data: any) => {
          while (!window.firebaseDb) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return window.firebaseDb.collection(name).doc(id).set(data);
        }
      })
    })
  };
}

export { auth, db };
export const analytics = null;
export default app;