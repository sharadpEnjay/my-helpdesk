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

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
  const skip = (page - 1) * pageSize;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({ where, orderBy, skip, take: pageSize }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ data: tickets, total, page, pageSize });
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

export default router;
