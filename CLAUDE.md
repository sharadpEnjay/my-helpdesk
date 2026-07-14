# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered ticket management / helpdesk system with CRM capabilities. Bun monorepo with Express backend and React frontend.

## Commands

```bash
# Install all dependencies (root + workspaces)
bun install

# Start both server and client in dev mode (with hot reload)
bun run dev

# Server only (with watch mode)
cd server && bun run dev        # http://localhost:3001

# Client only (Vite dev server)
cd client && bun run dev        # http://localhost:5173

# Build client for production
cd client && bun run build      # runs tsc -b && vite build

# Lint client code (oxlint, not eslint)
cd client && bun run lint

# Prisma commands (run from /server)
cd server && bunx prisma migrate dev      # create/apply migrations
cd server && bunx prisma generate          # regenerate client after schema changes
cd server && bunx prisma studio            # visual database browser
```

## Architecture

**Monorepo** managed by Bun workspaces (root `package.json` → `workspaces: ["core", "server", "client"]`).

### Core (`/core`)
- Shared package for code used by both server and client
- Zod schemas live in `core/schemas/` (e.g. `core/schemas/user.ts`) — define schemas here, import as `"core/schemas/user"` in both client and server
- Exports via `"core/schemas/*"` path mapping in `core/package.json`

### Server (`/server`)
- **Express 5** on Bun runtime, single entry point: `server/index.ts`
- **Prisma ORM** with PostgreSQL via `@prisma/adapter-pg` (uses `pg` connection pool, not Bun.sql)
- Database client singleton: `server/db.ts`
- Schema: `server/prisma/schema.prisma` — models: `Ticket`, `Reply`, `user`, `session`, `account`, `verification`
- Prisma config: `server/prisma.config.ts` (reads `DATABASE_URL` from env)
- **Better Auth** for authentication: `server/auth.ts` — email/password, database sessions, Prisma adapter
- Auth middleware: `server/middleware/auth.ts` — `requireAuth` attaches `req.user` and `req.session`
- Auth routes mounted at `/api/auth/{*splat}` (must be before `express.json()`)
- API routes prefixed with `/api/`

### Client (`/client`)
- **React 19** + **Vite 8** + TypeScript
- Entry: `client/src/main.tsx` → `client/src/App.tsx`
- Linting: **oxlint** (configured in `client/.oxlintrc.json` with react + typescript + oxc plugins)
- Vite proxy: `/api` → `http://localhost:3001` (configurable via `API_PROXY_TARGET` env var)

### Data Fetching
- **Axios** for all HTTP requests — do not use `fetch`
- **TanStack React Query** (`@tanstack/react-query`) for server state — do not use `useEffect` + `useState` for API calls
- `QueryClientProvider` is set up in `client/src/main.tsx`
- Use `useQuery` for GET requests, `useMutation` for POST/PUT/DELETE
- For polling, use `refetchInterval` instead of `setInterval`

### Validation & Forms
- **Zod v4** (`zod`) — define shared schemas in `core/schemas/`, import in both client and server
- Use Zod schemas for all request body validation on API endpoints
- Shared enum constants live in `core/constants/` (e.g. `Role` in `core/constants/user`, `TicketStatus`/`TicketCategory`/`SenderType` in `core/constants/ticket`) — use these instead of hardcoded string values. In Zod schemas, derive enums from constants via `z.enum(Object.values(Const) as [T, ...T[]])` instead of hardcoding strings. On the server, map to Prisma enums (e.g. `PrismaRole`) only at the database boundary
- **React Hook Form** + `@hookform/resolvers/zod` for all client-side forms — use `useForm` with `zodResolver`, not manual `useState` validation

### Key Conventions
- TypeScript strict mode enabled across both workspaces
- `noUncheckedIndexedAccess: true` — array/object index access returns `T | undefined`
- ESModules throughout (`"type": "module"`)

### Authentication
- **Better Auth** with email/password and database sessions
- Auth instance: `server/auth.ts` — shares PrismaClient from `server/db.ts`
- Middleware: `server/middleware/auth.ts` — `requireAuth` guards protected routes, sets `req.user` / `req.session`
- Type augmentation: `server/types/express.d.ts` extends Express `Request` with user/session
- Express 5 wildcard syntax: use `{*splat}` not `*` in route patterns
- Auth endpoints: `/api/auth/sign-up/email`, `/api/auth/sign-in/email`, `/api/auth/get-session`

### Database
- PostgreSQL required; connection string via `DATABASE_URL` environment variable
- Prisma generates client to `server/prisma/client/`
- Prisma 7: `url` is not allowed in `schema.prisma` datasource — connection is via `@prisma/adapter-pg` at runtime and `prisma.config.ts` for migrations

### Environment Variables
- `server/.env` (gitignored) — must be created manually
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_URL` — server base URL (e.g. `http://localhost:3001`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seed script admin credentials
- `ALLOWED_ORIGINS` — comma-separated CORS origins (defaults to `http://localhost:5173`)
- `TRUSTED_ORIGINS` — comma-separated Better Auth CSRF origins
- `NODE_ENV=production` — enables secure cookies and auth rate limiting
- `GROK_API_KEY` — Groq API key for the AI reply-polish endpoint (`POST /api/tickets/:id/polish-reply`, llama-3.3-70b via Vercel AI SDK)
- `SENDGRID_API_KEY` — SendGrid API key for outbound email (agent + AI auto-replies), sent via a `send-email` pg-boss queue
- `SENDGRID_FROM_EMAIL` — verified SendGrid Single Sender address (no domain/DNS needed); must equal `IMAP_USER` so plus-addressed replies thread back
- `SENDGRID_FROM_NAME` — optional sender display name (default `Support Team`)
- `IMAP_HOST` / `IMAP_PORT` — inbound mailbox (default `imap.gmail.com` / `993`)
- `IMAP_USER` / `IMAP_PASSWORD` — Gmail address + **App Password** the poller reads inbound email from (needs 2-Step Verification). Poller is skipped if unset
- `IMAP_POLL_INTERVAL_MS` — inbound poll interval (default `30000`)
- `IMAP_MAILBOX` — the **only** Gmail label/folder the poller reads (default `Test`); all other mail is ignored. Every unread message in it becomes a ticket (new) or threads onto an existing one (reply)
- `SENTRY_DSN` — server error/tracing DSN for `@sentry/bun` (`server/instrument.ts`). Left unset locally → SDK disabled (no-op)
- `VITE_SENTRY_DSN` — **client** error/tracing/replay DSN for `@sentry/react` (`client/src/lib/sentry.ts`). Must be `VITE_`-prefixed to reach the browser; set in `client/.env`. Unset → SDK disabled

### Error Monitoring (Sentry)
- **Server**: `server/instrument.ts` calls `Sentry.init()` and is imported on the **first line** of `server/index.ts` (before any other module) so instrumentation hooks in. `Sentry.setupExpressErrorHandler(app)` is registered after all routes, before the fallback error middleware.
- **Client**: `client/src/lib/sentry.ts` calls `Sentry.init()` (browser tracing + session replay) and is the **first import** in `main.tsx`; the app tree is wrapped in `Sentry.ErrorBoundary`.
- Both are no-ops when their DSN env var is unset, so local dev needs no Sentry account.

### Email (SendGrid outbound + IMAP inbound)
- **Outbound**: `server/workers/send-email.ts` (`send-email` queue) sends via `@sendgrid/mail`. Enqueued from `POST /api/tickets/:id/replies` (agent replies) and `workers/auto-resolve-ticket.ts` (AI replies) using `utils/send-email.ts`.
- **Inbound**: `server/imap.ts` polls **only the `IMAP_MAILBOX` Gmail label** (default `Test`); every unread message becomes a ticket (new) or threads onto an existing one (reply). It parses with `mailparser` and feeds the shared `utils/process-inbound-email.ts`. The raw SMTP server (`smtp.ts`) and `/api/webhooks/inbound-email` also route through this same processor.
- **Threading** (`utils/email-thread.ts`): outbound sets a plus-addressed `Reply-To` (`user+t<id>@gmail.com`) and a `[Ticket #<id>]` subject tag; inbound recovers the ticket id from either and appends a `customer` `Reply` (reopening the ticket) instead of creating a duplicate. `Reply.emailMessageId` (unique) guards against double-processing.

### Testing Strategy
- **Prefer component tests** (Vitest + React Testing Library) for all UI rendering, user interactions, states (loading/error/empty), and data display. These are fast, reliable, and cover the majority of frontend behavior.
- **Reserve E2E tests** (Playwright) for flows that genuinely span the full stack — data persisted server-side and surviving a reload, authentication, cross-page navigation that depends on server state. Do not duplicate in E2E what is already covered by component tests (e.g. rendering details, link hrefs, form validation, loading/error states). An E2E test must justify itself by exercising a real server round-trip that a unit test cannot.

### Component Testing
- **Vitest** + **React Testing Library** with jsdom environment
- Config: `client/vite.config.ts` (`test` block), setup: `client/src/test/setup.ts`
- Test files live next to the component: `ComponentName.test.tsx`
- Use `renderWithProviders` from `@/test/render` to wrap components with `QueryClientProvider` + `MemoryRouter`
- Mock axios with `vi.mock("axios")` and `vi.mocked(axios)` for API calls
- Run once: `cd client && bun run test`
- Run in watch mode: `cd client && bun run test:watch`

### E2E Testing
- Use the **e2e-test-writer** agent (subagent) to write, create, or update Playwright E2E tests — do not write them inline.
- Test files live in `e2e/` with `.spec.ts` extension. The agent has full context on test infrastructure, conventions, and helpers.
- Only write E2E tests for cross-boundary flows (e.g. webhook → DB → UI, login → protected page). If a test can be written as a component test, it should be.

### Note on `server/CLAUDE.md`
The file at `server/CLAUDE.md` is a Bun-generated default. **Ignore its recommendations** about `Bun.serve()`, `bun:sqlite`, `Bun.sql`, and HTML imports — this project uses Express, Prisma with pg, and Vite.
