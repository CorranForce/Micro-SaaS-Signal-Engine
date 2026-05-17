"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, role, loading } = useAuth();
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFetching(true);
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBio(data.bio || "");
          setDisplayName(data.displayName || user.displayName || "");
          setPhotoURL(data.photoURL || user.photoURL || "");
        } else {
          setDisplayName(user.displayName || "");
          setPhotoURL(user.photoURL || "");
        }
      }).catch(err => {
        console.error(err);
        toast.error("Failed to load profile data");
      }).finally(() => {
        setFetching(false);
      });
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error(`Login failed: ${error.message}`);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Try to create the user if they don't exist
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast.success("Account created and logged in!");
        } catch (createError: any) {
          toast.error(`Failed to create account: ${createError.message}`);
        }
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out");
    } catch (error: any) {
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      // Determine role: if owner email, set owner, else use existing role or default to viewer
      const userRole = user.email === "corranforce@gmail.com" ? "owner" : (role || "viewer");
      
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL,
        bio,
        role: userRole,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, profileData, { merge: true });

      // Sync to Supabase if configured
      const localSupabaseUrl = localStorage.getItem("ms-supabase-url");
      const localSupabaseKey = localStorage.getItem("ms-supabase-key");
      if (localSupabaseUrl && localSupabaseKey) {
        try {
          const { getSupabase } = await import('@/lib/supabase');
          const supabase = getSupabase(localSupabaseUrl, localSupabaseKey);
          if (supabase) {
            const { error } = await supabase.from('users').upsert({
              id: user.uid,
              email: user.email,
              display_name: displayName,
              photo_url: photoURL,
              bio,
              role: userRole,
              updated_at: profileData.updatedAt
            });
            if (error && error.message?.includes('Could not find the table')) {
              console.warn("Supabase warning: 'users' table not found. Profile saved locally but not synced.");
            } else if (error) {
              console.error("Supabase sync error:", error);
            }
          }
        } catch (e) {
          console.error("Failed to sync profile to Supabase", e);
        }
      }

      toast.success("Profile saved successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text p-8 flex items-center justify-center font-ms">
        <div className="text-ms-green animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ms-bg text-ms-text font-ms">
      <div className="border-b border-ms-border px-4 md:px-7 py-4 flex items-center justify-between bg-ms-panel">
        <div>
          <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-1 font-bold">◈ MAKER PROFILE</div>
          <div className="font-ms text-[18px] font-bold text-ms-white">YOUR IDENTITY</div>
        </div>
        <Link href="/" className="font-ms bg-transparent border border-ms-border-light text-ms-green px-4 py-2 text-[11px] cursor-pointer hover:bg-ms-panel-light transition-colors">
          ← Back to Engine
        </Link>
      </div>

      <div className="max-w-[600px] mx-auto p-4 md:p-7 mt-8">
        {!user ? (
          <div className="bg-ms-panel border border-ms-border p-8 text-center">
            <h2 className="text-white text-lg font-bold mb-2">Authentication Required</h2>
            <p className="text-ms-text-muted text-xs mb-6 leading-relaxed">
              You must be logged in to view and edit your maker profile. Your profile allows you to store your bio and identity for future launch kits.
            </p>
            
            <form onSubmit={handleEmailLogin} className="max-w-[300px] mx-auto mb-6 flex flex-col gap-3">
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Email address" 
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                required
              />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Password" 
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                required
              />
              <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-ms-green-dark border border-ms-green text-ms-green px-6 py-2.5 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors disabled:opacity-50"
              >
                {authLoading ? "LOADING..." : "LOGIN / SIGN UP"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px bg-ms-border flex-1 max-w-[100px]"></div>
              <div className="text-ms-text-muted text-[10px] font-bold">OR</div>
              <div className="h-px bg-ms-border flex-1 max-w-[100px]"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="bg-transparent border border-ms-border text-ms-text-muted px-6 py-2.5 text-xs font-bold hover:text-white hover:border-ms-border-light transition-colors"
            >
              LOGIN WITH GOOGLE
            </button>
          </div>
        ) : (
          <div className="bg-ms-panel border border-ms-border p-6">
            <div className="flex justify-between items-start mb-6 border-b border-ms-border pb-6">
              <div className="flex items-center gap-4">
                {photoURL ? (
                  <div className="relative w-16 h-16 rounded-full border-2 border-ms-green overflow-hidden">
                    <Image 
                      src={photoURL} 
                      alt="Profile" 
                      fill 
                      className="object-cover" 
                      unoptimized={!photoURL.includes('googleusercontent.com')}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-ms-green bg-ms-bg flex items-center justify-center text-ms-green text-xl font-bold">
                    {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div>
                  <div className="text-white font-bold text-lg flex items-center gap-2">
                    {displayName || "Anonymous Maker"}
                    {role && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                        role === 'owner' ? 'bg-ms-yellow-dark text-ms-yellow border border-ms-yellow' :
                        role === 'admin' ? 'bg-ms-red-dark text-ms-red border border-ms-red' :
                        role === 'maker' ? 'bg-ms-green-dark text-ms-green border border-ms-green' :
                        'bg-ms-panel-light text-ms-text-muted border border-ms-border'
                      }`}>
                        {role}
                      </span>
                    )}
                  </div>
                  <div className="text-ms-text-muted text-xs">{user.email}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-transparent border border-ms-border text-ms-text-muted px-3 py-1.5 text-[10px] hover:text-ms-red hover:border-ms-red transition-colors"
              >
                LOGOUT
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">DISPLAY NAME</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">PROFILE PICTURE URL</label>
                <input 
                  type="text" 
                  value={photoURL} 
                  onChange={e => setPhotoURL(e.target.value)}
                  className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">MAKER BIO</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)}
                  className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors min-h-[120px] resize-y"
                  placeholder="Tell the world about your skills and what you build..."
                  maxLength={1000}
                />
                <div className="text-right text-[9px] text-ms-text-muted mt-1">{bio.length}/1000</div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-ms-green-dark border border-ms-green text-ms-green px-6 py-3 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "SAVING..." : "SAVE PROFILE"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
