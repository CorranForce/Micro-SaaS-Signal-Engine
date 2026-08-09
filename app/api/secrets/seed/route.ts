import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { encrypt } from '@/app/lib/encryption';

export async function POST() {
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

    const encryptedValue = encrypt(secret.value);

    // Upsert the secret into the database
    const { error } = await supabase
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
