import type {
  AdminLoginDto,
  AdminSessionDto,
  CustomerLoginDto,
  CustomerRegisterDto,
  CustomerSessionDto
} from "@mattress/shared";
import { AdminSessionSchema, CustomerSessionSchema } from "@mattress/shared";
import { apiBaseUrl, apiClient } from "./client";

export function loginAdmin(payload: AdminLoginDto) {
  return apiClient<AdminSessionDto>("/api/auth/login", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function logoutAdmin() {
  return apiClient<{ ok: boolean }>("/api/auth/logout", {
    method: "POST"
  });
}

export function registerCustomer(payload: CustomerRegisterDto) {
  return apiClient<{ email: string; ok: boolean }>("/api/auth/register", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function loginCustomer(payload: CustomerLoginDto) {
  return apiClient<CustomerSessionDto>("/api/auth/customer/login", {
    body: JSON.stringify(payload),
    method: "POST"
  }).then((data) => CustomerSessionSchema.parse(data));
}

export function verifyCustomerEmail(token: string) {
  return apiClient<{ ok: boolean }>("/api/auth/verify-email", {
    body: JSON.stringify({ token }),
    method: "POST"
  });
}

export async function getAdminSession(cookieHeader?: string) {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as unknown;
  return AdminSessionSchema.parse(data);
}

export async function getCustomerSession(cookieHeader?: string) {
  const response = await fetch(`${apiBaseUrl}/api/auth/customer/me`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as unknown;
  return data ? CustomerSessionSchema.parse(data) : null;
}
