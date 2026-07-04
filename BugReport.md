# Bug Report — Micro-SaaS Signal Engine

**Date:** 2026-07-03
**Repo:** https://github.com/CorranForce/Micro-SaaS-Signal-Engine
**Environment analyzed:** Windows 10 Pro, Node v22.14.0, npm 11.16.0
**Status:** ✅ Both issues resolved and verified (clean `npm install`, clean `next build` 4/4 pages, app + 404 page verified running in browser with zero console errors)

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
