import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const imageSchema = z.object({
  alt: z.string().optional(),
  role: z.enum(["MAIN", "GALLERY"]).default("GALLERY"),
  sortOrder: z.number().int().nonnegative().optional(),
  url: z.string().url()
});

const baseProductSchema = z.object({
  categoryId: z.string().min(1),
  currency: z.string().length(3).default("RUB"),
  description: z.string().optional(),
  images: z.array(imageSchema).default([]),
  price: z.number().nonnegative(),
  sku: z.string().min(1).optional(),
  slug: slugSchema,
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  stockQuantity: z.number().int().nonnegative().default(0),
  title: z.string().min(2)
});

export const adminProductCreateSchema = baseProductSchema;

export const adminProductUpdateSchema = baseProductSchema.partial().extend({
  images: z.array(imageSchema).optional()
});
