import { z } from "zod";
import { AdminOrderStatusSchema } from "./admin-order";

export const AdminAnalyticsSchema = z.object({
  ordersByStatus: z.array(
    z.object({
      count: z.number().int().nonnegative(),
      revenue: z.number().nonnegative(),
      status: AdminOrderStatusSchema
    })
  ),
  revenue: z.number().nonnegative(),
  topProducts: z.array(
    z.object({
      productId: z.string().nullable(),
      quantity: z.number().int().nonnegative(),
      revenue: z.number().nonnegative(),
      title: z.string()
    })
  ),
  totalVisits: z.number().int().nonnegative(),
  visitsLast30Days: z.number().int().nonnegative()
});

export type AdminAnalyticsDto = z.infer<typeof AdminAnalyticsSchema>;
