# Deploying to Railway

This app deploys as a **single Railway service**: the Express/Bun server serves both
the `/api` routes and the built React client from the same origin. Same-origin means
auth cookies and the client's relative `/api` calls work with no CORS/cross-site setup.

Build & run are defined by:

- **`Dockerfile`** — installs deps, runs `prisma generate`, builds the client, starts the server.
- **`docker-entrypoint.sh`** — runs `prisma migrate deploy` (and optional admin seed), then `bun index.ts`.
- **`railway.json`** — tells Railway to use the Dockerfile and health-check `/api/health`.

## 1. Create the project

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**, pick this repo.
3. Railway detects `railway.json` / `Dockerfile` and builds with Docker.

## 2. Add PostgreSQL

- In the project: **New → Database → PostgreSQL**.
- This exposes `DATABASE_URL` on the DB service; reference it from the app service (step 3).

## 3. Set service variables

On the **app service → Variables**, add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` (reference the DB service) |
| `NODE_ENV` | `production` |
| `BETTER_AUTH_SECRET` | **required** — random secret, e.g. `openssl rand -base64 32`. Auth crashes on boot without it. |
| `BETTER_AUTH_URL` | your public URL, e.g. `https://your-app.up.railway.app` (no trailing slash) |
| `TRUSTED_ORIGINS` | same public URL |
| `ALLOWED_ORIGINS` | same public URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | initial admin login |
| `SEED_ON_DEPLOY` | `true` for the first deploy (creates the admin; idempotent). Optional afterwards. |
| `GROK_API_KEY` | Groq key (AI replies) |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | outbound email |
| `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASSWORD`, `IMAP_MAILBOX` | inbound email poll |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | inbound webhook secret |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT` | optional server error monitoring |

Do **not** set `PORT` — Railway injects it and the server reads it automatically.

See `server/.env.example` for the full list with notes. Never commit real secrets;
`.env` files are gitignored and excluded from the Docker image.

> The public domain: once deployed, open **Settings → Networking → Generate Domain**
> (or attach a custom domain), then set `BETTER_AUTH_URL` / `*_ORIGINS` to that URL and redeploy.

## 4. Deploy

Railway builds and deploys on push. On boot the container runs migrations, seeds the
admin (if `SEED_ON_DEPLOY=true`), and starts the server. Watch the deploy logs.

Health check: `GET /api/health` returns `{ status: "ok", database: "ok" }`.

## Notes

- **Admin login**: `disableSignUp` is on, so users can only be created by the seed or by
  an existing admin. `SEED_ON_DEPLOY=true` creates the first admin from `ADMIN_EMAIL`/
  `ADMIN_PASSWORD`. You can also run it once from a Railway shell: `cd server && bun prisma/seed.ts`.
- **Migrations** run automatically on every deploy (`prisma migrate deploy` — idempotent).
- **Inbound email** uses the IMAP poller (an outbound connection to Gmail), which works on
  Railway. The raw SMTP server stays off unless `ENABLE_SMTP_SERVER=true` (Railway routes
  only the one HTTP port, so a public SMTP listener isn't reachable there anyway).
- **Client Sentry** (`VITE_SENTRY_DSN`) is baked in at build time and `client/.env` is not
  copied into the image, so it's disabled by default. To enable, wire it through as a Docker
  build arg (add `ARG VITE_SENTRY_DSN` + `ENV` before the `client` build step) and set the
  build variable in Railway. The client works fine without it.
