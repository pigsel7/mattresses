import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/shared/api/auth";
import { AdminAnalyticsPage } from "@/views/admin-analytics";

export default async function Page() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;
  const admin = await getAdminSession(cookieHeader);

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminAnalyticsPage cookieHeader={cookieHeader} />;
}
