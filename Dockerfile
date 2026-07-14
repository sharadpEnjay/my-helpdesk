# Single-service image: builds the React client and runs the Express/Bun API that
# serves it. Matches the Bun version used in development (see `bun --version`).
FROM oven/bun:1.3

WORKDIR /app

# Copy the whole monorepo. Dependencies (`bun install`) and the client build both
# need source from every workspace (core, server, client), and the server's
# postinstall runs `prisma generate`, which needs the Prisma schema.
COPY . .

# Install deps for all workspaces. Runs server's postinstall -> `prisma generate`.
# prisma.config.ts resolves DATABASE_URL at load time; `prisma generate` doesn't
# connect, so a build-only placeholder satisfies it. This ARG is not persisted as a
# runtime ENV, so the real DATABASE_URL must still be provided when the container runs.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN bun install --frozen-lockfile

# Build the client (tsc -b && vite build -> client/dist).
ENV NODE_ENV=production
RUN cd client && bun run build

# Railway injects PORT; the server reads process.env.PORT (falls back to 3001).
EXPOSE 3001

# Run migrations then start the server (see docker-entrypoint.sh).
CMD ["sh", "/app/docker-entrypoint.sh"]
