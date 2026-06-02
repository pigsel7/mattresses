import { AdminAnalyticsSchema } from "@mattress/shared";
import { apiBaseUrl, apiClient } from "./client";

export function trackPageView(input: { path: string; referrer?: string }) {
  return apiClient<{ ok: boolean }>("/api/analytics/page-view", {
    body: JSON.stringify(input),
    method: "POST"
  });
}

export async function getAdminAnalytics(cookieHeader?: string) {
  const response = await fetch(`${apiBaseUrl}/api/admin/analytics`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load admin analytics: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  return AdminAnalyticsSchema.parse(data);
}
