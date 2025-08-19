import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthUser extends User {
  companyId?: string;
  role?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Get custom claims for role and company info
        firebaseUser.getIdTokenResult().then((idTokenResult) => {
          const customClaims = idTokenResult.claims;
          const authUser: AuthUser = {
            ...firebaseUser,
            role: customClaims.role as string,
            companyId: customClaims.companyId as string,
          };
          setUser(authUser);
          setLoading(false);
        }).catch(() => {
          // Fallback if custom claims fail
          setUser(firebaseUser as AuthUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
};