import type { AdminRole, UserType } from "@prisma/client";

export type AdminSession = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: AdminRole;
  userType: "ADMIN";
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  expiresAt: string;
};

export type CustomerSession = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  userType: UserType;
  emailVerifiedAt: string | null;
  expiresAt: string;
};

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type SessionPayload = {
  sub: string;
  email: string;
  userType: UserType;
  iat: number;
  exp: number;
};
