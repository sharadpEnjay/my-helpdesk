#!/bin/sh
# Startup for the Railway container: apply DB migrations, optionally seed the admin
# user, then start the server. Runs from /app/server so Prisma finds prisma.config.ts.
set -e

cd /app/server

echo "==> Applying database migrations (prisma migrate deploy)"
bunx prisma migrate deploy

# The AI agent user is required infrastructure: inbound tickets are assigned to it
# (FK ticket.assignedToId -> user.id), so this must exist or every inbound email fails.
# Idempotent — skips if already present. Always run, regardless of SEED_ON_DEPLOY.
echo "==> Ensuring AI agent user exists"
bun prisma/seed-ai-agent.ts

# Create the admin user on first deploy (idempotent — the seed skips if it exists).
# Requires ADMIN_EMAIL / ADMIN_PASSWORD. Opt in with SEED_ON_DEPLOY=true.
if [ "$SEED_ON_DEPLOY" = "true" ]; then
  echo "==> Seeding admin user"
  bun prisma/seed.ts || echo "!! Seed failed or skipped (continuing)"
fi

echo "==> Starting server"
exec bun index.ts
