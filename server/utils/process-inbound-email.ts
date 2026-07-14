import prisma from "../db";
import { classifyTicket } from "./classify-ticket";
import { autoResolveTicket } from "./auto-resolve-ticket";
import { stripTicketTag, parseTicketRef } from "./email-thread";
import { stripQuotedReply, stripQuotedReplyHtml } from "./strip-quoted-reply";
import { AI_AGENT_ID } from "core/constants/ai-agent";

export interface InboundEmail {
  fromEmail: string;
  fromName?: string;
  subject: string;
  text: string;
  html?: string | null;
  toAddresses?: string[];
  messageId?: string | null;
}

export type InboundResult =
  | { action: "created"; ticketId: number }
  | { action: "appended"; ticketId: number }
  | { action: "duplicate"; ticketId: number };

// Single entry point for every inbound channel (IMAP poller, raw SMTP, HTTP webhook).
// Threads replies onto an existing ticket when the message carries a ticket reference
// (plus-address or subject tag), otherwise opens a new ticket and kicks off AI triage.
export async function processInboundEmail(email: InboundEmail): Promise<InboundResult> {
  const { fromEmail, fromName, subject, html, toAddresses = [], messageId } = email;
  const body = email.text?.trim() ? email.text : "(no text content)";

  const ticketRef = parseTicketRef(toAddresses, subject);

  if (ticketRef !== null) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketRef } });
    if (ticket && ticket.status !== "closed") {
      // Idempotency: never process the same message twice.
      if (messageId) {
        const existing = await prisma.reply.findUnique({ where: { emailMessageId: messageId } });
        if (existing) return { action: "duplicate", ticketId: ticket.id };
      }

      await prisma.$transaction([
        prisma.reply.create({
          data: {
            // Drop the quoted thread a reply carries — the original is already on the ticket.
            body: stripQuotedReply(body),
            bodyHtml: html ? stripQuotedReplyHtml(html) : null,
            senderType: "customer",
            senderEmail: fromEmail,
            emailMessageId: messageId ?? null,
            ticketId: ticket.id,
          },
        }),
        // Customer follow-up reopens the ticket for a human.
        prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "open" },
        }),
      ]);

      return { action: "appended", ticketId: ticket.id };
    }
    // Referenced ticket missing or closed → fall through and open a fresh one.
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject: stripTicketTag(subject) || "(No subject)",
      body,
      bodyHtml: html ?? null,
      senderEmail: fromEmail,
      senderName: fromName || fromEmail,
      assignedToId: AI_AGENT_ID,
    },
  });

  classifyTicket(ticket.id, ticket.subject, ticket.body);
  autoResolveTicket(ticket.id, ticket.subject, ticket.body, ticket.senderName, ticket.senderEmail);

  return { action: "created", ticketId: ticket.id };
}
