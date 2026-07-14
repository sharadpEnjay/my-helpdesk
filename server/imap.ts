import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";
import { processInboundEmail } from "./utils/process-inbound-email";

const HOST = process.env.IMAP_HOST || "imap.gmail.com";
const PORT = Number(process.env.IMAP_PORT) || 993;
const USER = process.env.IMAP_USER;
const PASS = process.env.IMAP_PASSWORD;
const POLL_INTERVAL_MS = Number(process.env.IMAP_POLL_INTERVAL_MS) || 30000;
// Only this Gmail label/folder is polled — nothing else is read.
const MAILBOX = process.env.IMAP_MAILBOX || "Test";

// Flatten mailparser's to/cc address objects into a plain list of addresses.
function collectAddresses(to: AddressObject | AddressObject[] | undefined): string[] {
  if (!to) return [];
  const objects = Array.isArray(to) ? to : [to];
  return objects.flatMap((o) => o.value.map((v) => v.address).filter((a): a is string => !!a));
}

let polling = false;

// Poll the mailbox once: fetch unseen mail, turn each into a ticket/reply, then mark
// it \Seen. On error a message is left unseen so it retries on the next cycle.
async function pollOnce() {
  if (polling) return;
  polling = true;

  const client = new ImapFlow({
    host: HOST,
    port: PORT,
    secure: true,
    auth: { user: USER!, pass: PASS! },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(MAILBOX);
    try {
      const messages: { uid: number; source: Buffer }[] = [];
      for await (const msg of client.fetch({ seen: false }, { source: true, uid: true })) {
        if (msg.source) messages.push({ uid: msg.uid, source: msg.source });
      }

      for (const m of messages) {
        try {
          const parsed = await simpleParser(m.source);
          const sender = parsed.from?.value[0];

          // Every message in the polled label becomes a ticket (new) or threads onto an
          // existing one (reply) — processInboundEmail decides which.
          const result = await processInboundEmail({
            fromEmail: sender?.address ?? "unknown@unknown.com",
            fromName: sender?.name || undefined,
            subject: parsed.subject || "(No subject)",
            text: parsed.text || "",
            html: parsed.html || null,
            toAddresses: collectAddresses(parsed.to),
            messageId: parsed.messageId ?? null,
          });

          await client.messageFlagsAdd(m.uid, ["\\Seen"], { uid: true });
          console.log(`Inbound email (IMAP): ${result.action} ticket #${result.ticketId}`);
        } catch (err) {
          console.error("Failed to process IMAP message:", err);
        }
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("IMAP poll error:", err);
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout failures
    }
    polling = false;
  }
}

export function startImapPoller() {
  if (!USER || !PASS) {
    console.warn(
      "IMAP poller: IMAP_USER / IMAP_PASSWORD not set — inbound email polling disabled"
    );
    return;
  }

  console.log(
    `IMAP poller started (${HOST}, label "${MAILBOX}", every ${POLL_INTERVAL_MS}ms)`
  );
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
}
