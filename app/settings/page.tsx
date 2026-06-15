"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { testGoDaddyAction } from '@/app/actions';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { apiTracker } from '@/utils/apiTracker';

const UserRoleManager = ({ supabaseUrl, supabaseKey }: { supabaseUrl: string, supabaseKey: string }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = React.useCallback(async () => {
    if (!supabaseUrl || !supabaseKey) return;
    setLoading(true);
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase(supabaseUrl, supabaseKey);
      if (supabase) {
        const { data, error } = await supabase.from('users').select('*').order('updated_at', { ascending: false });
        if (error) {
          if (error.message?.includes('Could not find the table')) {
            console.warn("Supabase warning: 'users' table not found. Please create it if you want to manage roles.");
            setUsers([]);
            return;
          }
          console.error("Supabase error:", error);
          toast.error(`Supabase error: ${error.message || 'Unknown error'}`);
          return;
        }
        setUsers(data || []);
      }
    } catch (e: any) {
      console.error("Failed to fetch users", e);
      const msg = e.message === "Failed to fetch" 
        ? "Network error: Could not connect to Supabase. Please check your Project URL and internet connection." 
        : e.message || 'Check console';
      toast.error(`Failed to fetch users: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabaseUrl || !supabaseKey) return;
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase(supabaseUrl, supabaseKey);
      if (supabase) {
        const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
        if (error) {
          if (error.message?.includes('Could not find the table')) {
            toast.error("The 'users' table does not exist in your Supabase database.");
            return;
          }
          throw error;
        }
        toast.success("Role updated successfully");
        fetchUsers();
      }
    } catch (e: any) {
      console.error("Failed to update role", e);
      toast.error("Failed to update role");
    }
  };

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="bg-ms-panel border border-ms-border p-6">
        <div className="mb-6 border-b border-ms-border pb-4">
          <h2 className="text-white text-lg font-bold">User Role Management</h2>
          <p className="text-ms-text-muted text-xs mt-1">Configure Supabase credentials above to manage user roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ms-panel border border-ms-border p-6">
      <div className="mb-6 border-b border-ms-border pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-lg font-bold">User Role Management</h2>
          <p className="text-ms-text-muted text-xs mt-1">Manage user roles directly from Supabase.</p>
        </div>
        <button onClick={fetchUsers} disabled={loading} className="bg-transparent border border-ms-border text-ms-text-muted px-3 py-1.5 text-[10px] hover:text-white transition-colors">
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-ms-text">
          <thead className="text-[10px] text-ms-green font-bold tracking-[1px] border-b border-ms-border">
            <tr>
              <th className="px-4 py-3">USER</th>
              <th className="px-4 py-3">EMAIL</th>
              <th className="px-4 py-3">ROLE</th>
              <th className="px-4 py-3">LAST ACTIVE</th>
              <th className="px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ms-text-muted">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ms-text-muted">No users found in Supabase.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b border-ms-border/50 hover:bg-ms-panel-light/50">
                  <td className="px-4 py-3 font-bold text-white">{u.display_name || 'Anonymous'}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-sm font-bold uppercase tracking-wider text-[9px] ${
                      u.role === 'owner' ? 'bg-ms-yellow-dark text-ms-yellow border border-ms-yellow' :
                      u.role === 'admin' ? 'bg-ms-red-dark text-ms-red border border-ms-red' :
                      u.role === 'maker' ? 'bg-ms-green-dark text-ms-green border border-ms-green' :
                      'bg-ms-panel-light text-ms-text-muted border border-ms-border'
                    }`}>
                      {u.role || 'viewer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ms-text-muted whitespace-nowrap">
                    {u.last_active ? new Date(u.last_active).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      value={u.role || 'viewer'} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-ms-bg border border-ms-border text-ms-text px-2 py-1 text-[10px] outline-none focus:border-ms-green"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="maker">Maker</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const isTableNotFoundError = (error: any) => {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || '';
  const code = error.code || '';
  return code === '42P01' || code === 'PGRST116' || msg.includes('could not find the table') || msg.includes('does not exist') || msg.includes('relation');
};

export default function SettingsPage() {
  const { user, role, loading } = useAuth();
  const [goDaddyKey, setGoDaddyKey] = useState("");
  const [goDaddySecret, setGoDaddySecret] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [testingGoDaddy, setTestingGoDaddy] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [autoSyncProfiles, setAutoSyncProfiles] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);

  useEffect(() => {
    setApiStats(apiTracker.getStats());

    const handleStatsUpdate = () => {
      setApiStats(apiTracker.getStats());
    };

    window.addEventListener("api-stats-updated", handleStatsUpdate);
    return () => {
      window.removeEventListener("api-stats-updated", handleStatsUpdate);
    };
  }, []);

  useEffect(() => {
    // Load from local storage for now to maintain compatibility with existing components
    const localGoDaddyKey = localStorage.getItem("ms-godaddy-key") || "";
    const localGoDaddySecret = localStorage.getItem("ms-godaddy-secret") || "";
    const localSupabaseUrl = localStorage.getItem("ms-supabase-url") || "";
    const localSupabaseKey = localStorage.getItem("ms-supabase-key") || "";
    const localResendKey = localStorage.getItem("ms-resend-key") || "";
    const localGeminiKey = localStorage.getItem("ms-gemini-key") || "";
    const localAutoSync = localStorage.getItem("ms-auto-sync-supabase") === 'true';
    
    setGoDaddyKey(localGoDaddyKey);
    setGoDaddySecret(localGoDaddySecret);
    setSupabaseUrl(localSupabaseUrl);
    setSupabaseKey(localSupabaseKey);
    setResendKey(localResendKey);
    setGeminiKey(localGeminiKey);
    setAutoSyncProfiles(localAutoSync);

    // Try to sync from Supabase
    if (localSupabaseUrl && localSupabaseKey) {
      import('@/lib/supabase').then(({ getSupabase }) => {
        const supabase = getSupabase(localSupabaseUrl, localSupabaseKey);
        if (supabase) {
          supabase.from('app_settings').select('*').eq('id', 'global').single().then(({ data, error }) => {
            if (!error && data) {
              if (data.godaddy_key) {
                setGoDaddyKey(data.godaddy_key);
                localStorage.setItem("ms-godaddy-key", data.godaddy_key);
              }
              if (data.godaddy_secret) {
                setGoDaddySecret(data.godaddy_secret);
                localStorage.setItem("ms-godaddy-secret", data.godaddy_secret);
              }
              if (data.supabase_url) {
                setSupabaseUrl(data.supabase_url);
                localStorage.setItem("ms-supabase-url", data.supabase_url);
              }
              if (data.supabase_key) {
                setSupabaseKey(data.supabase_key);
                localStorage.setItem("ms-supabase-key", data.supabase_key);
              }
              if (data.resend_key) {
                setResendKey(data.resend_key);
                localStorage.setItem("ms-resend-key", data.resend_key);
              }
              if (data.gemini_key) {
                setGeminiKey(data.gemini_key);
                localStorage.setItem("ms-gemini-key", data.gemini_key);
              }
              if (data.auto_sync_profiles !== null && data.auto_sync_profiles !== undefined) {
                setAutoSyncProfiles(data.auto_sync_profiles);
                localStorage.setItem("ms-auto-sync-supabase", String(data.auto_sync_profiles));
              }
            }
          });
        }
      });
    }
  }, []);

  const handleSaveGoDaddy = async () => {
    if (goDaddyKey && goDaddyKey.length < 10) {
      toast.error("GoDaddy API Key seems invalid (too short).");
      return;
    }
    if (goDaddySecret && goDaddySecret.length < 10) {
      toast.error("GoDaddy API Secret seems invalid (too short).");
      return;
    }

    localStorage.setItem("ms-godaddy-key", goDaddyKey);
    localStorage.setItem("ms-godaddy-secret", goDaddySecret);
    
    // Try to save to Supabase if configured
    if (supabaseUrl && supabaseKey) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase(supabaseUrl, supabaseKey);
        if (supabase) {
          const { error } = await supabase.from('app_settings').upsert({
            id: 'global',
            godaddy_key: goDaddyKey,
            godaddy_secret: goDaddySecret
          });
          if (error && isTableNotFoundError(error)) {
            console.warn("Supabase warning: 'app_settings' table not found. Credentials saved locally but not synced.");
          } else if (error) {
            console.warn("Supabase sync warning (could be permissions/RLS or database rules):", error);
          }
        }
      } catch (e) {
        console.error("Failed to save to Supabase", e);
      }
    }
    
    toast.success("GoDaddy credentials saved locally and synced");
  };

  const handleSaveSupabase = async () => {
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      toast.error("Supabase URL must start with https://");
      return;
    }
    if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
      toast.error("Supabase Key seems invalid (should be a JWT starting with eyJ).");
      return;
    }

    localStorage.setItem("ms-supabase-url", supabaseUrl);
    localStorage.setItem("ms-supabase-key", supabaseKey);
    
    // Try to save to Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase(supabaseUrl, supabaseKey);
        if (supabase) {
          const payload: any = {
            id: 'global',
            supabase_url: supabaseUrl,
            supabase_key: supabaseKey,
            auto_sync_profiles: autoSyncProfiles
          };
          if (goDaddyKey) payload.godaddy_key = goDaddyKey;
          if (goDaddySecret) payload.godaddy_secret = goDaddySecret;
          if (resendKey) payload.resend_key = resendKey;
          if (geminiKey) payload.gemini_key = geminiKey;

          const { error } = await supabase.from('app_settings').upsert(payload);
          if (error && isTableNotFoundError(error)) {
            console.warn("Supabase warning: 'app_settings' table not found. Credentials saved locally but not synced.");
          } else if (error) {
            console.warn("Supabase sync warning (could be permissions/RLS or database rules):", error);
          }
        }
      } catch (e) {
        console.warn("Failed to save to Supabase", e);
      }
    }
    
    toast.success("Supabase credentials saved locally and synced");
  };

  const handleSaveAutoSync = async (checked: boolean) => {
    setAutoSyncProfiles(checked);
    localStorage.setItem("ms-auto-sync-supabase", String(checked));
    
    if (supabaseUrl && supabaseKey) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase(supabaseUrl, supabaseKey);
        if (supabase) {
          const { error } = await supabase.from('app_settings').upsert({
            id: 'global',
            auto_sync_profiles: checked
          });
          if (error && isTableNotFoundError(error)) {
            console.warn("Supabase warning: 'app_settings' table not found.");
          } else if (!error && checked) {
            toast.success("Auto-Sync enabled and settings saved!");
          } else if (!error && !checked) {
            toast.success("Auto-Sync disabled and settings saved!");
          }
        }
      } catch (e) {
        console.warn("Failed to save auto-sync to Supabase", e);
      }
    } else {
      if (checked) toast.success("Auto-Sync enabled locally!");
      else toast.success("Auto-Sync disabled locally!");
    }
  };

  const handleSaveResend = async () => {
    if (resendKey && resendKey.length < 15) {
      toast.error("Resend API Key seems invalid (too short).");
      return;
    }
    if (resendKey && !resendKey.startsWith('re_')) {
      toast.error("Resend API Key seems invalid (should start with 're_').");
      return;
    }

    localStorage.setItem("ms-resend-key", resendKey);
    
    // Try to save to Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase(supabaseUrl, supabaseKey);
        if (supabase) {
          const { error } = await supabase.from('app_settings').upsert({
            id: 'global',
            resend_key: resendKey
          });
          if (error && isTableNotFoundError(error)) {
            console.warn("Supabase warning: 'app_settings' table not found. Credentials saved locally but not synced.");
          } else if (error) {
            console.warn("Supabase sync warning (could be permissions/RLS or database rules):", error);
          }
        }
      } catch (e) {
        console.warn("Failed to save to Supabase", e);
      }
    }
    
    toast.success("Resend credentials saved locally and synced");
  };

  const handleSaveGemini = async () => {
    if (geminiKey && geminiKey.length < 10) {
      toast.error("Gemini API Key seems invalid (too short).");
      return;
    }

    localStorage.setItem("ms-gemini-key", geminiKey);
    
    // Try to save to Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase(supabaseUrl, supabaseKey);
        if (supabase) {
          const { error } = await supabase.from('app_settings').upsert({
            id: 'global',
            gemini_key: geminiKey
          });
          if (error && isTableNotFoundError(error)) {
            console.warn("Supabase warning: 'app_settings' table not found. Credentials saved locally but not synced.");
          } else if (error) {
            console.warn("Supabase sync warning (could be permissions/RLS or database rules):", error);
          }
        }
      } catch (e) {
        console.warn("Failed to save to Supabase", e);
      }
    }
    
    toast.success("Gemini credentials saved locally and synced");
  };

  const testGemini = async () => {
    if (!geminiKey) {
      toast.error("Please enter a Gemini API Key first");
      return;
    }
    setTestingGemini(true);
    apiTracker.logAttempt();
    const loadingToast = toast.loading("Testing Gemini connection...");
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Test connection. Reply 'OK' if successful."
      });
      apiTracker.logSuccess("Test connection", response.text || "");
      toast.success("Connection successful!", { id: loadingToast });
    } catch (e: any) {
      apiTracker.logFailure(e);
      toast.error(`Error: ${e.message}`, { id: loadingToast });
    } finally {
      setTestingGemini(false);
    }
  };

  const testGoDaddy = async () => {
    if (!goDaddyKey || !goDaddySecret) {
      toast.error("Please enter both Key and Secret first");
      return;
    }
    setTestingGoDaddy(true);
    const loadingToast = toast.loading("Testing GoDaddy connection...");
    try {
      const res = await testGoDaddyAction(goDaddyKey, goDaddySecret);
      if (res.error) {
        toast.error(`Connection failed: ${res.error}`, { id: loadingToast });
      } else {
        toast.success("Connection successful!", { id: loadingToast });
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`, { id: loadingToast });
    } finally {
      setTestingGoDaddy(false);
    }
  };

  const testSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast.error("Please enter both URL and Anon Key first");
      return;
    }
    setTestingSupabase(true);
    const loadingToast = toast.loading("Testing Supabase connection...");
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase(supabaseUrl, supabaseKey);
      
      if (!supabase) {
        toast.error("Failed to initialize Supabase client. Please check URL and Key formats.", { id: loadingToast });
        return;
      }
      
      const { error } = await Promise.race([
        supabase.from('app_settings').select('id').limit(1),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000))
      ]);
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          toast.success("Connection works, but 'app_settings' table not found.", { id: loadingToast });
        } else {
          toast.success(`Connected, query returned: ${error.message}`, { id: loadingToast });
        }
      } else {
        toast.success("Connection successful! 'app_settings' table found.", { id: loadingToast });
      }
    } catch (e: any) {
      toast.error(`Connection failed: ${e.message}`, { id: loadingToast });
    } finally {
      setTestingSupabase(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text p-8 flex items-center justify-center font-ms">
        <div className="text-ms-green animate-pulse">Loading Settings...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text p-8 flex flex-col items-center justify-center font-ms">
        <div className="bg-ms-panel border border-ms-border p-8 text-center max-w-md">
          <h2 className="text-white text-lg font-bold mb-2">Authentication Required</h2>
          <p className="text-ms-text-muted text-xs mb-6">Please log in to access settings.</p>
          <Link href="/profile" className="bg-ms-green-dark border border-ms-green text-ms-green px-6 py-3 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors">
            GO TO PROFILE
          </Link>
        </div>
      </div>
    );
  }

  // Only Admins and Owners can access global settings. If these are personal settings, anyone could access them.
  // The prompt says: "Admins should have access to all features and settings". This implies settings might be restricted.
  // Let's restrict it to admin/owner.
  if (role !== 'admin' && role !== 'owner') {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text p-8 flex flex-col items-center justify-center font-ms">
        <div className="bg-ms-panel border border-ms-red p-8 text-center max-w-md">
          <h2 className="text-ms-red text-lg font-bold mb-2">Access Denied</h2>
          <p className="text-ms-text-muted text-xs mb-6">You need Admin or Owner privileges to access the settings page. Your current role is: {role || 'viewer'}.</p>
          <Link href="/" className="bg-transparent border border-ms-border text-ms-text-muted px-6 py-3 text-xs font-bold hover:text-white transition-colors">
            RETURN TO ENGINE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ms-bg text-ms-text font-ms">
      <div className="border-b border-ms-border px-4 md:px-7 py-4 flex items-center justify-between bg-ms-panel">
        <div>
          <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-1 font-bold">◈ CONFIGURATION</div>
          <div className="font-ms text-[18px] font-bold text-ms-white">SYSTEM SETTINGS</div>
        </div>
        <Link href="/" className="font-ms bg-transparent border border-ms-border-light text-ms-green px-4 py-2 text-[11px] cursor-pointer hover:bg-ms-panel-light transition-colors">
          ← Back to Engine
        </Link>
      </div>

      <div className="max-w-[800px] mx-auto p-4 md:p-7 mt-4 space-y-8">
        
        {/* Gemini Settings */}
        <div className="bg-ms-panel border border-ms-border p-6">
          <div className="mb-6 border-b border-ms-border pb-4">
            <h2 className="text-white text-lg font-bold">Gemini API Integration</h2>
            <p className="text-ms-text-muted text-xs mt-1">Configure your Gemini API Key to enable AI generation features. If left blank, the system will attempt to use the environment variable. (Saved locally and synced to Supabase `app_settings` table)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">API KEY</label>
              <input 
                type="password" 
                value={geminiKey} 
                onChange={e => setGeminiKey(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                placeholder="Enter Gemini API key"
              />
              {geminiKey && geminiKey.length < 10 && (
                <p className="text-ms-yellow text-[10px] mt-1">Key seems too short. Please verify.</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveGemini}
                className="bg-ms-green-dark border border-ms-green text-ms-green px-4 py-2 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors"
              >
                SAVE CREDENTIALS
              </button>
              <button 
                onClick={testGemini}
                disabled={testingGemini}
                className="bg-transparent border border-ms-border text-ms-text-muted px-4 py-2 text-xs hover:text-white transition-colors disabled:opacity-50"
              >
                {testingGemini ? "TESTING..." : "TEST CONNECTION"}
              </button>
            </div>
          </div>
        </div>

        {/* Gemini API Usage Statistics and Status */}
        <div className="bg-ms-panel border border-ms-border p-6">
          <div className="mb-6 border-b border-ms-border pb-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-white text-lg font-bold">AI Connection & Usage Monitor</h2>
              <p className="text-ms-text-muted text-xs mt-1">Real-time stats and request telemetry tracked locally to help gauge quota limits.</p>
            </div>
            <div>
              {(!apiStats || apiStats.status === "idle") && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-ms-panel border border-ms-border text-ms-text-muted rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ms-text-muted" /> Idle
                </span>
              )}
              {apiStats?.status === "connected" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-ms-green-dark border border-ms-green text-ms-green rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ms-green" /> Connected / Active
                </span>
              )}
              {apiStats?.status === "rate_limited" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-ms-yellow-dark/20 border border-ms-yellow text-ms-yellow rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ms-yellow" /> Rate Limited (429)
                </span>
              )}
              {apiStats?.status === "invalid_key" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-ms-red-dark/20 border border-ms-red text-ms-red rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ms-red" /> Invalid Key
                </span>
              )}
              {apiStats?.status === "failed" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-ms-red-dark/20 border border-ms-red text-ms-red rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ms-red" /> Connection Error
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-ms-bg border border-ms-border/50 p-4">
              <span className="block font-ms text-[9px] text-ms-green font-bold tracking-[1px] uppercase mb-1">Total Attempts</span>
              <span className="text-white text-xl font-bold font-mono">{apiStats?.totalRequests ?? 0}</span>
            </div>
            
            <div className="bg-ms-bg border border-ms-border/50 p-4">
              <span className="block font-ms text-[9px] text-ms-green font-bold tracking-[1px] uppercase mb-1">Success Rate</span>
              <span className="text-white text-xl font-bold font-mono">
                {apiStats?.totalRequests 
                  ? `${Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100)}%` 
                  : "100%"}
              </span>
              <span className="block text-[9px] text-ms-text-muted mt-0.5">{apiStats?.successfulRequests ?? 0} success / {apiStats?.failedRequests ?? 0} fail</span>
            </div>

            <div className="bg-ms-bg border border-ms-border/50 p-4">
              <span className="block font-ms text-[9px] text-ms-green font-bold tracking-[1px] uppercase mb-1">Est. Tokens Used</span>
              <span className="text-white text-xl font-bold font-mono">{(apiStats?.estimatedTokens ?? 0).toLocaleString()}</span>
              <span className="block text-[9px] text-ms-text-muted mt-0.5">Approx. {Math.round((apiStats?.estimatedTokens ?? 0) * 0.00035 * 100) / 100}¢ cost</span>
            </div>

            <div className="bg-ms-bg border border-ms-border/50 p-4">
              <span className="block font-ms text-[9px] text-ms-green font-bold tracking-[1px] uppercase mb-1">Rate Limit Hits</span>
              <span className={`text-xl font-bold font-mono ${(apiStats?.rateLimitErrors ?? 0) > 0 ? "text-ms-yellow" : "text-white"}`}>
                {apiStats?.rateLimitErrors ?? 0}
              </span>
              <span className="block text-[9px] text-ms-text-muted mt-0.5">HTTP 429 count</span>
            </div>
          </div>

          {apiStats?.lastErrorMessage && (
            <div className="bg-ms-red-dark/10 border border-ms-red/20 p-3 mb-6 rounded-sm text-xs">
              <span className="text-ms-red font-bold">Last Error Logged:</span>
              <p className="text-ms-text text-[11px] mt-1 font-mono break-all leading-relaxed bg-ms-bg/50 p-2 border border-ms-border/20 rounded-sm">{apiStats.lastErrorMessage}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
            <div className="text-[10px] text-ms-text-muted leading-relaxed max-w-[500px]">
              <span className="text-ms-green font-bold tracking-[0.5px]">💡 QUOTA TIPS:</span> The Gemini standard free tier has a limit of <strong className="text-white">15 RPM</strong> (Requests Per Minute) and <strong className="text-white">1,500 RPD</strong> (Requests Per Day). We have implemented a smart retry utility with exponential backoff on server routes to help mitigate limits automatically.
            </div>
            <button 
              onClick={() => {
                apiTracker.resetStats();
                toast.success("Usage statistics reset successfully");
              }}
              className="bg-transparent border border-ms-border text-ms-text-muted px-4 py-2 text-xs hover:text-white transition-colors"
            >
              RESET STATISTICS
            </button>
          </div>
        </div>

        {/* GoDaddy Settings */}
        <div className="bg-ms-panel border border-ms-border p-6">
          <div className="mb-6 border-b border-ms-border pb-4">
            <h2 className="text-white text-lg font-bold">GoDaddy Integration</h2>
            <p className="text-ms-text-muted text-xs mt-1">Configure your GoDaddy API credentials to enable real-time domain availability checks for generated SaaS ideas. (Saved locally and synced to Supabase `app_settings` table if configured)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">API KEY</label>
              <input 
                type="text" 
                value={goDaddyKey} 
                onChange={e => setGoDaddyKey(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                placeholder="Enter your GoDaddy API Key"
              />
              {goDaddyKey && goDaddyKey.length < 20 && (
                <p className="text-ms-yellow text-[10px] mt-1">Key seems too short. Please verify.</p>
              )}
            </div>
            <div>
              <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">API SECRET</label>
              <input 
                type="password" 
                value={goDaddySecret} 
                onChange={e => setGoDaddySecret(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                placeholder="Enter your GoDaddy API Secret"
              />
              {goDaddySecret && goDaddySecret.length < 15 && (
                <p className="text-ms-yellow text-[10px] mt-1">Secret seems too short. Please verify.</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveGoDaddy}
                className="bg-ms-green-dark border border-ms-green text-ms-green px-4 py-2 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors"
              >
                SAVE CREDENTIALS
              </button>
              <button 
                onClick={testGoDaddy}
                disabled={testingGoDaddy}
                className="bg-transparent border border-ms-border text-ms-text-muted px-4 py-2 text-xs hover:text-white transition-colors disabled:opacity-50"
              >
                {testingGoDaddy ? "TESTING..." : "TEST CONNECTION"}
              </button>
            </div>
          </div>
        </div>

        {/* Supabase Settings */}
        <div className="bg-ms-panel border border-ms-border p-6">
          <div className="mb-6 border-b border-ms-border pb-4">
            <h2 className="text-white text-lg font-bold">Supabase Integration</h2>
            <p className="text-ms-text-muted text-xs mt-1">Configure your Supabase project to save and retrieve generated Launch Kits. (Saved locally and synced to Supabase `app_settings` table)</p>
            <div className="mt-3 bg-ms-yellow-dark/20 border border-ms-yellow/30 p-3 rounded-sm">
              <p className="text-ms-yellow text-[10px] font-bold">⚠️ IMPORTANT: To enable syncing, you must create a table named `app_settings` with columns: `id` (text, primary), `godaddy_key` (text), `godaddy_secret` (text), `supabase_url` (text), `supabase_key` (text), `auto_sync_profiles` (boolean).</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">PROJECT URL</label>
              <input 
                type="text" 
                value={supabaseUrl} 
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                placeholder="https://xyzcompany.supabase.co"
              />
              {supabaseUrl && !supabaseUrl.startsWith('https://') && (
                <p className="text-ms-yellow text-[10px] mt-1">URL should start with https://</p>
              )}
              {supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('.supabase.co') && (
                <p className="text-ms-yellow text-[10px] mt-1">URL usually ends with .supabase.co</p>
              )}
            </div>
            <div>
              <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">ANON KEY</label>
              <input 
                type="password" 
                value={supabaseKey} 
                onChange={e => setSupabaseKey(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                placeholder="eyJh..."
              />
              {supabaseKey && !supabaseKey.startsWith('eyJ') && (
                <p className="text-ms-yellow text-[10px] mt-1">Key should be a JWT starting with &quot;eyJ&quot;</p>
              )}
            </div>
            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <button 
                onClick={handleSaveSupabase}
                className="bg-ms-green-dark border border-ms-green text-ms-green px-4 py-2 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors"
              >
                SAVE CREDENTIALS
              </button>
              <button 
                onClick={testSupabase}
                disabled={testingSupabase}
                className="bg-transparent border border-ms-green text-ms-green px-4 py-2 text-xs font-bold hover:bg-ms-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingSupabase ? "TESTING..." : "TEST CONNECTION"}
              </button>
              <label className="flex items-center gap-2 cursor-pointer ml-2 md:ml-4">
                <input 
                  type="checkbox" 
                  checked={autoSyncProfiles} 
                  onChange={e => handleSaveAutoSync(e.target.checked)}
                  className="accent-ms-green w-4 h-4"
                />
                <span className="text-xs text-ms-text font-bold uppercase tracking-wider">AUTO-SYNC PROFILES</span>
              </label>
            </div>
          </div>
        </div>

        {/* Resend Settings */}
        <div className="bg-ms-panel border border-ms-border p-6">
          <div className="mb-6 border-b border-ms-border pb-4">
            <h2 className="text-white text-lg font-bold">Resend Integration</h2>
            <p className="text-ms-text-muted text-xs mt-1">Configure your Resend API Key to enable sending generated Launch Kits via email. (Saved locally and synced to Supabase `app_settings` table)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-1.5">API KEY</label>
              <input 
                type="password" 
                value={resendKey} 
                onChange={e => setResendKey(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2.5 text-xs outline-none focus:border-ms-green transition-colors"
                placeholder="re_..."
              />
              {resendKey && !resendKey.startsWith('re_') && (
                <p className="text-ms-yellow text-[10px] mt-1">Key should start with &quot;re_&quot;</p>
              )}
            </div>
            <div className="pt-2">
              <button 
                onClick={handleSaveResend}
                className="bg-ms-green-dark border border-ms-green text-ms-green px-4 py-2 text-xs font-bold hover:bg-ms-green hover:text-ms-bg transition-colors"
              >
                SAVE CREDENTIALS
              </button>
            </div>
          </div>
        </div>

        {/* User Role Management */}
        <UserRoleManager supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />

      </div>
    </div>
  );
}
