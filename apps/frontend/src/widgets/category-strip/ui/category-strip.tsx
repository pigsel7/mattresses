import { CategoryCard, type Category } from "@/entities/category";

type CategoryStripProps = {
  categories: Category[];
  selectedCategorySlug?: string;
};

export function CategoryStrip({
  categories,
  selectedCategorySlug
}: CategoryStripProps) {
  if (categories.length === 0) {
    return <div className="empty-state">Категории пока не добавлены.</div>;
  }

  return (
    <div className="category-strip">
      {categories.map((category) => (
        <CategoryCard
          category={category}
          isSelected={category.slug === selectedCategorySlug}
          key={category.id}
        />
      ))}
    </div>
  );
}
