import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const MAILBOX = process.env.IMAP_MAILBOX || "Test";
const REQUIRED = (process.env.IMAP_REQUIRED_BODY || "developer testing").toLowerCase();

const client = new ImapFlow({
  host: process.env.IMAP_HOST || "imap.gmail.com",
  port: Number(process.env.IMAP_PORT) || 993,
  secure: true,
  auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASSWORD! },
  logger: false,
});

await client.connect();

console.log("Available mailboxes / labels:");
for (const mb of await client.list()) console.log("  -", JSON.stringify(mb.path));

const lock = await client.getMailboxLock(MAILBOX);
try {
  console.log(`\nAll messages in "${MAILBOX}" (newest fetch order):`);
  let count = 0;
  for await (const msg of client.fetch("1:*", { uid: true, flags: true, envelope: true, source: true })) {
    count++;
    const parsed = await simpleParser(msg.source as Buffer);
    const body = `${parsed.text || ""}\n${parsed.html || ""}`.toLowerCase();
    const seen = msg.flags?.has("\\Seen");
    console.log(
      `  uid=${msg.uid} seen=${seen} hasPhrase=${body.includes(REQUIRED)} ` +
        `from=${parsed.from?.value[0]?.address} subject=${JSON.stringify(msg.envelope?.subject)}`
    );
  }
  if (count === 0) console.log("  (folder is empty)");

  const unseen = await client.search({ seen: false }, { uid: true });
  console.log(`\nUnseen UIDs the poller would fetch: ${JSON.stringify(unseen)}`);
} finally {
  lock.release();
}
await client.logout();
