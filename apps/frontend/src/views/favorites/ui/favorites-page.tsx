"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/entities/product";
import { useFavorites } from "@/features/favorites/model";
import { getProducts } from "@/shared/api/catalog";
import { ProductGrid } from "@/widgets/product-grid";

export function FavoritesPage() {
  const { productIds, removeFavorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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

  const favoriteProducts = products.filter((product) =>
    productIds.includes(product.id)
  );
  const availableFavoriteIds = new Set(favoriteProducts.map((product) => product.id));
  const unavailableFavoriteIds = isLoading || loadError
    ? []
    : productIds.filter((productId) => !availableFavoriteIds.has(productId));
  const unavailableFavoriteIdsKey = unavailableFavoriteIds.join("\n");

  useEffect(() => {
    if (unavailableFavoriteIdsKey) {
      const ids = unavailableFavoriteIdsKey.split("\n");

      setRemovedUnavailableCount((count) => count + ids.length);
      removeFavorites(ids);
    }
  }, [removeFavorites, unavailableFavoriteIdsKey]);

  return (
    <section>
      <h1 className="section-title">Избранное</h1>
      {loadError ? (
        <div className="empty-state">
          Не удалось загрузить избранное. Проверьте, что backend запущен.
        </div>
      ) : null}
      {removedUnavailableCount > 0 ? (
        <div className="empty-state">
          Некоторые товары больше недоступны и удалены из избранного.
        </div>
      ) : null}
      {isLoading ? <div className="empty-state">Загрузка избранного.</div> : null}
      {!isLoading && productIds.length === 0 ? (
        <div className="empty-state">Избранные товары появятся здесь.</div>
      ) : null}
      {!isLoading && favoriteProducts.length > 0 ? (
        <ProductGrid products={favoriteProducts} />
      ) : null}
      {!isLoading && productIds.length > 0 && favoriteProducts.length === 0 ? (
        <div className="empty-state">Доступных избранных товаров сейчас нет.</div>
      ) : null}
    </section>
  );
}
