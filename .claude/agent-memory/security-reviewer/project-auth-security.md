---
name: project-auth-security
description: Security findings from auth/authorization review of the helpdesk app — covers CORS, missing server-side admin enforcement, AdminRoute race, health endpoint exposure
metadata:
  type: project
---

Security review conducted 2026-06-29. Key findings:

**CORS is wide open** — `server/index.ts:11` uses `app.use(cors())` with no options, sending `Access-Control-Allow-Origin: *` for all routes. Cookie-based auth is still protected by browser behavior (wildcard CORS blocks credentialed requests), but this is a policy violation and risky for any future non-cookie endpoints.

**No server-side admin middleware exists** — `requireAuth` exists at `server/middleware/auth.ts` but there is no `requireAdmin` equivalent. Admin enforcement is client-side only (`AdminRoute.tsx`). No `/api/users` endpoint exists yet, so no immediate breach, but the pattern is dangerous as features are added. [[project-routing]]

**AdminRoute skips `isPending`** — `client/src/components/AdminRoute.tsx:5` calls `authClient.useSession()` without checking `isPending`. Works today because parent `ProtectedRoute` blocks rendering until loading completes, but is fragile.

**`/api/health` is unauthenticated** — `server/index.ts:22` exposes DB status, uptime, and timestamp to all origins without auth. Low-risk but useful for recon.

**Raw `err.message` in 500 responses** — `server/index.ts:48` sends `err.message` directly to clients on ticket fetch errors. Can leak DB schema, query details, or internal paths.

**No security headers** — No Helmet or equivalent. Missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options.

**`trustedOrigins` is localhost-only** — `server/auth.ts:30` has only `http://localhost:5173`. Must be updated before any production deployment.

**Two separate PrismaClient instances** — `server/auth.ts` and `server/db.ts` each create their own `PrismaClient` + `pg.Pool`. Doubles DB connections unnecessarily (default 10 each = 20 total).

**Good:** `disableSignUp: true` is set. `input: false` on role field prevents client-side role escalation. Session stored in DB with cascade-delete. Seed script correctly creates admin and upgrades role via direct DB update.

**Why:** This was the first security audit of the codebase.
**How to apply:** When reviewing or adding new API routes, always check for missing `requireAdmin` middleware. Flag any CORS changes. The next priority is adding a `requireAdmin` middleware and tightening CORS.
