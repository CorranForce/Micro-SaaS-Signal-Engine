# Enhancements & Backlog — Micro-SaaS Signal Engine

**Last updated:** 2026-07-22

This is the forward-looking backlog: work that is **not yet done**. Completed remediation is recorded in [README.md](./README.md) (two code-review sections) and [BugReport.md](./BugReport.md) (build/router failures). Items are grouped by priority; each has the *why* and a suggested approach.

---

## 🔴 P0 — Do before any public/shared deployment

### 1. Rotate and purge previously committed credentials
- **Why:** Earlier commits tracked `data/users.json` (an unsalted SHA-256 operator hash) and a hard-coded fallback encryption key lived in the now-deleted `app/lib/encryption.ts`. Deleting files does **not** remove them from git history on GitHub — they remain retrievable.
- **Do:**
  - Rotate the operator password and every key ever entered in Settings (Supabase anon + service-role, Resend, GoDaddy) and `GEMINI_API_KEY`.
  - Rewrite history to drop the sensitive blobs, e.g. `git filter-repo --invert-paths --path data/users.json --path app/lib/encryption.ts`, then force-push and re-clone anywhere it lives.
- **Effort:** S (but coordinate — history rewrite affects all clones).

### 2. Confirm the Gemini model IDs for your key *(largely resolved)*
- **Status:** Defaults now use the stable aliases `gemini-flash-latest` / `gemini-pro-latest`, verified working end-to-end against a live key (idea generation + realtime suggestions returned real output). One caveat: `gemini-pro-latest` (chatbot "Pro / High Thinking" mode only) hit a **429 quota** on a free-tier key — a billing limit, not a code issue.
- **Do (if needed):** List what your key can access with `curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"` and override `GEMINI_MODEL` / `GEMINI_MODEL_PRO` in `.env`. If you need the Pro chat mode on free tier, point `GEMINI_MODEL_PRO` at a flash model or enable billing.
- **Effort:** S.

### 3. Provision the operator account out-of-band
- **Why:** Self-registration of the operator email is now blocked (closed the escalation hole). The account must be created another way or the Settings panel is unreachable.
- **Do:** Create the operator user in Supabase Auth (if using the Supabase path) or add it to `data/users.json` via a one-off script using the app's scrypt hasher (`hashPassword` in `app/security.ts`). Document the chosen method.
- **Effort:** S.

### 4. Add a router guardrail to CI / prebuild
- **Why:** The App/Pages Router conflict has now recurred once and broke the hosted build. Convention alone didn't hold.
- **Do:** Fail the build if `pages/` reappears or `next/document` is imported. Minimal `prebuild` script:
  ```bash
  test ! -d pages || { echo "ERROR: pages/ dir must not exist (App Router only)"; exit 1; }
  ! grep -rq "next/document" app || { echo "ERROR: do not import next/document"; exit 1; }
  ```
  Also prefer `npm ci` (honors the committed lockfile) over `npm install` in build environments.
- **Effort:** S.

---

## 🟠 P1 — Correctness & durability on real hosting

### 5. Move users / settings / saved-ideas off the JSON file store
- **Why:** `data/*.json` (via `app/db.ts`) does not survive serverless or multi-instance deployments — Vercel's filesystem is ephemeral/read-only, so login, settings, and the app secret silently fail or reset. Atomic writes don't help when the disk itself is gone.
- **Do:** Persist users, settings, and saved ideas in Supabase with **Supabase Auth + per-user RLS**. This also subsumes the ad-hoc session/HMAC layer and the `saved_ideas` anon-insert workaround.
- **Effort:** L.

### 6. Serverless-safe rate limiting and app secret
- **Why:** The rate limiter (`app/security.ts`) is an in-memory `Map` per process — it resets on every cold start and isn't shared across instances, so limits are effectively unenforced on Vercel. The auto-generated app secret persisted under `data/` has the same ephemerality problem, which would rotate session/encryption keys unexpectedly.
- **Do:** Back rate limiting with a shared store (Upstash Redis / Vercel KV), and require `SESSION_SECRET` from env in production (fail fast if missing) rather than generating one to disk.
- **Effort:** M.

### 7. Decide the fate of the `secret_keys` / cron "AI security agent" feature
- **Why:** This subsystem is half-built: the seed route (deleted) wrote secrets nothing ever reads, the cron route only pattern-matches an encryption format and asks an LLM to comment on it, and `secret_keys` is populated by nothing now. It adds attack surface (service-role access, paid LLM calls) for no delivered value.
- **Do:** Either (a) remove it entirely (`app/api/cron/agent`, the `secret_keys` table in `supabase_schema.sql`, the `vercel.json` cron, and `instrumentation.ts`), or (b) redesign it into a real, useful scheduled job. Recommendation: remove until there's a concrete use case.
- **Effort:** S (remove) / L (redesign).

---

## 🟡 P2 — Maintainability & UX

### 8. Decompose `app/page.tsx` (~3,500 lines)
- **Why:** The ideas grid, saved kits, compare view, settings, auth modal, chatbot, and PDF export all live in one component with ~40 `useState` hooks. This is where the crash-on-search bug (first review, B1) hid.
- **Do:** Continue the extraction started with `LaunchKitTabs`: `IdeaCard`, `SavedKits`, `SettingsPanel`, `AuthModal`, `FloatingChatbot`, and the PDF builder are natural seams. Consider `useReducer` or a small store for the shared state.
- **Effort:** L.

### 9. Trim up-front font loading
- **Why:** `app/layout.tsx` loads **seven** Google font families on every page just to power a font-switcher setting most users never touch — wasted bytes and requests.
- **Do:** Load only the default (Inter/JetBrains Mono) up front; lazy-load the others when the operator actually selects them.
- **Effort:** S.

### 10. Tighten remaining type boundaries and error surfacing
- **Why:** Server actions and several handlers still accept/return `any`; `chatWithAgent` still `throw`s (Next redacts the message in production, so the chatbot shows a generic error), inconsistent with the structured-result pattern used elsewhere.
- **Do:** Replace `any` payloads with the shared `SaasIdea`/`LaunchKit` types; make `chatWithAgent` return `{ success, text?, error? }`; stop returning raw Supabase error text to the client (`handleSupabaseError`).
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
