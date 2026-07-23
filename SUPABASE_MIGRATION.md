# Supabase Migration Plan (Enhancements.md P1 #5)

**Status:** Plan only — no code changes yet. This document is the design to review before committing to the work.

## Why

Users, settings, and the app secret currently live in `data/*.json` on the local filesystem (`app/db.ts`, `app/security.ts`). That works in local dev but **silently fails on serverless/multi-instance hosting** (Vercel's filesystem is ephemeral and read-only at runtime):

- New registrations and settings writes throw or vanish between requests.
- The auto-generated app secret under `data/.app-secret` is regenerated per cold start, which rotates the session-signing and encryption keys unexpectedly — logging everyone out and making previously-encrypted settings undecryptable.
- The in-memory rate limiter (see #6) has the same per-instance problem.

Moving persistence to Supabase (already a dependency) fixes all of this and enables real multi-user isolation.

## Target architecture

| Concern | Today | After migration |
|---|---|---|
| Identity | Signed cookie + `data/users.json` (scrypt) | **Supabase Auth** (email/password). The app already has a Supabase-auth code path in `loginUser`/`registerUser` — make it the only path. |
| Operator gate | `email === OPERATOR_EMAIL` from a self-asserted session | A `profiles.role = 'operator'` flag enforced by RLS, plus the env allow-list as a backstop |
| App settings (API keys) | `data/settings.json`, AES-256-GCM at rest | `app_settings` table, secrets still encrypted at rest with `SESSION_SECRET` (or Supabase Vault) |
| Saved ideas | `localStorage` + `saved_ideas` (anon insert, no select) | `saved_ideas` keyed to `auth.uid()` with per-user RLS (select/insert/delete own rows) |
| App secret | `data/.app-secret` | **Required** `SESSION_SECRET` env var (fail fast if missing in prod — see #6) |
| Rate limiting | in-memory Map | shared store (see #6) |

Recommendation: **adopt Supabase Auth** rather than porting the JSON user store into a table. It removes the hand-rolled session/HMAC layer, gives email confirmation and password reset for free, and `auth.uid()` becomes the key for all RLS.

## Schema

```sql
-- 1) Profiles: one row per auth user, holds the role. Created via trigger on signup.
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','operator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) App settings: a single operator-managed row of integration credentials.
CREATE TABLE public.app_settings (
  id                 INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  supabase_url       TEXT,
  supabase_anon_key  TEXT,   -- stored encrypted (enc:v1:...) by the app
  resend_api_key     TEXT,   -- encrypted
  godaddy_api_key    TEXT,   -- encrypted
  godaddy_api_secret TEXT,   -- encrypted
  compact_mode       BOOLEAN DEFAULT false,
  font_family        TEXT DEFAULT 'inter',
  font_size          TEXT DEFAULT 'base',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Saved ideas: now keyed to the authenticated user.
ALTER TABLE public.saved_ideas
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- (backfill user_id from user_email during migration, then consider NOT NULL)
```

## Row Level Security

```sql
-- profiles: a user can read/update only their own row; role is not self-writable.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- role changes are done by an admin via the service role (dashboard/edge fn), never client-side.

-- app_settings: only the operator may read or write; secrets never reach non-operators.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator reads settings" ON public.app_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'operator'));
CREATE POLICY "operator writes settings" ON public.app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'operator'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'operator'));

-- saved_ideas: each user sees and manages only their own rows (replaces anon-insert-only).
ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert" ON public.saved_ideas;
CREATE POLICY "own ideas: select" ON public.saved_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ideas: insert" ON public.saved_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ideas: delete" ON public.saved_ideas FOR DELETE USING (auth.uid() = user_id);
```

> Even with encryption at rest, keep `app_settings` behind the operator RLS policy — defense in depth. Storing the plaintext keys only in memory server-side (never returned to the browser) still holds, exactly as the current masked `loadApiSettings` does.

## Code changes required (when we do the work)

1. **Auth:** make the Supabase-auth branch the only path in `loginUser`/`registerUser`; use `supabase.auth.getUser()` server-side for identity; drop the HMAC session token and `data/users.json`. Operator check becomes "profile.role = operator".
2. **Settings:** replace `getSettings`/`saveSettings` (file I/O in `app/db.ts`) with reads/writes to `app_settings`, keeping the encrypt/decrypt + masked-return logic already in place.
3. **Saved ideas:** write `user_id = auth.uid()`; the client can now `select` its own rows (removing the localStorage-only sync workaround and the cross-user dedupe caveat).
4. **App secret:** require `SESSION_SECRET` from env in production (fail fast) — overlaps with #6; keep it only for encrypting `app_settings` values (or move to Supabase Vault).
5. **Delete** `app/db.ts` file-store code paths and the `data/` runtime dir usage.

## One-time data migration

A `scripts/migrate-to-supabase.mjs` (to be written) would:
1. Read `data/users.json` → create Supabase Auth users (they'll need a password reset, since scrypt hashes can't be imported into Supabase Auth) **or** simply ask users to re-register. For a single-operator app, just re-provision the operator.
2. Read `data/settings.json` → upsert the singleton `app_settings` row (re-encrypt under the same `SESSION_SECRET`).
3. Existing `saved_ideas` rows: backfill `user_id` by matching `user_email` to the new auth users.

## Rollout steps

1. Create a Supabase project; run the schema + RLS above and the existing `supabase_schema.sql`.
2. Set env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, for admin ops like setting `role`), and a fixed `SESSION_SECRET`.
3. Land the code changes behind a short-lived flag or on a branch; test locally against the live project (auth, settings read/write as operator, saved-idea isolation between two accounts).
4. Set the operator's `profiles.role = 'operator'` via the dashboard/service role.
5. Deploy; verify on the serverless environment (the whole point — confirm login/settings persist across cold starts).
6. Remove the JSON file-store code and `data/` usage.

## Effort & risk

- **Effort:** L (multi-day). Auth swap is the riskiest part; do it with two test accounts to prove RLS isolation before removing the file store.
- **Risk:** existing local accounts can't be imported password-and-all (scrypt → Supabase Auth), so plan a re-register / password-reset step. For a single-operator deployment this is trivial (re-provision once).

## What I need from you to implement it

- A Supabase project (URL, anon key, service-role key), or confirmation to create one.
- Confirmation to adopt Supabase Auth (vs. keeping the custom session layer) — recommended.
