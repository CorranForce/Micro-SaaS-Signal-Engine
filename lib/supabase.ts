import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string | null = null;
let currentKey: string | null = null;

export const getSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  
  if (supabaseInstance && currentUrl === url && currentKey === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key);
    currentUrl = url;
    currentKey = key;
    return supabaseInstance;
  } catch (e) {
    console.warn("Failed to initialize Supabase client", e);
    return null;
  }
};

export const getSupabaseUserTable = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("ms-supabase-user-table") || "microSaaS-Users";
  }
  return "microSaaS-Users";
};
