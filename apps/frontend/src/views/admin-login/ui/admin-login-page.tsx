import Link from "next/link";
import { Card } from "@mattress/ui";
import { AdminLoginForm } from "@/features/admin-auth/login-form";

export function AdminLoginPage() {
  return (
    <section className="admin-auth-page">
      <Card className="admin-auth-page__card">
        <div className="admin-auth-page__header">
          <h1 className="section-title">Вход в админку</h1>
          <p className="admin-auth-page__description">
            Используйте email и пароль администратора из локального `.env`.
          </p>
        </div>
        <AdminLoginForm />
        <Link className="admin-auth-page__back" href="/">
          Вернуться на сайт
        </Link>
      </Card>
    </section>
  );
}
