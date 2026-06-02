"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@mattress/ui";

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");
    const trimmedQuery = query.trim();

    if (category) {
      params.set("category", category);
    }

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (sort) {
      params.set("sort", sort);
    }

    const search = params.toString();
    router.push(`/catalog${search ? `?${search}` : ""}`);
  }

  return (
    <form className="site-search" onSubmit={handleSubmit}>
      <Input
        aria-label="Поиск товаров"
        fullWidth
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Найти в каталоге"
        type="search"
        value={query}
      />
      <Button
        aria-label="Искать товары"
        className="site-search__button"
        type="submit"
      >
        <span className="site-search__button-text">Найти</span>
      </Button>
    </form>
  );
}
