import boss from "../queue";

export interface SendEmailData {
  to: string;
  subject: string;
  text: string;
  html?: string | null;
  replyTo?: string;
  ticketId?: number;
}

export async function enqueueSendEmail(data: SendEmailData) {
  await boss.send("send-email", data);
}
