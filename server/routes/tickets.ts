import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth";
import prisma from "../db";

const router = Router();

router.get("/", requireAuth, async (_req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
});

export default router;
