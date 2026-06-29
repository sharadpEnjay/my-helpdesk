import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middleware/auth";
import prisma from "./db";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

// Better Auth handler must be before express.json()
app.all("/api/auth/{*splat}", toNodeHandler(auth));

app.use(express.json());

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express + Bun!" });
});

app.get("/api/health", async (req: Request, res: Response) => {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    console.error("DB connection error:", err);
  }

  res.json({ 
    status: "ok", 
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

app.get("/api/tickets", requireAuth, async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});