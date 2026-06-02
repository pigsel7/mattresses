"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginSchema } from "@mattress/shared";
import { Button, Input } from "@mattress/ui";
import { loginAdmin } from "@/shared/api/auth";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = AdminLoginSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте данные формы");
      return;
    }

    setIsLoading(true);

    try {
      await loginAdmin(parsed.data);
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Не удалось войти. Проверьте email и пароль.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="admin-auth-form" onSubmit={handleSubmit}>
      <label>
        <span>Email</span>
        <Input
          autoComplete="email"
          fullWidth
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          type="email"
          value={email}
        />
      </label>
      <label>
        <span>Пароль</span>
        <Input
          autoComplete="current-password"
          fullWidth
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Введите пароль"
          type="password"
          value={password}
        />
      </label>
      {error ? <div className="form-error">{error}</div> : null}
      <Button fullWidth loading={isLoading} type="submit">
        Войти
      </Button>
    </form>
  );
}
