import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  getUserProfile,
  syncUserProfile,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  resetPassword,
  isSystemAdminEmail,
} from '../services/authService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (name: string, email: string, pass: string, studentId?: string, dept?: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        let prof = await getUserProfile(auth.currentUser.uid);
        if (!prof) {
          prof = await syncUserProfile(auth.currentUser);
        }
        setUserProfile(prof);
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          let prof = await getUserProfile(user.uid);
          if (!prof) {
            prof = await syncUserProfile(user);
          }
          setUserProfile(prof);
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
    (currentUser?.email && isSystemAdminEmail(currentUser.email))
  );

  const value: AuthContextType = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    login: async (email, pass) => {
      const prof = await loginWithEmail(email, pass);
      setUserProfile(prof);
      return prof;
    },
    register: async (name, email, pass, studentId, dept) => {
      const prof = await registerWithEmail(name, email, pass, studentId, dept);
      setUserProfile(prof);
      return prof;
    },
    loginWithGoogle: async () => {
      const prof = await loginWithGoogle();
      setUserProfile(prof);
      return prof;
    },
    logout: async () => {
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
    },
    resetPassword: async (email) => {
      await resetPassword(email);
    },
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
