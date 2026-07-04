---
name: project-e2e-api-testing
description: How to test server-only/API endpoints (webhooks, non-UI routes) in this repo's Playwright suite, and how secrets/env vars are wired for the test server
metadata:
  type: project
---

For endpoints with no browser UI (webhooks, pure API routes), hit the test
server directly with the `request` fixture rather than going through the
client's Vite proxy: `http://localhost:${TEST_SERVER_PORT}` (3002), using
`TEST_SERVER_PORT` from `e2e/test-config.ts`. This matches how the endpoint
is actually invoked in production (server-to-server) and doesn't depend on
the client dev server proxy being up.

**Env vars for the test server are set in `playwright.config.ts`'s
`webServer[0].env` block** (the `bun run start` process in `./server`). That
block spreads `...process.env` first, then overrides specific keys
(`DATABASE_URL`, `PORT`, `BETTER_AUTH_URL`, `ALLOWED_ORIGINS`,
`TRUSTED_ORIGINS`) for test isolation. Any secret an endpoint depends on
(e.g. `INBOUND_EMAIL_WEBHOOK_SECRET` for the inbound-email webhook) should
get the same treatment: add a `TEST_*` constant to `e2e/test-config.ts` and
add an override line in that `env` block, rather than relying on whatever
value happens to be in `server/.env` (gitignored, developer-specific, not
guaranteed present in CI). Import the same constant in the spec file so the
value is guaranteed to match.

To verify side effects of an unauthenticated webhook call (e.g. that a
ticket was actually created with the right stored field values), sign in via
`POST {SERVER_URL}/api/auth/sign-in/email` with the seeded admin
credentials using the *same* Playwright `request` context, then call an
authenticated GET route (`GET /api/tickets` — no auth token, cookie-based
session only) to fetch and assert on the created record. Cookies set by
Better Auth have no explicit `Domain` attribute, so they are host-only for
"localhost" and are shared across ports within the same `request` context —
no need for separate browser contexts.

Before asserting on exact Zod validation error strings returned by an
endpoint (server wraps `result.error.issues[0].message` — see
`server/utils/validation.ts` `parseBody`), verify the actual message by
running the schema's `safeParse` directly via `bun -e '...'` rather than
guessing. Confirmed example for `core/schemas/ticket.ts`
`inboundEmailSchema`: a field that is *omitted entirely* fails Zod's type
check with `"Invalid input: expected string, received undefined"` (not the
custom `.min()` message), whereas a field present as an *empty string* hits
the custom message (e.g. `"Subject is required"`). Schema key declaration
order determines which field's issue becomes `issues[0]` when multiple
fields are invalid at once.

See also [[project-e2e-setup]] for the broader E2E infra (ports, seeded
users, global setup/teardown).
