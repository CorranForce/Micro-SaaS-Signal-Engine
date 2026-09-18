import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/app/lib/supabase";
import { ENC_PREFIX } from "@/app/security";

// Scheduled by vercel.json. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
// Without this gate the route is a public endpoint that reads the secret_keys
// table and spends paid Gemini tokens on every request.
export const dynamic = "force-dynamic";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

interface KeyRow {
  id?: string | number;
  name?: string;
  encrypted_value?: string | null;
  created_at?: string;
  updated_at?: string;
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  // Fail closed: an unset CRON_SECRET disables the route rather than opening it.
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json({
        success: true,
        report: "Supabase not configured. Skipping automated security audit.",
      });
    }

    // Never select * here — the row's ciphertext has no business leaving the
    // database for an LLM prompt. Only the integrity metadata is needed.
    const { data: keys, error } = await supabase
      .from("secret_keys")
      .select("id, name, encrypted_value, created_at, updated_at");

    if (error) {
      console.error("Failed to fetch keys for analysis:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch keys for analysis" },
        { status: 200 },
      );
    }

    // Values written by the seed route are AES-256-GCM blobs tagged
    // "enc:v1:<iv>:<tag>:<ciphertext>". Anything else is plaintext at rest.
    const analysisData = (keys || []).map((key: KeyRow) => ({
      id: key.id,
      name: key.name,
      isEncryptedFormat: Boolean(key.encrypted_value?.startsWith(ENC_PREFIX)),
      valueLength: key.encrypted_value?.length || 0,
      created_at: key.created_at,
      updated_at: key.updated_at,
    }));

    const allEncrypted = analysisData.every((k) => k.isEncryptedFormat);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        report: `Security Audit Summary: ${analysisData.length} key(s) monitored. All valid formats: ${allEncrypted}.`,
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const report = response.text || "Security audit completed successfully.";
    console.log("Hourly AI Security Agent Report:\n", report);

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Agent check failed";
    console.warn("Security agent execution caught error:", message);
    return NextResponse.json({ success: false, error: "Agent check failed" });
  }
}
