import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/shared/api/auth";
import { AdminLoginPage } from "@/views/admin-login";

export default async function Page() {
  const requestHeaders = await headers();
  const admin = await getAdminSession(requestHeaders.get("cookie") ?? undefined);

  if (admin) {
    redirect("/admin");
  }

  return <AdminLoginPage />;
}
