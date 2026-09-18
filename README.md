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
   # NOTE: this account cannot be self-registered from the login modal, and NO
   # default operator is seeded. Provision it with:
   #   npm run create-operator -- you@yourdomain.com
   # (or create it in Supabase Auth if you use that instead).
   OPERATOR_EMAIL=you@yourdomain.com
   # Optional: verified Resend sender for real email delivery
   RESEND_FROM="SaaS Radar <radar@yourdomain.com>"
   # Optional: override the Gemini model IDs. The in-code defaults are PINNED IDs
   # (gemini-3.8-flash). If your key cannot reach them, every generation call
   # degrades to synthesized placeholder content (the UI labels this). Set these to
   # IDs your key can access, or to the stable gemini-flash-latest /
   # gemini-pro-latest aliases. List a key's models with:
   #   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
   GEMINI_MODEL=
   GEMINI_MODEL_PRO=
   GEMINI_MODEL_FAST=
   # Required if you deploy the hourly security-agent cron (/api/cron/agent).
   # The route fails closed: unset means every request is rejected with 401.
   CRON_SECRET=
   ```

   See [.env.example](./.env.example) for the full list, including
   `SUPABASE_SERVICE_ROLE_KEY` and the optional local-cron switches.

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
- **No operator account exists until you create one.** Nothing is seeded — a committed password hash would be a public, offline-crackable credential (see finding C4). Run `npm run create-operator -- <email>` once, matching `OPERATOR_EMAIL`. Symptom if you skip it: login fails with "Invalid email or password" and the API Settings tab never appears.
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

## Code Review — 2026-09-18

A full review of the latest commit (`8e0865a`) and the changes that landed since the
2026-07-25 sweep. All findings below are **fixed** on branch
`claude/focused-pasteur-x6ya7g` and verified with a clean `npm run build`
(4/4 pages), a clean `next lint`, a clean `tsc --noEmit`, live HTTP probes of both
API routes, and a scripted browser session (login → operator gate → settings form →
logout, plus a full scan against a server with no `GEMINI_API_KEY`).

### ⚠️ Headline: three previously-fixed security findings had been reverted

Commits `8a5d0ea` ("feat: implement secrets encryption and security agent") and
`fea894f` ("refactor: update model versions…") re-introduced files and behaviour
that the [2026-07-22 review](#second-code-review--remediation--2026-07-22) and
[Enhancements.md #7](./Enhancements.md) had deliberately deleted. Git's history makes
this easy to miss: the files came back as a *new feature*, not as a revert.
**When re-adding a subsystem that a prior review removed, re-read why it was
removed first** — R3, R6 and R7 below all came back verbatim.

### 🔴 Critical — Security

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| C1 | **Unauthenticated secret-seeding endpoint (regression of R3).** `POST /api/secrets/seed` had no auth at all. Any anonymous caller could trigger it: it reads five server-side credentials out of the environment, writes them to Supabase through the **service-role** client, and returns a per-secret status list that discloses exactly which credentials the deployment holds. | `app/api/secrets/seed/route.ts` | Gated on an operator session (same check as `loadApiSettings`); non-operators get an opaque `404`. Added `force-dynamic`, and error details are logged server-side instead of returned. |
| C2 | **Encryption key published in the repo (regression of R6).** `app/lib/encryption.ts` used AES-256-**CBC** with no authentication tag and fell back to the literal key `"a-default-secret-key-that-is-at-least-32-chars-long"` when `SESSION_SECRET` was unset — so on any deployment missing that variable, every credential in `secret_keys` was encrypted with a key committed to a public repository. It duplicated the correct AES-256-GCM implementation already in `app/security.ts`. | `app/lib/encryption.ts` | Module deleted. The seed route now uses `encryptSecret()` from `app/security.ts` (AES-256-GCM, `enc:v1:` envelope), whose key derivation **fails closed** in production when `SESSION_SECRET` is absent. |
| C3 | **Unauthenticated paid-API endpoint (regression of R3).** `GET /api/cron/agent` had no auth. Every request read the whole `secret_keys` table (`select('*')`, ciphertext included) and spent Gemini tokens. It was also reachable by anyone who could guess the path — and `vercel.json` publishes that path. | `app/api/cron/agent/route.ts` | Requires `Authorization: Bearer $CRON_SECRET` (the header Vercel Cron sends) and **fails closed** when `CRON_SECRET` is unset. The query no longer selects ciphertext, and the encrypted-format probe now checks the real `enc:v1:` envelope instead of the deleted CBC hex pattern. Verified: correct secret → `200`, wrong/absent → `401`. |
| C4 | **Live operator password hash committed to the repo, and unchangeable (regression of S4).** `app/db.ts` carried a hard-coded scrypt hash for `corranforce@gmail.com` and `getUsers()` re-asserted it **on every read** — seeding the account if absent and *overwriting the stored hash if it differed*. Two consequences: a real credential hash is public and offline-crackable, and any password the operator sets (via `create-operator` or otherwise) is silently reverted on the next request. | `app/db.ts` | Seeding removed; `getUsers()` is a pure read again. **Action required:** provision the account with `npm run create-operator -- <email>` and treat the old password as compromised — rotate it. |

### 🟠 High

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| H1 | **Deep Strategic Audit rendered three empty boxes on every successful call.** `runDeepThinkingAnalysis` asked Gemini for `threatMatrix` as an **array of strings**, but `app/types.ts`, the fallback generator and `IdeaCard` all read it as an **object** (`competitorRisk` / `regulatoryRisk` / `executionFriction`). TypeScript could not catch it: the response goes through `JSON.parse()`, which is `any`. The feature only ever *looked* correct when the API call failed and the fallback supplied the right shape. | `app/actions.ts` | `responseSchema` and the prompt now specify the object shape the UI actually renders. |
| H2 | **Domain checker reported registered domains as available.** The DNS fallback treated "no records returned" as "not registered". A resolver `SERVFAIL`, a timeout, a refusal or no network at all produces exactly that — so an outage turned every domain green with a Buy button. A registered-but-parked domain (`ENODATA`) hit the same path. | `app/actions.ts` | Error codes are now classified: `ENOTFOUND`/`NXDOMAIN` from every lookup → available; any `ENODATA` → registered; anything else → reported as inconclusive, which the card already renders as an amber "Check". Verified against 7 cases including 4 that the old logic called available. |
| H3 | **Silent, unlabelled fallback content.** Every generation action caught *all* errors — including a missing `GEMINI_API_KEY` — and returned canned template text with `success: true`. The user saw three polished "AI-discovered opportunities" with no indication they were generic boilerplate. This defeats the B6 fix (which existed precisely so actionable errors reach the UI) and repeats finding B5 (simulated data presented as analysis). | `app/actions.ts`, `app/page.tsx` | `GenerationResult` carries `usedFallback` + a sanitized `fallbackReason`. The results grid shows an amber "Offline Mode — Synthesized Example Data" banner naming the cause, and the scan feed logs it. Cards still render, so graceful degradation is preserved. |
| H4 | **Operator gate hard-coded in the browser.** `page.tsx` compared the session email against the literal `"corranforce@gmail.com"` in five places while the server authorizes against `OPERATOR_EMAIL`. Setting that variable hid the Settings tab from the actual operator (and showed it to an address the server would then refuse). Not an escalation — the server check held — but the feature was unusable for anyone else. | `app/page.tsx`, `app/actions.ts` | New `getSessionInfo()` action returns `{ email, isOperator }` decided server-side, next to the check that enforces it; the client holds no operator address. Verified end-to-end with `OPERATOR_EMAIL` set to a different address. |
| H5 | **Supabase admin client built at import time.** `app/lib/supabase.ts` called `createClient()` at module scope with `'https://placeholder.supabase.co'` / `'placeholder-key'` fallbacks, so a misconfigured deployment got a client silently pointed at a fake host instead of a detectable failure. (This is the shape of the build-time crash noted under *Latent build bug uncovered* in the 2026-07-22 review.) | `app/lib/supabase.ts` | Lazy `getSupabaseAdmin()` that returns `null` when unconfigured; no placeholder credentials. Marked `server-only`. |

### 🟡 Medium

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| M1 | **Broken in-process cron (regression of R7).** `instrumentation.ts` ran `node-cron` against a hard-coded `http://localhost:3000`, duplicating the `vercel.json` schedule. On Vercel the timer dies with the lambda; locally on any other port it silently no-ops; and against the now-authenticated route it would 401 hourly. | `instrumentation.ts` | Off unless `ENABLE_LOCAL_CRON=true`, requires `CRON_SECRET`, sends the bearer header, and honours `PORT`/`CRON_AGENT_URL`. Vercel Cron remains the production path. |
| M2 | **Pinned Gemini model IDs with no safety net (regression of R5).** All three model constants default to a single pinned ID. R5 moved these to the stable `-latest` aliases precisely because pinned IDs vary by API account and get retired; when they fail, H3 meant the user silently got boilerplate. `.env.example` still documented the old alias defaults, so the docs and the code disagreed. | `app/actions.ts`, `.env.example` | The pinned defaults are unchanged (deliberate), but the retry chain now ends with `gemini-flash-latest` / `gemini-pro-latest`, so a retired ID degrades to a working model instead of to canned text. `.env.example` and the README now describe what the code actually does. |
| M3 | **Wasted quota on rate-limited calls.** `generateContentWithFallback` retried with a stripped config after *any* failure, including `429`/`503` — spending another call against the same exhausted quota to "fix" a problem that was never about the config. | `app/actions.ts` | Config-stripping now happens only for non-transient errors. |
| M4 | **`secret_keys` table was undocumented.** Both API routes read and write it, but `supabase_schema.sql` only defined `saved_ideas` — the feature could not work on a fresh project, and nothing specified its RLS posture. | `supabase_schema.sql` | Added the table with RLS enabled and **no policies**, so the public anon key can never touch it (both routes use the service-role key, which bypasses RLS). |
| M5 | **`npm ci` failed — the committed lockfile was out of sync with `package.json`.** Commit `8a5d0ea` added `motion`, `node-cron` and `@types/node-cron` to `package.json` and regenerated only `bun.lock`; `package-lock.json` was never updated. `npm ci` (the correct command for CI and clean deploys) aborts with *"Missing: motion@13.4.0 from lock file"* plus five more — and `motion` is imported by `app/components/IdeaCard.tsx`, `node-cron` by `instrumentation.ts`, so this is not a phantom dependency. Reproduced before the fix, verified passing after. | `package-lock.json` | Lockfile regenerated; `npm ci` now installs 492 packages cleanly. **Note:** this repo carries both `package-lock.json` and `bun.lock` — whichever you edit, regenerate the other, or CI and local will disagree. |
| M6 | Minor correctness and hygiene: the footer hard-coded "Gemini 3.5 Flash" while the app defaults to another engine; `searchSaaSIdeas` assigned `model` then immediately overwrote it; `loginUser`/`registerUser` used `require()` inside an ESM `"use server"` module; `update_readme.py` and `update_readme_2.py` were one-off scratch scripts left at the repo root containing two contradictory, stale tech-stack blurbs. | `app/page.tsx`, `app/actions.ts`, repo root | Footer shows the selected engine; dead assignment removed; `require()` → static import; scratch scripts deleted. |

### Verified, not changed

- `tsc --noEmit`, `next lint` and `next build` were already clean before this review — every finding above is a behavioural or security issue that compiles perfectly.
- HTML escaping on both the email (`escapeH`) and PDF (`escapeHtmlC`) paths is correct and applied to every interpolation, including the new PDF layout from `8e0865a`.
- Session tokens, scrypt hashing, constant-time comparison and the rate limiter in `app/security.ts` are sound.
- `sendLaunchKitEmail` still ignores any client-supplied recipient and mails only the session user.
- The `saved_ideas` RLS posture (anon INSERT only, no SELECT) is correct in both `supabase_schema.sql` and the in-app recovery script.

### Still open (owner actions)

1. **Rotate the operator password and purge secrets from git history.** The hash removed in C4 is still in the history of this repository, as is the `data/users.json` noted in the 2026-07-04 *Remaining Work*. `git filter-repo` plus a force-push, coordinated with any clones.
2. **Reconsider the `secret_keys` / cron "AI security agent" subsystem.** It is hardened now, but [Enhancements.md #7](./Enhancements.md) retired it for a reason that still holds: nothing reads the secrets it writes, and the audit only pattern-matches a prefix and asks an LLM to comment. It is attack surface and recurring spend for no delivered capability.
3. **Confirm the pinned Gemini model IDs against a real key** (`curl "https://generativelanguage.googleapis.com/v1beta/models?key=…"`). The alias fallback added in M2 prevents a hard failure, but a wrong pinned ID means every request pays two or more failed round-trips first.
4. **Serverless-safe persistence and rate limiting** remain outstanding from earlier reviews: the JSON store under `data/` and the in-memory rate limiter are both per-instance and do not survive an ephemeral filesystem.

## License

This project is licensed under the MIT License.
