# Bug Report — Micro-SaaS Signal Engine

**Date:** 2026-07-03
**Repo:** https://github.com/CorranForce/Micro-SaaS-Signal-Engine
**Environment analyzed:** Windows 10 Pro, Node v22.14.0, npm 11.16.0
**Status:** ✅ Both issues resolved and verified (clean `npm install`, clean `next build` 4/4 pages, app + 404 page verified running in browser with zero console errors)

> ⚠️ **UPDATE 2026-08-09 — the build broke again, for two new reasons.** `npm ci` failed on desynced lockfiles, and `next build` crashed on a module-scope Supabase client (a recurrence of the 2026-07-22 latent bug). Both are fixed; see [the 2026-08-09 update at the end of this document](#update-2026-08-09--main-would-not-build-two-independent-causes).

> ⚠️ **UPDATE 2026-07-22 — Issue 2 RECURRED and was re-fixed.** After this report was written, `pages/_document.tsx` and `pages/_app.tsx` were re-created **and committed to `main`**, reintroducing the exact Pages/App Router conflict described in Issue 2 below. The `app/global-error.tsx` file this report claims was added was **not present** in the repo. Both have now been corrected — see [the recurrence section at the end of this document](#update-2026-07-22--issue-2-recurred). Treat the "Fixes applied" and "Verification" sections below as the *original* 2026-07-03 state, not the current one.

---

## Executive Summary

The app failed twice in the hosted build environment due to two colliding problems:

1. **React 19 peer-dependency conflicts** that made `npm install` fail with an unrecoverable dependency-tree error (exit 254).
2. **A Pages Router / App Router structural conflict** where `pages/404.tsx` and `pages/_document.tsx` were generated alongside the `app/` directory, and `<Html>` from `next/document` was imported outside `pages/_document.tsx`, crashing static page generation during `next build`.

Forensic analysis of the repo shows the codebase had already been *partially* stabilized by commit `46cec5f` ("chore: downgrade to Next.js 15 and simplify stack") — but several **latent hazards remained that would re-trigger both failures** in any environment that re-resolves dependencies (exactly what AI-driven build sandboxes do). All of them are now fixed.

---

## Issue 1 — React 19 Peer Dependency Conflicts

### What actually happened (root cause)

The failing dependency set predates HEAD. At commit `cc60a8c` the project used a bleeding-edge combination (`next ^16.2.2`, `react ^19.2.4`, `recharts ^3.8.1`, `motion ^12`, `lucide-react ^1.16.0`). Commit `46cec5f` downgraded to Next 15.1.0 + React 19 and swapped in `recharts@2`, `framer-motion@11`, and `lucide-react@0.468.0`. That got the *lockfile* into a consistent state, but the *manifest* (`package.json`) still contained constraints that fail whenever a resolver ignores the lockfile and re-resolves from scratch:

| Package | Problem found | Evidence |
|---|---|---|
| `lucide-react@0.468.0` | **The literal "React 19 RC" peer constraint.** Its peer range is `react: "^16.5.1 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0-rc"` — it never declares support for React 19 **stable**. npm's semver happens to accept `19.2.7` against `^19.0.0-rc`, but stricter resolvers (and `--strict-peer-deps` environments, common in hosted sandboxes) reject it, producing exactly the ERESOLVE failure described. | `npm view lucide-react@0.468.0 peerDependencies` |
| `framer-motion@^11.15.0` | Listed as a conflict source — and it turned out to be **completely unused**. Zero imports anywhere in `app/`. Pure conflict surface with no benefit. | `grep -r "framer-motion" app/` → no matches |
| `firebase@^11.0.2` | Also **completely unused** (zero imports). Pulls in a massive transitive tree (76 packages) that only widens the resolution search space. | `grep -r "firebase" app/` → no matches |
| `@google/genai: "latest"` | A **floating dist-tag**. Every fresh install resolves a potentially different major version — non-deterministic builds and a classic way hosted rebuilds break "for no reason." | `package.json` line 12 |
| `next@15.1.0` | Deprecated on npm with a **known security vulnerability (CVE-2025-66478)**. npm prints a deprecation warning on every install. | `npm install` output |
| `recharts@2.15.4` | **Not actually a conflict** — its peers allow `^19.0.0` stable. (It is EOL/deprecated in favor of v3, but functional.) | `npm view recharts@2.15.4 peerDependencies` |
| `@xyflow/react@12.11.1` | **Not actually a conflict** — peers are `react: ">=17"`. | lockfile metadata |

Key insight: two of the three libraries blamed in the failure report (`framer-motion`, `firebase`) were dead weight, and the real strict-peer landmine (`lucide-react`'s `^19.0.0-rc` range) was not on the suspect list at all.

### Fixes applied (`package.json`)

```diff
 "dependencies": {
-  "@google/genai": "latest",
+  "@google/genai": "^2.10.0",          // pinned — deterministic installs
   "@xyflow/react": "^12.11.1",
-  "firebase": "^11.0.2",               // REMOVED — unused
-  "framer-motion": "^11.15.0",         // REMOVED — unused
   "html2pdf.js": "^0.14.0",
-  "lucide-react": "^0.468.0",
+  "lucide-react": "^0.469.0",          // first version whose peer range is ^19.0.0 (stable), not ^19.0.0-rc
-  "next": "15.1.0",
+  "next": "15.5.20",                   // patches CVE-2025-66478; stays on React-19-compatible 15.x line
   ...
 },
 "devDependencies": {
-  "eslint-config-next": "15.1.0",
+  "eslint-config-next": "15.5.20",     // kept in lockstep with next
   ...
 }
```

`package-lock.json` was regenerated. The install now resolves a single, flat React tree — `react@19.2.7` / `react-dom@19.2.7` — with **every** peer range in the graph satisfied by React 19 stable. 76 packages were removed from the tree.

---

## Issue 2 — Next.js Router Conflict (`<Html>` import error)

### What actually happened (root cause)

`next build` crashed during static page generation with:

> `<Html> should not be imported outside of pages/_document`

Forensics: **no `pages/` directory or `next/document` import exists anywhere in the repo's git history** (verified with `git log --all -- "pages/*"` and a full-text search). The `pages/404.tsx` and `pages/_document.tsx` files were generated by the hosted build tool as a 404-page workaround and never committed. That created two problems at once:

1. **Mixed-router conflict.** The project is App Router (`app/` directory). Adding `pages/_document.tsx` re-activates the Pages Router build pipeline in parallel, and Next.js then prerenders `/404` and `/500` through the Pages machinery.
2. **Illegal `<Html>` import.** `<Html>`, `<Head>`, `<Main>`, and `<NextScript>` from `next/document` are only valid inside `pages/_document.tsx` itself. When any of them is pulled into a regular page/component chunk (or when a duplicated React copy — see Issue 1 — corrupts the error-page prerender), static generation of the error pages throws and the whole build fails. The two issues compound: the peer-conflict workaround (`--force`/`--legacy-peer-deps`) creates duplicate React trees, which surfaces as this exact `<Html>` error even in pure App Router projects.

The root gap that invited the bad workaround: **the project had no App Router 404 or global error page**, so tooling reached for the Pages Router pattern.

### Fixes applied

1. **`app/not-found.tsx` (new)** — the App Router-native custom 404 page, styled to match the app's dark theme, with a link back to the dashboard. This removes any reason to ever create `pages/404.tsx`. A guard comment in the file documents the rule.
2. **`app/global-error.tsx` (new)** — the App Router-native replacement for `_document`-level error handling. It is the only file in an App Router project that legitimately renders its own `<html>`/`<body>` tags. This removes any reason to ever create `pages/_document.tsx`.
3. **No `pages/` directory** — confirmed absent; the project is now unambiguously single-router.

**Rule going forward:** never import from `next/document` in this project. 404 → `app/not-found.tsx`; error UI → `app/error.tsx` / `app/global-error.tsx`; document shell → `app/layout.tsx`.

---

## Additional Hazard Found & Removed

**`check.js` and `edit.js` (repo root) — deleted.** These were one-shot codemod scripts left over from the `LaunchKitTabs` extraction (commit `f42568a`). They blindly rewrite `app/page.tsx` using **hard-coded stale line offsets** (e.g., line 3838 in a file that is now 3,395 lines long). If any tool or person re-ran `edit.js`, it would silently corrupt `page.tsx`. Their work is already committed; they had no remaining purpose.

---

## Verification

| Check | Result |
|---|---|
| `npm install` (fresh resolution) | ✅ Clean — zero peer-dep warnings/errors, no deprecation warnings, 76 packages removed |
| `npm ls next react react-dom lucide-react recharts @xyflow/react` | ✅ Single flat tree: `next@15.5.20`, `react@19.2.7`, `react-dom@19.2.7`, `lucide-react@0.469.0` |
| `npm run build` (`next build`) | ✅ Compiled successfully; **4/4 static pages generated** (`/`, `/_not-found`) — no `<Html>` error |
| App smoke test in browser (`next dev`) | ✅ Full UI renders (radar config, niche grid, crawler panel); **zero console errors** |
| 404 behavior (`/this-route-does-not-exist`) | ✅ Custom `app/not-found.tsx` renders with working "Back to Signal Engine" link |

---

## Recommendations (not applied — future work)

1. **Use `npm ci` in build environments** so the committed lockfile is honored instead of re-resolving (this alone would have prevented failure #1 from recurring at HEAD).
2. **Migrate `recharts` 2.x → 3.x** when convenient; the 2.x branch is EOL. Only three symbols are used (`LineChart`, `Line`, `ResponsiveContainer`), so migration is low-risk.
3. **Re-enable type checking** — `next.config.ts` currently sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`, which can mask real regressions.
4. **Security:** `app/db.ts` seeds a default admin account (`corranforce@gmail.com`) with an unsalted SHA-256 hash of a known default password into `data/users.json`. Replace with bcrypt/argon2 hashing and remove the hard-coded default credential before any public deployment.

---

## Update 2026-07-22 — Issue 2 recurred

**Environment:** Windows 10 Pro, Node v22.14.0, npm 11.16.0
**Status:** ✅ Re-fixed and verified (`next build` → compiled successfully, 4/4 static pages generated, type checking + linting pass). Fixes are on branch `fix/router-conflict-and-security`.

### What was found

A follow-up review (triggered by the app repeatedly resetting in the hosted AI Studio sandbox and only loading the client UI) found that **Issue 2 had come back** and, unlike the original occurrence, this time the offending files were **committed to `main`**:

| File | State on `main` (2026-07-22) | Problem |
|---|---|---|
| `pages/_document.tsx` | Present, committed | Imports `<Html>`/`<Head>`/`<Main>`/`<NextScript>` from `next/document` — the illegal-import + mixed-router conflict this report's Issue 2 is entirely about. |
| `pages/_app.tsx` | Present, committed | Re-activates the Pages Router pipeline alongside `app/`. |
| `app/global-error.tsx` | **Absent** | This report (Issue 2, fix #2) states it was added. It was not in the repo. |

This is the most likely explanation for the hosted-sandbox behavior: `next build` fails during static generation of the error pages, and the tool responds by regenerating the project and serving only the pre-built client bundle.

### Root cause

The original 2026-07-03 fix relied on *social convention* ("never import from `next/document`") plus files (`app/global-error.tsx`) that were never actually committed. Nothing in the repo **enforced** single-router structure, so a later hosted-tool edit re-created the Pages Router files and they were committed unchecked.

### Fixes applied

1. **Deleted `pages/_document.tsx` and `pages/_app.tsx`.** The project is App Router only; these files exist solely as conflict surface. `app/layout.tsx` is the document shell.
2. **Added `app/global-error.tsx`** — the App-Router-native global error boundary (the only file allowed to render its own `<html>`/`<body>`), with a guard comment restating the "never recreate `pages/_document.tsx`" rule.
3. **Uncovered and fixed a latent build crash** that the router conflict had been masking: `app/lib/supabase.ts` created the Supabase service-role client at *module import time* with empty build-time env, throwing `Error: supabaseUrl is required` during "Collecting page data". Converted to a lazy `getSupabaseAdmin()` created inside the request handler.

### Verification

| Check | Result |
|---|---|
| `npm ci` (from committed lockfile) | ✅ Installed |
| `npm run build` (`next build`) | ✅ Compiled successfully; **4/4 static pages generated** (`/`, `/_not-found`, `/api/cron/agent` as dynamic); no `<Html>` error, no `supabaseUrl` error |
| Type checking + linting | ✅ Pass (they are enabled — `next.config.ts` no longer sets `ignoreBuildErrors`/`ignoreDuringBuilds`) |

### Recommendation to stop this recurring

Add a CI check (or a `predev`/`prebuild` script) that fails if a `pages/` directory or any `next/document` import reappears, e.g.:

```bash
test ! -d pages || { echo "ERROR: pages/ router dir must not exist (App Router only)"; exit 1; }
```

This turns the "never do this" convention into an enforced guardrail. Security and other findings from the same review are tracked in [README.md](./README.md#second-code-review--remediation--2026-07-22) and [Enhancements.md](./Enhancements.md).

---

## Update 2026-08-09 — `main` would not build (two independent causes)

**Status:** ✅ Both fixed and verified — `npm ci` clean, and `next build` green **with no environment variables set at all** (4/4 static pages; `/api/cron/agent` and `/api/secrets/seed` as dynamic routes). `tsc --noEmit` and `next lint` also clean.

The router guardrail added above did its job — it passed on every run, and no `pages/` directory or `next/document` import reappeared. These are different failures, both introduced by commit `8a5d0ea`.

### Issue 3 — `npm ci` failed: lockfiles out of sync

**Symptom**
```
npm error `npm ci` can only install packages when your package.json and
npm error package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: @types/node-cron@3.0.11 from lock file
npm error Missing: node-cron@4.6.0 from lock file
```

**Root cause.** `node-cron` and `@types/node-cron` were added to `package.json` and `bun.lock` was regenerated, but `package-lock.json` was not. The repo carries **two lockfiles**, and only one was updated. `npm install` silently repairs this locally, which is why it went unnoticed — but `npm ci`, which every CI and Vercel build uses, fails hard and never reaches the compile step.

**Fix applied.** `node-cron` was removed entirely along with `instrumentation.ts` (its only consumer — see README T6), and `package-lock.json` was regenerated. Verified with a clean `rm -rf node_modules && npm ci`.

**Recommendation.** Pick one lockfile and delete the other, or add `npm ci` to CI so a desync fails on the PR rather than at deploy. Tracked as a note under Enhancements.md #11.

### Issue 4 — `next build` crashed on module-scope Supabase client

**Symptom**
```
Collecting page data ...
Error: supabaseUrl is required.
    at 12683 (.next/server/app/api/secrets/seed/route.js:1:526)

> Build error occurred
[Error: Failed to collect page data for /api/secrets/seed]
```

**Root cause.** `app/lib/supabase.ts` called `createClient(supabaseUrl, supabaseKey)` at **module scope**, with `''` fallbacks when the env vars were unset. supabase-js throws on an empty URL, and Next.js imports every route module while collecting page data — so the whole build died on any machine without Supabase credentials. A fresh clone could not build.

This is a **recurrence**: the same latent bug was found and fixed on 2026-07-22 (see README, "Latent build bug uncovered"), then reintroduced verbatim when `8a5d0ea` restored the file.

**Fix applied.** The client is lazy again — `getServiceClient()` constructs it on first use inside the request handler, throws a clear, actionable error when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing, and has no silent anon-key fallback. Routes translate that into a `503` instead of a build failure.

**Why it kept recurring.** Both this and Issue 2 came back the same way: a file deleted for cause was later restored wholesale, carrying its original defects. The router guardrail only checks for `pages/` and `next/document`. A cheap way to catch this whole class is to run `next build` in CI **with no env vars set** — that single check would have caught Issue 4 and the R3/T3 unauthenticated-route regressions would still need review, but the build blockers would have surfaced on the PR.

Full findings from this review round, including the security regressions, are in [README.md](./README.md#third-code-review--remediation--2026-08-09).
