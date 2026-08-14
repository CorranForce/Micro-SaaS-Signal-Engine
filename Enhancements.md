# Enhancements & Backlog — Micro-SaaS Signal Engine

**Last updated:** 2026-07-25

This is the forward-looking backlog: work that is **not yet done**. Completed remediation is recorded in [README.md](./README.md) (three code-review / backlog-completion sections) and [BugReport.md](./BugReport.md) (build/router failures). Items are grouped by priority; each has the *why* and a suggested approach.

**Status as of 2026-07-25:** all P0/P1/P2 items are done or have a delivered plan except #1 (rotate/purge credentials — owner action), #5 (Supabase migration — needs a project), and #6 (distributed rate limiter — needs a provider choice). See README.md's "Backlog Completion & Decomposition" section for the full summary.

---

## 🔴 P0 — Do before any public/shared deployment

### 1. Rotate and purge previously committed credentials — ⚠️ *needs owner action*
- **Why:** Deleting a file does **not** remove it from git history on GitHub — it stays retrievable at old commits.
- **Audit (2026-07-22):**
  - `data/users.json` (operator password hash) is in history at commits `1e9dafa` and `22518be`; not tracked at HEAD.
  - `app/lib/encryption.ts` (hard-coded fallback key `a-default-secret-key-…`) is in history through `ff8d849`; not present at HEAD.
- **This one can't be automated away** — it requires (a) rotating real credentials on accounts only you control, and (b) a history rewrite + `--force` push, which is irreversible and breaks every existing clone. Runbook:
  1. **Rotate** the operator password (re-provision with `npm run create-operator`) and every key ever entered in Settings (Supabase anon + service-role, Resend, GoDaddy) and `GEMINI_API_KEY`.
  2. **Install the tool** (not currently present): `pip install git-filter-repo`.
  3. **Rewrite history:** `git filter-repo --invert-paths --path data/users.json --path app/lib/encryption.ts`
  4. **Re-add the remote & force-push:** filter-repo drops `origin`, so `git remote add origin <url>`, then `git push --force --all` and `git push --force --tags`.
  5. **Re-clone** everywhere the repo lives; old clones still contain the secrets and must be discarded.
- **Effort:** S — but destructive; do it deliberately. (Alternatives if you can't install filter-repo: BFG Repo-Cleaner, or `git filter-branch`.)

### 2. Confirm the Gemini model IDs for your key *(largely resolved)*
- **Status:** Defaults now use the stable aliases `gemini-flash-latest` / `gemini-pro-latest`, verified working end-to-end against a live key (idea generation + realtime suggestions returned real output). One caveat: `gemini-pro-latest` (chatbot "Pro / High Thinking" mode only) hit a **429 quota** on a free-tier key — a billing limit, not a code issue.
- **Do (if needed):** List what your key can access with `curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"` and override `GEMINI_MODEL` / `GEMINI_MODEL_PRO` in `.env`. If you need the Pro chat mode on free tier, point `GEMINI_MODEL_PRO` at a flash model or enable billing.
- **Effort:** S.

### 3. Provision the operator account out-of-band ✅ *(delivered 2026-07-22; verified end-to-end 2026-07-25)*
- **Why:** Self-registration of the operator email is now blocked (closed the escalation hole). The account must be created another way or the Settings panel is unreachable.
- **Done:** Added `scripts/create-operator.mjs` (npm script `create-operator`) — it writes to the local `data/users.json` using the exact salted-scrypt format `app/security.ts` expects (the produced hash validates with the app's `verifyPassword` logic; the script merges rather than clobbering existing users). Verified end-to-end 2026-07-25: provisioned the operator, logged in through the app, and confirmed operator access + the API Settings tab.
  ```bash
  npm run create-operator -- corranforce@gmail.com          # interactive (hidden prompt)
  OPERATOR_PASSWORD=... npm run create-operator -- <email>  # non-interactive (CI / reliable)
  ```
  Password sources are tried in order: CLI arg → `OPERATOR_PASSWORD` env → prompt. If you use Supabase Auth instead of the local store, create the operator in Supabase.
- **Interactive-prompt fixes (2026-07-23):** the hidden prompt initially failed two ways when launched via `npm run`:
  1. **Masked TTY** — npm's shell wrapper can leave `process.stdin.isTTY` false in a real terminal, so the script took the "piped input" branch and waited on a stdin end-of-stream that never arrives interactively (appeared frozen). Fixed by distinguishing *redirected* stdin (fstat FIFO/file) from a *masked* TTY, reading the console device directly (`\\.\CONIN$` / `/dev/tty`) in the latter case, and adding the `OPERATOR_PASSWORD` fallback + fail-fast guidance.
  2. **Multi-character input chunks** — the keystroke handler assumed one char per `data` event, but Windows delivers Enter as `\r\n` in a single chunk (and paste/fast-typing batch input), so Enter was silently dropped. Fixed by iterating each buffer character-by-character (unit-tested against 6 input shapes).
- **Note:** the non-interactive `OPERATOR_PASSWORD` path is the most reliable across terminals; the interactive prompt is best-effort. The change does **not** revoke existing sessions (see #13).

### 4. Add a router guardrail to CI / prebuild ✅ *(resolved 2026-07-22)*
- **Why:** The App/Pages Router conflict has now recurred once and broke the hosted build. Convention alone didn't hold.
- **Done:** Added `scripts/check-router.mjs` (portable Node, no bash dependency) wired into `package.json` as `prebuild` **and** `predev`, so a `pages/` directory or a real `next/document` import fails `npm run build`/`npm run dev` before Next ever runs. It strips comments first (so guard-comments mentioning `next/document` don't false-positive) and is also runnable directly via `npm run check:router`. Verified: passes clean, fails on both a `pages/` dir and a real import.
- **CI note:** also run `npm run check:router` (or just `npm ci && npm run build`) in CI, and prefer `npm ci` over `npm install` in build environments to honor the committed lockfile.

---

## 🟠 P1 — Correctness & durability on real hosting

### 5. Move users / settings / saved-ideas off the JSON file store — 📋 *plan delivered 2026-07-23*
- **Why:** `data/*.json` (via `app/db.ts`) does not survive serverless or multi-instance deployments — Vercel's filesystem is ephemeral/read-only, so login, settings, and the app secret silently fail or reset. Atomic writes don't help when the disk itself is gone.
- **Plan:** Full design (schema, RLS policies, code-change list, data migration, rollout steps, risks) is in [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md). Recommends adopting Supabase Auth + per-user RLS, which also subsumes the ad-hoc session/HMAC layer and the `saved_ideas` anon-insert workaround.
- **Blocked on you:** a Supabase project (URL + keys) and confirmation to adopt Supabase Auth, before implementation.
- **Effort:** L.

### 6. Serverless-safe rate limiting and app secret — 🟡 *partially done 2026-07-23*
- **Why:** The rate limiter (`app/security.ts`) is an in-memory `Map` per process — it resets on every cold start and isn't shared across instances, so limits are effectively unenforced on Vercel. The auto-generated app secret persisted under `data/` has the same ephemerality problem, which would rotate session/encryption keys unexpectedly.
- **Done:** `getAppSecret` now **throws in production** if `SESSION_SECRET` is missing/short, instead of silently generating a disk secret that rotates on every cold start (which would log everyone out and make stored settings undecryptable). The dev disk-fallback is unchanged.
- **Remaining (needs a provider choice):** back the rate limiter with a shared store — **Upstash Redis** or **Vercel KV**. Both are callable over HTTP with no heavy dependency. Blocked on which provider you want + its credentials; the current in-memory limiter still works correctly on single-instance/local.
- **Effort:** M.

### 7. Retire the `secret_keys` / cron "AI security agent" feature ✅ *(removed 2026-07-23)*
- **Why:** This subsystem was half-built: the seed route (already deleted) wrote secrets nothing ever read, the cron route only pattern-matched an encryption format and asked an LLM to comment on it, and `secret_keys` was populated by nothing. It added attack surface (service-role access, paid LLM calls) for no delivered value.
- **Done:** Removed `app/api/cron/agent/route.ts`, `app/lib/supabase.ts` (its only consumer), `instrumentation.ts`, and `vercel.json` (contained only the cron). Rewrote `supabase_schema.sql` to the canonical `saved_ideas` table the app actually uses (with anon-insert-only RLS), and dropped the now-unused `CRON_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` env vars. Build verified after removal.

### 14. Stop the same fixes from regressing — enforce them in `prebuild`/CI
> Numbered 14 to keep existing cross-references to #1–#13 valid.

- **Why:** Three fixes have now been made twice. `8a5d0ea` restored the `secret_keys`/cron subsystem removed under #7, bringing back both unauthenticated routes (BugReport R3) and the AES-CBC module with a committed fallback key (R6); the module-scope Supabase client that breaks `next build` came back with it. Separately, two commits in a row added a dependency to `package.json` while regenerating only `bun.lock`, breaking `npm ci`. The router conflict stopped recurring only when `scripts/check-router.mjs` made it a hard `prebuild` failure — convention alone has not held for anything else.
- **Do:**
  1. `npm ci --dry-run` (or `npm ls` against the lockfile) in `prebuild` or CI, so lockfile drift fails at the commit that causes it rather than at deploy.
  2. Extend `scripts/check-router.mjs` (or add a sibling) to fail when a handler under `app/api/` has no auth guard — a grep for `CRON_SECRET` / `verifySessionToken` in each route file would have caught both regressions.
  3. Decide #7 once and for all: either finish the `secret_keys` subsystem (something must actually *read* the seeded credentials) or delete it again. Half-built is what keeps regressing.
- **Found:** 2026-08-14 review. **Effort:** S.

### 13. Sessions are never revoked when a user is deleted or disabled
> Numbered 13 (out of positional order) so existing cross-references to #1–#12 in README.md and BugReport.md stay valid.

- **Why:** `verifySessionToken` (`app/security.ts`) validates only the HMAC signature and the 30-day `iat` expiry — it never re-checks that the account still exists or is still allowed in. Consequences:
  - Deleting a user from `data/users.json` leaves their signed cookie valid for up to **30 days**; they keep full access.
  - Because the operator gate is `email === OPERATOR_EMAIL`, an operator session stays privileged even after the operator account is removed or its password is rotated.
  - There is no way to force-logout a single compromised session. The only lever is rotating `SESSION_SECRET`, which logs *everyone* out **and** makes stored settings undecryptable (they're encrypted under the same secret) — so it's not a usable revocation tool.
- **Do:**
  1. After signature/expiry validation, re-check the subject on each request — a cheap lookup in the user store now, or `supabase.auth.getUser()` after the #5 migration.
  2. Optionally add a per-user `tokenVersion` (or `sessionsValidAfter` timestamp) stored alongside the account and embedded in the token, so bumping it invalidates just that user's sessions without a global secret rotation.
- **Found:** 2026-07-23, while debugging the operator login (a session from a deleted test account was still active).
- **Effort:** S for the local store. Largely subsumed by #5 — Supabase Auth handles revocation natively, so if you're doing the migration, fold this in rather than building it twice.

---

## 🟡 P2 — Maintainability & UX

### 8. Decompose `app/page.tsx` ✅ *(done 2026-07-25 — 3,510 → 1,651 lines, −53%)*
- **Why:** The ideas grid, saved kits, compare view, settings, auth modal, chatbot, and PDF export all lived in one component with ~40 `useState` hooks. This is where the crash-on-search bug (first review, B1) hid.
- **Pass 1 (2026-07-23):** extracted the self-contained pieces — `LEGACY_NICHES` → `app/lib/niches.ts`; `generateSqlFallback` + `escapeHtmlC` → `app/lib/launchkit-utils.ts`; and `TypewriterLog`, `VisualSchemaDiagram` (+ `TableNode`), `CompareNichesView`, `FloatingChatbot` → `app/components/*`.
- **Pass 2 (2026-07-25):** lifted the state-coupled sections out via typed, prop-threaded components (explicit props rather than a global store — lower regression risk, verified each at runtime):
  - `AboutTab`, `AuthModal`, `ClearConfirmModal` (batch 1)
  - `SettingsPanel` — owns the `ApiSettingsState` type; handles operator form + access-denied (batch 2)
  - `SavedKitsTab` — grid, search, per-card view/copy/delete/export + inline `LaunchKitTabs` (batch 3)
  - `IdeaCard` — the ~500-line repeated card, flattened to per-index scalar props (batch 4)
  Each was verified in the browser: auth login, settings save, saved-kit render/search/expand/delete, and idea-card render/expand/save/domain-check all work; build passes with zero console errors.
- **Optional future polish:** the per-index callback closures in the `generatedIdeas.map` could move to a `useReducer`/context if the prop lists ever feel heavy, but the component is now readable and each section is independently testable.

### 9. Trim up-front font loading ✅ *(resolved 2026-07-23)*
- **Why:** `app/layout.tsx` loaded **seven** Google font families on every page just to power a font-switcher setting most users never touch — wasted bytes and requests.
- **Done:** Reduced to the two families the switcher actually offers — **Inter** (default sans) and **JetBrains Mono** (mono). Removed Roboto, Open Sans, Lato, Poppins, and Playfair from `layout.tsx`, the dynamic font `<style>` block, and the Settings dropdown (a stale saved value now falls back to Inter). Five fewer font downloads per page.

### 10. Tighten remaining type boundaries and error surfacing ✅ *(resolved 2026-07-25)*
- **Why:** Server actions and several handlers accepted/returned `any`; `chatWithAgent` used to `throw` (Next redacts the message in production, so the chatbot showed a generic error).
- **Done:**
  - `chatWithAgent` returns a structured `GenerationResult<string>` and the chatbot surfaces the real error message (2026-07-23).
  - The client/server payload boundaries are now typed with the shared `SaasIdea` / `LaunchKit` / `SavedIdea` types: `searchSaaSIdeas` → `GenerationResult<{ saasIdeas: SaasIdea[] }>`, `generateLaunchKit` → `GenerationResult<LaunchKit>` (param is a `Pick<SaasIdea, …>`), and `sendLaunchKitEmail` / `addToSupabaseAction` / `syncToSupabaseAction` take `SaasIdea` / `LaunchKit | null` / `SavedIdea[]` (2026-07-25).
  - `handleSupabaseError` no longer echoes raw Supabase/PostgREST error text to the client — the full detail is logged server-side and the client gets an actionable, non-sensitive message.
- **Note:** a handful of internal `any`s remain by design (catch clauses, the third-party Gemini `config` object) — those aren't client/server trust boundaries.

### 11. Migrate `recharts` 2.x → 3.x ✅ *(resolved 2026-07-23)*
- **Why:** The 2.x line is EOL/deprecated. Only three symbols are used (`LineChart`, `Line`, `ResponsiveContainer`), so the migration was low-risk.
- **Done:** Bumped to `recharts@^3.10.0`; no code changes needed (the three symbols are API-stable across the major). Build passes and the Compare-tab sparklines render correctly under v3; the main route's First Load JS dropped ~178 kB → ~163 kB. Also removed the now-orphaned `node-cron` dependency (its only consumer was the deleted `instrumentation.ts`).
- **Note:** `package-lock.json` was updated; `bun.lock` is now stale (regenerate with `bun install` if you use Bun).

### 12. Local-dev session cookie ✅ *(resolved 2026-07-22)*
- **Why:** The session cookie was `secure: true; sameSite: "none"; partitioned: true` — correct for the AI Studio iframe, but browsers drop it on plain `http://localhost`, so login silently failed in local dev.
- **Done:** `setSessionCookie` (`app/actions.ts`) now relaxes to `secure: false; sameSite: "lax"; partitioned: false` when `NODE_ENV !== "production"`, keeping the strict cross-site settings in production.

---

## Notes
- Effort key: **S** ≈ <½ day, **M** ≈ 1–2 days, **L** ≈ multi-day.
- P0 items 2 and 3 are required for the app to actually function for a new operator, independent of security.
