import { z } from "zod";

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

export const updateTicketSchema = z.object({
  assignedToId: z.string().min(1, "Invalid agent ID").nullable().optional(),
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  category: z.enum(["general", "billing", "technical", "bug", "feature_request"]).nullable().optional(),
});
