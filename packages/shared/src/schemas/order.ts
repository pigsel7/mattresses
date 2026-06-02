import { z } from "zod";

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(5),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().min(5),
  comment: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive().max(99)
      })
    )
    .min(1)
});

export const OrderCreatedSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().length(3),
  itemsCount: z.number().int().nonnegative(),
  createdAt: z.string()
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type OrderCreatedDto = z.infer<typeof OrderCreatedSchema>;
