import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth";
import prisma from "../db";
import { AI_AGENT_ID } from "core/constants/ai-agent";

const router = Router();

interface StatsRow {
  totalTickets: bigint;
  openTickets: bigint;
  aiResolvedCount: bigint;
  aiResolvedPercent: number;
  avgResolutionTimeMs: number;
}

interface TicketsPerDayRow {
  date: Date;
  count: bigint;
}

router.get("/stats", requireAuth, async (_req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<StatsRow[]>`
    SELECT * FROM get_dashboard_stats(${AI_AGENT_ID})
  `;
  const row = rows[0]!;

  res.json({
    totalTickets: Number(row.totalTickets),
    openTickets: Number(row.openTickets),
    aiResolvedCount: Number(row.aiResolvedCount),
    aiResolvedPercent: row.aiResolvedPercent,
    avgResolutionTimeMs: row.avgResolutionTimeMs,
  });
});

router.get("/tickets-per-day", requireAuth, async (_req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<TicketsPerDayRow[]>`
    SELECT * FROM get_tickets_per_day(30)
  `;

  const data = rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    count: Number(r.count),
  }));

  res.json(data);
});

export default router;
