import { AddToCartButton } from "@/features/cart/add-to-cart";
import { FavoriteButton } from "@/features/favorites/toggle-favorite";
import { getProductBySlug, getPublicSettings } from "@/shared/api/catalog";
import { getPhoneHref } from "@/shared/lib/phone";
import { Badge, Card, Price } from "@mattress/ui";

type ProductDetailsPageProps = {
  slug: string;
};

async function getProductDetailsData(slug: string) {
  try {
    const [product, settings] = await Promise.all([
      getProductBySlug(slug),
      getPublicSettings()
    ]);

    return { product, settings, isUnavailable: false };
  } catch {
    return { product: null, settings: null, isUnavailable: true };
  }
}

export async function ProductDetailsPage({ slug }: ProductDetailsPageProps) {
  const { product, settings, isUnavailable } = await getProductDetailsData(slug);
  const phoneHref = settings?.contactPhone
    ? getPhoneHref(settings.contactPhone)
    : undefined;

  if (!product) {
    return (
      <section>
        <h1 className="section-title">Товар</h1>
        <div className="empty-state">
          {isUnavailable
            ? "Не удалось загрузить товар. Проверьте, что backend запущен."
            : "Товар не найден."}
        </div>
      </section>
    );
  }

  return (
    <section className="product-details">
      <div className="product-details__media">
        {product.imageUrl ? (
          <img alt={product.title} src={product.imageUrl} />
        ) : null}
      </div>
      <div className="product-details__content">
        {product.category ? <Badge>{product.category.name}</Badge> : null}
        <h1 className="product-details__title">{product.title}</h1>
        <Price amount={product.price} currency={product.currency} />
        {product.description ? (
          <p className="product-details__description">{product.description}</p>
        ) : null}
        <div className="product-details__actions">
          <AddToCartButton productId={product.id} />
          <FavoriteButton productId={product.id} />
        </div>
        {settings?.contactPhone || settings?.address ? (
          <Card>
            <div className="product-details__contact">
              {settings?.contactPhone ? (
                <span>
                  Телефон магазина:{" "}
                  {phoneHref ? (
                    <a href={phoneHref}>{settings.contactPhone}</a>
                  ) : (
                    settings.contactPhone
                  )}
                </span>
              ) : null}
              {settings?.address ? (
                <span>Адрес: {settings.address}</span>
              ) : null}
            </div>
          </Card>
        ) : null}
        {product.attributes?.length ? (
          <Card>
            <h2 className="product-details__subtitle">Характеристики</h2>
            <dl className="product-details__attributes">
              {product.attributes.map((attribute) => (
                <div key={attribute.key}>
                  <dt>{attribute.label}</dt>
                  <dd>
                    {attribute.value}
                    {attribute.unit ? ` ${attribute.unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
