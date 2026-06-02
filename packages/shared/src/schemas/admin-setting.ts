import { z } from "zod";

export const AdminSettingSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string().optional(),
  value: z.string(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AdminSettingsListSchema = z.array(AdminSettingSchema);

export type AdminSettingDto = z.infer<typeof AdminSettingSchema>;
