import sgMail from "@sendgrid/mail";
import type { MailDataRequired } from "@sendgrid/mail";
import boss from "../queue";
import type { SendEmailData } from "../utils/send-email";

const QUEUE = "send-email";

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;
const fromName = process.env.SENDGRID_FROM_NAME || "Support Team";

if (apiKey) sgMail.setApiKey(apiKey);

export async function startSendEmailWorker() {
  if (!apiKey || !fromEmail) {
    console.warn(
      "send-email worker: SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not set — outbound emails will fail until configured"
    );
  }

  await boss.createQueue(QUEUE, {
    retryLimit: 3,
    retryDelay: 10,
    retryBackoff: true,
  });

  await boss.work(QUEUE, async ([job]) => {
    const { to, subject, text, html, replyTo } = job.data as SendEmailData;

    if (!apiKey || !fromEmail) {
      throw new Error(
        "SendGrid not configured: set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL"
      );
    }

    const msg: MailDataRequired = {
      to,
      from: { email: fromEmail, name: fromName },
      subject,
      text,
    };
    if (html) msg.html = html;
    if (replyTo) msg.replyTo = replyTo;

    await sgMail.send(msg);
  });
}
