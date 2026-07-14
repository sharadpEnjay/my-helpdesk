import { test, expect, mock, beforeEach } from "bun:test";

const prisma = {
  ticket: { findUnique: mock(), create: mock(), update: mock() },
  reply: { findUnique: mock(), create: mock() },
  $transaction: mock(async (ops: unknown) => ops),
};
const classifyTicket = mock(() => {});
const autoResolveTicket = mock(() => {});

mock.module("../db", () => ({ default: prisma }));
mock.module("./classify-ticket", () => ({ classifyTicket }));
mock.module("./auto-resolve-ticket", () => ({ autoResolveTicket }));

const { processInboundEmail } = await import("./process-inbound-email");

const baseEmail = {
  fromEmail: "customer@example.com",
  fromName: "Customer",
  subject: "Need help",
  text: "My question",
  html: null as string | null,
};

beforeEach(() => {
  process.env.IMAP_USER = "support@gmail.com";
  for (const m of [
    prisma.ticket.findUnique, prisma.ticket.create, prisma.ticket.update,
    prisma.reply.findUnique, prisma.reply.create, prisma.$transaction,
    classifyTicket, autoResolveTicket,
  ]) m.mockClear();

  prisma.ticket.create.mockResolvedValue({
    id: 10, subject: "Need help", body: "My question", senderName: "Customer", senderEmail: "customer@example.com",
  });
  prisma.$transaction.mockResolvedValue(undefined);
});

test("creates a new ticket + triggers AI triage when there is no ticket reference", async () => {
  const result = await processInboundEmail({ ...baseEmail, toAddresses: ["support@gmail.com"] });

  expect(result).toEqual({ action: "created", ticketId: 10 });
  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);
  expect(classifyTicket).toHaveBeenCalledWith(10, "Need help", "My question");
  expect(autoResolveTicket).toHaveBeenCalledWith(10, "Need help", "My question", "Customer", "customer@example.com");
});

test("appends a customer reply when a plus-addressed ticket is open", async () => {
  prisma.ticket.findUnique.mockResolvedValue({ id: 5, status: "open" });
  prisma.reply.findUnique.mockResolvedValue(null);

  const result = await processInboundEmail({
    ...baseEmail,
    toAddresses: ["support+t5@gmail.com"],
    messageId: "<abc@mail>",
  });

  expect(result).toEqual({ action: "appended", ticketId: 5 });
  expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("skips duplicate messages by emailMessageId", async () => {
  prisma.ticket.findUnique.mockResolvedValue({ id: 5, status: "open" });
  prisma.reply.findUnique.mockResolvedValue({ id: 99 });

  const result = await processInboundEmail({
    ...baseEmail,
    toAddresses: ["support+t5@gmail.com"],
    messageId: "<abc@mail>",
  });

  expect(result).toEqual({ action: "duplicate", ticketId: 5 });
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

test("opens a new ticket when the referenced ticket is closed", async () => {
  prisma.ticket.findUnique.mockResolvedValue({ id: 5, status: "closed" });
  prisma.ticket.create.mockResolvedValue({
    id: 11, subject: "Need help", body: "My question", senderName: "Customer", senderEmail: "customer@example.com",
  });

  const result = await processInboundEmail({
    ...baseEmail,
    toAddresses: ["support+t5@gmail.com"],
  });

  expect(result).toEqual({ action: "created", ticketId: 11 });
  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);
});
