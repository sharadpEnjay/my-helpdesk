import { Router, type Request, type Response } from "express";
import { parseBody } from "../utils/validation";
import { classifyTicket } from "../utils/classify-ticket";
import { autoResolveTicket } from "../utils/auto-resolve-ticket";
import prisma from "../db";
import { inboundEmailSchema } from "core/schemas/ticket";
import { AI_AGENT_ID } from "core/constants/ai-agent";

const router = Router();

const WEBHOOK_SECRET = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;

router.post("/inbound-email", async (req: Request, res: Response) => {
  if (!WEBHOOK_SECRET || req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    res.status(401).json({ error: "Invalid webhook secret" });
    return;
  }

  const data = parseBody(inboundEmailSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.create({
    data: {
      subject: data.subject,
      body: data.body,
      bodyHtml: data.bodyHtml ?? null,
      senderEmail: data.from,
      senderName: data.fromName ?? data.from,
      assignedToId: AI_AGENT_ID,
    },
  });

  classifyTicket(ticket.id, ticket.subject, ticket.body);
  autoResolveTicket(ticket.id, ticket.subject, ticket.body, ticket.senderName);

  res.status(201).json({ status: "created", ticketId: ticket.id });
});

export default router;
