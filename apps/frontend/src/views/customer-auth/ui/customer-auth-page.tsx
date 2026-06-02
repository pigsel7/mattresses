"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@mattress/ui";
import { loginCustomer, registerCustomer } from "@/shared/api/auth";

type CustomerAuthPageProps = {
  mode: "login" | "register";
};

export function CustomerAuthPage({ mode }: CustomerAuthPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (isRegister) {
        await registerCustomer({
          email,
          name: String(formData.get("name") ?? ""),
          password,
          phone: String(formData.get("phone") ?? "")
        });
        setMessage("Проверьте почту и подтвердите email для входа.");
      } else {
        await loginCustomer({ email, password });
        window.location.href = "/profile";
      }
    } catch {
      setError(
        isRegister
          ? "Не удалось зарегистрироваться. Проверьте данные."
          : "Не удалось войти. Проверьте email, пароль и подтверждение почты."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="customer-auth-page">
      <Card className="customer-auth-card">
        <div>
          <h1 className="section-title">{isRegister ? "Регистрация" : "Вход"}</h1>
          <p className="customer-auth-card__description">
            {isRegister
              ? "Создайте профиль, подтвердите email и используйте его для заказов."
              : "Войдите в профиль покупателя."}
          </p>
        </div>
        <form className="customer-auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <>
              <label>
                Имя
                <Input fullWidth name="name" required />
              </label>
              <label>
                Телефон
                <Input fullWidth name="phone" required type="tel" />
              </label>
            </>
          ) : null}
          <label>
            Email
            <Input fullWidth name="email" required type="email" />
          </label>
          <label>
            Пароль
            <Input fullWidth minLength={8} name="password" required type="password" />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          {message ? <div className="form-success">{message}</div> : null}
          <Button fullWidth loading={isLoading} type="submit">
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </Button>
        </form>
        <Link className="customer-auth-card__link" href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Уже есть профиль" : "Создать профиль"}
        </Link>
      </Card>
    </div>
  );
}
