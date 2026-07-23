# Enhancements & Backlog — Micro-SaaS Signal Engine

**Last updated:** 2026-07-22

This is the forward-looking backlog: work that is **not yet done**. Completed remediation is recorded in [README.md](./README.md) (two code-review sections) and [BugReport.md](./BugReport.md) (build/router failures). Items are grouped by priority; each has the *why* and a suggested approach.

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

### 3. Provision the operator account out-of-band ✅ *(tooling delivered 2026-07-22)*
- **Why:** Self-registration of the operator email is now blocked (closed the escalation hole). The account must be created another way or the Settings panel is unreachable.
- **Done:** Added `scripts/create-operator.mjs` (npm script `create-operator`) — it writes to the local `data/users.json` using the exact salted-scrypt format `app/security.ts` expects (verified: the produced hash validates with the app's `verifyPassword` logic; the script merges rather than clobbering existing users). Run it yourself with your own password:
  ```bash
  npm run create-operator -- corranforce@gmail.com   # prompts for a hidden password
  ```
  If you use Supabase Auth instead of the local store, create the operator in Supabase.
- **Remaining:** You run it once with a password you choose (I can't set that for you).

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

---

## 🟡 P2 — Maintainability & UX

### 8. Decompose `app/page.tsx` (~3,500 lines)
- **Why:** The ideas grid, saved kits, compare view, settings, auth modal, chatbot, and PDF export all live in one component with ~40 `useState` hooks. This is where the crash-on-search bug (first review, B1) hid.
- **Do:** Continue the extraction started with `LaunchKitTabs`: `IdeaCard`, `SavedKits`, `SettingsPanel`, `AuthModal`, `FloatingChatbot`, and the PDF builder are natural seams. Consider `useReducer` or a small store for the shared state.
- **Effort:** L.

### 9. Trim up-front font loading ✅ *(resolved 2026-07-23)*
- **Why:** `app/layout.tsx` loaded **seven** Google font families on every page just to power a font-switcher setting most users never touch — wasted bytes and requests.
- **Done:** Reduced to the two families the switcher actually offers — **Inter** (default sans) and **JetBrains Mono** (mono). Removed Roboto, Open Sans, Lato, Poppins, and Playfair from `layout.tsx`, the dynamic font `<style>` block, and the Settings dropdown (a stale saved value now falls back to Inter). Five fewer font downloads per page.

### 10. Tighten remaining type boundaries and error surfacing — 🟡 *partially done 2026-07-23*
- **Why:** Server actions and several handlers still accept/return `any`; `chatWithAgent` used to `throw` (Next redacts the message in production, so the chatbot showed a generic error).
- **Done:** `chatWithAgent` now returns a structured `GenerationResult<string>` (`{ success, data?, error? }`) and the chatbot surfaces the real error message.
- **Remaining:** replace remaining `any` payloads on server actions with the shared `SaasIdea`/`LaunchKit` types, and stop returning raw Supabase error text to the client (`handleSupabaseError`). Deferred to the #8 decomposition, which touches the same call sites.
- **Effort:** M.

### 11. Migrate `recharts` 2.x → 3.x
- **Why:** The 2.x line is EOL/deprecated. Only three symbols are used (`LineChart`, `Line`, `ResponsiveContainer`), so the migration is low-risk.
- **Effort:** S.

### 12. Local-dev session cookie ✅ *(resolved 2026-07-22)*
- **Why:** The session cookie was `secure: true; sameSite: "none"; partitioned: true` — correct for the AI Studio iframe, but browsers drop it on plain `http://localhost`, so login silently failed in local dev.
- **Done:** `setSessionCookie` (`app/actions.ts`) now relaxes to `secure: false; sameSite: "lax"; partitioned: false` when `NODE_ENV !== "production"`, keeping the strict cross-site settings in production.

---

## Notes
- Effort key: **S** ≈ <½ day, **M** ≈ 1–2 days, **L** ≈ multi-day.
- P0 items 2 and 3 are required for the app to actually function for a new operator, independent of security.
