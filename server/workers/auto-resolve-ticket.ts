import { generateText } from "ai";
import { groq } from "../ai";
import prisma from "../db";
import boss from "../queue";

const QUEUE = "auto-resolve-ticket";

const knowledgeBase = await Bun.file(
  import.meta.dirname + "/../knowledge-base.md"
).text();

export interface AutoResolveData {
  ticketId: number;
  subject: string;
  body: string;
  senderName: string;
}

export async function startAutoResolveWorker() {
  await boss.createQueue(QUEUE, {
    retryLimit: 2,
    retryDelay: 10,
    retryBackoff: true,
  });

  await boss.work(QUEUE, async ([job]) => {
    const { ticketId, subject, body, senderName } = job.data as AutoResolveData;

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
          data: { status: "open" },
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
    } catch (err) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "open" },
      });
      throw err;
    }
  });
}
