import { CatalogPage } from "@/views/catalog";

export const dynamic = "force-dynamic";

type CatalogRouteProps = {
  searchParams: Promise<{
    category?: string | string[];
    q?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function Page({ searchParams }: CatalogRouteProps) {
  const params = await searchParams;
  const category = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;

  return <CatalogPage categorySlug={category} query={query} sort={sort} />;
}
