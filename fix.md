CorranForce/Micro-SaaS-Signal-Engine fix list

Default branch: main. Write access: yes. Visibility: public.

Critical

- Next.js is flagged by npm audit as critical
  - File: package.json (next ^15.5.20) and package-lock.json (resolved next 15.5.20)
  - npm audit --package-lock-only reports 1 critical and 7 high issues, including Next.js Server Action denial of service and SSRF, plus high issues in sharp, js-yaml, nanoid, postcss, brace-expansion, browserslist, and source-map-js.
  - Fix: upgrade next and the other patched packages, then rerun npm audit until the critical and high counts are clear.

High

- Hardcoded default encryption secret
  - File: app/lib/encryption.ts line 5
  - getSecretKey() falls back to a hardcoded default string when SESSION_SECRET is missing.
  - app/security.ts lines 31-36 throws when SESSION_SECRET is missing in production. encryption.ts does not.
  - Fix: remove the default. Fail closed when SESSION_SECRET is missing, in every environment that encrypts data.

Medium

- No CI and no branch protection
  - Files: missing .github/workflows. Ruleset read for main returned no required reviews, status checks, or signed commits.
  - Fix: add a workflow that runs lint, build, and npm audit. Turn on branch protection for main with a required review and required checks.

- No LICENSE file
  - File: missing LICENSE at the repo root
  - Fix: add an explicit license if you intend others to use or fork this public repo.

Low

- package.json still uses the template name ai-studio-applet
  - File: package.json line 2
  - Fix: rename it to match the repository.
- Hygiene is otherwise decent: README.md, .gitignore, and .env.example are present. .gitignore ignores .env. No committed secret values were found.
