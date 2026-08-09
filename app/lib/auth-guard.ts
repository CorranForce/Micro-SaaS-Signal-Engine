import "server-only";
import { cookies, headers } from "next/headers";
import { verifySessionToken } from "../security";

export const SESSION_COOKIE = "session_token";

export const OPERATOR_EMAIL = (
  process.env.OPERATOR_EMAIL || "corranforce@gmail.com"
).toLowerCase();

/** Email from the signed session cookie, or null when anonymous/expired. */
export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** True only for a valid session belonging to the operator account. */
export async function isOperator(): Promise<boolean> {
  const email = await getSessionEmail();
  return !!email && email.toLowerCase() === OPERATOR_EMAIL;
}

/**
 * Gate for scheduled jobs. Vercel Cron (and any other caller) must present
 * `Authorization: Bearer $CRON_SECRET`. A route protected only by an obscure
 * path is not protected at all — the URL is the whole secret, and it leaks
 * through logs, referrers, and analytics.
 *
 * Fails closed: with CRON_SECRET unset, nothing is authorized.
 */
export async function isAuthorizedCron(): Promise<boolean> {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const auth = (await headers()).get("authorization") || "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (presented.length !== expected.length) return false;

  // Constant-time compare so a timing oracle can't recover the secret.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
