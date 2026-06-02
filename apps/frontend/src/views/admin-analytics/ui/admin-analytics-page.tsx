import Link from "next/link";
import { Card, Price } from "@mattress/ui";
import { getAdminAnalytics } from "@/shared/api/analytics";

type AdminAnalyticsPageProps = {
  cookieHeader?: string;
};

export async function AdminAnalyticsPage({ cookieHeader }: AdminAnalyticsPageProps) {
  const analytics = await getAdminAnalytics(cookieHeader);

  return (
    <div className="page-stack admin-analytics-page">
      <div className="admin-analytics-page__top">
        <div>
          <h1 className="section-title">Аналитика</h1>
          <p className="admin-analytics-page__description">
            Посещения, выручка, статусы заказов и популярные товары.
          </p>
        </div>
        <Link className="admin-analytics-page__back-link" href="/admin">
          Назад
        </Link>
      </div>

      <div className="admin-analytics-page__summary">
        <Card>
          <span className="admin-dashboard__label">Посещения всего</span>
          <strong className="admin-dashboard__value">{analytics.totalVisits}</strong>
        </Card>
        <Card>
          <span className="admin-dashboard__label">За 30 дней</span>
          <strong className="admin-dashboard__value">{analytics.visitsLast30Days}</strong>
        </Card>
        <Card>
          <span className="admin-dashboard__label">Выручка</span>
          <Price amount={analytics.revenue} currency="RUB" />
        </Card>
      </div>

      <div className="admin-analytics-page__grid">
        <Card className="admin-analytics-card">
          <h2 className="admin-analytics-card__title">Заказы</h2>
          {analytics.ordersByStatus.map((item) => (
            <div className="admin-analytics-row" key={item.status}>
              <span>{item.status}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </Card>

        <Card className="admin-analytics-card">
          <h2 className="admin-analytics-card__title">Товары</h2>
          {analytics.topProducts.map((item) => (
            <div className="admin-analytics-row" key={`${item.productId}-${item.title}`}>
              <span>{item.title}</span>
              <strong>{item.quantity} шт.</strong>
            </div>
          ))}
          {analytics.topProducts.length === 0 ? (
            <div className="empty-state">Данных по товарам пока нет.</div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
