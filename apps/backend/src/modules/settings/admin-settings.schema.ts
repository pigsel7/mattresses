import { z } from "zod";

export const adminSettingUpdateSchema = z.object({
  label: z.string().optional().or(z.literal("")),
  value: z.string(),
  isPublic: z.boolean().optional()
});
