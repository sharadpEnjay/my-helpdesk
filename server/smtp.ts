import { SMTPServer } from "smtp-server";
import { simpleParser, type AddressObject } from "mailparser";
import { processInboundEmail } from "./utils/process-inbound-email";

const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;

// Flatten mailparser's to/cc address objects into a plain list of addresses.
function collectAddresses(to: AddressObject | AddressObject[] | undefined): string[] {
  if (!to) return [];
  const objects = Array.isArray(to) ? to : [to];
  return objects.flatMap((o) => o.value.map((v) => v.address).filter((a): a is string => !!a));
}

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onData(stream, _session, callback) {
    let raw = "";
    stream.on("data", (chunk) => { raw += chunk.toString(); });
    stream.on("end", async () => {
      try {
        const parsed = await simpleParser(raw);
        const sender = parsed.from?.value[0];

        const result = await processInboundEmail({
          fromEmail: sender?.address ?? "unknown@unknown.com",
          fromName: sender?.name || undefined,
          subject: parsed.subject || "(No subject)",
          text: parsed.text || "",
          html: parsed.html || null,
          toAddresses: collectAddresses(parsed.to),
          messageId: parsed.messageId ?? null,
        });

        console.log(`Inbound email (SMTP): ${result.action} ticket #${result.ticketId}`);
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
