#!/usr/bin/env node
// Router guardrail (Enhancements.md P0 #4).
//
// This project is App Router only. A committed `pages/` directory or any
// `next/document` import reintroduces the Pages/App Router build conflict that
// has broken this repo before (see BugReport.md, Issue 2 and its recurrence).
// This script fails fast so the conflict can never be committed or built again.
//
// Wired into package.json as `prebuild` and `predev`, and runnable directly:
//   npm run check:router
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, extname, relative } from "node:path";

const root = process.cwd();
const errors = [];

// 1) No Pages Router directory at the repo root.
try {
  if (statSync(join(root, "pages")).isDirectory()) {
    errors.push(
      "A `pages/` directory exists — this project is App Router only.\n" +
        "    Put routes under `app/`. A committed pages/_document.tsx importing\n" +
        "    <Html> from next/document is exactly what broke the build before.",
    );
  }
} catch {
  /* absent = good */
}

// 2) No `next/document` imports in application code (app/ or src/).
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIR = new Set(["node_modules", ".next", ".git", ".vercel", "scripts"]);
// Match a real import/require of next/document — `import ... from "next/document"`,
// side-effect `import "next/document"`, or `require("next/document")`.
const DOC_IMPORT = /(?:from\s+|require\(\s*|import\s+)["']next\/document["']/;

// Strip comments first so a mention of next/document in prose (e.g. a
// "do NOT import from next/document" guard comment) doesn't trip the check.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/(^|[^:])\/\/.*$/gm, "$1"); // line comments (keeps http:// intact)
}

function scan(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) scan(join(dir, entry.name));
    } else if (CODE_EXT.has(extname(entry.name))) {
      const full = join(dir, entry.name);
      let src;
      try {
        src = readFileSync(full, "utf8");
      } catch {
        continue;
      }
      if (DOC_IMPORT.test(stripComments(src))) {
        errors.push(
          `\`next/document\` imported in ${relative(root, full)} — not allowed ` +
            `(App Router only; that import belongs solely in pages/_document.tsx, ` +
            `which must not exist here).`,
        );
      }
    }
  }
}

for (const codeRoot of ["app", "src"]) scan(join(root, codeRoot));

if (errors.length) {
  console.error("\n✖ Router guardrail failed:\n");
  for (const e of errors) console.error("  • " + e + "\n");
  console.error(
    "See BugReport.md for why this matters. Remove the offending file(s) and retry.\n",
  );
  process.exit(1);
}

console.log("✓ Router guardrail passed (App Router only, no next/document imports).");
