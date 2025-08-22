import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { authService } from '../services/authService';

// Define types for Firebase Auth (since we're using CDN version)
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken: () => Promise<string>;
  updateProfile: (profile: {displayName?: string | null; photoURL?: string | null}) => Promise<void>;
}

interface UserCredential {
  user: User;
  credential?: any;
  operationType?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'candidate' | 'recruiter' | 'hiring_manager' | 'admin' | 'system_admin';
  companyId?: string;
  companyAccess?: string[];
  emailVerified: boolean;
  createdAt?: Date;
  lastSignIn?: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, profile?: Partial<UserProfile>) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle potential Firebase initialization errors gracefully
    try {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          await loadUserProfile(firebaseUser.uid);
          
          // Create session with backend
          try {
            const idToken = await firebaseUser.getIdToken();
            await authService.createSession(idToken);
          } catch (error) {
            console.error('Failed to create session:', error);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        
        // Clear session with backend
        try {
          await authService.clearSession();
        } catch (error) {
          console.error('Failed to clear session:', error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
    } catch (error) {
      console.error('❌ Firebase Auth initialization failed:', error);
      // Set loading to false so app can continue without auth
      setLoading(false);
      
      // Return empty unsubscribe function
      return () => {};
    }
  }, []);

  const loadUserProfile = async (uid: string): Promise<void> => {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          uid,
          email: data.email || user?.email || null,
          displayName: data.displayName || user?.displayName || null,
          photoURL: data.photoURL || user?.photoURL || null,
          role: data.role || 'candidate',
          companyId: data.companyId,
          companyAccess: data.companyAccess || [],
          emailVerified: data.emailVerified || user?.emailVerified || false,
          createdAt: data.createdAt?.toDate(),
          lastSignIn: data.lastSignIn?.toDate(),
        });
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: Partial<UserProfile> = {
          uid,
          email: user?.email || null,
          displayName: user?.displayName || null,
          photoURL: user?.photoURL || null,
          role: 'candidate',
          emailVerified: user?.emailVerified || false,
        };
        
        await createUserProfile(uid, defaultProfile);
        setUserProfile(defaultProfile as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const createUserProfile = async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
    try {
      await db.collection('users').doc(uid).set({
        ...profile,
        createdAt: new Date(),
        lastSignIn: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    setLoading(true);
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    profile: Partial<UserProfile> = {}
  ): Promise<UserCredential> => {
    setLoading(true);
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update Firebase Auth profile
      if (profile.displayName) {
        await result.user.updateProfile({
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        });
      }
      
      // Create Firestore profile
      await createUserProfile(result.user.uid, {
        ...profile,
        uid: result.user.uid,
        email: result.user.email,
        displayName: profile.displayName || result.user.displayName,
        photoURL: profile.photoURL || result.user.photoURL,
      });
      
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential> => {
    setLoading(true);
    try {
      if (!window.firebase) throw new Error('Firebase not loaded');
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      
      // Create or update profile
      await createUserProfile(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: 'candidate', // Default role
        emailVerified: result.user.emailVerified,
      });
      
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      // Update Firebase Auth profile if needed
      const authUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
      if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;
      
      if (Object.keys(authUpdates).length > 0) {
        await user.updateProfile(authUpdates);
      }

      // Update Firestore profile
      await db.collection('users').doc(user.uid).set({
        ...updates,
        updatedAt: new Date(),
      }, { merge: true });

      // Refresh local profile
      await loadUserProfile(user.uid);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};