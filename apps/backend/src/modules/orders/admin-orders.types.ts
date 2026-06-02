import type { OrderStatus } from "@prisma/client";

export type AdminOrderItemDto = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshotName: string;
  productSnapshotSku?: string | null;
  productSnapshotSlug?: string | null;
  productId?: string | null;
};

export type AdminOrderDto = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress: string;
  comment?: string | null;
  totalAmount: number;
  currency: string;
  itemsCount: number;
  items: AdminOrderItemDto[];
  createdAt: string;
  updatedAt: string;
};
