import { CategoryStrip } from "@/widgets/category-strip";
import { ProductGrid } from "@/widgets/product-grid";
import { getCategories, getProducts } from "@/shared/api/catalog";
import { CatalogControls } from "./catalog-controls";

type CatalogPageProps = {
  categorySlug?: string;
  query?: string;
  sort?: string;
};

async function getCatalogData(input: CatalogPageProps) {
  try {
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts({
        category: input.categorySlug,
        query: input.query,
        sort: input.sort
      })
    ]);

    return { categories, products, isUnavailable: false };
  } catch {
    return { categories: [], products: [], isUnavailable: true };
  }
}

export async function CatalogPage({ categorySlug, query, sort }: CatalogPageProps) {
  const { categories, products, isUnavailable } =
    await getCatalogData({ categorySlug, query, sort });
  const selectedCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined;
  const catalogTitle = selectedCategory?.name ?? "Каталог";

  return (
    <div className="page-stack">
      {isUnavailable ? (
        <div className="empty-state">
          Не удалось загрузить каталог. Проверьте, что backend запущен.
        </div>
      ) : null}
      <section aria-label="Фильтр по категориям">
        <CategoryStrip
          categories={categories}
          selectedCategorySlug={categorySlug}
        />
      </section>
      <section>
        <div className="catalog-heading">
          <h2 className="section-title">{catalogTitle}</h2>
          <CatalogControls
            categorySlug={categorySlug}
            query={query}
            sort={sort}
          />
        </div>
        <ProductGrid products={products} />
      </section>
    </div>
  );
}
