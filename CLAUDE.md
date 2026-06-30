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

# E2E tests (Playwright, uses separate test DB)
bun run test:e2e                           # headless run
bun run test:e2e:ui                        # interactive UI mode
bun run test:e2e:headed                    # visible browser
bun run test:e2e:report                    # open HTML report
```

## Architecture

**Monorepo** managed by Bun workspaces (root `package.json` → `workspaces: ["server", "client"]`).

### Server (`/server`)
- **Express 5** on Bun runtime, single entry point: `server/index.ts`
- **Prisma ORM** with PostgreSQL via `@prisma/adapter-pg` (uses `pg` connection pool, not Bun.sql)
- Database client singleton: `server/db.ts`
- Schema: `server/prisma/schema.prisma` — models: `Ticket`, `user`, `session`, `account`, `verification`
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

### E2E Testing (`/e2e`)
- **Playwright** with separate test database (`my-helpdesk-test`)
- Config: `playwright.config.ts` (root)
- Shared constants: `e2e/test-config.ts` (DB URLs, ports)
- Global setup: `e2e/global-setup.ts` — creates test DB, runs migrations, seeds admin user
- Global teardown: `e2e/global-teardown.ts` — no-op (preserves DB for inspection)
- Test server on port **3002**, test client on port **5174** (dev uses 3001/5173)
- Test files go in `e2e/` directory

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

### Note on `server/CLAUDE.md`
The file at `server/CLAUDE.md` is a Bun-generated default. **Ignore its recommendations** about `Bun.serve()`, `bun:sqlite`, `Bun.sql`, and HTML imports — this project uses Express, Prisma with pg, and Vite.
