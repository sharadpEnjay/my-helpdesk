import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth, requireRole } from "./middleware/auth";
import prisma from "./db";

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:5173"],
  credentials: true,
}));

// Better Auth handler must be before express.json()
app.all("/api/auth/{*splat}", toNodeHandler(auth));

app.use(express.json());

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from Express + Bun!" });
});

app.get("/api/health", async (_req: Request, res: Response) => {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    console.error("DB connection error:", err);
  }

  res.json({ status: "ok", database: dbStatus });
});

app.get("/api/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

app.get("/api/tickets", requireAuth, async (_req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany();
  res.json(tickets);
});

app.get("/api/users", requireAuth, requireRole("admin"), async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});