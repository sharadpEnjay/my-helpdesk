import { generateText } from "ai";
import { groq } from "../ai";
import prisma from "../db";
import boss from "../queue";
import { TicketCategory } from "core/constants/ticket";
import type { ClassifyTicketData } from "../utils/classify-ticket";

const QUEUE = "classify-ticket";
const validCategories = new Set<string>(Object.values(TicketCategory));

export async function startClassifyWorker() {
  await boss.createQueue(QUEUE, {
    retryLimit: 3,
    retryDelay: 10,
    retryBackoff: true,
  });

  const categories = Object.values(TicketCategory).join(", ");

  await boss.work(QUEUE, async ([job]) => {
    const { ticketId, subject, body } = job.data as ClassifyTicketData;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are a ticket classifier. Classify the support ticket into exactly one of these categories: ${categories}. Respond with only the category name, nothing else.`,
      prompt: `Subject: ${subject}\n\nMessage: ${body}`,
    });

    const category = text.trim().toLowerCase();
    if (!validCategories.has(category)) return;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category: category as any },
    });
  });
}
