import { z } from "zod";

export const PublicSettingsSchema = z.object({
  address: z.string().optional(),
  contactPhone: z.string()
});

export type PublicSettingsDto = z.infer<typeof PublicSettingsSchema>;
