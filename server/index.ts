import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middleware/auth";
import prisma from "./db";
import ticketsRouter from "./routes/tickets";
import usersRouter from "./routes/users";
import webhooksRouter from "./routes/webhooks";
import dashboardRouter from "./routes/dashboard";
import { startSmtpServer } from "./smtp";
import { startImapPoller } from "./imap";
import boss from "./queue";
import { startClassifyWorker } from "./workers/classify-ticket";
import { startAutoResolveWorker } from "./workers/auto-resolve-ticket";
import { startSendEmailWorker } from "./workers/send-email";

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

app.use("/api/tickets", ticketsRouter);
app.use("/api/users", usersRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await boss.start();
  await startClassifyWorker();
  await startAutoResolveWorker();
  await startSendEmailWorker();
  startSmtpServer();
  startImapPoller();
});