"use client";

import { Button } from "@mattress/ui";
import { useCart } from "../../model";

type AddToCartButtonProps = {
  productId: string;
};

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const isInCart = items.some((item) => item.productId === productId);

  return (
    <Button
      aria-label={`Добавить товар ${productId} в корзину`}
      onClick={() => addItem(productId)}
      size="sm"
      variant={isInCart ? "secondary" : "primary"}
    >
      {isInCart ? "Еще в корзину" : "В корзину"}
    </Button>
  );
}
