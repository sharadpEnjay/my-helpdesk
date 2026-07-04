import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { stripSubjectPrefix } from "core/schemas/ticket";
import prisma from "./db";

const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onData(stream, _session, callback) {
    let raw = "";
    stream.on("data", (chunk) => { raw += chunk.toString(); });
    stream.on("end", async () => {
      try {
        const parsed = await simpleParser(raw);

        const senderAddress = parsed.from?.value[0];
        const senderEmail = senderAddress?.address ?? "unknown@unknown.com";
        const senderName = senderAddress?.name || "Unknown";
        const subject = stripSubjectPrefix(parsed.subject || "(No subject)");
        const body = parsed.text || "";
        const bodyHtml = parsed.html || null;

        const ticket = await prisma.ticket.create({
          data: {
            subject,
            body,
            bodyHtml,
            senderEmail,
            senderName,
          },
        });

        console.log(`Ticket #${ticket.id} created from email: "${subject}" <${senderEmail}>`);
      } catch (err) {
        console.error("Failed to process inbound email:", err);
      }
      callback();
    });
  },
});

export function startSmtpServer() {
  server.listen(SMTP_PORT, "0.0.0.0", () => {
    console.log(`SMTP server listening on port ${SMTP_PORT}`);
  });

  server.on("error", (err) => {
    console.error("SMTP server error:", err);
  });
}
