import { z } from "zod";

export const adminOrderStatusSchema = z.object({
  status: z.enum(["NEW", "PROCESSING", "COMPLETED", "CANCELLED"])
});
