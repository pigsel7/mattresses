const serverApiBaseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export const apiBaseUrl = (
  typeof window === "undefined"
    ? serverApiBaseUrl
    : browserApiBaseUrl
)?.replace(/\/$/, "") ?? "http://localhost:4000";

export async function apiClient<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${path} returned ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
