# Micro-SaaS Signal Engine

Discover underserved, high-retention B2B opportunities in legacy industries. Instantly generate full Launch Kits, including Vibe-Coding prompts, database structures, ROI matrices, and cold outreach copy.

## Overview

The **Micro-SaaS Signal Engine** is designed to help entrepreneurs find boring but highly profitable B2B SaaS ideas. Instead of competing in crowded consumer markets, this tool points you towards unglamorous niches (like HVAC, property management, auto repair) where businesses are eager for simple digital solutions that save them time and money.

Powered by the Gemini API, the engine turns niche + constraint inputs into ready-to-execute Launch Kits. (The terminal-style "crawler" feed is a simulated visualization of the generation process, not a live scraper.)

## Features

- **Niche Selection:** Choose from multiple predefined legacy industries or enter your own custom niche (e.g., HVAC, Property Management, Custom Manufacturing).
- **Target Customization:** Specify your technical experience level and target Monthly Recurring Revenue (MRR).
- **Live Terminal Feed:** Simulates a live crawl through forums and subreddits, finding real complaints and inefficiencies.
- **Launch Kit Generation:** Automatically generates complete micro-SaaS blueprints using the Gemini API.
  - **The Core Hook:** Name, tagline, and the core problem solved.
  - **Feature Specs:** Core features with detailed descriptions.
  - **Vibe-Coding Prompts:** Ready-to-use prompts for AI coding assistants.
  - **Database Architecture:** Suggested schema structures for the initial build.
  - **Financial Metrics:** Pricing models and break-even calculations.
  - **Go-to-Market Strategy:** Cold outreach scripts and target customer profiles.
- **Save & Export:** Save ideas locally for future reference or export them directly as a highly polished PDF document.
- **Compact Mode:** A settings toggle to adjust the UI and fit more information on screen.
- **Operator Authentication:** A built-in authentication system with secure API settings management.

## Tech Stack

This project is built using modern web technologies:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [@google/genai](https://github.com/google/genai-js) (Gemini API)
- **Charts:** [Recharts](https://recharts.org/) (niche comparison sparklines)
- **Diagrams:** [@xyflow/react](https://reactflow.dev/) (visual database ER diagrams)
- **PDF Export:** [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- **Cloud persistence (optional):** [Supabase](https://supabase.com/) (`saved_ideas` push/sync; see [supabase_schema.sql](./supabase_schema.sql))

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd ai-studio-applet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and configure at minimum your Gemini API key. For production deployments also set a session-signing secret:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Required in production — signs session cookies & encrypts stored credentials:
   SESSION_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   # Optional: operator account for the API Settings panel (defaults to project owner).
   # NOTE: this account cannot be self-registered from the login modal — provision
   # it out-of-band (create it in Supabase Auth, or add it to data/users.json).
   OPERATOR_EMAIL=you@yourdomain.com
   # Optional: verified Resend sender for real email delivery
   RESEND_FROM="SaaS Radar <radar@yourdomain.com>"
   # Optional: override the Gemini model IDs (defaults: gemini-flash-latest / gemini-pro-latest).
   # Set these to the exact IDs your API key can access.
   GEMINI_MODEL=
   GEMINI_MODEL_PRO=
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to access the application.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on http://localhost:3000 (runs the router guardrail first). |
| `npm run build` | Production build (runs the router guardrail first). |
| `npm run check:router` | Guardrail: fails if a `pages/` directory or a `next/document` import exists (App Router only — see BugReport.md). Runs automatically before `dev` and `build`. |
| `npm run create-operator -- <email>` | Provision/update the operator (or any) account in the local `data/users.json` using the app's salted-scrypt format. Prompts for a hidden password. Needed because operator self-registration is intentionally blocked. Skip this if you use Supabase Auth. For a non-interactive run (CI, or if your terminal misbehaves): `OPERATOR_PASSWORD=... npm run create-operator -- <email>`. |

## Local development notes

A few gotchas that are easy to trip over (all learned the hard way):

- **Run commands from the repo root.** The local JSON store resolves as `path.join(process.cwd(), "data")` (`app/db.ts`), and the app secret / rate limiter are process-relative too. If a launcher starts the dev server from a *different* directory (e.g. `npm --prefix ...` run from a parent folder), the server reads a **different** `data/users.json` than your CLI writes to — so a freshly provisioned operator will appear "invalid" at login. Symptom: `create-operator` succeeds but login fails. Fix: ensure the server's working directory is this repo (use an absolute path in any launch config).
- **One checkout only.** Keep a single working copy. Duplicate checkouts (a second clone, or an extracted ZIP) combined with the point above are the classic cause of "my changes/logins aren't taking" — the server may be serving the other copy.
- **Clear `.next` when switching between `build` and `dev`.** `next build` writes production artifacts into `.next`; starting `next dev` on top of them can throw `Invariant: Expected clientReferenceManifest to be defined` or similar. `rm -rf .next` (delete the `.next` folder) and restart.
- **Local login needs the dev cookie relaxation.** The session cookie is `Secure; SameSite=None` in production (for the AI Studio iframe) but relaxes to `SameSite=Lax; Secure=false` when `NODE_ENV !== "production"`, so it works over `http://localhost`. Changing a password does **not** invalidate existing sessions (see Enhancements.md #13) — click **Terminate Session** to clear one.

## Usage

1. **Find Ideas:** Start by selecting a niche or typing in a custom one. Set your parameters and click **"SCAN LEGACY MARKETS"**.
2. **Review:** Watch the live terminal feed and then review the generated SaaS ideas.
3. **Save:** Save the ideas you like using the bookmark icon on the idea card.
4. **Export:** Export any idea as a PDF for a clean, shareable Launch Kit.
5. **Settings:** Navigate to the API settings tab to configure external API keys (authentication restricted to the operator). Use the Compact Mode toggle to adjust your viewing preference.

## Design Philosophy

The application follows a "Boring B2B SaaS Philosophy", focusing on building simple, efficient, and offline-first solutions. The UI/UX is built to reflect this—clean, technical, and without unnecessary bloat. It features a retro-futuristic dark mode theme, emphasizing data density and actionable insights over flashy consumer designs.

## Code Review — 2026-07-03

A full-codebase review was conducted covering every source file (`app/actions.ts`, `app/page.tsx`, `app/db.ts`, `app/layout.tsx`, `app/LaunchKitTabs.tsx`, configs, and the git history). Dependency and build-pipeline issues were resolved separately — see [BugReport.md](./BugReport.md). Findings below are ordered by severity.

> **Remediation status (2026-07-04): all findings below are FIXED** except the three follow-ups listed under *Remaining Work*. Fixes were verified with a clean production build (type checking and linting re-enabled) and a live browser session (registration → signed httpOnly session, scrypt hash on disk, settings tab hidden for non-operators, saved-kits search no longer crashes, simulated-data labels visible, zero console errors). See *Fixes Applied* below for the how.

### 🔴 Critical — Security

| # | Finding | Location |
|---|---------|----------|
| S1 ✅ | **Remote secret disclosure.** `loadApiSettings(email)` / `updateApiSettings(email, ...)` authorize using the **client-supplied `email` parameter**, not the session. Any anonymous visitor can invoke the server action with `"corranforce@gmail.com"` as the argument and read or overwrite **all stored secrets** (Supabase keys, Resend key, GoDaddy key/secret). | `app/actions.ts:494-519` |
| S2 ✅ | **Forgeable session.** The session is a plaintext, unsigned cookie containing only the email (`session_user`). Anyone can set this cookie manually and impersonate any user, including the operator. There is no session ID, signature, or expiry validation. | `app/actions.ts:421-427` |
| S3 ✅ | **All server actions are unauthenticated public endpoints.** Next.js server actions are POST routes callable by anyone. `chatWithAgent` is a free LLM proxy; `searchSaaSIdeas`/`generateLaunchKit` burn Gemini quota; `sendLaunchKitEmail(userEmail, ...)` sends to an **arbitrary recipient with attacker-controlled content** (an open spam relay on your Resend account); `checkDomainAvailabilityAction` burns GoDaddy quota. No action verifies the session, and there is no rate limiting anywhere. | `app/actions.ts` (all exports) |
| S4 ✅ | **Live credential hash committed to a public repo.** `data/users.json` is tracked in git and contains the operator's real unsalted SHA-256 password hash — crackable offline. Separately, `app/db.ts` seeds a default admin with the known hash of `password123` on first run. Passwords use single-round unsalted SHA-256 (no bcrypt/argon2), compared non-constant-time. **Action: rotate the password, purge the file from git history, and rehash with bcrypt/argon2.** | `data/users.json`, `app/db.ts:12-34`, `app/actions.ts:401-403` |
| S5 ✅ | **No `.gitignore` exists.** A `git add .` would commit `node_modules/`, `.next/`, the runtime `data/` files — and most dangerously a local `.env` containing `GEMINI_API_KEY`. This is likely how `data/users.json` got committed (S4). | repo root |

### 🟠 High — Security

| # | Finding | Location |
|---|---------|----------|
| S6 ✅ | **HTML injection.** `sendLaunchKitEmail` and `handleExportPdf` interpolate model-generated and client-supplied strings directly into HTML without escaping (email body, `container.innerHTML`). A prompt-injected model response or a crafted direct call can inject markup/event handlers. Combined with S3, outbound email content is fully attacker-controlled. | `app/actions.ts:637-713`, `app/page.tsx:1305-1399` |
| S7 ✅ | **Secrets at rest in plaintext.** The settings UI persists Supabase/Resend/GoDaddy credentials to `data/settings.json` unencrypted on disk. | `app/db.ts:89-93` |
| S8 ✅ | **World-readable/writable Supabase table.** The suggested RLS policy grants `anon` full `INSERT`/`SELECT` on `saved_ideas`, so every user's saved ideas (and emails) are readable by anyone holding the public anon key. The sync-dedupe query already fetches rows cross-user. | `app/actions.ts:819-822, 879-896` |
| S9 ✅ | **Auth hygiene.** Login reveals whether an email exists (user enumeration); registration is unlimited and writes unbounded entries to `users.json`; the JSON file store has read-modify-write races that can silently drop users under concurrency. | `app/actions.ts:405-472`, `app/db.ts` |

### 🟡 Confirmed Bugs

| # | Finding | Location |
|---|---------|----------|
| B1 ✅ | **Saved-kits search crashes the page.** The filter calls `idea.niche.toLowerCase()`, but `SaasIdea` has no `niche` field — the first keystroke in the Saved Kits search box throws `TypeError: Cannot read properties of undefined`. This type error is hidden because the build sets `ignoreBuildErrors: true`. | `app/page.tsx:1896` |
| B2 ✅ | **Invisible email feedback (dead state).** `handleGenerateKit` auto-emails the launch kit to logged-in users and writes progress into `emailStatus` — but `emailStatus` is never rendered anywhere. Users get emailed with no on-screen confirmation, and the state is dead weight. `kitTab`/`setKitTab` at page level are similarly dead (superseded by `LaunchKitTabs`'s internal state). | `app/page.tsx:939-941, 1791-1846, 926-928` |
| B3 ✅ | **Terminal log animation replays.** Log entries use `key={index}` while new logs are *prepended*, so every existing row receives a new `text` prop and re-runs its typewriter animation on each tick. Keys should be stable per log entry. | `app/page.tsx:2283-2299` |
| B4 ✅ | **Suggestions race + flicker + quota burn.** The realtime-suggestions effect sets `isSuggestionsLoading(true)` on every keystroke *before* the 600 ms debounce fires (constant "AI Refining…" flicker), never cancels in-flight requests (a stale response can overwrite a newer one), and issues a Gemini API call after every typing pause — significant cost at scale. | `app/page.tsx:949-984` |
| B5 ✅ | **Simulated data presented as analysis.** The Compare tab's "Niche Comparison Engine" metrics (growth %, MRR potential, build score, trend charts) are deterministically fabricated from a string hash of the niche name — no data source. The "Live Social & Forum Crawler" terminal is likewise a scripted animation. Neither is labeled as simulated in the UI. | `app/page.tsx:574-746, 1456-1484` |
| B6 ✅ | Production error messages will break: expected auth errors are `throw new Error(...)`, but Next.js redacts server-action error messages in production builds, so users will see a generic error instead of "Incorrect password." Return structured `{ success, error }` values instead. | `app/actions.ts:405-472` |
| B7 ✅ | Minor: GoDaddy price rendered as raw micro-unit division without rounding (`$${price / 1000000}`); saved ideas are identified by `idea.name` only (deleting one removes all same-named entries; Supabase dedupe collides across sessions); Resend sends from the sandbox sender `onboarding@resend.dev`, which only delivers to the account owner's verified address. | `app/page.tsx:2595, 3009-3013`, `app/actions.ts:722` |

### 🔵 Architecture & Code Quality

- **`app/page.tsx` is a 3,395-line monolith** — the ideas grid, saved kits, compare view, settings, auth modal, chatbot, and PDF export all live in one component with ~40 `useState` hooks. Continue the extraction started with `LaunchKitTabs` (e.g., `IdeaCard`, `SavedKits`, `SettingsPanel`, `AuthModal`, `FloatingChatbot` are natural seams).
- **Type checking and linting are disabled in builds** (`next.config.ts`: `ignoreBuildErrors`, `ignoreDuringBuilds`) — this is what let crash bug B1 ship. Re-enable both; fix B1 first since it's a genuine type error.
- **JSON files as a database** (`data/*.json`) breaks on any serverless/multi-instance deployment (ephemeral or read-only filesystems — login and settings would silently fail on Vercel) and has no locking. Supabase is already integrated; move users/settings there.
- **Untyped boundaries:** `LaunchKitTabs` takes `any` props; server actions accept `any` payloads. The `SaasIdea`/`LaunchKit` interfaces exist — share them across both files.
- **Dead code:** 8 unused lucide imports (`Clock`, `RotateCcw`, `BookOpen`, `ChevronRight`, `ExternalLink`, `DollarSign`, `Share2`, `Compass`), dead `emailStatus`/`kitTab` state (B2).
- **Performance:** seven Google font families load up front in `layout.tsx` for a font-switcher setting; most users need one.
- `LaunchKitTabs.tsx` uses `useState` without its own `"use client"` directive — it only works because its importer is a client component; add the directive to make it self-contained.

### ✅ What's Done Well

- Correct App Router structure with server-side Gemini calls — the `GEMINI_API_KEY` never reaches the browser, and the client/server boundary (`"use server"`) is used appropriately.
- Structured output via Gemini `responseSchema` on every generation call — far more robust than parsing free-form model text.
- `html2pdf.js` is dynamically imported inside the click handler, keeping a browser-only library out of SSR and the main bundle.
- Thoughtful UI states throughout: per-card loading/error/status tracking, debounced suggestions, empty states, confirmation modal for destructive clear-all.
- Graceful degradation paths (SQL fallback generator for older kits, Supabase table-missing flow that hands the user the exact `CREATE TABLE` script).

### Fixes Applied — 2026-07-04

**Security**

- **S1** — `loadApiSettings()` / `updateApiSettings(settings)` no longer accept an email parameter. Identity is derived server-side from the signed session cookie and checked against `OPERATOR_EMAIL` (env-configurable).
- **S2** — Sessions are now HMAC-SHA256-signed tokens (`app/security.ts`) carried in an `httpOnly`, `SameSite=Lax` cookie with a 30-day expiry, verified with constant-time comparison. The signing key comes from `SESSION_SECRET` (auto-generated and persisted under gitignored `data/` in dev).
- **S3** — Every server action is now rate-limited (sliding-window limiter, per user or per client IP). `sendLaunchKitEmail` ignores client-supplied recipients entirely — it only ever emails the authenticated session user, closing the open-relay hole. Supabase writes require a session.
- **S4** — Passwords are hashed with salted scrypt; legacy SHA-256 hashes are transparently re-hashed on the next successful login. The seeded default admin account was removed, `data/users.json` was untracked from git and deleted locally (regenerates empty). Password comparisons are constant-time. *Minimum password length raised 6 → 8.*
- **S5** — `.gitignore` added covering `node_modules/`, `.next/`, `data/`, and `.env*`.
- **S6** — All model-generated and client-supplied values are HTML-escaped before interpolation into the Resend email markup (`escapeHtml` in `app/security.ts`) **and** into the PDF-export DOM builder (`escapeHtmlClient` in `app/page.tsx`; closed in the 2026-07-04 follow-up review after the first fix only covered the email path).
- **S7** — The four credential fields in `data/settings.json` are now encrypted at rest with AES-256-GCM under the app secret (legacy plaintext values are read once and re-encrypted on next save).
- **S8** — The suggested RLS script no longer grants `anon` SELECT on `saved_ideas`; background sync deduplicates client-side instead of by reading the table back.
- **S9** — Login returns a uniform "Invalid email or password" (no user enumeration); login attempts are limited per email and per client; registrations are limited per client; user-store writes are atomic (temp file + rename).

**Bugs**

- **B1** — Saved-kits search no longer references the nonexistent `idea.niche`; it searches name, tagline, problem, solution, and target audience. Verified live: typing in the search box filters instead of crashing.
- **B2** — Dead `emailStatus` and page-level `kitTab` state removed; kit-generation email feedback now flows through `emailCardStatus`, which the card actually renders.
- **B3** — Terminal log rows use stable identities (distance from array end) so prepending a log no longer replays every row's typewriter animation.
- **B4** — Suggestion loading state only appears once the debounced call actually fires, and stale responses are discarded (cancellation guard), eliminating flicker and out-of-order overwrites.
- **B5** — The Compare tab is labeled **"Simulated Data"** with an explanatory subtitle, and the terminal panel is now titled "Scan Activity Feed *(simulated visualization)*".
- **B6** — `loginUser`/`registerUser` return structured `{ success, email?, error? }` results instead of throwing, so real error messages survive production builds. Extended in the 2026-07-04 follow-up: `searchSaaSIdeas`/`generateLaunchKit` also return structured results, so actionable hints (e.g., a missing `GEMINI_API_KEY`) reach the UI in production instead of being redacted, and the missing-key message now covers both local `.env` and AI Studio setups.
- **B7** — GoDaddy prices render as proper dollars (`toFixed(2)`); the Resend sandbox-sender restriction is documented and overridable via `RESEND_FROM`.

**Quality**

- Build-time **type checking and linting re-enabled** (`ignoreBuildErrors`/`ignoreDuringBuilds` removed) — the production build passes clean.
- Shared `SaasIdea`/`LaunchKit` types extracted to `app/types.ts`; `LaunchKitTabs` has typed props and its own `"use client"` directive.
- Dead code removed: 8 unused icon imports, unused `handleEmailActive`/`handleSupabaseActive` handlers and their four state hooks, the unused `getLatestNewsForNiche` server action (an unauthenticated quota-burning endpoint), and the stale `check.js`/`edit.js` codemod scripts.
- New modules: `app/security.ts` (sessions, hashing, rate limiting, escaping, encryption) and `app/types.ts`; `app/db.ts` rewritten (typed, atomic writes, no seeding).

### Remaining Work

1. **Purge `data/users.json` from git history and rotate credentials.** The file is untracked going forward, but the old password hash remains in prior commits on GitHub until history is rewritten. Rotate the operator password and any keys ever stored in settings, then run e.g. `git filter-repo --invert-paths --path data/users.json` and force-push (coordinate with any clones).
2. **Move users/settings/saved-ideas to Supabase** (with Supabase Auth + per-user RLS). The JSON-file store now writes atomically but still won't survive serverless/multi-instance deployments with ephemeral filesystems.
3. **Decompose `page.tsx`** (~3,100 lines after cleanup) into components (`IdeaCard`, `SavedKits`, `SettingsPanel`, `AuthModal`, `FloatingChatbot`), and trim the seven up-front Google font families if the font switcher isn't essential.

## Second Code Review & Remediation — 2026-07-22

A follow-up full-codebase review was conducted after the app began failing in the hosted AI Studio environment (repo repeatedly reset; only the client UI would load). It surfaced a mix of **regressions of previously-fixed issues** and new findings. All items below are **FIXED** on branch `fix/router-conflict-and-security` and verified with a clean production build (`next build` → 4/4 pages generated, type checking + linting pass).

### 🔴 Critical

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| R1 | **App Router / Pages Router conflict recommitted.** `pages/_document.tsx` (importing `<Html>` from `next/document`) and `pages/_app.tsx` were committed to `main`, reintroducing the exact build failure documented and "fixed" in [BugReport.md](./BugReport.md) Issue 2. This breaks `next build` during static generation of the error pages — the most likely cause of the hosted sandbox wiping/reloading the repo. `app/global-error.tsx` (claimed present in BugReport) was **missing**. | `pages/_document.tsx`, `pages/_app.tsx` | Deleted both `pages/` files; added the real `app/global-error.tsx`. |
| R2 | **Operator privilege escalation → API-key disclosure.** The Settings gate is `email === OPERATOR_EMAIL`, but the session email came from `registerUser` with **no proof of ownership**. Anyone could register the operator address (if not already claimed) and become admin, then `loadApiSettings()` returned the **decrypted** Supabase/Resend/GoDaddy keys to the browser. This is a new path around the S1 fix from the first review. | `app/actions.ts` | Registration now refuses the operator email; Supabase auth only grants a session when a real `session` is returned; `loadApiSettings` no longer returns secret values (blanked + `configured` flag), and `updateApiSettings` treats a blank secret field as "keep existing". |
| R3 | **Two unauthenticated API routes.** `POST /api/secrets/seed` (no auth) read env secrets and wrote them to Supabase via the **service-role** client; `GET /api/cron/agent` (no auth) hit the paid Gemini API and read the `secret_keys` table on every call. | `app/api/secrets/seed/route.ts`, `app/api/cron/agent/route.ts` | Deleted the seed route; the cron route was hardened with `CRON_SECRET` + `force-dynamic`, then **removed entirely** on 2026-07-23 along with `secret_keys`, `instrumentation.ts`, and the `vercel.json` cron (half-built, no delivered value — see Enhancements.md #7). |

### 🟠 High

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| R4 | **Email feature could never send.** `sendLaunchKitEmail` used `from: userEmail`, which Resend rejects (sender must be a verified-domain address); the documented `RESEND_FROM` env var was **never referenced in code**. | `app/actions.ts` | `from` now uses `RESEND_FROM` (fallback to the `onboarding@resend.dev` sandbox sender); the user's address is only the recipient. |
| R5 | **Brittle hard-coded Gemini model IDs.** All generation pinned `gemini-3.1-flash-lite` / `gemini-3.1-pro-preview` directly in code. These IDs *do* exist, but pinned model names are fragile — availability varies by API account and pinned versions get retired (verified: `gemini-2.5-flash` is already blocked for new keys), so a hard-coded ID silently breaks all generation on some accounts. | `app/actions.ts`, `app/api/cron/agent/route.ts` | Made the models env-overridable constants (`GEMINI_MODEL` / `GEMINI_MODEL_PRO`) defaulting to the stable `gemini-flash-latest` / `gemini-pro-latest` aliases, which track a current model. Verified end-to-end against a real key. List a key's available models with `GET https://generativelanguage.googleapis.com/v1beta/models?key=…`. |
| R6 | **Two competing crypto modules; the weaker guarded real secrets.** `app/lib/encryption.ts` used AES-256-**CBC** (no auth tag) with a **hard-coded fallback key committed in the repo**, while `app/security.ts` correctly used AES-256-GCM. The weak module backed the (now-deleted) seed route. | `app/lib/encryption.ts` | Deleted; the app standardizes on `app/security.ts`. |
| R7 | **Broken in-process cron.** `instrumentation.ts` ran `node-cron` and `fetch('http://localhost:3000/...')` — a no-op on serverless that also duplicated the `vercel.json` cron (and would now 401 hourly against the protected route). | `instrumentation.ts` | Removed the self-invoking cron; scheduling is handled solely by Vercel Cron via `vercel.json`. |

### Latent build bug uncovered
With the router conflict removed, the build progressed further and hit a pre-existing crash: `app/lib/supabase.ts` created the service-role client **at import time** with empty build-time env (`Error: supabaseUrl is required`). Fixed by making the client lazy (`getSupabaseAdmin()`), created inside the request handler.

### Follow-up fixes (2026-07-22, same day)
- **Model defaults corrected & verified.** Testing against a live key showed the interim default `gemini-2.5-flash` is blocked for new API accounts, while the original `gemini-3.1-*` IDs do exist. Defaults now use the stable `gemini-flash-latest` / `gemini-pro-latest` aliases (see R5), verified end-to-end (a live scan returned 3 complete blueprints).
- **Local-dev login fixed.** The session cookie was unconditionally `Secure; SameSite=None; Partitioned` (required for the AI Studio iframe), which browsers drop on `http://localhost`, silently breaking local login. `setSessionCookie` now relaxes these attributes when `NODE_ENV !== "production"`, keeping the strict settings in production.

### Still open after this round
See [Enhancements.md](./Enhancements.md) for the forward-looking backlog (Supabase-backed persistence, serverless-safe rate limiting, `page.tsx` decomposition, retiring the half-built `secret_keys`/cron "security agent" feature, and rotating/purging any previously committed credentials).

## Backlog Completion & Decomposition — 2026-07-23 to 2026-07-25

Worked through the [Enhancements.md](./Enhancements.md) backlog in priority order. Summary (see that file for full detail on each item):

- **P0:** router guardrail (`scripts/check-router.mjs`, wired into `predev`/`prebuild`) and an operator-provisioning CLI (`scripts/create-operator.mjs`) shipped and verified end-to-end; credential rotation/history-purge remains an owner action.
- **P1:** the half-built `secret_keys`/cron "AI security agent" subsystem was removed entirely (dead code, no delivered value, real attack surface); a full Supabase migration plan was written ([SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)); `SESSION_SECRET` now fails closed in production.
- **P2:** `recharts` upgraded 2.x → 3.x; up-front font loading trimmed 7 families → 2; `chatWithAgent` and the client/server action payloads were fully typed (no more `any` at the trust boundary); **`app/page.tsx` was decomposed from 3,510 → 1,651 lines (−53%)** into 11 components under `app/components/` plus two `app/lib/` helper modules.

**Decomposition verification.** Because prop-threading a large stateful component carries real regression risk, every extracted component was verified twice: once at runtime in-browser (login, settings save, saved-kit search/expand/delete, idea-card render/expand/save/domain-check — all exercised live) immediately after extraction, and again via a line-by-line adversarial diff against the pre-extraction code (`git show <baseline>:app/page.tsx`) for every component, specifically hunting for dropped props, inverted conditions, or changed defaults. No behavioral drift was found in any of the 11 extracted pieces.

**Follow-up quick review (2026-07-25).** A post-decomposition sweep (ESLint, a manual unused-import check, and a runtime smoke test) found 10 dead imports left in `app/page.tsx` after their JSX moved into the new components: the `LaunchKitTabs` import and the `ArrowRight`, `Mail`, `Users`, `Globe`, `Calendar`, `CheckCircle2`, `ChevronDown`, `ChevronUp` icons, and the `chatWithAgent` action — all now imported directly by the components that use them (`IdeaCard`, `SavedKitsTab`, `SettingsPanel`, `AuthModal`, `FloatingChatbot`). Removed; build and lint clean, zero console errors at runtime.

## Third Code Review & Remediation — 2026-08-09

A full review of three commits pushed to `main` after the 2026-07-25 sweep: `8a5d0ea` (secrets encryption + security agent), `2073f04` (font options), and `a131ec4` (SQL editor + compare-niches dashboard). `8a5d0ea` restored, byte-for-byte, the `secret_keys`/cron subsystem that R3/R6/R7 above record as removed — so most of that round's findings came back with it. All items below are **FIXED** and verified: `npm ci` clean, `next build` green **with no environment variables set at all**, `tsc --noEmit` and `next lint` clean, auth gates and UI behavior confirmed in a browser.

### 🔴 Build blockers (`main` would not build)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| T1 | **`npm ci` failed outright.** `node-cron` and `@types/node-cron` were added to `package.json` and `bun.lock` was regenerated, but `package-lock.json` was never updated — `npm error Missing: node-cron@4.6.0 from lock file`. Any npm-based CI or Vercel build died before compiling. | `package-lock.json` | `node-cron` removed entirely with `instrumentation.ts` (T6) and the lockfile regenerated; `npm ci` verified clean. |
| T2 | **`next build` failed without `SUPABASE_URL`.** `app/lib/supabase.ts` called `createClient()` at module scope with `''` fallbacks; supabase-js throws `supabaseUrl is required.`, and Next imports every route module while collecting page data → `Failed to collect page data for /api/secrets/seed`. This is the identical latent bug called out under "Latent build bug uncovered" above, reintroduced. | `app/lib/supabase.ts` | Client is lazy again via `getServiceClient()`, built inside the request handler. Build now succeeds with zero env vars. |

### 🔴 Critical (regressions of R3 / R6)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| T3 | **`POST /api/secrets/seed` unauthenticated.** Verified live: anonymous POST returned `HTTP 200`. With credentials configured it reads `GEMINI_API_KEY`, `RESEND_API_KEY`, `GODADDY_API_KEY`, `GODADDY_API_SECRET` and `APOLLO_API_KEY` and writes them to the database. Even unconfigured, the per-key `skipped (not found)` vs `success` breakdown told an anonymous caller exactly which integrations the deployment holds. | `app/api/secrets/seed/route.ts` | Operator-gated via `isOperator()`; anonymous and non-operator callers both get an identical `403`. `force-dynamic` restored. Verified: anonymous POST → `403 {"error":"Not authorized"}`. |
| T4 | **`GET /api/cron/agent` unauthenticated.** Reachable anonymously; each call billed a Gemini request and returned metadata about the `secret_keys` table. `vercel.json` scheduled it hourly with no secret check — the URL was the entire gate. | `app/api/cron/agent/route.ts` | Requires `Authorization: Bearer $CRON_SECRET`, compared in constant time, **failing closed when `CRON_SECRET` is unset**. Model id now follows `GEMINI_MODEL` instead of a hard-coded `gemini-3.1-flash-lite` (R5). Supabase errors are logged server-side, not returned. Verified: no header → `401`, wrong bearer → `401`, correct bearer → passes auth. |
| T5 | **Hard-coded encryption fallback key returned.** `app/lib/encryption.ts` came back verbatim, including `'a-default-secret-key-that-is-at-least-32-chars-long'`. Demonstrated: a value encrypted with `SESSION_SECRET` unset is recoverable knowing only the repo. Still AES-256-**CBC** (unauthenticated), and its `sha256 → base64 → substring(0,32)` derivation yields **192 bits** of entropy, not 256. Because this is one of the two paths in the Enhancements.md #1 history-purge runbook, restoring it at HEAD also blocked that cleanup. | `app/lib/encryption.ts` | Deleted again. Both routes now use `encryptSecret`/`decryptSecret` from `app/security.ts` (AES-256-GCM, `enc:v1:` envelope, key from `getAppSecret()` which throws in production when `SESSION_SECRET` is missing). |

### 🟠 High

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| T6 | **In-process cron returned, still broken.** `instrumentation.ts` re-registered `node-cron` against a hard-coded `http://localhost:3000`. Verified: on a server started on port 3113 it logged `⚙️ Hourly security agent cron registered.` while pointing at 3000. It also duplicated the `vercel.json` schedule and would now 401 hourly against the protected route. | `instrumentation.ts` | Deleted (again), along with the `node-cron` dependency. Scheduling is Vercel Cron only, via `vercel.json`. |
| T7 | **`secret_keys` table existed nowhere.** `supabase_schema.sql` defines only `saved_ideas`, so both routes queried a table nothing creates — the cron route 500'd on every run. | `supabase_schema.sql` | Added `secret_keys` with **RLS enabled and no policies**, so PostgREST denies anon and authenticated entirely and only the service-role key can reach it, plus an `updated_at` trigger so the agent's staleness reporting means something. |
| T8 | **Session cookie heuristic broke non-localhost dev.** `8a5d0ea` treated *any* host not starting with `localhost`/`127.0.0.1` as HTTPS, so `next dev` reached over a LAN IP or IPv6 `[::1]` got `Secure; SameSite=None`, the browser silently dropped the cookie, and login failed with no error — the exact failure the original comment existed to prevent. | `app/actions.ts` | `x-forwarded-proto` is now authoritative when present (covering Cloud Run/Vercel/nginx regardless of `NODE_ENV`); loopback — including `[::1]` — is always treated as plain http; `NODE_ENV` is only the fallback. Since the header can only *add* `Secure`, a spoofed value cannot downgrade a real HTTPS session. |

### 🟡 Medium — dashboard correctness

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| T9 | **Fabricated ideas were counted as the user's own.** `DEFAULT_SAMPLE_IDEAS` (10 hard-coded ideas) padded any shorter run, then the panel reported them as `SAMPLE SIZE 10 · Ideas Tracked` under `LAST 10 GENERATED IDEAS`. On a clean session it showed `AVG HOTNESS 86.6` and `TOP SCORING IDEA Solar Permit Auto-Filer` — none of it generated. With a partial run the aggregates silently blended real and invented scores. | `app/components/CompareNichesView.tsx` | Real and sample ideas are never mixed. With nothing generated the canned set shows alone behind an `EXAMPLE DATA` badge and explanatory copy; the moment real ideas exist the samples disappear and every statistic is computed from real data only. Verified in-browser: two seeded ideas scoring 71 and 64 now yield `AVG HOTNESS 67.5`, `SAMPLE SIZE 2 Ideas Tracked`, and no canned entries. |
| T10 | **Niche dropdowns disagreed with the table they drive** *(pre-existing, predates these commits — surfaced by the new dashboard)*. State defaulted to `"Dental Practices"` / `"HVAC Services"`, neither of which exists in `LEGACY_NICHES` (`"Dental Practice Ops"`, `"HVAC & Electrical"`). Both `<select>`s therefore displayed their first option, "Amazon FBA Sellers", while the comparison table below read DENTAL PRACTICES vs HVAC SERVICES. | `app/components/CompareNichesView.tsx` | Defaults are now `LEGACY_NICHES[0].name` / `[1].name`. Verified: selects and table columns agree. |
| T11 | **SQL editor edits silently discarded on export.** The new editor shows a "CUSTOM MODIFIED" badge, but `customSql` is local component state — saved kits, the PDF export and the launch-kit email all render `kit.databaseRequirements.sqlSchema`, the unedited original. | `app/LaunchKitTabs.tsx` | Helper text now states plainly that edits apply to **Copy SQL Script** only and are not saved to the kit, PDF, or email. (The editor itself is copy-only by design — it never executes SQL.) |

### 🔵 Low

- **`"build": "NODE_ENV=production next build"`** reverted to `next build` — `next build` already sets `NODE_ENV=production`, and the inline assignment breaks on Windows `cmd`/PowerShell.
- **`update_readme.py` / `update_readme_2.py`** deleted. Two committed one-off scripts that contradicted each other (Next.js `v16.2.10` vs `v15.1.0`, recharts `v2.15.4` vs `v3.10.0`), were both wrong about the actual versions, were never applied (`README.md` is untouched in those commits), and carried a greedy `re.sub(r'## Tech Stack.*## Getting Started', …, flags=DOTALL)` that would erase everything between the first and last occurrence of those headings.
- **`.env.example`** now documents `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` and `APOLLO_API_KEY`, each scoped to the routes that read it.

### Reviewed and deliberately left alone

- **`app/global-error.tsx` dropping its `<html>`/`<body>` wrapper is fine.** This looked like a re-run of BugReport Issue 2, so it was tested rather than assumed: a root-layout throw was forced, built for production, and loaded in Chromium. It renders correctly — one `<html>`, one `<body>`, "Something went wrong. / Try again", no nesting or hydration errors — because Next 15.5 supplies its own `__next_error__` document shell. It does diverge from Next's documented contract and from their builtin implementation, so it is worth revisiting on a major Next upgrade, but it is not a bug today.
- **The session-refresh work in `app/page.tsx`** (`8a5d0ea`) is correct and was kept as-is: falling back to the server session instead of trusting client state, and clearing `localStorage` on an `AUTH_REQUIRED` response, is the right fix.
- **Simulated niche metrics.** `getMetrics` still derives MRR/growth/trend from `hashCode(nicheName)`. That is pre-existing and honestly labeled by the `SIMULATED DATA` badge on the tab, so it was left alone — it is also why two different niches can show an identical growth figure.
- **Font loading.** `2073f04` re-expanded up-front fonts from 2 families to 5 (Roboto at 3 weights), reversing Enhancements.md #9. That is a deliberate product choice, so it stands — but the `/` bundle is now 197 kB (299 kB first load), up from 164 kB, and the item is reopened in the backlog rather than silently dropped.

## License

This project is licensed under the MIT License.
