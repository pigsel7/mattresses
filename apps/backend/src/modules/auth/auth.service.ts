import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, UserType } from "@prisma/client";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { ADMIN_SESSION_TTL_SECONDS } from "./auth.constants";
import type {
  AdminLoginInput,
  AdminSession,
  CustomerSession,
  SessionPayload
} from "./auth.types";
import type {
  CustomerLoginInput,
  CustomerRegisterInput
} from "./auth.schema";
import { signSessionToken, verifySessionToken } from "./auth.utils";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../../prisma/prisma.service";

type AuthenticatedUser = Prisma.AdminUserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    passwordHash: true;
    phone: true;
    role: true;
    userType: true;
    isActive: true;
    emailVerifiedAt: true;
    lastLoginAt: true;
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {}

  async login(input: AdminLoginInput) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
      select: this.authenticatedUserSelect
    });

    if (
      !admin ||
      !admin.isActive ||
      admin.userType !== UserType.ADMIN ||
      !this.verifyPassword(input.password, admin.passwordHash)
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ADMIN_SESSION_TTL_SECONDS * 1000);
    const updatedAdmin = await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: now },
      select: this.authenticatedUserSelect
    });

    return {
      admin: this.mapAdminSession(updatedAdmin, expiresAt),
      token: this.signToken(updatedAdmin, now, expiresAt)
    };
  }

  async registerCustomer(input: CustomerRegisterInput) {
    const existingUser = await this.prisma.adminUser.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }]
      },
      select: { id: true }
    });

    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const user = await this.prisma.adminUser.create({
      data: {
        email: input.email,
        name: input.name,
        phone: input.phone,
        passwordHash: this.hashPassword(input.password),
        userType: UserType.USER
      },
      select: this.authenticatedUserSelect
    });

    await this.createAndSendVerification(user);

    return {
      email: user.email,
      ok: true
    };
  }

  async loginCustomer(input: CustomerLoginInput) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
      select: this.authenticatedUserSelect
    });

    if (
      !user ||
      !user.isActive ||
      !this.verifyPassword(input.password, user.passwordHash)
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException("Email is not verified");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ADMIN_SESSION_TTL_SECONDS * 1000);
    const updatedUser = await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
      select: this.authenticatedUserSelect
    });

    return {
      token: this.signToken(updatedUser, now, expiresAt),
      user: this.mapCustomerSession(updatedUser, expiresAt)
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: this.authenticatedUserSelect
        }
      }
    });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException("Invalid verification token");
    }

    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() }
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return { ok: true };
  }

  async validateSession(token: string | undefined) {
    const user = await this.getSessionUser(token);

    if (!user || user.userType !== UserType.ADMIN) {
      return null;
    }

    return this.mapAdminSession(user, this.getTokenExpiration(token));
  }

  async validateCustomerSession(token: string | undefined) {
    const user = await this.getSessionUser(token);

    if (!user) {
      return null;
    }

    return this.mapCustomerSession(user, this.getTokenExpiration(token));
  }

  private readonly authenticatedUserSelect = {
    email: true,
    emailVerifiedAt: true,
    id: true,
    isActive: true,
    lastLoginAt: true,
    name: true,
    passwordHash: true,
    phone: true,
    role: true,
    userType: true
  } satisfies Prisma.AdminUserSelect;

  private async getSessionUser(token: string | undefined) {
    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);

    if (!payload) {
      return null;
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: this.authenticatedUserSelect
    });

    if (
      !user ||
      !user.isActive ||
      user.email !== payload.email ||
      user.userType !== payload.userType
    ) {
      return null;
    }

    return user;
  }

  private signToken(user: AuthenticatedUser, issuedAt: Date, expiresAt: Date) {
    return signSessionToken(
      {
        sub: user.id,
        email: user.email,
        userType: user.userType,
        iat: Math.floor(issuedAt.getTime() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000)
      } satisfies SessionPayload,
      this.getSessionSecret()
    );
  }

  private verifyToken(token: string) {
    const payload = verifySessionToken<SessionPayload>(token, this.getSessionSecret());

    if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  }

  private getTokenExpiration(token: string | undefined) {
    const payload = token ? this.verifyToken(token) : null;
    return new Date((payload?.exp ?? Math.floor(Date.now() / 1000)) * 1000);
  }

  private mapAdminSession(user: AuthenticatedUser, expiresAt: Date): AdminSession {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      userType: "ADMIN",
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      expiresAt: expiresAt.toISOString()
    };
  }

  private mapCustomerSession(user: AuthenticatedUser, expiresAt: Date): CustomerSession {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      userType: user.userType,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      expiresAt: expiresAt.toISOString()
    };
  }

  private async createAndSendVerification(user: AuthenticatedUser) {
    const token = randomBytes(32).toString("hex");
    const appUrl = this.configService.get<string>("APP_URL") ?? "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    await this.prisma.emailVerificationToken.create({
      data: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        tokenHash: this.hashToken(token),
        userId: user.id
      }
    });

    await this.mailService.sendEmailVerification({
      email: user.email,
      name: user.name ?? user.email,
      verificationUrl
    });
  }

  private getSessionSecret() {
    return this.configService.get<string>("JWT_SECRET") ?? "change-me-in-local-env";
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");

    return `scrypt:${salt}:${hash}`;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split(":");

    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const derivedHash = scryptSync(password, salt, 64).toString("hex");
    const hashBuffer = Buffer.from(hash, "hex");
    const derivedHashBuffer = Buffer.from(derivedHash, "hex");

    if (hashBuffer.length !== derivedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashBuffer, derivedHashBuffer);
  }
}
