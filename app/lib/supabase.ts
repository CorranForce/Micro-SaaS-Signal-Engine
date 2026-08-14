import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Created lazily, on first request — NOT at module import time.
// `createClient` throws "supabaseUrl is required" when the env is empty, and
// route modules are imported during `next build` ("Collecting page data"),
// which killed the production build on any machine without Supabase env vars.
// This regressed once before (see BugReport.md, 2026-07-22); keep it lazy.
let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    // Prefer the service-role key for server-side operations; fall back to anon.
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).',
      );
    }

    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}
