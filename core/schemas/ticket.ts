import { z } from "zod";
import { TicketStatus, TicketCategory } from "core/constants/ticket";

const subjectPrefixPattern = /^(re|fwd?|aw|wg)\s*:\s*/i;

export function stripSubjectPrefix(subject: string): string {
  let cleaned = subject;
  while (subjectPrefixPattern.test(cleaned)) {
    cleaned = cleaned.replace(subjectPrefixPattern, "");
  }
  return cleaned.trim();
}

export const inboundEmailSchema = z.object({
  from: z.string().trim().pipe(z.email("Invalid sender email")),
  fromName: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Subject is required").transform(stripSubjectPrefix),
  body: z.string().min(1, "Body is required"),
  bodyHtml: z.string().optional(),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: TicketStatus;
  category: TicketCategory | null;
  senderName: string;
  senderEmail: string;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const updateTicketSchema = z.object({
  assignedToId: z.string().min(1, "Invalid agent ID").nullable().optional(),
  status: z.enum(Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]).optional(),
  category: z.enum(Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]]).nullable().optional(),
});