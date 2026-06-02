"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Price, Select, Textarea, Badge } from "@mattress/ui";
import type { CategoryDto } from "@mattress/shared";
import type { AdminProductDto } from "@mattress/shared";
import { getCategories } from "@/shared/api/catalog";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct
} from "@/shared/api/admin-products";

type ProductFormState = {
  categoryId: string;
  currency: string;
  description: string;
  galleryImageUrls: string;
  mainImageUrl: string;
  price: string;
  sku: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  stockQuantity: string;
  title: string;
};

const initialFormState: ProductFormState = {
  categoryId: "",
  currency: "RUB",
  description: "",
  galleryImageUrls: "",
  mainImageUrl: "",
  price: "",
  sku: "",
  slug: "",
  status: "ACTIVE",
  stockQuantity: "0",
  title: ""
};

export function AdminProductsPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [loadedCategories, loadedProducts] = await Promise.all([
          getCategories(),
          getAdminProducts()
        ]);

        if (cancelled) {
          return;
        }

        setCategories(loadedCategories);
        setProducts(loadedProducts);

        const firstCategoryId = loadedCategories[0]?.id ?? "";

        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || firstCategoryId
        }));
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить админские данные.");
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    const mainImage = selectedProduct.images.find((image) => image.role === "MAIN");
    const galleryImages = selectedProduct.images
      .filter((image) => image.role !== "MAIN")
      .map((image) => image.url)
      .join("\n");

    setForm({
      categoryId: selectedProduct.categoryId,
      currency: selectedProduct.currency,
      description: selectedProduct.description ?? "",
      galleryImageUrls: galleryImages,
      mainImageUrl: mainImage?.url ?? selectedProduct.images[0]?.url ?? "",
      price: String(selectedProduct.price),
      sku: selectedProduct.sku ?? "",
      slug: selectedProduct.slug,
      status: selectedProduct.status,
      stockQuantity: String(selectedProduct.stockQuantity),
      title: selectedProduct.title
    });
  }, [selectedProduct]);

  async function refreshProducts() {
    const loadedProducts = await getAdminProducts();
    setProducts(loadedProducts);
  }

  function resetForm() {
    setSelectedProductId(null);
    setForm((current) => ({
      ...initialFormState,
      categoryId: current.categoryId || categories[0]?.id || ""
    }));
  }

  function buildImages() {
    const images: Array<{
      alt?: string;
      role?: "MAIN" | "GALLERY";
      sortOrder?: number;
      url: string;
    }> = [];

    if (form.mainImageUrl.trim()) {
      images.push({
        alt: form.title.trim() || undefined,
        role: "MAIN",
        sortOrder: 0,
        url: form.mainImageUrl.trim()
      });
    }

    const galleryImages = form.galleryImageUrls
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    galleryImages.forEach((url, index) => {
      images.push({
        alt: form.title.trim() || undefined,
        role: "GALLERY",
        sortOrder: index + 1,
        url
      });
    });

    return images;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.categoryId) {
      setError("Выберите категорию.");
      return;
    }

    const payload = {
      categoryId: form.categoryId,
      currency: form.currency.trim().toUpperCase() || "RUB",
      description: form.description.trim() || undefined,
      images: buildImages(),
      price: Number(form.price),
      sku: form.sku.trim() || undefined,
      slug: form.slug.trim(),
      status: form.status,
      stockQuantity: Number(form.stockQuantity),
      title: form.title.trim()
    };

    if (!payload.title || !payload.slug || Number.isNaN(payload.price) || Number.isNaN(payload.stockQuantity)) {
      setError("Проверьте обязательные поля.");
      return;
    }

    setIsLoading(true);

    try {
      if (selectedProductId) {
        await updateAdminProduct(selectedProductId, payload);
      } else {
        await createAdminProduct(payload);
      }

      await refreshProducts();
      resetForm();
    } catch {
      setError("Не удалось сохранить товар.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить товар? Это действие нельзя отменить.");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteAdminProduct(id);
      await refreshProducts();

      if (selectedProductId === id) {
        resetForm();
      }
    } catch {
      setError("Не удалось удалить товар.");
    }
  }

  return (
    <div className="page-stack admin-products-page">
      <div className="admin-products-page__top">
        <div>
          <h1 className="section-title">Товары</h1>
          <p className="admin-products-page__description">
            Создание и редактирование товаров без выхода из админки.
          </p>
        </div>
        <div className="admin-products-page__top-actions">
          <Button type="button" onClick={resetForm} variant="secondary">
            Новый товар
          </Button>
          <Link className="admin-products-page__back-link" href="/admin">
            Назад
          </Link>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="admin-products-page__layout">
        <Card className="admin-products-page__form-card">
          <form className="admin-products-form" onSubmit={handleSubmit}>
            <label>
              <span>Название</span>
              <Input
                fullWidth
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                value={form.title}
              />
            </label>
            <label>
              <span>Slug</span>
              <Input
                fullWidth
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="matras-ortopedicheskii"
                value={form.slug}
              />
            </label>
            <label>
              <span>Категория</span>
              <Select
                fullWidth
                onValueChange={(categoryId) => setForm({ ...form, categoryId })}
                value={form.categoryId}
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="admin-products-form__row">
              <label>
                <span>Цена</span>
                <Input
                  fullWidth
                  inputMode="decimal"
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  type="number"
                  value={form.price}
                />
              </label>
              <label>
                <span>В наличии</span>
                <Input
                  fullWidth
                  inputMode="numeric"
                  onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                  type="number"
                  value={form.stockQuantity}
                />
              </label>
            </div>
            <div className="admin-products-form__row">
              <label>
                <span>Валюта</span>
                <Input
                  fullWidth
                  maxLength={3}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  value={form.currency}
                />
              </label>
              <label>
                <span>SKU</span>
                <Input
                  fullWidth
                  onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  value={form.sku}
                />
              </label>
            </div>
            <label>
              <span>Статус</span>
              <Select
                fullWidth
                onValueChange={(status) =>
                  setForm({
                    ...form,
                    status: status as ProductFormState["status"]
                  })
                }
                value={form.status}
              >
                <option value="DRAFT">Черновик</option>
                <option value="ACTIVE">Активен</option>
                <option value="ARCHIVED">Архив</option>
              </Select>
            </label>
            <label>
              <span>Основное фото</span>
              <Input
                fullWidth
                placeholder="https://..."
                onChange={(event) => setForm({ ...form, mainImageUrl: event.target.value })}
                value={form.mainImageUrl}
              />
            </label>
            <label>
              <span>Галерея, по одному URL в строке</span>
              <Textarea
                fullWidth
                onChange={(event) => setForm({ ...form, galleryImageUrls: event.target.value })}
                value={form.galleryImageUrls}
              />
            </label>
            <label>
              <span>Описание</span>
              <Textarea
                fullWidth
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                value={form.description}
              />
            </label>
            <div className="admin-products-form__actions">
              {selectedProductId ? (
                <Button onClick={resetForm} type="button" variant="secondary">
                  Отмена
                </Button>
              ) : null}
              <Button loading={isLoading} type="submit">
                {selectedProductId ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="admin-products-page__list">
          {products.map((product) => {
            const mainImage = product.images.find((image) => image.role === "MAIN") ?? product.images[0];

            return (
              <Card key={product.id} className="admin-product-row">
                <div className="admin-product-row__media">
                  {mainImage ? <img alt={product.title} src={mainImage.url} /> : null}
                </div>
                <div className="admin-product-row__body">
                  <div className="admin-product-row__top">
                    <div>
                      <h2 className="admin-product-row__title">{product.title}</h2>
                      <div className="admin-product-row__meta">
                        <span>{product.slug}</span>
                        <span>{product.category.name}</span>
                      </div>
                    </div>
                    <Badge>{product.status}</Badge>
                  </div>
                  <Price amount={product.price} currency={product.currency} />
                  <p className="admin-product-row__description">
                    {product.description || "Без описания"}
                  </p>
                  <div className="admin-product-row__actions">
                    <Button onClick={() => setSelectedProductId(product.id)} variant="secondary">
                      Редактировать
                    </Button>
                    <Button onClick={() => void handleDelete(product.id)} variant="ghost">
                      Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {products.length === 0 ? (
            <div className="empty-state">Товаров пока нет.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
