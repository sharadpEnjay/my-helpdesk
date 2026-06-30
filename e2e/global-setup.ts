import pg from "pg";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes, scrypt } from "node:crypto";
import {
  TEST_DB_NAME,
  TEST_DB_URL,
  ADMIN_DB_URL,
  TEST_BETTER_AUTH_URL,
} from "./test-config.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "../server");

async function globalSetup(): Promise<void> {
  console.log("[e2e] Global setup starting...");

  const client = new pg.Client({ connectionString: ADMIN_DB_URL });
  await client.connect();

  await client.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [TEST_DB_NAME]
  );

  await client.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
  await client.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  console.log(`[e2e] Created fresh database: ${TEST_DB_NAME}`);
  await client.end();

  execSync("bunx prisma migrate deploy", {
    cwd: serverDir,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
    },
  });
  console.log("[e2e] Migrations applied to test database");

  execSync("bun prisma/seed.ts", {
    cwd: serverDir,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      BETTER_AUTH_URL: TEST_BETTER_AUTH_URL,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@example.com",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin@123",
    },
  });
  console.log("[e2e] Admin user seeded");

  await seedAgentUser();
  console.log("[e2e] Agent user seeded");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, derivedKey) => (err ? reject(err) : resolve(derivedKey))
    );
  });
  return `${salt}:${key.toString("hex")}`;
}

async function seedAgentUser(): Promise<void> {
  const client = new pg.Client({ connectionString: TEST_DB_URL });
  await client.connect();
  try {
    const userId = randomBytes(16).toString("hex");
    const accountId = randomBytes(16).toString("hex");
    const now = new Date();
    const hashedPw = await hashPassword("agent@123");

    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, 'agent', $4, $4)`,
      [userId, "E2E Agent", "agent-e2e@example.com", now]
    );
    await client.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
      [accountId, userId, userId, hashedPw, now]
    );
  } finally {
    await client.end();
  }
}

export default globalSetup;
