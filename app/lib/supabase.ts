import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client for server-only tables (currently secret_keys).
//
// Built lazily on first use, NOT at module scope. Next.js imports every route
// module while collecting page data during `next build`; a module-scope
// createClient() with a blank URL throws "supabaseUrl is required." and fails
// the entire build on any machine without Supabase env vars set.
//
// There is deliberately no anon-key fallback. This client exists to reach
// tables that anon must never touch, and silently degrading to the anon key
// would turn an obvious 500 into a confusing RLS denial. Routes that write
// user data with the anon key build their own client from the operator
// settings (see app/actions.ts).

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase service client unavailable: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
