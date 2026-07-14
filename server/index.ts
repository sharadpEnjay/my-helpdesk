// Must be imported before any other module so Sentry can instrument them.
import "./instrument";

import path from "path";
import * as Sentry from "@sentry/bun";
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

app.use(
  helmet({
    // The SPA is served from this same origin in production; helmet's default
    // Content-Security-Policy would block the app's inline styles (Radix) and the
    // browser Sentry SDK. Disable CSP here (parity with the Vite dev server, which
    // serves without CSP) — all other helmet protections stay on.
    contentSecurityPolicy: false,
  })
);
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

// In production, serve the built client from this same service (single origin), so
// relative `/api` calls and auth cookies work without any CORS/cross-site setup.
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(import.meta.dir, "../client/dist");
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html so client-side routing works.
  app.get(/^\/(?!api\/).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Sentry error handler must be after all routes and before any other error middleware.
Sentry.setupExpressErrorHandler(app);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Bind to 0.0.0.0 (not localhost) so the container's platform proxy (Railway, etc.)
// can reach the app — otherwise external requests 502.
app.listen(Number(port), "0.0.0.0", async () => {
  console.log(`Server running on 0.0.0.0:${port}`);
  await boss.start();
  await startClassifyWorker();
  await startAutoResolveWorker();
  await startSendEmailWorker();
  // Raw SMTP ingestion is opt-in: Railway only routes the one HTTP port, so inbound
  // mail arrives via the IMAP poller. Enable this only where a public SMTP port exists.
  if (process.env.ENABLE_SMTP_SERVER === "true") {
    startSmtpServer();
  }
  startImapPoller();
});