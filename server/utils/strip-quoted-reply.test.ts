import { test, expect } from "bun:test";
import { stripQuotedReply, stripQuotedReplyHtml } from "./strip-quoted-reply";

test("strips a Gmail 'On … wrote:' quoted block", () => {
  const body = [
    "I am not able to login",
    "",
    "On Tue, 14 Jul, 2026, 10:52 Sharad Patel <sharad230201@gmail.com> wrote:",
    "> Dear Sharad,",
    "> I appreciate you reaching out to us.",
  ].join("\n");
  expect(stripQuotedReply(body)).toBe("I am not able to login");
});

test("strips a leading quoted block with no On-header", () => {
  const body = "Thanks, that worked!\n\n> previous message line";
  expect(stripQuotedReply(body)).toBe("Thanks, that worked!");
});

test("strips an Outlook 'Original Message' separator", () => {
  const body = "Please reopen this.\n\n-----Original Message-----\nFrom: Support";
  expect(stripQuotedReply(body)).toBe("Please reopen this.");
});

test("leaves a plain reply with no quoting untouched", () => {
  const body = "This is my whole message.\nSecond line.";
  expect(stripQuotedReply(body)).toBe("This is my whole message.\nSecond line.");
});

test("falls back to full text when the body is entirely quoted", () => {
  const body = "> only quoted content here";
  expect(stripQuotedReply(body)).toBe("> only quoted content here");
});

test("does not cut a normal sentence that merely contains the word wrote", () => {
  const body = "I wrote to you yesterday but got no reply.";
  expect(stripQuotedReply(body)).toBe("I wrote to you yesterday but got no reply.");
});

test("HTML: strips a Gmail gmail_quote container", () => {
  const html =
    '<div dir="auto">Actully i need if by tomorrow anyhow is this possible</div>\n<br>\n' +
    '<div class="gmail_quote gmail_quote_container">' +
    '<div dir="ltr" class="gmail_attr">On Tue, 14 Jul, 2026, 11:14 pm Support Team wrote:<br></div>' +
    '<blockquote class="gmail_quote"><div>Dear Sharad, ...</div></blockquote></div>';
  const out = stripQuotedReplyHtml(html);
  expect(out).toContain("Actully i need if by tomorrow anyhow is this possible");
  expect(out).not.toContain("gmail_quote");
  expect(out).not.toContain("Dear Sharad");
});

test("HTML: strips a bare blockquote", () => {
  const html = "<p>Please reopen this.</p><blockquote>old message</blockquote>";
  expect(stripQuotedReplyHtml(html)).toBe("<p>Please reopen this.</p>");
});

test("HTML: leaves un-quoted markup untouched", () => {
  const html = "<p>Just a <strong>simple</strong> reply.</p>";
  expect(stripQuotedReplyHtml(html)).toBe("<p>Just a <strong>simple</strong> reply.</p>");
});
