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
   # NOTE: this account cannot be self-registered from the login modal — provision
   # it out-of-band (create it in Supabase Auth, or add it to data/users.json).
   OPERATOR_EMAIL=you@yourdomain.com
   # Optional: verified Resend sender for real email delivery
   RESEND_FROM="SaaS Radar <radar@yourdomain.com>"
   # Optional: override the Gemini model IDs (defaults: gemini-2.5-flash / gemini-2.5-pro).
   # Set these to the exact IDs your API key can access.
   GEMINI_MODEL=
   GEMINI_MODEL_PRO=
   # Required for the hourly cron route (/api/cron/agent) to run — it fails closed
   # (returns 401) when unset. Vercel Cron sends it automatically as a Bearer token.
   CRON_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to access the application.

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
| R3 | **Two unauthenticated API routes.** `POST /api/secrets/seed` (no auth) read env secrets and wrote them to Supabase via the **service-role** client; `GET /api/cron/agent` (no auth) hit the paid Gemini API and read the `secret_keys` table on every call. | `app/api/secrets/seed/route.ts`, `app/api/cron/agent/route.ts` | Deleted the seed route; the cron route now requires `Authorization: Bearer <CRON_SECRET>` and **fails closed** when unset; marked `force-dynamic`. |

### 🟠 High

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| R4 | **Email feature could never send.** `sendLaunchKitEmail` used `from: userEmail`, which Resend rejects (sender must be a verified-domain address); the documented `RESEND_FROM` env var was **never referenced in code**. | `app/actions.ts` | `from` now uses `RESEND_FROM` (fallback to the `onboarding@resend.dev` sandbox sender); the user's address is only the recipient. |
| R5 | **Invalid Gemini model IDs.** All generation used `gemini-3.1-flash-lite` / `gemini-3.1-pro-preview` (not valid published model names), which 404 every idea/kit/chat generation. | `app/actions.ts`, `app/api/cron/agent/route.ts` | Replaced with env-overridable constants (`GEMINI_MODEL` / `GEMINI_MODEL_PRO`, defaulting to `gemini-2.5-flash` / `gemini-2.5-pro`). **Verify the exact IDs your API key can access.** |
| R6 | **Two competing crypto modules; the weaker guarded real secrets.** `app/lib/encryption.ts` used AES-256-**CBC** (no auth tag) with a **hard-coded fallback key committed in the repo**, while `app/security.ts` correctly used AES-256-GCM. The weak module backed the (now-deleted) seed route. | `app/lib/encryption.ts` | Deleted; the app standardizes on `app/security.ts`. |
| R7 | **Broken in-process cron.** `instrumentation.ts` ran `node-cron` and `fetch('http://localhost:3000/...')` — a no-op on serverless that also duplicated the `vercel.json` cron (and would now 401 hourly against the protected route). | `instrumentation.ts` | Removed the self-invoking cron; scheduling is handled solely by Vercel Cron via `vercel.json`. |

### Latent build bug uncovered
With the router conflict removed, the build progressed further and hit a pre-existing crash: `app/lib/supabase.ts` created the service-role client **at import time** with empty build-time env (`Error: supabaseUrl is required`). Fixed by making the client lazy (`getSupabaseAdmin()`), created inside the request handler.

### Still open after this round
See [Enhancements.md](./Enhancements.md) for the forward-looking backlog (Supabase-backed persistence, serverless-safe rate limiting, `page.tsx` decomposition, retiring the half-built `secret_keys`/cron "security agent" feature, and rotating/purging any previously committed credentials).

## License

This project is licensed under the MIT License.
