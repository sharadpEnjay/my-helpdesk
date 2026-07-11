import { generateText } from "ai";
import { groq } from "../ai";
import prisma from "../db";
import { TicketCategory } from "core/constants/ticket";

const validCategories = new Set<string>(Object.values(TicketCategory));

export function classifyTicket(ticketId: number, subject: string, body: string) {
  const categories = Object.values(TicketCategory).join(", ");

  generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a ticket classifier. Classify the support ticket into exactly one of these categories: ${categories}. Respond with only the category name, nothing else.`,
    prompt: `Subject: ${subject}\n\nMessage: ${body}`,
  })
    .then(async ({ text }) => {
      const category = text.trim().toLowerCase();
      if (!validCategories.has(category)) return;

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { category: category as any },
      });
    })
    .catch((err) => {
      console.error(`Failed to classify ticket #${ticketId}:`, err);
    });
}
