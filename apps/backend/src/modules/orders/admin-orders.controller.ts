import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards
} from "@nestjs/common";
import { ZodError } from "zod";
import { AdminSessionGuard } from "../auth/auth.guard";
import { adminOrderStatusSchema } from "./admin-orders.schema";
import { OrdersService } from "./orders.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query("status") status?: string) {
    return this.ordersService.findAllAdmin(status);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.ordersService.findAdminById(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() body: unknown) {
    try {
      return this.ordersService.updateStatusAdmin(
        id,
        adminOrderStatusSchema.parse(body).status
      );
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid order status payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }
}
