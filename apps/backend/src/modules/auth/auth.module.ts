import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AdminSessionGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AdminSessionGuard],
  exports: [AuthService, AdminSessionGuard]
})
export class AuthModule {}
