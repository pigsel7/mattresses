import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const adminCategoryCreateSchema = z.object({
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  name: z.string().min(2),
  parentId: z.string().min(1).optional().or(z.literal("")),
  slug: slugSchema,
  sortOrder: z.number().int().default(0)
});

export const adminCategoryUpdateSchema = adminCategoryCreateSchema.partial().extend({
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  parentId: z.string().min(1).optional().or(z.literal(""))
});
