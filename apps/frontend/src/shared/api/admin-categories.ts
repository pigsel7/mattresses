import type { AdminCategoryDto } from "@mattress/shared";
import { AdminCategoriesListSchema, AdminCategorySchema } from "@mattress/shared";
import { apiClient } from "./client";

export type AdminCategoryInput = {
  description?: string;
  imageUrl?: string;
  name: string;
  parentId?: string;
  slug: string;
  sortOrder: number;
};

export function getAdminCategories() {
  return apiClient<AdminCategoryDto[]>("/api/admin/categories").then((data) =>
    AdminCategoriesListSchema.parse(data)
  );
}

export function getAdminCategory(id: string) {
  return apiClient<AdminCategoryDto>(`/api/admin/categories/${id}`).then((data) =>
    AdminCategorySchema.parse(data)
  );
}

export function createAdminCategory(payload: AdminCategoryInput) {
  return apiClient<AdminCategoryDto>("/api/admin/categories", {
    body: JSON.stringify(payload),
    method: "POST"
  }).then((data) => AdminCategorySchema.parse(data));
}

export function updateAdminCategory(id: string, payload: Partial<AdminCategoryInput>) {
  return apiClient<AdminCategoryDto>(`/api/admin/categories/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  }).then((data) => AdminCategorySchema.parse(data));
}

export function deleteAdminCategory(id: string) {
  return apiClient<{ ok: boolean }>(`/api/admin/categories/${id}`, {
    method: "DELETE"
  });
}
