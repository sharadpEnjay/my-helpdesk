import { test, expect, beforeEach } from "bun:test";
import { buildReplyTo, buildSubject, parseTicketRef, stripTicketTag } from "./email-thread";

beforeEach(() => {
  process.env.IMAP_USER = "support@gmail.com";
  delete process.env.SENDGRID_FROM_EMAIL;
});

test("buildReplyTo plus-addresses the mailbox with the ticket id", () => {
  expect(buildReplyTo(123)).toBe("support+t123@gmail.com");
});

test("buildReplyTo falls back to SENDGRID_FROM_EMAIL when IMAP_USER is unset", () => {
  delete process.env.IMAP_USER;
  process.env.SENDGRID_FROM_EMAIL = "help@gmail.com";
  expect(buildReplyTo(7)).toBe("help+t7@gmail.com");
});

test("buildReplyTo returns undefined when no mailbox is configured", () => {
  delete process.env.IMAP_USER;
  delete process.env.SENDGRID_FROM_EMAIL;
  expect(buildReplyTo(7)).toBeUndefined();
});

test("buildSubject tags the subject and strips Re:/existing tags", () => {
  expect(buildSubject(123, "Help me")).toBe("[Ticket #123] Help me");
  expect(buildSubject(123, "Re: [Ticket #123] Help me")).toBe("[Ticket #123] Help me");
});

test("stripTicketTag removes the ticket tag and reply prefixes", () => {
  expect(stripTicketTag("[Ticket #45] Re: hello")).toBe("hello");
  expect(stripTicketTag("Re: Fwd: hello")).toBe("hello");
  expect(stripTicketTag("plain subject")).toBe("plain subject");
});

test("parseTicketRef prefers a plus-addressed recipient", () => {
  expect(parseTicketRef(["support+t123@gmail.com"], "unrelated subject")).toBe(123);
});

test("parseTicketRef falls back to the subject tag", () => {
  expect(parseTicketRef(["support@gmail.com"], "[Ticket #45] hello")).toBe(45);
});

test("parseTicketRef returns null when there is no reference", () => {
  expect(parseTicketRef(["support@gmail.com"], "brand new question")).toBeNull();
});
