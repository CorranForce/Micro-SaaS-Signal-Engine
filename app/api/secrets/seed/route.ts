import { NextResponse } from "next/server";
import { getServiceClient } from "@/app/lib/supabase";
import { isOperator } from "@/app/lib/auth-guard";
import { encryptSecret } from "@/app/security";

// Reads server-side credentials and mirrors them (encrypted) into secret_keys.
// Operator-only: an unauthenticated caller could otherwise trigger writes of
// every configured credential, and even the per-key "configured / not found"
// breakdown in the response discloses which integrations this deployment holds.
export const dynamic = "force-dynamic";

const SEEDED_KEYS = [
  "GEMINI_API_KEY",
  "RESEND_API_KEY",
  "GODADDY_API_KEY",
  "GODADDY_API_SECRET",
  "APOLLO_API_KEY",
] as const;

export async function POST() {
  if (!(await isOperator())) {
    // Same body for anonymous and non-operator callers — distinguishing them
    // would confirm which accounts exist.
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
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

  const results: { name: string; status: string; details?: string }[] = [];

  for (const name of SEEDED_KEYS) {
    const value = process.env[name];
    if (!value) {
      results.push({ name, status: "skipped (not configured)" });
      continue;
    }

    const { error } = await client
      .from("secret_keys")
      .upsert(
        { name, encrypted_value: encryptSecret(value) },
        { onConflict: "name" },
      );

    results.push(
      error
        ? { name, status: "error", details: error.message }
        : { name, status: "success" },
    );
  }

  return NextResponse.json({ message: "Secrets seeded", results });
}
