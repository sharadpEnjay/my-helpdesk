import { generateText } from "ai";
import { groq } from "../ai";
import prisma from "../db";
import boss from "../queue";
import { enqueueSendEmail } from "../utils/send-email";
import { buildReplyTo, buildSubject } from "../utils/email-thread";

const QUEUE = "auto-resolve-ticket";

const knowledgeBase = await Bun.file(
  import.meta.dirname + "/../knowledge-base.md"
).text();

export interface AutoResolveData {
  ticketId: number;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
}

export async function startAutoResolveWorker() {
  await boss.createQueue(QUEUE, {
    retryLimit: 2,
    retryDelay: 10,
    retryBackoff: true,
  });

  await boss.work(QUEUE, async ([job]) => {
    const { ticketId, subject, body, senderName, senderEmail } = job.data as AutoResolveData;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "processing" },
    });

    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: `You are a customer support auto-responder. You have a knowledge base to answer customer questions.

If the knowledge base contains a clear, confident answer to the customer's question, respond with a helpful reply addressing the customer by their first name and sign off as "Support Team".

If the knowledge base does NOT cover the question, or the question requires human judgment (refund disputes, legal threats, account security, complex issues), respond with exactly: NO_MATCH

Rules:
- Only answer if the knowledge base directly addresses the question
- Do not make up information beyond what the knowledge base provides
- Be concise and professional
- Return ONLY the reply text or NO_MATCH, nothing else

Knowledge Base:
${knowledgeBase}`,
        prompt: `Customer name: ${senderName}
Subject: ${subject}
Message: ${body}`,
      });

      const reply = text.trim();

      if (reply === "NO_MATCH") {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "open", assignedToId: null },
        });
        return;
      }

      await prisma.$transaction([
        prisma.reply.create({
          data: {
            body: reply,
            senderType: "agent",
            ticketId,
          },
        }),
        prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "resolved" },
        }),
      ]);

      // Email the AI auto-response to the customer. Non-fatal: the reply is already
      // committed, so a send hiccup must not roll the ticket back and retry (which
      // would generate a duplicate reply).
      try {
        await enqueueSendEmail({
          to: senderEmail,
          subject: buildSubject(ticketId, subject),
          text: reply,
          replyTo: buildReplyTo(ticketId),
          ticketId,
        });
      } catch (mailErr) {
        console.error(`Failed to enqueue outbound email for ticket #${ticketId}:`, mailErr);
      }
    } catch (err) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "open", assignedToId: null },
      });
      throw err;
    }
  });
}
