import { z } from "zod";
import { CategorySchema } from "./category";

export const AdminProductImageSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
  alt: z.string().nullable().optional(),
  role: z.enum(["MAIN", "GALLERY"]),
  sortOrder: z.number().int().nonnegative()
});

export const AdminProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  sku: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  stockQuantity: z.number().int().nonnegative(),
  categoryId: z.string(),
  category: CategorySchema,
  images: z.array(AdminProductImageSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AdminProductsListSchema = z.array(AdminProductSchema);

export type AdminProductImageDto = z.infer<typeof AdminProductImageSchema>;
export type AdminProductDto = z.infer<typeof AdminProductSchema>;
