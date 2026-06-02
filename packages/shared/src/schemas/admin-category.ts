import { z } from "zod";
import { CategorySchema } from "./category";

export const AdminCategorySchema = CategorySchema.extend({
  parentId: z.string().nullable().optional(),
  parent: CategorySchema.nullable().optional(),
  productsCount: z.number().int().nonnegative(),
  childrenCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AdminCategoriesListSchema = z.array(AdminCategorySchema);

export type AdminCategoryDto = z.infer<typeof AdminCategorySchema>;
