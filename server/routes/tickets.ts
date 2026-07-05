import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth";
import prisma from "../db";
import { type Prisma } from "@prisma/client";
import { TicketStatus, TicketCategory } from "core/constants/ticket";

const router = Router();

const sortableFields = new Set([
  "subject",
  "senderName",
  "status",
  "category",
  "createdAt",
]);

const validStatuses: Set<string> = new Set(Object.values(TicketStatus));
const validCategories: Set<string> = new Set(Object.values(TicketCategory));

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const sortField = String(req.query.sortBy ?? "createdAt");
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

  const orderBy = sortableFields.has(sortField)
    ? { [sortField]: sortOrder }
    : { createdAt: "desc" as const };

  const where: Prisma.TicketWhereInput = {};

  const status = String(req.query.status ?? "");
  if (status && validStatuses.has(status)) {
    where.status = status as Prisma.TicketWhereInput["status"];
  }

  const category = String(req.query.category ?? "");
  if (category && validCategories.has(category)) {
    where.category = category as Prisma.TicketWhereInput["category"];
  }

  const search = String(req.query.search ?? "").trim();
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { senderName: { contains: search, mode: "insensitive" } },
      { senderEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.ticket.findMany({ where, orderBy });
  res.json(tickets);
});

export default router;
