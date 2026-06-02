import { z } from "zod";
import { CategorySchema } from "./category";

export const ProductAttributeSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  unit: z.string().optional()
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  imageUrl: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  category: CategorySchema.optional(),
  attributes: z.array(ProductAttributeSchema).optional()
});

export type ProductAttributeDto = z.infer<typeof ProductAttributeSchema>;
export type ProductDto = z.infer<typeof ProductSchema>;
