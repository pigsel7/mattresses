import { z } from "zod";

export const AdminOrderStatusSchema = z.enum([
  "NEW",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED"
]);

export const AdminOrderItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  productSnapshotName: z.string(),
  productSnapshotSku: z.string().nullable().optional(),
  productSnapshotSlug: z.string().nullable().optional(),
  productId: z.string().nullable().optional()
});

export const AdminOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: AdminOrderStatusSchema,
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().nullable().optional(),
  deliveryAddress: z.string(),
  comment: z.string().nullable().optional(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().length(3),
  itemsCount: z.number().int().nonnegative(),
  items: z.array(AdminOrderItemSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AdminOrdersListSchema = z.array(AdminOrderSchema);

export type AdminOrderStatusDto = z.infer<typeof AdminOrderStatusSchema>;
export type AdminOrderItemDto = z.infer<typeof AdminOrderItemSchema>;
export type AdminOrderDto = z.infer<typeof AdminOrderSchema>;
