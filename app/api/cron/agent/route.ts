import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServiceClient } from "@/app/lib/supabase";
import { isAuthorizedCron } from "@/app/lib/auth-guard";

// Scheduled audit of the secret_keys table. Requires `Authorization: Bearer
// $CRON_SECRET` — without it an anonymous caller could bill unlimited Gemini
// requests and read back metadata about which credentials this deployment holds.
export const dynamic = "force-dynamic";

// Matches the "enc:v1:<iv>:<tag>:<ciphertext>" envelope written by
// encryptSecret() in app/security.ts (AES-256-GCM, base64 segments).
const ENCRYPTED_ENVELOPE = /^enc:v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

const AGENT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export async function GET() {
  if (!(await isAuthorizedCron())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let client;
  try {
    client = getServiceClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Supabase unavailable" },
      { status: 503 },
    );
  }

  const { data: keys, error } = await client
    .from("secret_keys")
    .select("id, name, encrypted_value, created_at, updated_at");

  if (error) {
    console.error("Security agent: failed to read secret_keys:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch keys for analysis" },
      { status: 500 },
    );
  }

  // Only shape metadata is sent to the model — never the stored values.
  const analysisData = (keys || []).map((key) => ({
    name: key.name,
    isEncryptedFormat: ENCRYPTED_ENVELOPE.test(String(key.encrypted_value ?? "")),
    valueLength: String(key.encrypted_value ?? "").length,
    created_at: key.created_at,
    updated_at: key.updated_at,
  }));

  const prompt = `You are a security agent auditing the 'secret_keys' table of a Supabase database.

Status of the stored keys (values themselves are never included):
${JSON.stringify(analysisData, null, 2)}

Tasks:
1. Flag a critical risk for any key whose 'isEncryptedFormat' is false.
2. Comment on update frequency and any key that looks stale.
3. Give a brief security summary with recommendations.

Respond in clear text.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: AGENT_MODEL,
      contents: prompt,
    });

    const report = response.text;
    console.log("Scheduled security agent report:\n", report);
    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("Security agent: model call failed:", err);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 },
    );
  }
}
