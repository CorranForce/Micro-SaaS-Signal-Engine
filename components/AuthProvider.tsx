"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export type UserRole = 'owner' | 'admin' | 'maker' | 'viewer' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("AuthProvider rendering");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Hardcode owner role for the bootstrapped admin email
    if (user.email === 'corranforce@gmail.com') {
      setRole('owner');
      setLoading(false);
      return;
    }

    let isMounted = true;

    try {
      // Listen to user document to get role
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setRole(docSnap.data().role as UserRole);
        } else {
          // If no document exists yet, default to viewer until created
          setRole('viewer');
        }
        setLoading(false);
      }, (error) => {
        if (!isMounted) return;
        console.error("Error fetching user role:", error);
        setLoading(false);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.error("Failed to setup onSnapshot", e);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
