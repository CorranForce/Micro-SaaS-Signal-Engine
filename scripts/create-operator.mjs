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
//   node scripts/create-operator.mjs <email>            # prompts (hidden input)
//   npm run create-operator -- <email>                  # same, via npm
//   OPERATOR_PASSWORD=... npm run create-operator -- <email>   # non-interactive
//   echo 'pass' | node scripts/create-operator.mjs <email>     # piped / CI
//   node scripts/create-operator.mjs <email> <password>        # arg (in shell history)
//
// Password sources are tried in order: CLI argument -> OPERATOR_PASSWORD env
// -> interactive prompt. Prefer the prompt or the env var; passing the password
// as an argument leaves it in your shell history.
//
// Note on the prompt: `npm run` wraps the script through a shell, which on some
// platforms leaves process.stdin.isTTY false even in a real terminal. We detect
// that and read the console device directly, so the hidden prompt still works.
import { randomBytes, scryptSync } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
  openSync,
  closeSync,
  fstatSync,
} from "node:fs";
import { join } from "node:path";
import { ReadStream } from "node:tty";

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

// Read hidden (masked) input from a TTY stream.
function hiddenFromStream(stream, promptText, onDone) {
  return new Promise((resolve) => {
    process.stdout.write(promptText);
    stream.setRawMode(true);
    stream.resume();
    let pass = "";
    const finish = (value, exit) => {
      try {
        stream.setRawMode(false);
      } catch {
        /* ignore */
      }
      stream.removeListener("data", onData);
      stream.pause();
      process.stdout.write("\n");
      if (onDone) onDone();
      if (exit) process.exit(1);
      resolve(value);
    };
    const onData = (buf) => {
      const ch = buf.toString("utf8");
      if (ch === "\n" || ch === "\r" || ch === CTRL_D) {
        finish(pass, false);
      } else if (ch === CTRL_C) {
        finish("", true);
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
    stream.on("data", onData);
  });
}

// `npm run` wraps the script through a shell, which on some platforms (notably
// Windows) leaves process.stdin.isTTY false even in a real interactive
// terminal. Opening the console device directly gives us a genuine TTY so the
// hidden prompt still works. Returns { stream, close } or null.
function openConsole() {
  const candidates =
    process.platform === "win32" ? ["\\\\.\\CONIN$", "CONIN$"] : ["/dev/tty"];
  for (const path of candidates) {
    try {
      const fd = openSync(path, "r");
      const stream = new ReadStream(fd);
      if (stream.isTTY) {
        return {
          stream,
          close: () => {
            try {
              stream.destroy();
              closeSync(fd);
            } catch {
              /* ignore */
            }
          },
        };
      }
      closeSync(fd);
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

// Read piped stdin (e.g. `echo pass | node ...`). Fails fast instead of
// hanging forever when stdin is neither a TTY nor an ending pipe.
function readPipedStdin(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let data = "";
    const timer = setTimeout(() => {
      reject(
        new Error(
          "No password received and no interactive terminal is available.\n" +
            "  Run the script directly:  node scripts/create-operator.mjs <email>\n" +
            "  or supply the password:   OPERATOR_PASSWORD=... npm run create-operator -- <email>",
        ),
      );
    }, timeoutMs);
    process.stdin.on("data", (d) => (data += d));
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(data.replace(/\r?\n$/, ""));
    });
    process.stdin.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

// Is stdin actually redirected (a pipe or a file), as opposed to an
// interactive terminal that merely isn't reporting itself as a TTY?
function stdinIsRedirected() {
  try {
    const st = fstatSync(0);
    return st.isFIFO() || st.isFile();
  } catch {
    return false;
  }
}

async function readPasswordHidden(promptText) {
  // 1) Real TTY on stdin (direct `node scripts/...` invocation).
  if (process.stdin.isTTY) {
    return hiddenFromStream(process.stdin, promptText);
  }
  // 2) Genuinely redirected input (`echo pass | ...`, `< file`, CI).
  if (stdinIsRedirected()) {
    return readPipedStdin();
  }
  // 3) Not a TTY and not redirected — we're interactive but the TTY is masked
  //    (typical of `npm run` wrappers). Read from the console device directly.
  const consoleIn = openConsole();
  if (consoleIn) {
    return hiddenFromStream(consoleIn.stream, promptText, consoleIn.close);
  }
  // 4) Last resort: try stdin anyway, failing fast with guidance.
  return readPipedStdin();
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

// Password sources, in order: CLI arg -> OPERATOR_PASSWORD env -> prompt.
let password = passwordArg || process.env.OPERATOR_PASSWORD;
if (!password) {
  try {
    password = await readPasswordHidden(`Password for ${email}: `);
  } catch (err) {
    fail(err.message);
  }
}
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
