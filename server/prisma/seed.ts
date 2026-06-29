import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  basePath: "/api/auth",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: {
        type: ["admin", "agent"],
        required: false,
        defaultValue: Role.agent,
        input: false,
      },
    },
  },
});

const existing = await auth.api.signInEmail({
  body: { email, password },
}).catch(() => null);

if (existing?.user) {
  console.log(`Admin user already exists: ${email}`);
  await pool.end();
  process.exit(0);
}

const user = await auth.api.signUpEmail({
  body: { email, password, name: "Admin" },
});

if (!user?.user) {
  console.error("Failed to create admin user");
  await pool.end();
  process.exit(1);
}

await prisma.user.update({
  where: { id: user.user.id },
  data: { role: Role.admin },
});

console.log(`Admin user created: ${email} (role: admin)`);
await pool.end();
process.exit(0);
