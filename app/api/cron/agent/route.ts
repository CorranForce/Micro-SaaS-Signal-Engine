import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/app/lib/supabase';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        report: "Supabase not configured. Skipping automated security audit.",
      });
    }

    // 1. Fetch the secret keys
    const { data: keys, error } = await supabase.from('secret_keys').select('*');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch keys for analysis', details: error.message },
        { status: 200 }
      );
    }

    // 2. Format the data to check if they are encrypted
    const analysisData = (keys || []).map((key: any) => {
      // Basic check: encrypted format should be iv:encrypted_text (e.g. hex:hex)
      const isEncryptedFormat = /^[0-9a-f]{32}:[0-9a-f]+$/i.test(key.encrypted_value);
      return {
        id: key.id,
        name: key.name,
        isEncryptedFormat,
        valueLength: key.encrypted_value?.length || 0,
        created_at: key.created_at,
        updated_at: key.updated_at,
      };
    });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        report: `Security Audit Summary: ${analysisData.length} key(s) monitored. All valid formats: ${analysisData.every(k => k.isEncryptedFormat)}.`,
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: prompt,
    });

    const report = response.text || "Security audit completed successfully.";
    console.log("Hourly AI Security Agent Report:\n", report);

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.warn('Security agent execution caught error:', err?.message);
    return NextResponse.json({ success: false, error: err?.message || 'Agent check failed' });
  }
}
