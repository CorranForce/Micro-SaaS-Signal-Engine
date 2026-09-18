import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/app/lib/supabase";
import { encryptSecret, verifySessionToken } from "@/app/security";

// This route copies server-side env credentials into the Supabase
// `secret_keys` table. It is an operator bootstrap action, not a public
// endpoint: an unauthenticated POST here both burns a write against the
// service-role client and discloses which credentials the deployment holds.
export const dynamic = "force-dynamic";

const OPERATOR_EMAIL = (
  process.env.OPERATOR_EMAIL || "corranforce@gmail.com"
).toLowerCase();

export async function POST() {
  const cookieStore = await cookies();
  const email = verifySessionToken(cookieStore.get("session_token")?.value);
  if (!email || email.toLowerCase() !== OPERATOR_EMAIL) {
    // Deliberately opaque: a 404 does not confirm the route exists.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on this deployment." },
      { status: 503 },
    );
  }

  const secrets = [
    { name: "GEMINI_API_KEY", value: process.env.GEMINI_API_KEY },
    { name: "RESEND_API_KEY", value: process.env.RESEND_API_KEY },
    { name: "GODADDY_API_KEY", value: process.env.GODADDY_API_KEY },
    { name: "GODADDY_API_SECRET", value: process.env.GODADDY_API_SECRET },
    { name: "APOLLO_API_KEY", value: process.env.APOLLO_API_KEY },
  ];

  const results = [];

  for (const secret of secrets) {
    if (!secret.value) {
      results.push({ name: secret.name, status: "skipped (not found)" });
      continue;
    }

    // AES-256-GCM under the app secret (app/security.ts) — the same primitive
    // that protects data/settings.json. The previous AES-256-CBC helper had no
    // authentication tag and fell back to a key committed in this repo.
    const { error } = await supabase
      .from("secret_keys")
      .upsert(
        { name: secret.name, encrypted_value: encryptSecret(secret.value) },
        { onConflict: "name" },
      );

    if (error) {
      console.error(`Failed to seed secret ${secret.name}:`, error.message);
      results.push({ name: secret.name, status: "error" });
    } else {
      results.push({ name: secret.name, status: "success" });
    }
  }

  return NextResponse.json({ message: "Secrets seeded", results });
}
