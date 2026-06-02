import { z } from "zod";

export const AdminRoleSchema = z.enum(["ADMIN", "SUPER_ADMIN"]);
export const UserTypeSchema = z.enum(["USER", "ADMIN"]);

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const AdminSessionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: AdminRoleSchema,
  userType: z.literal("ADMIN"),
  isActive: z.boolean(),
  emailVerifiedAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  expiresAt: z.string()
});

export const CustomerRegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8),
  phone: z.string().trim().min(6).max(32)
});

export const CustomerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const CustomerSessionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  userType: UserTypeSchema,
  emailVerifiedAt: z.string().nullable(),
  expiresAt: z.string()
});

export type AdminRoleDto = z.infer<typeof AdminRoleSchema>;
export type UserTypeDto = z.infer<typeof UserTypeSchema>;
export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;
export type AdminSessionDto = z.infer<typeof AdminSessionSchema>;
export type CustomerRegisterDto = z.infer<typeof CustomerRegisterSchema>;
export type CustomerLoginDto = z.infer<typeof CustomerLoginSchema>;
export type CustomerSessionDto = z.infer<typeof CustomerSessionSchema>;
