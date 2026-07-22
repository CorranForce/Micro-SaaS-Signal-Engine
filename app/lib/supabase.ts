import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazily create the service-role Supabase client. Creating it at module scope
// crashes `next build` ("supabaseUrl is required") because the env vars are not
// present when Next imports the route module to collect page data. Callers must
// invoke this inside a request handler, where the env is available.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL || '';
  // Prefer the service-role key for server-side/admin operations; fall back to
  // the anon key if that is all that is configured.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  cached = createClient(url, key);
  return cached;
}
