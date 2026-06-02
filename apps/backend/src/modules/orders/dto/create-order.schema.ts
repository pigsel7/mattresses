import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(5),
  customerEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  deliveryAddress: z.string().trim().min(5),
  comment: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(99)
      })
    )
    .min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
