import type {
  AdminOrderDto,
  AdminOrderStatusDto
} from "@mattress/shared";
import { AdminOrderSchema, AdminOrdersListSchema } from "@mattress/shared";
import { apiClient } from "./client";

type AdminOrdersParams = {
  status?: AdminOrderStatusDto | "";
};

export function getAdminOrders(params: AdminOrdersParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();

  return apiClient<AdminOrderDto[]>(`/api/admin/orders${query ? `?${query}` : ""}`).then(
    (data) => AdminOrdersListSchema.parse(data)
  );
}

export function getAdminOrder(id: string) {
  return apiClient<AdminOrderDto>(`/api/admin/orders/${id}`).then((data) =>
    AdminOrderSchema.parse(data)
  );
}

export function updateAdminOrderStatus(id: string, status: AdminOrderStatusDto) {
  return apiClient<AdminOrderDto>(`/api/admin/orders/${id}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH"
  }).then((data) => AdminOrderSchema.parse(data));
}
