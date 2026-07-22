#!/usr/bin/env node
// Provision (or update) a local account in data/users.json (Enhancements.md P0 #3).
//
// Self-registration of the operator email is blocked in the app, so the operator
// account must be created out-of-band. This writes to the local JSON user store
// used when Supabase auth is NOT configured, using the exact salted-scrypt format
// that app/security.ts (hashPassword / verifyPassword) expects.
//
// If you use Supabase Auth instead, create the operator there rather than here.
//
// Usage:
//   node scripts/create-operator.mjs <email> [password]
//   npm run create-operator -- <email> [password]
// Omit the password to be prompted (input hidden). Passing it as an argument is
// convenient but leaves it in your shell history — prefer the prompt.
import { randomBytes, scryptSync } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

// Must match app/security.ts exactly.
const SCRYPT_N = 16384;
const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
  }).toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${derived}`;
}

// Control characters referenced by code, built from char codes so no raw
// control bytes ever appear in this source file.
const CTRL_C = String.fromCharCode(3); // ETX / Ctrl-C -> abort
const CTRL_D = String.fromCharCode(4); // EOT / Ctrl-D -> end of input
const DEL = String.fromCharCode(127); // Delete / backspace on many terminals

function readPasswordHidden(promptText) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      // Piped input (e.g. `echo pass | node ...`)
      let data = "";
      stdin.on("data", (d) => (data += d));
      stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")));
      return;
    }
    process.stdout.write(promptText);
    stdin.setRawMode(true);
    stdin.resume();
    let pass = "";
    const onData = (buf) => {
      const ch = buf.toString("utf8");
      if (ch === "\n" || ch === "\r" || ch === CTRL_D) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(pass);
      } else if (ch === CTRL_C) {
        stdin.setRawMode(false);
        process.stdout.write("\n");
        process.exit(1);
      } else if (ch === DEL || ch === "\b") {
        if (pass.length) {
          pass = pass.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (ch >= " ") {
        pass += ch;
        process.stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

function fail(msg) {
  console.error("Error: " + msg);
  process.exit(1);
}

const [, , emailArg, passwordArg] = process.argv;
const email = (emailArg || "").trim().toLowerCase();
if (!email) {
  fail("Usage: node scripts/create-operator.mjs <email> [password]");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail(`"${email}" is not a valid email address.`);
}

let password = passwordArg;
if (!password) password = await readPasswordHidden(`Password for ${email}: `);
if (!password || password.length < 8) {
  fail("Password must be at least 8 characters.");
}

const DATA_DIR = join(process.cwd(), "data");
const usersPath = join(DATA_DIR, "users.json");

let users = [];
if (existsSync(usersPath)) {
  try {
    const parsed = JSON.parse(readFileSync(usersPath, "utf8"));
    if (Array.isArray(parsed)) users = parsed;
  } catch {
    users = [];
  }
}

const existing = users.find((u) => (u.email || "").toLowerCase() === email);
const passwordHash = hashPassword(password);
if (existing) {
  existing.passwordHash = passwordHash;
  console.log(`Updated password for existing user: ${email}`);
} else {
  users.push({ email, passwordHash, createdAt: new Date().toISOString() });
  console.log(`Created user: ${email}`);
}

mkdirSync(DATA_DIR, { recursive: true });
const tmp = `${usersPath}.tmp`;
writeFileSync(tmp, JSON.stringify(users, null, 2), "utf8");
renameSync(tmp, usersPath);

console.log(`Saved to ${usersPath}. Log in with these credentials.`);
if (
  email === (process.env.OPERATOR_EMAIL || "corranforce@gmail.com").toLowerCase()
) {
  console.log(
    "This is the operator account — the API Settings panel will be available after login.",
  );
}
