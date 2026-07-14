import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error("Missing SENDGRID_API_KEY in server/.env");
  process.exit(1);
}
sgMail.setApiKey(apiKey);

const address = process.env.SENDGRID_FROM_EMAIL || "sharadp.enjay@gmail.com";

const msg = {
  to: "sharadp.enjay@gmail.com",
  from: address, // must be a verified Single Sender in SendGrid
  subject: "SendGrid test from helpdesk",
  text: "This is a plain-text test email sent via SendGrid.",
  html: "<strong>This is a test email sent via SendGrid.</strong>",
};

try {
  const [res] = await sgMail.send(msg);
  console.log("SENT ✅  status:", res.statusCode, " x-message-id:", res.headers["x-message-id"]);
} catch (err: any) {
  console.error("FAILED ❌  status:", err?.code);
  console.error(JSON.stringify(err?.response?.body ?? err?.message, null, 2));
  process.exit(1);
}
