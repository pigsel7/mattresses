import { z } from "zod";

type EnvSource = Record<string, string | undefined>;

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(4000),
  SHOP_OWNER_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional()
});

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url()
});

export function createServerEnv(source: EnvSource) {
  return serverEnvSchema.parse(source);
}

export function createClientEnv(source: EnvSource) {
  return clientEnvSchema.parse(source);
}
