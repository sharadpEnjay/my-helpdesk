// Remove the quoted history a mail client appends when replying (the "On <date>
// … wrote:" block, ">" quoted lines, Outlook "Original Message" separators, etc.)
// so only the newly-typed reply text is kept. Conservative: cuts at the earliest
// quote marker and never touches text that has none.
const markers: RegExp[] = [
  /^\s*On\b.+\bwrote:\s*$/m,                       // Gmail / Apple Mail, single line
  /^\s*On\b.+\n.*\bwrote:\s*$/m,                   // Gmail / Apple Mail, wrapped to 2 lines
  /^\s*-{2,}\s*Original Message\s*-{2,}/im,         // Outlook
  /^\s*From:\s.+$/m,                               // Outlook forwarded header block
  /^\s*_{5,}\s*$/m,                                 // Outlook divider line
  /^\s*>.*$/m,                                      // any quoted line
];

export function stripQuotedReply(text: string): string {
  if (!text) return text;

  let cut = text.length;
  for (const re of markers) {
    const m = text.match(re);
    if (m && m.index !== undefined && m.index < cut) cut = m.index;
  }

  const stripped = text.slice(0, cut).trim();
  // If the whole body was quoted history, fall back to the original trimmed text.
  return stripped || text.trim();
}

// The HTML equivalent — clients wrap quoted history in identifiable containers
// (Gmail's gmail_quote div, <blockquote>, Outlook's reply divider). Truncating at the
// first such marker drops the quote; the client sanitizes the result with DOMPurify,
// which balances any tags left open by the cut.
const htmlMarkers: RegExp[] = [
  /<div[^>]*gmail_quote/i,                 // Gmail (gmail_quote / gmail_quote_container)
  /<blockquote/i,                          // generic quoted block
  /<div[^>]*id=["']?appendonsend/i,        // Outlook
  /<div[^>]*border-top:\s*solid/i,         // Outlook reply divider
  /-{2,}\s*Original Message\s*-{2,}/i,      // Outlook, in-HTML text
];

export function stripQuotedReplyHtml(html: string): string {
  if (!html) return html;

  let cut = html.length;
  for (const re of htmlMarkers) {
    const m = html.match(re);
    if (m && m.index !== undefined && m.index < cut) cut = m.index;
  }

  const stripped = html.slice(0, cut).trim();
  return stripped || html.trim();
}
