import boss from "../queue";

export async function autoResolveTicket(
  ticketId: number,
  subject: string,
  body: string,
  senderName: string
) {
  await boss.send("auto-resolve-ticket", { ticketId, subject, body, senderName });
}
