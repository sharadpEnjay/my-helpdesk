import { z } from "zod";
import { SenderType } from "core/constants/ticket";

export const createReplySchema = z.object({
  body: z.string().trim().min(1, "Reply cannot be empty"),
  senderType: z.enum(Object.values(SenderType) as [SenderType, ...SenderType[]]),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
