import type { AdminProductDto } from "@mattress/shared";
import { AdminProductSchema, AdminProductsListSchema } from "@mattress/shared";
import { apiClient } from "./client";

export type AdminProductInput = {
  categoryId: string;
  currency: string;
  description?: string;
  images: Array<{
    alt?: string;
    role?: "MAIN" | "GALLERY";
    sortOrder?: number;
    url: string;
  }>;
  price: number;
  sku?: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  stockQuantity: number;
  title: string;
};

export function getAdminProducts() {
  return apiClient<AdminProductDto[]>("/api/admin/products").then((data) =>
    AdminProductsListSchema.parse(data)
  );
}

export function getAdminProduct(id: string) {
  return apiClient<AdminProductDto>(`/api/admin/products/${id}`).then((data) =>
    AdminProductSchema.parse(data)
  );
}

export function createAdminProduct(payload: AdminProductInput) {
  return apiClient<AdminProductDto>("/api/admin/products", {
    body: JSON.stringify(payload),
    method: "POST"
  }).then((data) => AdminProductSchema.parse(data));
}

export function updateAdminProduct(id: string, payload: Partial<AdminProductInput>) {
  return apiClient<AdminProductDto>(`/api/admin/products/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  }).then((data) => AdminProductSchema.parse(data));
}

export function deleteAdminProduct(id: string) {
  return apiClient<{ ok: boolean }>(`/api/admin/products/${id}`, {
    method: "DELETE"
  });
}
