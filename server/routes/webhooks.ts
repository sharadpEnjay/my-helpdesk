import { Router, type Request, type Response } from "express";
import { parseBody } from "../utils/validation";
import { processInboundEmail } from "../utils/process-inbound-email";
import { inboundEmailSchema } from "core/schemas/ticket";

const router = Router();

const WEBHOOK_SECRET = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;

router.post("/inbound-email", async (req: Request, res: Response) => {
  if (!WEBHOOK_SECRET || req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    res.status(401).json({ error: "Invalid webhook secret" });
    return;
  }

  const data = parseBody(inboundEmailSchema, req.body, res);
  if (!data) return;

  const result = await processInboundEmail({
    fromEmail: data.from,
    fromName: data.fromName,
    subject: data.subject,
    text: data.body,
    html: data.bodyHtml ?? null,
    toAddresses: data.to ?? [],
    messageId: data.messageId ?? null,
  });

  res.status(result.action === "created" ? 201 : 200).json({
    status: result.action,
    ticketId: result.ticketId,
  });
});

export default router;
