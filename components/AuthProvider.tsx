"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

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
    
    let isMounted = true;
    let fallbackTimeout: NodeJS.Timeout | null = null;
    let unsubscribe: any = null;

    // Asynchronously update lastActive in Firestore
    const syncLastActive = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const lastActiveTime = user.metadata.lastSignInTime || new Date().toISOString();
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          await setDoc(docRef, {
            lastActive: lastActiveTime,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } else {
          // Default initial doc creation with 'viewer' role on first mount if none exists yet
          await setDoc(docRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            bio: '',
            role: user.email === 'corranforce@gmail.com' ? 'owner' : 'viewer',
            updatedAt: new Date().toISOString(),
            lastActive: lastActiveTime
          });
        }
      } catch (err) {
        console.error("Failed to sync lastActive to Firestore:", err);
      }
    };
    syncLastActive();

    // Hardcode owner role for the bootstrapped admin email
    if (user.email === 'corranforce@gmail.com') {
      setRole('owner');
    }

    try {
      // Add a fallback timeout in case Firestore is hanging
      fallbackTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn("Firestore onSnapshot timeout, defaulting to viewer");
          if (user.email !== 'corranforce@gmail.com') {
            setRole('viewer');
          }
          setLoading(false);
        }
      }, 5000);

      // Listen to user document to get role
      unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        if (!isMounted) return;
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          if (user.email === 'corranforce@gmail.com') {
            setRole('owner');
          } else {
            setRole((profileData.role as UserRole) || 'viewer');
          }

          // Check if auto-sync is enabled
          const autoSync = localStorage.getItem('ms-auto-sync-supabase') === 'true';
          const localSupabaseUrl = localStorage.getItem("ms-supabase-url");
          const localSupabaseKey = localStorage.getItem("ms-supabase-key");

          if (autoSync && localSupabaseUrl && localSupabaseKey) {
            try {
              const { getSupabase } = await import('@/lib/supabase');
              const supabase = getSupabase(localSupabaseUrl, localSupabaseKey);
              if (supabase) {
                const { error } = await supabase.from('users').upsert({
                  id: user.uid,
                  email: user.email,
                  display_name: profileData.displayName || user.displayName,
                  photo_url: profileData.photoURL || user.photoURL,
                  bio: profileData.bio || '',
                  role: user.email === 'corranforce@gmail.com' ? 'owner' : (profileData.role || 'viewer'),
                  updated_at: profileData.updatedAt || new Date().toISOString(),
                  last_active: profileData.lastActive || user.metadata.lastSignInTime || new Date().toISOString()
                });
                if (error && error.message?.includes('Could not find the table')) {
                  console.warn("Auto-sync: 'users' table not found in Supabase.");
                } else if (error) {
                  console.warn("Auto-sync to Supabase warning:", error);
                } else {
                  console.log("Successfully auto-synced profile to Supabase");
                }
              }
            } catch (syncErr) {
              console.warn("Failed to execute Supabase auto-sync:", syncErr);
            }
          }
        } else {
          // If no document exists yet, default to viewer until created
          if (user.email === 'corranforce@gmail.com') {
            setRole('owner');
          } else {
            setRole('viewer');
          }
        }
        setLoading(false);
      }, (error) => {
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        if (!isMounted) return;
        console.error("Error fetching user role:", error);
        setLoading(false);
      });

    } catch (e) {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      console.error("Failed to setup onSnapshot", e);
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
