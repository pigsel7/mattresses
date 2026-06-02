import type {
  CategoryDto,
  ProductDto,
  PublicSettingsDto
} from "@mattress/shared";
import { apiClient } from "./client";

type ProductListParams = {
  category?: string;
  query?: string;
  sort?: string;
};

export function getCategories() {
  return apiClient<CategoryDto[]>("/api/categories");
}

export function getProducts(params: ProductListParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.query) {
    searchParams.set("q", params.query);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();

  return apiClient<ProductDto[]>(`/api/products${query ? `?${query}` : ""}`);
}

export function getProductBySlug(slug: string) {
  return apiClient<ProductDto>(`/api/products/${slug}`);
}

export function getPublicSettings() {
  return apiClient<PublicSettingsDto>("/api/settings/public");
}
