"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/entities/product";
import { useCart } from "@/features/cart/model";
import { getProducts } from "@/shared/api/catalog";
import { createOrder } from "@/shared/api/orders";
import { Button, Card, Input, Price, Textarea } from "@mattress/ui";

type CheckoutForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  comment: string;
};

const initialForm: CheckoutForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  deliveryAddress: "",
  comment: ""
};

export function CartPage() {
  const { clear, items, removeItem, removeItems, updateItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [removedUnavailableCount, setRemovedUnavailableCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    getProducts()
      .then((loadedProducts) => {
        if (isActive) {
          setProducts(loadedProducts);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );
  const lines = items
    .map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        return null;
      }

      return {
        ...item,
        product,
        lineTotal: product.price * item.quantity
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);
  const unavailableProductIds = useMemo(() => {
    if (isLoading || loadError) {
      return [];
    }

    return items
      .filter((item) => !productById.has(item.productId))
      .map((item) => item.productId);
  }, [isLoading, items, loadError, productById]);
  const unavailableProductIdsKey = unavailableProductIds.join("\n");
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  useEffect(() => {
    if (unavailableProductIdsKey) {
      const ids = unavailableProductIdsKey.split("\n");

      setRemovedUnavailableCount((count) => count + ids.length);
      removeItems(ids);
    }
  }, [removeItems, unavailableProductIdsKey]);

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setCreatedOrderNumber(null);

    if (lines.length === 0) {
      setSubmitError("Корзина пуста.");
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder({
        comment: form.comment || undefined,
        customerEmail: form.customerEmail || undefined,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        deliveryAddress: form.deliveryAddress,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity
        }))
      });

      clear();
      setForm(initialForm);
      setCreatedOrderNumber(order.orderNumber);
    } catch {
      setSubmitError("Не удалось оформить заказ. Проверьте данные и попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0 && !createdOrderNumber) {
    return (
      <section>
        <h1 className="section-title">Корзина</h1>
        <div className="empty-state">Корзина пока пуста.</div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1 className="section-title">Корзина</h1>
      {createdOrderNumber ? (
        <div className="empty-state">
          Заказ {createdOrderNumber} создан. Мы свяжемся с вами для подтверждения.
        </div>
      ) : null}
      {loadError ? (
        <div className="empty-state">
          Не удалось загрузить товары. Проверьте, что backend запущен.
        </div>
      ) : null}
      {removedUnavailableCount > 0 ? (
        <div className="empty-state">
          Некоторые товары больше недоступны и удалены из корзины.
        </div>
      ) : null}
      <div className="cart-page__layout">
        <div className="cart-page__items">
          {isLoading ? <div className="empty-state">Загрузка корзины.</div> : null}
          {lines.map((line) => (
            <Card className="cart-item" key={line.productId}>
              <div className="cart-item__media">
                {line.product.imageUrl ? (
                  <img alt={line.product.title} src={line.product.imageUrl} />
                ) : null}
              </div>
              <div className="cart-item__body">
                <h2 className="cart-item__title">{line.product.title}</h2>
                {line.product.shortDescription ? (
                  <p className="cart-item__meta">{line.product.shortDescription}</p>
                ) : null}
                <Price amount={line.product.price} currency={line.product.currency} />
              </div>
              <div className="cart-item__controls">
                <Button
                  aria-label={`Уменьшить количество ${line.product.title}`}
                  disabled={line.quantity <= 1}
                  onClick={() => updateItem(line.productId, line.quantity - 1)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  −
                </Button>
                <span
                  aria-label={`Количество ${line.product.title}`}
                  className="cart-item__quantity"
                >
                  {line.quantity}
                </span>
                <Button
                  aria-label={`Увеличить количество ${line.product.title}`}
                  onClick={() => updateItem(line.productId, line.quantity + 1)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  +
                </Button>
                <Button
                  onClick={() => removeItem(line.productId)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <Card className="checkout-card">
          <div className="checkout-card__total">
            <span>Итого</span>
            <Price amount={total} />
          </div>
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label>
              <span>Имя</span>
              <Input
                fullWidth
                minLength={2}
                onChange={(event) => updateField("customerName", event.target.value)}
                required
                value={form.customerName}
              />
            </label>
            <label>
              <span>Телефон</span>
              <Input
                fullWidth
                minLength={5}
                onChange={(event) => updateField("customerPhone", event.target.value)}
                required
                type="tel"
                value={form.customerPhone}
              />
            </label>
            <label>
              <span>Email</span>
              <Input
                fullWidth
                onChange={(event) => updateField("customerEmail", event.target.value)}
                type="email"
                value={form.customerEmail}
              />
            </label>
            <label>
              <span>Адрес доставки</span>
              <Input
                fullWidth
                minLength={5}
                onChange={(event) =>
                  updateField("deliveryAddress", event.target.value)
                }
                required
                value={form.deliveryAddress}
              />
            </label>
            <label>
              <span>Комментарий</span>
              <Textarea
                fullWidth
                onChange={(event) => updateField("comment", event.target.value)}
                rows={4}
                value={form.comment}
              />
            </label>
            {submitError ? <div className="form-error">{submitError}</div> : null}
            <Button
              disabled={lines.length === 0}
              fullWidth
              loading={isSubmitting}
              type="submit"
            >
              Оформить заказ
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
