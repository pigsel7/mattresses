import { Badge, Card } from "@mattress/ui";
import { AdminLogoutButton } from "@/features/admin-auth/logout-button";
import Link from "next/link";
import type { AdminSessionDto } from "@mattress/shared";

type AdminPageProps = {
  admin: AdminSessionDto;
};

export function AdminPage({ admin }: AdminPageProps) {
  const lastLoginAt = admin.lastLoginAt
    ? new Date(admin.lastLoginAt).toLocaleString("ru-RU")
    : "первый вход";
  const expiresAt = new Date(admin.expiresAt).toLocaleString("ru-RU");

  return (
    <section className="page-stack admin-dashboard">
      <div className="admin-dashboard__top">
        <div>
          <h1 className="section-title">Админ-панель</h1>
          <p className="admin-dashboard__meta">
            <span>{admin.email}</span>
            <span>Последний вход: {lastLoginAt}</span>
            <span>Сессия действует до: {expiresAt}</span>
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <Card className="admin-dashboard__summary">
        <div className="admin-dashboard__summary-row">
          <div>
            <div className="admin-dashboard__label">Статус доступа</div>
            <Badge>{admin.role}</Badge>
          </div>
          <div>
            <div className="admin-dashboard__label">Состояние аккаунта</div>
            <div className="admin-dashboard__value">
              {admin.isActive ? "Активен" : "Отключен"}
            </div>
          </div>
          <div>
            <div className="admin-dashboard__label">Следующий шаг</div>
            <div className="admin-dashboard__value">Фото товаров и доработка аналитики</div>
          </div>
        </div>
      </Card>

      <div className="admin-dashboard__cards">
        <Card className="admin-dashboard__card">
          <div className="admin-dashboard__label">Товары</div>
          <div className="admin-dashboard__value">Список, создание, редактирование, фото</div>
          <Link className="admin-dashboard__link" href="/admin/products">
            Открыть управление товарами
          </Link>
        </Card>
        <Card className="admin-dashboard__card">
          <div className="admin-dashboard__label">Категории</div>
          <div className="admin-dashboard__value">Управление деревом категорий</div>
          <Link className="admin-dashboard__link" href="/admin/categories">
            Открыть управление категориями
          </Link>
        </Card>
        <Card className="admin-dashboard__card">
          <div className="admin-dashboard__label">Заказы</div>
          <div className="admin-dashboard__value">Просмотр и смена статусов</div>
          <Link className="admin-dashboard__link" href="/admin/orders">
            Открыть заказы
          </Link>
        </Card>
        <Card className="admin-dashboard__card">
          <div className="admin-dashboard__label">Настройки</div>
          <div className="admin-dashboard__value">Телефон и email владельца</div>
          <Link className="admin-dashboard__link" href="/admin/settings">
            Открыть настройки магазина
          </Link>
        </Card>
        <Card className="admin-dashboard__card">
          <div className="admin-dashboard__label">Аналитика</div>
          <div className="admin-dashboard__value">Посещения, заказы и популярные товары</div>
          <Link className="admin-dashboard__link" href="/admin/analytics">
            Открыть аналитику
          </Link>
        </Card>
      </div>
    </section>
  );
}
