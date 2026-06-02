"use client";

import { useRouter } from "next/navigation";
import { Select } from "@mattress/ui";

type CatalogControlsProps = {
  categorySlug?: string;
  query?: string;
  sort?: string;
};

const sortOptions = [
  { label: "Сначала новые", value: "new" },
  { label: "Имя: А-Я", value: "name_asc" },
  { label: "Имя: Я-А", value: "name_desc" },
  { label: "Цена: сначала дешевле", value: "price_asc" },
  { label: "Цена: сначала дороже", value: "price_desc" }
];

export function CatalogControls({
  categorySlug,
  query,
  sort = "new"
}: CatalogControlsProps) {
  const router = useRouter();

  function handleSortChange(nextSort: string) {
    const params = new URLSearchParams();

    if (categorySlug) {
      params.set("category", categorySlug);
    }

    if (query) {
      params.set("q", query);
    }

    if (nextSort !== "new") {
      params.set("sort", nextSort);
    }

    const search = params.toString();
    router.push(`/catalog${search ? `?${search}` : ""}`);
  }

  return (
    <div className="catalog-controls">
      {query ? (
        <span className="catalog-controls__query">Поиск: {query}</span>
      ) : null}
      <Select
        aria-label="Сортировка товаров"
        onChange={(event) => handleSortChange(event.target.value)}
        value={sort}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
