import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabase';
// AES-256-GCM, keyed off the app secret. Do NOT reintroduce app/lib/encryption.ts:
// it used AES-256-CBC (no auth tag) with a fallback key committed to the repo.
import { encryptSecret, verifySessionToken } from '@/app/security';

// Writes deployment credentials into Supabase with the service-role client, and
// its per-key result breakdown reveals which credentials this deployment holds.
// Operator session required — this was previously reachable anonymously.
export const dynamic = 'force-dynamic';

const OPERATOR_EMAIL = (
  process.env.OPERATOR_EMAIL || 'corranforce@gmail.com'
).toLowerCase();

export async function POST() {
  const cookieStore = await cookies();
  const email = verifySessionToken(cookieStore.get('session_token')?.value);
  if (!email || email.toLowerCase() !== OPERATOR_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured; nothing to seed.' },
      { status: 503 },
    );
  }

  const secrets = [
    { name: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
    { name: 'GODADDY_API_KEY', value: process.env.GODADDY_API_KEY },
    { name: 'GODADDY_API_SECRET', value: process.env.GODADDY_API_SECRET },
    { name: 'APOLLO_API_KEY', value: process.env.APOLLO_API_KEY },
  ];

  const results = [];

  for (const secret of secrets) {
    if (!secret.value) {
      results.push({ name: secret.name, status: 'skipped (not found)' });
      continue;
    }

    const encryptedValue = encryptSecret(secret.value);

    // Upsert the secret into the database
    const { error } = await getSupabaseAdmin()
      .from('secret_keys')
      .upsert({ name: secret.name, encrypted_value: encryptedValue }, { onConflict: 'name' });

    if (error) {
      results.push({ name: secret.name, status: 'error', details: error.message });
    } else {
      results.push({ name: secret.name, status: 'success' });
    }
  }

  return NextResponse.json({ message: 'Secrets seeded', results });
}
