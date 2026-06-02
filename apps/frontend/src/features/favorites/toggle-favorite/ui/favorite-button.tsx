"use client";

import { Button } from "@mattress/ui";
import { useFavorites } from "../../model";

type FavoriteButtonProps = {
  className?: string;
  productId: string;
  variant?: "button" | "icon";
};

export function FavoriteButton({
  className,
  productId,
  variant = "button"
}: FavoriteButtonProps) {
  const { hasFavorite, toggleFavorite } = useFavorites();
  const isFavorite = hasFavorite(productId);
  const label = isFavorite
    ? `Удалить товар ${productId} из избранного`
    : `Добавить товар ${productId} в избранное`;

  if (variant === "icon") {
    return (
      <Button
        aria-label={label}
        aria-pressed={isFavorite}
        className={className}
        onClick={() => toggleFavorite(productId)}
        size="sm"
        type="button"
        variant="ghost"
      >
        <span aria-hidden="true" className="favorite-heart__icon">
          {isFavorite ? "♥" : "♡"}
        </span>
      </Button>
    );
  }

  return (
    <Button
      aria-label={label}
      onClick={() => toggleFavorite(productId)}
      size="sm"
      variant={isFavorite ? "secondary" : "ghost"}
    >
      {isFavorite ? "В избранном" : "В избранное"}
    </Button>
  );
}
