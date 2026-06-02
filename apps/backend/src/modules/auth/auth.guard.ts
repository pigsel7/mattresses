import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ADMIN_SESSION_COOKIE_NAME } from "./auth.constants";
import { AuthService } from "./auth.service";
import { parseCookieValue } from "./auth.utils";
import type { AdminSession } from "./auth.types";

type AuthRequest = {
  headers: {
    cookie?: string;
  };
  adminUser?: AdminSession;
};

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = parseCookieValue(request.headers.cookie, ADMIN_SESSION_COOKIE_NAME);
    const session = await this.authService.validateSession(token);

    if (!session) {
      throw new UnauthorizedException("Unauthorized");
    }

    request.adminUser = session;
    return true;
  }
}
