import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/shared/api/auth";
import { AdminProductsPage } from "@/views/admin-products";

export default async function Page() {
  const requestHeaders = await headers();
  const admin = await getAdminSession(requestHeaders.get("cookie") ?? undefined);

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminProductsPage />;
}
