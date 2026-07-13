import boss from "../queue";

export interface ClassifyTicketData {
  ticketId: number;
  subject: string;
  body: string;
}

export async function classifyTicket(ticketId: number, subject: string, body: string) {
  await boss.send("classify-ticket", { ticketId, subject, body });
}
