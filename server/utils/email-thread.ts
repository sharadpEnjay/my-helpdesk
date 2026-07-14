import { stripSubjectPrefix } from "core/schemas/ticket";

// The mailbox we send from and poll for replies — same Gmail account for both,
// so plus-addressed replies (support+t123@gmail.com) land back in it.
function mailboxAddress(): string {
  return process.env.IMAP_USER || process.env.SENDGRID_FROM_EMAIL || "";
}

const subjectTagPattern = /^\s*\[ticket #\d+\]\s*/i;

// Strip our own "[Ticket #N]" tag(s) and any Re:/Fwd: prefixes — in any order — so a
// fresh ticket's subject stays clean.
export function stripTicketTag(subject: string): string {
  let s = subject.trim();
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = stripSubjectPrefix(s.replace(subjectTagPattern, ""));
  }
  return s.trim();
}

// Plus-addressed reply-to that routes a customer's reply back to our mailbox while
// carrying the ticket id, so the inbound poller can thread it. Returns undefined if
// no mailbox is configured (outbound still sends, just without threading metadata).
export function buildReplyTo(ticketId: number): string | undefined {
  const address = mailboxAddress();
  const at = address.indexOf("@");
  if (at === -1) return undefined;
  const local = address.slice(0, at);
  const domain = address.slice(at + 1);
  return `${local}+t${ticketId}@${domain}`;
}

// Visible subject fallback for threading when a mail client drops the plus-address.
export function buildSubject(ticketId: number, subject: string): string {
  return `[Ticket #${ticketId}] ${stripTicketTag(subject)}`;
}

const plusRefPattern = /\+t(\d+)@/;
const subjectRefPattern = /\[ticket #(\d+)\]/i;

// Recover a ticket id from an inbound message: prefer the plus-address on any
// recipient, fall back to the subject tag. Returns null when neither is present.
export function parseTicketRef(toAddresses: string[], subject: string): number | null {
  for (const addr of toAddresses) {
    const m = addr.match(plusRefPattern);
    if (m) return Number(m[1]);
  }
  const s = subject.match(subjectRefPattern);
  if (s) return Number(s[1]);
  return null;
}
