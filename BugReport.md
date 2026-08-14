# Bug Report — Micro-SaaS Signal Engine

**Date:** 2026-07-03
**Repo:** https://github.com/CorranForce/Micro-SaaS-Signal-Engine
**Environment analyzed:** Windows 10 Pro, Node v22.14.0, npm 11.16.0
**Status:** ✅ Both issues resolved and verified (clean `npm install`, clean `next build` 4/4 pages, app + 404 page verified running in browser with zero console errors)

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

# Code Review — 2026-08-14 (`68e4e44` "feat(ai): integrate deep thinking and grounding")

**Reviewed:** commit `68e4e44` on `main` (deep-thinking audit, Google Search grounding, model-config change, motion UI, `global-error` fix), plus the surrounding code it touches.
**Branch:** `claude/code-review-documentation-5p0bsg`
**Status:** all findings below are **fixed and verified** — `npm ci` clean from the committed lockfile, `tsc --noEmit` clean, `next lint` clean, `next build` green **with zero env vars set**, and the auth gates confirmed with live HTTP calls.

## Executive summary

The feature itself is sound, but three classes of problem shipped with it:

1. **The build was broken for npm consumers** — `package.json` gained `motion` with only `bun.lock` updated, so `npm ci` failed before compiling anything.
2. **Two headline features could not work as written.** The deep-audit JSON schema disagreed with the UI that renders it, and Google Search grounding is mutually exclusive with the JSON schema mode the same request asked for — so grounding silently never happened.
3. **Every AI failure was relabelled as success.** All four generation actions began returning `success: true` with locally synthesized template content on *any* error, including a missing API key. The UI presented canned copy as live market research, and the operator got no signal that Gemini was down.

The review also found that commit `8a5d0ea` (a few commits earlier) **regressed two security issues this document already recorded as fixed** — the unauthenticated `secret_keys` routes (R3) and the weak AES-CBC crypto module with a repo-committed fallback key (R6). Those are fixed again here.

> **Overlap note.** The unmerged branch `fix/router-conflict-and-security` (`3c42d8a`) independently fixes the lockfile, the lazy Supabase client, and the same two security regressions. If that branch is merged, expect conflicts in those files; the fixes here are equivalent in intent (operator gate on seed, `CRON_SECRET` bearer on cron, AES-256-GCM only).

## 🔴 Critical

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| A1 | **`npm ci` fails — the lockfile was never regenerated.** `motion@^13.1.0` was added to `package.json` with only `bun.lock` updated. `npm ci` aborts with *"package.json and package-lock.json are not in sync — Missing: motion@13.1.0, framer-motion@13.1.0, motion-dom, motion-utils"* (plus `node-cron` / `@types/node-cron` from `8a5d0ea`, same omission). Any npm-based CI or deploy fails before compiling. | `package-lock.json` | Regenerated the lockfile; `npm ci` verified clean from a wiped `node_modules`. |
| A2 | **Unauthenticated routes are back (regression of R6/R3).** `POST /api/secrets/seed` — no auth — encrypts every configured deployment credential into Supabase with the **service-role** client and returns a per-key breakdown disclosing which credentials the deployment holds. `GET /api/cron/agent` — no auth — reads `secret_keys` and bills a Gemini call **per request**. Verified reachable anonymously (HTTP 200). | `app/api/secrets/seed/route.ts`, `app/api/cron/agent/route.ts` | Seed now requires an operator session; cron requires `Authorization: Bearer $CRON_SECRET`, compared in constant time and **failing closed when `CRON_SECRET` is unset**. Both verified: 401 anonymous, 401 wrong secret, proceeds with the right one. |
| A3 | **The weak crypto module is back (regression of R6).** `app/lib/encryption.ts` reappeared: AES-256-**CBC** (no auth tag), keyed off `SESSION_SECRET` with the fallback `'a-default-secret-key-that-is-at-least-32-chars-long'` **committed in the repo**. With `SESSION_SECRET` unset, secrets were "encrypted" under a key anyone can read from GitHub. It was the only crypto used by the seed route. | `app/lib/encryption.ts` | Deleted. The seed route now uses `encryptSecret` (AES-256-GCM) from `app/security.ts`, which is what the rest of the app already uses. |

## 🟠 High

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| A4 | **AI outages were reported as successes.** `searchSaaSIdeas`, `generateLaunchKit`, `runDeepThinkingAnalysis` and `chatWithAgent` all changed their `catch` blocks to `return { success: true, data: <template content> }` and downgraded the log to `console.warn`. Because `getAIClient()` throws when `GEMINI_API_KEY` is missing, a completely unconfigured deployment shows three polished "market opportunities" with ROI figures and domain suggestions, indistinguishable from real output. `chatWithAgent`'s replacement even contradicts the comment three lines above it, which explains that results are structured precisely so the user sees the real reason (rate limit, missing key). | `app/actions.ts` | Kept the offline resilience but made it **honest**: `GenerationResult` gained `degraded`, `notice`, `error` and `modelUsed`; fallbacks set `degraded: true` and log at `console.error`. `app/page.tsx` renders an amber **"Offline / Template Mode"** banner over the results and writes a `[DEGRADED]` terminal line naming the underlying error; the chatbot's canned reply now opens with `⚠️ Offline advisory mode`. |
| A5 | **The deep audit renders blank on the live API path.** The response schema declared `threatMatrix` as `ARRAY of STRING`, while `DeepThinkingAnalysis`, `IdeaCard`, and the fallback generator all treat it as `{ competitorRisk, regulatoryRisk, executionFriction }`. A successful Gemini call therefore produced three empty risk cards; **only the offline fallback rendered correctly**, which is likely why it went unnoticed. `JSON.parse` returns `any`, so TypeScript could not catch it. | `app/actions.ts`, `app/components/IdeaCard.tsx` | Schema changed to an object with those three required keys, prompt updated to name them, and a `normalizeDeepAnalysis()` coercion added so an array-shaped or partial response still renders (`"Not assessed."` rather than blank). |
| A6 | **Google Search grounding never actually ran.** The grounded request attached `tools: [{ googleSearch: {} }]` *and* `responseMimeType: "application/json"` + `responseSchema`. The Gemini API rejects that combination (`INVALID_ARGUMENT`), so every grounded search failed, the retry layer stripped the tool, and the retry succeeded **ungrounded** — costing an extra round trip and guaranteeing `groundingSources` was always empty. The grounding toggle defaults to **on**, so this was the default path for every search. | `app/actions.ts` | The grounded path now drops `responseMimeType`/`responseSchema` and pins the JSON contract in the prompt, parsed with a fence-tolerant `parseJsonLoose()`. Grounding and High Thinking are also no longer mutually exclusive (they were `if/else if`, so ticking both silently disabled grounding). When grounding still has to be dropped, the result carries a `notice` and the terminal logs a `[WARN]`. |
| A7 | **`next build` died without Supabase env (regression).** `app/lib/supabase.ts` called `createClient` at **module scope** with `''` fallbacks; Next imports route modules while collecting page data, so the build failed with `Error: supabaseUrl is required.` This is the exact latent bug the 2026-07-22 round fixed with a lazy `getSupabaseAdmin()`. | `app/lib/supabase.ts` | Lazy again — `getSupabaseAdmin()` + `isSupabaseConfigured()`, created inside the request handler. Both routes return **503** when Supabase is unconfigured instead of crashing. `next build` now succeeds with no env vars at all. |

## 🟡 Medium / Low

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| A8 | **Stale audits leak across searches.** `deepAnalysisData` is keyed by the idea's array index, and `handleDiscover` resets `generatedIdeas`/`launchKits` but not the audit maps. Running a search, auditing an idea, then searching again showed the **previous** idea's strategic audit under a completely different idea. | `app/page.tsx` | `handleDiscover` now clears `deepAnalysisData`, `deepAnalysisLoading` and the degraded banner alongside the ideas. |
| A9 | **UI labels named models the code never uses.** Badges read `gemini-3.1-pro-preview` / `gemini-3.5-flash` and logs said "Activating Gemini 3.1 Pro", but all three constants default to `gemini-3.5-flash` — and `GEMINI_MODEL_PRO === GEMINI_MODEL`, so "High Thinking" changed only `thinkingLevel`, not the model. | `app/page.tsx`, `app/components/IdeaCard.tsx` | Badges now name the **setting** (`GEMINI_MODEL_PRO`), which is environment-dependent and stays true; success logs report `modelUsed` returned by the server. `.env.example` documents all four model vars and states plainly that `GEMINI_MODEL_PRO` defaults to a flash model. |
| A10 | **The model fallback chain reintroduced retired pins.** `generateContentWithFallback` hard-coded `gemini-2.5-flash` and `gemini-1.5-flash` as fallback rungs — `gemini-2.5-flash` is the exact ID finding R5 recorded as **blocked for new API keys**. The loop also retried non-retryable failures: an invalid API key was retried across 4 models with config-stripping retries (~8 calls) before surfacing. | `app/actions.ts` | Chain is now `requested → GEMINI_MODEL → GEMINI_MODEL_FALLBACK` (default `gemini-flash-latest`, a stable alias, overridable). Auth/permission failures (`API_KEY_INVALID`, `PERMISSION_DENIED`, 401, 403) short-circuit immediately. The helper also reports which model served the response and whether config had to be stripped. |
| A11 | **In-process cron duplicated the Vercel cron.** `instrumentation.ts` schedules `node-cron` against `http://localhost:3000` — on Vercel that both double-invokes the job already scheduled in `vercel.json` and logs a connection error hourly, since nothing listens on localhost. (Previously removed for this reason; returned with `8a5d0ea`.) | `instrumentation.ts` | Skipped when `process.env.VERCEL` is set, so it is local-dev only; honours `PORT`; skipped entirely when `CRON_SECRET` is unset (the route would 401 anyway); sends the bearer header. |
| A12 | **`secret_keys` was queried but never created.** Both routes read/write a table absent from `supabase_schema.sql`. | `supabase_schema.sql` | Added with **RLS enabled and no policies**, so only the service-role key can reach it. |
| A13 | Dead code: `SaasIdea.deepAnalysis` was added to the type but never read or written (audits live in `page.tsx` state); `Cpu` was imported in both `page.tsx` and `IdeaCard.tsx` and used in neither; `SaasIdea.groundingSources` duplicated the `GroundingSource` interface inline. `key.encrypted_value.length` would throw on a null column. | `app/types.ts`, `app/page.tsx`, `app/components/IdeaCard.tsx`, `app/api/cron/agent/route.ts` | Removed / deduplicated / null-guarded. |

## Confirmed correct

- **`app/global-error.tsx`** — the added `<html>`/`<body>` wrapper is right. `global-error` replaces the root layout when it fires, so it must render the document shell itself; without it the boundary renders nothing in production. This does **not** conflict with the App-Router guardrail (`scripts/check-router.mjs`), which only bans `next/document` imports and a `pages/` directory.
- **`instrumentation.ts` build-phase guard** — skipping registration during `phase-production-build` is correct and kept.
- **Rate limiting** — all four generation actions still return `success: false` on rate-limit rejection, so the fallback path never masks a rate limit.

## Verification

| Check | Result |
|---|---|
| `npm ci` from the committed lockfile (after `rm -rf node_modules`) | ✅ 492 packages, no sync error |
| `npx tsc --noEmit` | ✅ Clean |
| `npx next lint` | ✅ No warnings or errors |
| `npm run build` with **zero** env vars | ✅ Compiled; 6/6 pages generated (previously died at "Collecting page data") |
| `GET /api/cron/agent` anonymous / wrong secret / correct secret | ✅ 401 / 401 / proceeds |
| `POST /api/secrets/seed` without an operator session | ✅ 401 |
| `GET /` and both routes with Supabase unconfigured | ✅ 200 / 503 / 503 (no crash) |

## Not fixed — needs an owner decision

- **The `secret_keys` / cron "security agent" subsystem is still of questionable value.** [Enhancements.md #7](./Enhancements.md) removed it on 2026-07-23 as half-built; `8a5d0ea` restored it. It is now secured, but it still only pattern-matches an encryption envelope and asks an LLM to comment on the result, and nothing reads the seeded credentials back. Decide whether to keep it or retire it again — leaving it half-built is what produced these regressions twice.
- **A regressed fix needs a guardrail, not another fix.** R3, R6 and the lazy-Supabase fix have now each been made twice. The router conflict stopped recurring only once `scripts/check-router.mjs` enforced it in `prebuild`. Consider the same treatment: a prebuild check that fails on a `pages/` dir *and* on any route under `app/api/` lacking an auth guard, plus `npm ci --dry-run` in CI to catch lockfile drift at the source.
