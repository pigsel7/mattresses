"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mattress/ui";
import { logoutAdmin } from "@/shared/api/auth";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await logoutAdmin();
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button loading={isLoading} onClick={handleLogout} type="button" variant="ghost">
      Выйти
    </Button>
  );
}
