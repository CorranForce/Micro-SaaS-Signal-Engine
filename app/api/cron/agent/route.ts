import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { GoogleGenAI } from '@google/genai';

// Never statically evaluated; always runs per-request.
export const dynamic = 'force-dynamic';

// This route hits Supabase and the paid Gemini API, so it must never be
// publicly invocable. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
// when CRON_SECRET is set in the project env; require it here. Fail closed:
// if CRON_SECRET is not configured, deny every request.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch the secret keys
    const { data: keys, error } = await supabase.from('secret_keys').select('*');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch keys for analysis', details: error.message }, { status: 500 });
    }

    // 2. Format the data to check if they are encrypted
    const analysisData = (keys || []).map(key => {
      // Basic check: encrypted format should be iv:encrypted_text (e.g. hex:hex)
      const isEncryptedFormat = /^[0-9a-f]{32}:[0-9a-f]+$/i.test(key.encrypted_value);
      return {
        id: key.id,
        name: key.name,
        isEncryptedFormat,
        valueLength: key.encrypted_value.length,
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

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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
