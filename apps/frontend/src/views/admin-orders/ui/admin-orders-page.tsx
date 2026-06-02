"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Price, Select } from "@mattress/ui";
import type {
  AdminOrderDto,
  AdminOrderStatusDto
} from "@mattress/shared";
import {
  getAdminOrders,
  updateAdminOrderStatus
} from "@/shared/api/admin-orders";

const orderStatuses: Array<{ label: string; value: AdminOrderStatusDto | "" }> = [
  { label: "Все", value: "" },
  { label: "Новые", value: "NEW" },
  { label: "В обработке", value: "PROCESSING" },
  { label: "Завершенные", value: "COMPLETED" },
  { label: "Отмененные", value: "CANCELLED" }
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatusDto | "">("");
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const loadedOrders = await getAdminOrders({ status: statusFilter });

        if (cancelled) {
          return;
        }

        setOrders(loadedOrders);
        setSelectedOrderId((current) =>
          loadedOrders.some((order) => order.id === current)
            ? current
            : loadedOrders[0]?.id ?? null
        );
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить заказы.");
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId]
  );

  async function handleStatusChange(status: AdminOrderStatusDto) {
    if (!selectedOrder) {
      return;
    }

    setSavingStatus(true);
    setError(null);

    try {
      const updated = await updateAdminOrderStatus(selectedOrder.id, status);
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order))
      );
    } catch {
      setError("Не удалось изменить статус заказа.");
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="page-stack admin-orders-page">
      <div className="admin-orders-page__top">
        <div>
          <h1 className="section-title">Заказы</h1>
          <p className="admin-orders-page__description">
            Просмотр заявок, состава заказа и изменение статуса.
          </p>
        </div>
        <Link className="admin-orders-page__back-link" href="/admin">
          Назад
        </Link>
      </div>

      <div className="admin-orders-page__toolbar">
        <Select
          onChange={(event) =>
            setStatusFilter(event.target.value as AdminOrderStatusDto | "")
          }
          value={statusFilter}
        >
          {orderStatuses.map((status) => (
            <option key={status.value || "all"} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="admin-orders-page__layout">
        <div className="admin-orders-page__list">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={
                order.id === selectedOrder?.id
                  ? "admin-order-row admin-order-row--selected"
                  : "admin-order-row"
              }
            >
              <Button
                className="admin-order-row__button"
                onClick={() => setSelectedOrderId(order.id)}
                type="button"
                variant="ghost"
              >
                <span className="admin-order-row__top">
                  <span className="admin-order-row__number">{order.orderNumber}</span>
                  <Badge>{order.status}</Badge>
                </span>
                <span className="admin-order-row__meta">
                  <span>{order.customerName}</span>
                  <span>{new Date(order.createdAt).toLocaleString("ru-RU")}</span>
                </span>
                <span className="admin-order-row__total">
                  <Price amount={order.totalAmount} currency={order.currency} />
                  <span>{order.itemsCount} шт.</span>
                </span>
              </Button>
            </Card>
          ))}

          {orders.length === 0 ? <div className="empty-state">Заказов пока нет.</div> : null}
        </div>

        {selectedOrder ? (
          <Card className="admin-order-details">
            <div className="admin-order-details__top">
              <div>
                <h2 className="admin-order-details__title">
                  Заказ {selectedOrder.orderNumber}
                </h2>
                <p className="admin-order-details__meta">
                  {new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <Badge>{selectedOrder.status}</Badge>
            </div>

            <div className="admin-order-details__status">
              <Select
                disabled={savingStatus}
                onChange={(event) =>
                  void handleStatusChange(event.target.value as AdminOrderStatusDto)
                }
                value={selectedOrder.status}
              >
                {orderStatuses
                  .filter((status) => status.value)
                  .map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
              </Select>
              {savingStatus ? (
                <span className="admin-order-details__saving">Сохранение</span>
              ) : null}
            </div>

            <dl className="admin-order-details__contacts">
              <div>
                <dt>Покупатель</dt>
                <dd>{selectedOrder.customerName}</dd>
              </div>
              <div>
                <dt>Телефон</dt>
                <dd>{selectedOrder.customerPhone}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedOrder.customerEmail || "не указан"}</dd>
              </div>
              <div>
                <dt>Адрес</dt>
                <dd>{selectedOrder.deliveryAddress}</dd>
              </div>
              <div>
                <dt>Комментарий</dt>
                <dd>{selectedOrder.comment || "нет"}</dd>
              </div>
            </dl>

            <div className="admin-order-details__items">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="admin-order-item">
                  <div>
                    <div className="admin-order-item__title">
                      {item.productSnapshotName}
                    </div>
                    <div className="admin-order-item__meta">
                      {item.productSnapshotSku || item.productSnapshotSlug || "без SKU"}
                    </div>
                  </div>
                  <div className="admin-order-item__sum">
                    <span>{item.quantity} x</span>
                    <Price amount={item.unitPrice} currency={selectedOrder.currency} />
                    <Price amount={item.totalPrice} currency={selectedOrder.currency} />
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-order-details__total">
              <span>Итого</span>
              <Price amount={selectedOrder.totalAmount} currency={selectedOrder.currency} />
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
