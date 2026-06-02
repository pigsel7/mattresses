import { Card } from "@mattress/ui";
import Link from "next/link";
import type { Category } from "../model/types";

type CategoryCardProps = {
  category: Category;
  isSelected?: boolean;
};

const categoryImageFallbacks: Record<string, string> = {
  krovati: "/images/categories/krovati.svg",
  matrasy: "/images/categories/matrasy.svg",
  podushki: "/images/categories/podushki.svg"
};

function getCategoryImageUrl(category: Category) {
  return (
    category.imageUrl ??
    categoryImageFallbacks[category.slug] ??
    "/images/categories/default.svg"
  );
}

export function CategoryCard({ category, isSelected }: CategoryCardProps) {
  const imageUrl = getCategoryImageUrl(category);

  return (
    <Card
      className={
        isSelected
          ? "category-card-shell category-card-shell--selected"
          : "category-card-shell"
      }
    >
      <Link className="category-card" href={`/catalog?category=${category.slug}`}>
        <span className="category-card__media">
          <img alt="" src={imageUrl} />
        </span>
        <span className="category-card__body">
          <span className="category-card__name">{category.name}</span>
        </span>
      </Link>
    </Card>
  );
}
