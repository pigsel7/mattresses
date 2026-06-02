import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminOrdersController } from "./admin-orders.controller";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
