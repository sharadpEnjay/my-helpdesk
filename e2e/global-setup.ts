import pg from "pg";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
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
}

export default globalSetup;
