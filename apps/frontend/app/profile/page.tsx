import { headers } from "next/headers";
import Link from "next/link";
import { Card } from "@mattress/ui";
import { getCustomerSession } from "@/shared/api/auth";

export default async function Page() {
  const requestHeaders = await headers();
  const user = await getCustomerSession(requestHeaders.get("cookie") ?? undefined);

  if (!user) {
    return (
      <div className="page-stack">
        <Card>
          <h1 className="section-title">Профиль</h1>
          <p className="profile-page__text">Войдите, чтобы открыть профиль.</p>
          <Link className="profile-page__link" href="/login">
            Войти
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Card className="profile-page">
        <h1 className="section-title">Профиль</h1>
        <dl className="profile-page__data">
          <div>
            <dt>Имя</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd>{user.phone}</dd>
          </div>
          <div>
            <dt>Тип</dt>
            <dd>{user.userType}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
