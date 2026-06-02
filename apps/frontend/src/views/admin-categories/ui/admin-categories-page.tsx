"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input, Select, Textarea } from "@mattress/ui";
import type { AdminCategoryDto } from "@mattress/shared";
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from "@/shared/api/admin-categories";

type CategoryFormState = {
  description: string;
  imageUrl: string;
  name: string;
  parentId: string;
  slug: string;
  sortOrder: string;
};

const initialFormState: CategoryFormState = {
  description: "",
  imageUrl: "",
  name: "",
  parentId: "",
  slug: "",
  sortOrder: "0"
};

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const loadedCategories = await getAdminCategories();

        if (cancelled) {
          return;
        }

        setCategories(loadedCategories);
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить категории.");
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    setForm({
      description: selectedCategory.description ?? "",
      imageUrl: selectedCategory.imageUrl ?? "",
      name: selectedCategory.name,
      parentId: selectedCategory.parentId ?? "",
      slug: selectedCategory.slug,
      sortOrder: String(selectedCategory.sortOrder)
    });
  }, [selectedCategory]);

  async function refreshCategories() {
    const loadedCategories = await getAdminCategories();
    setCategories(loadedCategories);
  }

  function resetForm() {
    setSelectedCategoryId(null);
    setForm(initialFormState);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      name: form.name.trim(),
      parentId: form.parentId || undefined,
      slug: form.slug.trim(),
      sortOrder: Number(form.sortOrder)
    };

    if (!payload.name || !payload.slug || Number.isNaN(payload.sortOrder)) {
      setError("Проверьте обязательные поля.");
      return;
    }

    if (selectedCategoryId && payload.parentId === selectedCategoryId) {
      setError("Категория не может быть родителем самой себе.");
      return;
    }

    setIsLoading(true);

    try {
      if (selectedCategoryId) {
        await updateAdminCategory(selectedCategoryId, payload);
      } else {
        await createAdminCategory(payload);
      }

      await refreshCategories();
      resetForm();
    } catch {
      setError("Не удалось сохранить категорию.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить категорию? Она должна быть без подкатегорий и товаров.");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteAdminCategory(id);
      await refreshCategories();

      if (selectedCategoryId === id) {
        resetForm();
      }
    } catch {
      setError("Не удалось удалить категорию.");
    }
  }

  return (
    <div className="page-stack admin-categories-page">
      <div className="admin-categories-page__top">
        <div>
          <h1 className="section-title">Категории</h1>
          <p className="admin-categories-page__description">
            Разделы каталога, карточки категорий на главной и вложенность.
          </p>
        </div>
        <div className="admin-categories-page__top-actions">
          <Button type="button" onClick={resetForm} variant="secondary">
            Новая категория
          </Button>
          <Link className="admin-categories-page__back-link" href="/admin">
            Назад
          </Link>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="admin-categories-page__layout">
        <Card className="admin-categories-page__form-card">
          <form className="admin-categories-form" onSubmit={handleSubmit}>
            <label>
              <span>Название</span>
              <Input
                fullWidth
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                value={form.name}
              />
            </label>
            <label>
              <span>Адрес страницы</span>
              <Input
                fullWidth
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="matrasy"
                value={form.slug}
              />
              <span className="admin-products-form__hint">
                Используется в ссылке каталога, например /catalog?category=matrasy.
              </span>
            </label>
            <label>
              <span>Родительская категория</span>
              <Select
                fullWidth
                onValueChange={(parentId) => setForm({ ...form, parentId })}
                value={form.parentId}
              >
                <option value="">Без родителя</option>
                {categories
                  .filter((category) => category.id !== selectedCategoryId)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
            </label>
            <div className="admin-categories-form__row">
              <label>
                <span>Порядок</span>
                <Input
                  fullWidth
                  inputMode="numeric"
                  onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                  type="number"
                  value={form.sortOrder}
                />
              </label>
              <label>
                <span>Изображение</span>
                <Input
                  fullWidth
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                  placeholder="https://..."
                  value={form.imageUrl}
                />
              </label>
            </div>
            <label>
              <span>Описание</span>
              <Textarea
                fullWidth
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                value={form.description}
              />
            </label>
            <div className="admin-categories-form__actions">
              {selectedCategoryId ? (
                <Button onClick={resetForm} type="button" variant="secondary">
                  Отмена
                </Button>
              ) : null}
              <Button loading={isLoading} type="submit">
                {selectedCategoryId ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="admin-categories-page__list">
          {categories.map((category) => (
            <Card key={category.id} className="admin-category-row">
              <div className="admin-category-row__body">
                <div className="admin-category-row__top">
                  <div>
                    <h2 className="admin-category-row__title">{category.name}</h2>
                    <div className="admin-category-row__meta">
                      <span>{`Ссылка: /catalog?category=${category.slug}`}</span>
                      {category.parent ? <span>Родитель: {category.parent.name}</span> : null}
                    </div>
                  </div>
                  <Badge>
                    {category.productsCount} товаров, {category.childrenCount} подкатегорий
                  </Badge>
                </div>
                <p className="admin-category-row__description">
                  {category.description || "Без описания"}
                </p>
                <div className="admin-category-row__actions">
                  <Button onClick={() => setSelectedCategoryId(category.id)} variant="secondary">
                    Редактировать
                  </Button>
                  <Button onClick={() => void handleDelete(category.id)} variant="ghost">
                    Удалить
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {categories.length === 0 ? (
            <div className="empty-state">Категорий пока нет.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
