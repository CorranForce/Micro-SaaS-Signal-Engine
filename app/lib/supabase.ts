import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The admin client is created lazily. Building it at module scope meant every
// import (including during `next build`, when no env is present) constructed a
// client pointed at a placeholder host that silently failed at request time.
let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
  );
}

// Returns null instead of throwing so callers can degrade gracefully; every
// caller already has an "unconfigured" branch.
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;
  if (!isSupabaseConfigured()) return null;

  cached = createClient(
    process.env.SUPABASE_URL as string,
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY) as string,
  );
  return cached;
}
