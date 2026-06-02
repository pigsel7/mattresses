import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/shared/api/auth";
import { AdminPage } from "@/views/admin";

export default async function Page() {
  const requestHeaders = await headers();
  const admin = await getAdminSession(requestHeaders.get("cookie") ?? undefined);

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminPage admin={admin} />;
}
