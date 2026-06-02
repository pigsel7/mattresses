"use client";

import type { ChangeEvent, DragEvent, FormEvent } from "react";
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
import { uploadAdminImage } from "@/shared/api/admin-files";

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

const productStatusLabels: Record<ProductFormState["status"], string> = {
  ACTIVE: "Опубликован",
  ARCHIVED: "Скрыт из каталога",
  DRAFT: "Черновик"
};

export function AdminProductsPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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

  function getImageUrls() {
    return [form.mainImageUrl, ...form.galleryImageUrls.split(/\r?\n/)]
      .map((url) => url.trim())
      .filter(Boolean);
  }

  function updateImageUrls(urls: string[]) {
    const uniqueUrls = Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
    const [mainImageUrl = "", ...galleryUrls] = uniqueUrls;

    setForm((current) => ({
      ...current,
      galleryImageUrls: galleryUrls.join("\n"),
      mainImageUrl
    }));
  }

  async function uploadImageFiles(files: FileList | File[]) {
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    setError(null);
    setIsUploadingImages(true);

    try {
      const uploadedImages = await Promise.all(selectedFiles.map(uploadAdminImage));
      updateImageUrls([...getImageUrls(), ...uploadedImages.map((image) => image.url)]);
    } catch {
      setError("Не удалось загрузить изображения.");
    } finally {
      setIsUploadingImages(false);
    }
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    event.target.value = "";

    if (files) {
      void uploadImageFiles(files);
    }
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadImageFiles(event.dataTransfer.files);
  }

  function removeImage(url: string) {
    updateImageUrls(getImageUrls().filter((imageUrl) => imageUrl !== url));
  }

  function makeMainImage(url: string) {
    updateImageUrls([url, ...getImageUrls().filter((imageUrl) => imageUrl !== url)]);
  }

  const imageUrls = getImageUrls();

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
              <span>Адрес страницы</span>
              <Input
                fullWidth
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="matras-ortopedicheskii"
                value={form.slug}
              />
              <span className="admin-products-form__hint">
                Только латиница, цифры и дефисы. Используется в ссылке на товар.
              </span>
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
                <span>Артикул</span>
                <Input
                  fullWidth
                  onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  value={form.sku}
                />
              </label>
            </div>
            <label>
              <span>Публикация</span>
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
                <option value="DRAFT">{productStatusLabels.DRAFT}</option>
                <option value="ACTIVE">{productStatusLabels.ACTIVE}</option>
                <option value="ARCHIVED">{productStatusLabels.ARCHIVED}</option>
              </Select>
            </label>
            <div className="admin-products-images">
              <div>
                <span className="admin-products-images__label">Фотографии товара</span>
                <span className="admin-products-form__hint">
                  Первая фотография будет основной в карточке товара.
                </span>
              </div>
              <div
                className="admin-products-images__dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleImageDrop}
              >
                <Input
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="admin-products-images__input"
                  disabled={isUploadingImages}
                  id="admin-product-images"
                  multiple
                  onChange={handleImageInputChange}
                  type="file"
                />
                <label className="admin-products-images__picker" htmlFor="admin-product-images">
                  {isUploadingImages ? "Загружаем фотографии" : "Выбрать фотографии"}
                </label>
                <span className="admin-products-images__drop-text">
                  или перетащите файлы сюда
                </span>
              </div>
              {imageUrls.length > 0 ? (
                <div className="admin-products-images__grid">
                  {imageUrls.map((url, index) => (
                    <div className="admin-products-images__item" key={url}>
                      <img alt={`Фото товара ${index + 1}`} src={url} />
                      <div className="admin-products-images__item-actions">
                        <Badge>{index === 0 ? "Основное" : "Галерея"}</Badge>
                        {index > 0 ? (
                          <Button
                            onClick={() => makeMainImage(url)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            Сделать основным
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => removeImage(url)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
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
                        <span>{`Ссылка: /product/${product.slug}`}</span>
                        <span>{product.category.name}</span>
                      </div>
                    </div>
                    <Badge>{productStatusLabels[product.status]}</Badge>
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
