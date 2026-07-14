import { Router, type Request, type Response } from "express";
import { generateText } from "ai";
import { requireAuth } from "../middleware/auth";
import { groq } from "../ai";
import prisma from "../db";
import { type Prisma } from "@prisma/client";
import { TicketStatus, TicketCategory } from "core/constants/ticket";
import { updateTicketSchema } from "core/schemas/ticket";
import { createReplySchema } from "core/schemas/reply";
import { polishReplySchema } from "core/schemas/ai";
import { parseBody } from "../utils/validation";
import { enqueueSendEmail } from "../utils/send-email";
import { buildReplyTo, buildSubject } from "../utils/email-thread";

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

  const where: Prisma.TicketWhereInput = { status: { notIn: ["new", "processing"] } };

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

router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const data = parseBody(updateTicketSchema, req.body, res);
  if (!data) return;

  if (data.assignedToId !== undefined && data.assignedToId !== null) {
    const agent = await prisma.user.findUnique({ where: { id: data.assignedToId, deletedAt: null } });
    if (!agent) {
      res.status(400).json({ error: "Agent not found" });
      return;
    }
  }

  const updateData: Prisma.TicketUpdateInput = {};
  if (data.assignedToId !== undefined) {
    updateData.assignedTo = data.assignedToId
      ? { connect: { id: data.assignedToId } }
      : { disconnect: true };
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.category !== undefined) {
    updateData.category = data.category;
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  res.json(updated);
});

router.get("/:id/replies", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json(replies);
});

router.post("/:id/replies", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const data = parseBody(createReplySchema, req.body, res);
  if (!data) return;

  const reply = await prisma.reply.create({
    data: {
      body: data.body,
      bodyHtml: data.bodyHtml ?? null,
      senderType: data.senderType,
      ticketId: id,
      userId: data.senderType === "agent" ? req.user!.id : null,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  // Email the customer when an agent replies. Non-fatal: the reply is already saved,
  // so a send hiccup must not fail the request.
  if (data.senderType === "agent") {
    try {
      await enqueueSendEmail({
        to: ticket.senderEmail,
        subject: buildSubject(ticket.id, ticket.subject),
        text: data.body,
        html: data.bodyHtml ?? null,
        replyTo: buildReplyTo(ticket.id),
        ticketId: ticket.id,
      });
    } catch (mailErr) {
      console.error(`Failed to enqueue outbound email for ticket #${ticket.id}:`, mailErr);
    }
  }

  res.status(201).json(reply);
});

router.post("/:id/polish-reply", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const data = parseBody(polishReplySchema, req.body, res);
  if (!data) return;

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a helpful customer support writing assistant. Improve the agent's draft reply to be more professional, clear, and empathetic. Keep the same intent and meaning. Address the customer by their name at the start. Always end the reply with a sign-off using the agent's name. Return only the improved text, nothing else.`,
    prompt: `Ticket subject: ${ticket.subject}
Ticket message: ${ticket.body}

Customer's name: ${ticket.senderName.split(" ")[0]}
Agent's name: ${req.user!.name.split(" ")[0]}

Agent's draft reply to improve:
${data.draft}`,
  });

  res.json({ polished: text });
});

router.post("/:id/summarize", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const conversation = replies
    .map((r) => {
      const sender = r.senderType === "agent" ? (r.user?.name ?? "Agent") : ticket.senderName;
      return `${sender}: ${r.body}`;
    })
    .join("\n");

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a helpful customer support assistant. Summarize the ticket and its conversation history in a concise paragraph. Highlight the customer's issue, any actions taken, and the current status. Return only the summary, nothing else.`,
    prompt: `Ticket subject: ${ticket.subject}
Ticket message: ${ticket.body}
Customer: ${ticket.senderName}

Conversation history:
${conversation || "(no replies yet)"}`,
  });

  res.json({ summary: text });
});

export default router;
