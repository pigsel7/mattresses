import Link from "next/link";
import { Card } from "@mattress/ui";
import { verifyCustomerEmail } from "@/shared/api/auth";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function Page({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  let isVerified = false;

  if (token) {
    try {
      await verifyCustomerEmail(token);
      isVerified = true;
    } catch {
      isVerified = false;
    }
  }

  return (
    <div className="customer-auth-page">
      <Card className="customer-auth-card">
        <h1 className="section-title">
          {isVerified ? "Email подтвержден" : "Не удалось подтвердить email"}
        </h1>
        <p className="customer-auth-card__description">
          {isVerified
            ? "Теперь можно войти в профиль."
            : "Ссылка недействительна или срок действия истек."}
        </p>
        <Link className="customer-auth-card__link" href="/login">
          Перейти ко входу
        </Link>
      </Card>
    </div>
  );
}
