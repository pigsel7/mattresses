import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().min(1).optional(),
  sortOrder: z.number().int().optional()
});

export type CategoryDto = z.infer<typeof CategorySchema>;
