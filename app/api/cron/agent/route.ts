import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabase';
import { GoogleGenAI } from '@google/genai';

// Scheduled audit of the secret_keys table. Requires
// `Authorization: Bearer $CRON_SECRET` — an anonymous caller could otherwise
// bill unlimited Gemini requests and read back metadata about which
// credentials this deployment holds. Fails closed when CRON_SECRET is unset.
export const dynamic = 'force-dynamic';

// Keep in step with app/actions.ts — overridable per environment rather than
// pinned to a model ID that a given API key may not have access to.
const AGENT_MODEL = process.env.GEMINI_MODEL_FAST || 'gemini-3.5-flash';

// Constant-time compare so a caller can't learn the secret byte by byte.
function isAuthorized(header: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const provided = (header || '').replace(/^Bearer /i, '');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const ENCRYPTED_ENVELOPE =
  /^enc:v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

export async function GET() {
  const requestHeaders = await headers();
  if (!isAuthorized(requestHeaders.get('authorization'))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured; security agent skipped.' },
        { status: 503 },
      );
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured; security agent skipped.' },
        { status: 503 },
      );
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 1. Fetch the secret keys
    const { data: keys, error } = await getSupabaseAdmin()
      .from('secret_keys')
      .select('*');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch keys for analysis', details: error.message }, { status: 500 });
    }

    // 2. Format the data to check if they are encrypted
    const analysisData = (keys || []).map(key => {
      // Matches the "enc:v1:<iv>:<tag>:<ciphertext>" envelope written by
      // encryptSecret() in app/security.ts (AES-256-GCM, base64 segments).
      const encryptedValue: string = key.encrypted_value ?? '';
      const isEncryptedFormat = ENCRYPTED_ENVELOPE.test(encryptedValue);
      return {
        id: key.id,
        name: key.name,
        isEncryptedFormat,
        valueLength: encryptedValue.length,
        created_at: key.created_at,
        updated_at: key.updated_at
      };
    });

    // 3. Prompt Gemini to act as a security agent
    const prompt = `
      You are an AI Security Agent monitoring a Supabase database.
      Here is the status of the 'secret_keys' table in the database:
      ${JSON.stringify(analysisData, null, 2)}
      
      Your tasks:
      1. Check if all keys have 'isEncryptedFormat' as true. If not, flag a critical security risk.
      2. Review the update frequency.
      3. Provide a brief security summary and any recommendations.
      
      Respond in clear text.
    `;

    const response = await ai.models.generateContent({
      model: AGENT_MODEL,
      contents: prompt,
    });

    const report = response.text;

    // In a real scenario, we might store this report in a database, email it, or log it.
    console.log("Hourly AI Security Agent Report:\n", report);

    return NextResponse.json({ success: true, report });

  } catch (err: any) {
    return NextResponse.json({ error: 'Agent execution failed', details: err.message }, { status: 500 });
  }
}
