import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { AI_AGENT_ID, AI_AGENT_EMAIL, AI_AGENT_NAME } from "core/constants/ai-agent";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const existing = await prisma.user.findUnique({ where: { id: AI_AGENT_ID } });

if (existing) {
  console.log(`AI agent already exists: ${existing.email}`);
} else {
  await prisma.user.create({
    data: {
      id: AI_AGENT_ID,
      name: AI_AGENT_NAME,
      email: AI_AGENT_EMAIL,
      emailVerified: false,
      role: "agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`AI agent created: ${AI_AGENT_EMAIL}`);
}

await pool.end();
process.exit(0);
