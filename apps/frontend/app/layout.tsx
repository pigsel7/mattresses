import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { PageViewTracker } from "@/features/analytics/track-page-view";
import { Header } from "@/widgets/header";
import { getAdminSession, getCustomerSession } from "@/shared/api/auth";
import { getPublicSettings } from "@/shared/api/catalog";
import { ToastProvider } from "@/shared/ui/toast-provider";

export const metadata: Metadata = {
  title: "Sleep Shop",
  description: "Интернет-магазин товаров для сна"
};

async function getLayoutContacts() {
  try {
    return await getPublicSettings();
  } catch {
    return {
      address: "г. Симферополь",
      contactPhone: "+7 000 000-00-00"
    };
  }
}

async function getLayoutAdmin(cookieHeader?: string) {
  try {
    return await getAdminSession(cookieHeader);
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;
  const [contacts, admin, user] = await Promise.all([
    getLayoutContacts(),
    getLayoutAdmin(cookieHeader),
    getCustomerSession(cookieHeader).catch(() => null)
  ]);

  return (
    <html lang="ru">
      <body>
        <ToastProvider>
          <Header
            address={contacts.address ?? "г. Симферополь"}
            contactPhone={contacts.contactPhone}
            isSignedIn={Boolean(user)}
            showAdminLink={Boolean(admin)}
          />
          <PageViewTracker />
          <main className="page-shell">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
