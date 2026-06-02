import type { CreateOrderDto, OrderCreatedDto } from "@mattress/shared";
import { apiClient } from "./client";

export function createOrder(payload: CreateOrderDto) {
  return apiClient<OrderCreatedDto>("/api/orders", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}
