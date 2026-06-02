import { ProductDetailsPage } from "@/views/product-details";

export const dynamic = "force-dynamic";

type ProductRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params }: ProductRouteProps) {
  const { slug } = await params;

  return <ProductDetailsPage slug={slug} />;
}
