import { ProductGrid } from "@/widgets/product-grid";
import { CategoryStrip } from "@/widgets/category-strip";
import { getCategories, getProducts } from "@/shared/api/catalog";

async function getHomeData() {
  try {
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts()
    ]);

    return { categories, products, isUnavailable: false };
  } catch {
    return { categories: [], products: [], isUnavailable: true };
  }
}

export async function HomePage() {
  const { categories, products, isUnavailable } = await getHomeData();

  return (
    <div className="page-stack">
      {isUnavailable ? (
        <div className="empty-state">
          Не удалось загрузить данные магазина. Проверьте, что backend запущен.
        </div>
      ) : null}
      <section>
        <h1 className="section-title">Товары для сна</h1>
        <CategoryStrip categories={categories} />
      </section>
      <section>
        <h2 className="section-title">Каталог</h2>
        <ProductGrid products={products} />
      </section>
    </div>
  );
}
