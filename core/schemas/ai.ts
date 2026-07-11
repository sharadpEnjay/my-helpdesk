import { z } from "zod";

export const polishReplySchema = z.object({
  draft: z.string().trim().min(1, "Draft reply is required"),
});

export type PolishReplyInput = z.infer<typeof polishReplySchema>;
