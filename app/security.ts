import "server-only";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// ---------------------------------------------------------------------------
// App secret — used to sign session tokens and encrypt stored settings.
// Prefer SESSION_SECRET from the environment; otherwise generate one and
// persist it under data/ (gitignored) so sessions survive restarts in dev.
// ---------------------------------------------------------------------------

let cachedSecret: Buffer | null = null;

export function getAppSecret(): Buffer {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cachedSecret = crypto.createHash("sha256").update(fromEnv).digest();
    return cachedSecret;
  }

  const secretPath = path.join(DATA_DIR, ".app-secret");
  try {
    const existing = Buffer.from(
      fs.readFileSync(secretPath, "utf-8").trim(),
      "hex",
    );
    if (existing.length === 32) {
      cachedSecret = existing;
      return cachedSecret;
    }
  } catch {
    // fall through and generate a fresh secret
  }

  const fresh = crypto.randomBytes(32);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(secretPath, fresh.toString("hex"), "utf-8");
  cachedSecret = fresh;
  return fresh;
}

// ---------------------------------------------------------------------------
// Signed session tokens: base64url(email|issuedAt) + "." + HMAC-SHA256
// ---------------------------------------------------------------------------

function hmac(payload: string): string {
  return crypto
    .createHmac("sha256", getAppSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, iat: Date.now() }),
    "utf-8",
  ).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = hmac(payload);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (typeof parsed.email !== "string" || typeof parsed.iat !== "number") {
      return null;
    }
    if (Date.now() - parsed.iat > SESSION_MAX_AGE_MS) return null;
    return parsed.email;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Password hashing — salted scrypt. Legacy unsalted SHA-256 hashes (64 hex
// chars) are still verifiable so existing accounts can log in once and get
// transparently upgraded.
// ---------------------------------------------------------------------------

const SCRYPT_N = 16384;
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_N })
    .toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${derived}`;
}

export function verifyPassword(
  password: string,
  storedHash: string,
): { valid: boolean; needsUpgrade: boolean } {
  // A malformed stored hash (hand-edited users.json, truncated write) must
  // read as "wrong password", never crash the login action.
  try {
    if (storedHash.startsWith("scrypt$")) {
      const parts = storedHash.split("$");
      if (parts.length !== 4) return { valid: false, needsUpgrade: false };
      const [, nStr, salt, expected] = parts;
      const expectedBuf = Buffer.from(expected, "hex");
      if (expectedBuf.length !== SCRYPT_KEYLEN) {
        return { valid: false, needsUpgrade: false };
      }
      const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
        N: parseInt(nStr, 10),
      });
      const valid = crypto.timingSafeEqual(derived, expectedBuf);
      return { valid, needsUpgrade: false };
    }

    // Legacy: unsalted SHA-256 hex digest
    if (/^[0-9a-f]{64}$/i.test(storedHash)) {
      const legacy = crypto.createHash("sha256").update(password).digest();
      const valid = crypto.timingSafeEqual(
        legacy,
        Buffer.from(storedHash.toLowerCase(), "hex"),
      );
      return { valid, needsUpgrade: valid };
    }
  } catch {
    // fall through
  }

  return { valid: false, needsUpgrade: false };
}

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter (per process). Suitable for the
// single-instance deployments this app targets.
// ---------------------------------------------------------------------------

const rateBuckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (rateBuckets.get(key) || []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    rateBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  rateBuckets.set(key, hits);

  // Opportunistic cleanup so the map can't grow unbounded
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => t <= cutoff)) rateBuckets.delete(k);
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// HTML escaping for anything interpolated into email/PDF markup
// ---------------------------------------------------------------------------

export function escapeH(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// At-rest encryption for stored API credentials (AES-256-GCM with the app
// secret). Values are stored as "enc:v1:<iv>:<tag>:<ciphertext>" (base64);
// plaintext legacy values are read as-is and re-encrypted on next save.
// ---------------------------------------------------------------------------

const ENC_PREFIX = "enc:v1:";

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getAppSecret(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(ENC_PREFIX)) return stored; // legacy plaintext
  try {
    const [ivB64, tagB64, dataB64] = stored.slice(ENC_PREFIX.length).split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getAppSecret(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf-8");
  } catch {
    // Wrong/rotated secret — treat as unset rather than crashing
    return "";
  }
}
