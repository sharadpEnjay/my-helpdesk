---
name: project-e2e-setup
description: Layout and conventions of this repo's Playwright E2E infra (ports, config files, seeded test users)
metadata:
  type: project
---

- Tests live in `e2e/*.spec.ts`, config in `playwright.config.ts` (root),
  shared constants in `e2e/test-config.ts`.
- Test server: port 3002 (`TEST_SERVER_PORT`), test client: port 5174
  (`TEST_CLIENT_PORT`). Test DB: `my-helpdesk-test`
  (`TEST_DB_URL`/`TEST_DB_NAME`/`ADMIN_DB_URL` in `e2e/test-config.ts`).
- `e2e/global-setup.ts` drops/recreates the test DB, runs
  `prisma migrate deploy`, runs `server/prisma/seed.ts` to create the admin
  user (`ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, default
  `admin@example.com` / `admin@123`), and additionally seeds a second
  non-admin user directly via SQL: `agent-e2e@example.com` / `agent@123`
  (role `agent`) — useful for role-gating tests (see `AdminRoute` behavior
  in `e2e/auth.spec.ts` "non-admin role" tests).
- Existing spec files: `e2e/auth.spec.ts` (login/logout/route-protection UI
  flows), `e2e/users.spec.ts` (admin-only user CRUD UI flows),
  `e2e/webhooks.spec.ts` (inbound-email webhook API tests — added
  2026-07-04, see [[project-e2e-api-testing]]).
- Auth pattern used across specs: a `signInViaApi`/`signInAsAdmin` helper
  that does `page.request.post("/api/auth/sign-in/email", { data: { email,
  password } })` before `page.goto(...)` for tests that need an
  authenticated session, instead of driving the login form UI each time.
- Running: `bun run test:e2e` (headless), `bunx playwright test
  e2e/<file>.spec.ts --reporter=list` for a single file during development.
