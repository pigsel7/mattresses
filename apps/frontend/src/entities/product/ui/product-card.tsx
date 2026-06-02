"use client";

import { Badge, Card, Price } from "@mattress/ui";
import Link from "next/link";
import { AddToCartButton } from "@/features/cart/add-to-cart";
import { FavoriteButton } from "@/features/favorites/toggle-favorite";
import type { Product } from "../model/types";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="product-card">
      <div className="product-card__media-wrap">
        <FavoriteButton
          className="product-card__favorite"
          productId={product.id}
          variant="icon"
        />
        <Link href={`/product/${product.slug}`}>
          <div className="product-card__media">
            {product.imageUrl ? <img alt={product.title} src={product.imageUrl} /> : null}
          </div>
        </Link>
      </div>
      <div>
        <Badge>{product.stockQuantity ? "В наличии" : "Под заказ"}</Badge>
        <h3 className="product-card__title">
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        {product.shortDescription ? (
          <p className="product-card__meta">{product.shortDescription}</p>
        ) : null}
      </div>
      <Price amount={product.price} currency={product.currency} />
      <div className="product-card__actions">
        <AddToCartButton productId={product.id} />
      </div>
    </Card>
  );
}
