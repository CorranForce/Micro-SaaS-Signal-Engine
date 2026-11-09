import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || '';
const isDeadOrPlaceholder =
  !rawUrl ||
  rawUrl.includes('placeholder') ||
  rawUrl.includes('rccvbrnxiiymgmvjnupa') ||
  !rawUrl.startsWith('http');

const supabaseUrl = isDeadOrPlaceholder
  ? 'https://placeholder.supabase.co'
  : rawUrl;

// Use SERVICE_ROLE_KEY if available for server-side operations, fallback to ANON_KEY
const supabaseKey = isDeadOrPlaceholder
  ? 'placeholder-key'
  : process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function isSupabaseConfigured(): boolean {
  if (isDeadOrPlaceholder) return false;
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
}
