import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { ZodError } from "zod";
import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_TTL_SECONDS } from "./auth.constants";
import { AdminSessionGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import {
  adminLoginSchema,
  customerLoginSchema,
  customerRegisterSchema,
  verifyEmailSchema
} from "./auth.schema";
import type { AdminSession, CustomerSession } from "./auth.types";

type CookieResponse = {
  clearCookie: (
    name: string,
    options: { path: string; sameSite: "lax"; secure: boolean }
  ) => void;
  cookie: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      maxAge: number;
      path: string;
      sameSite: "lax";
      secure: boolean;
    }
  ) => void;
};

type RequestWithAdmin = {
  adminUser?: AdminSession;
};

type RequestWithUser = {
  headers: {
    cookie?: string;
  };
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: CookieResponse) {
    try {
      const input = adminLoginSchema.parse(body);
      const { admin, token } = await this.authService.login(input);

      this.setSessionCookie(response, token);
      return admin;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid login payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: CookieResponse) {
    this.clearSessionCookie(response);
    return { ok: true };
  }

  @Post("register")
  async register(@Body() body: unknown) {
    try {
      return await this.authService.registerCustomer(customerRegisterSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid register payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Post("customer/login")
  async customerLogin(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: CookieResponse
  ) {
    try {
      const { token, user } = await this.authService.loginCustomer(
        customerLoginSchema.parse(body)
      );

      this.setSessionCookie(response, token);
      return user;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid login payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Post("verify-email")
  async verifyEmail(@Body() body: unknown) {
    try {
      return await this.authService.verifyEmail(verifyEmailSchema.parse(body).token);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid verification payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @UseGuards(AdminSessionGuard)
  @Get("me")
  me(@Req() request: RequestWithAdmin) {
    return request.adminUser;
  }

  @Get("customer/me")
  async customerMe(@Req() request: RequestWithUser): Promise<CustomerSession | null> {
    const token = this.getSessionToken(request.headers.cookie);
    return this.authService.validateCustomerSession(token);
  }

  private getSessionToken(cookieHeader: string | undefined) {
    return cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE_NAME}=`))
      ?.slice(ADMIN_SESSION_COOKIE_NAME.length + 1);
  }

  private setSessionCookie(response: CookieResponse, token: string) {
    response.cookie(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: ADMIN_SESSION_TTL_SECONDS * 1000,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }

  private clearSessionCookie(response: CookieResponse) {
    response.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }
}
