import { ProductImageRole, ProductStatus } from "@prisma/client";

export type AdminProductImage = {
  id: string;
  url: string;
  alt?: string | null;
  role: ProductImageRole;
  sortOrder: number;
};

export type AdminProductCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
};

export type AdminProductDto = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  status: ProductStatus;
  stockQuantity: number;
  categoryId: string;
  category: AdminProductCategory;
  images: AdminProductImage[];
  createdAt: string;
  updatedAt: string;
};
