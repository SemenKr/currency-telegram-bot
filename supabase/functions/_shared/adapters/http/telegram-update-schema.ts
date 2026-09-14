import { z } from "zod";

export const telegramUpdateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      message_id: z.number().int(),
      chat: z.object({
        id: z.number().int().safe(),
      }),
      text: z.string().optional(),
    })
    .optional(),
});
