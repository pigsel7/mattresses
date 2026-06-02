import { z } from "zod";

export const trackPageViewSchema = z.object({
  path: z.string().trim().min(1).max(300),
  referrer: z.string().trim().max(500).optional(),
  productId: z.string().optional()
});

export type TrackPageViewInput = z.infer<typeof trackPageViewSchema>;
