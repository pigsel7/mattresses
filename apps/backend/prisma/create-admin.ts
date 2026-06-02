import { AdminRole, PrismaClient, UserType } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile(".env");

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "test-admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "TestAdmin123!";

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      isActive: true,
      emailVerifiedAt: new Date(),
      passwordHash: hashPassword(password),
      role: AdminRole.SUPER_ADMIN,
      userType: UserType.ADMIN
    },
    create: {
      email,
      isActive: true,
      emailVerifiedAt: new Date(),
      passwordHash: hashPassword(password),
      role: AdminRole.SUPER_ADMIN,
      userType: UserType.ADMIN
    }
  });

  console.log(`Admin user is ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
