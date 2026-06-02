import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ZodError } from "zod";
import { createOrderSchema } from "./dto/create-order.schema";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: unknown) {
    try {
      return this.ordersService.create(createOrderSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid order payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }
}
