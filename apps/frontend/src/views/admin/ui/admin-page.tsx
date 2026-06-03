import { Badge, Card } from "@mattress/ui";
import { AdminLogoutButton } from "@/features/admin-auth/logout-button";
import Link from "next/link";
import type { AdminSessionDto } from "@mattress/shared";

type AdminPageProps = {
  admin: AdminSessionDto;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  SUPER_ADMIN: "Главный администратор"
};

const adminSections = [
  {
    className: "admin-dashboard__card--products",
    href: "/admin/products",
    title: "Товары"
  },
  {
    className: "admin-dashboard__card--categories",
    href: "/admin/categories",
    title: "Категории"
  },
  {
    className: "admin-dashboard__card--orders",
    href: "/admin/orders",
    title: "Заказы"
  },
  {
    className: "admin-dashboard__card--settings",
    href: "/admin/settings",
    title: "Настройки"
  },
  {
    className: "admin-dashboard__card--analytics",
    href: "/admin/analytics",
    title: "Аналитика"
  }
];

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
            <Badge>{roleLabels[admin.role] ?? "Администратор"}</Badge>
          </div>
          <div>
            <div className="admin-dashboard__label">Состояние аккаунта</div>
            <div className="admin-dashboard__value">
              {admin.isActive ? "Активен" : "Отключен"}
            </div>
          </div>
          <div>
            <div className="admin-dashboard__label">Что можно делать</div>
            <div className="admin-dashboard__value">
              Управлять товарами, категориями, заказами и настройками магазина
            </div>
          </div>
        </div>
      </Card>

      <div className="admin-dashboard__cards">
        {adminSections.map((section) => (
          <Link
            className={`admin-dashboard__card ${section.className}`}
            href={section.href}
            key={section.href}
          >
            <span aria-hidden="true" className="admin-dashboard__card-icon" />
            <span className="admin-dashboard__card-title">{section.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
