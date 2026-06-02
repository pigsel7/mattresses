import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { ZodError } from "zod";
import { AdminSessionGuard } from "../auth/auth.guard";
import { adminProductCreateSchema, adminProductUpdateSchema } from "./admin-products.schema";
import { ProductsService } from "./products.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAllAdmin();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.productsService.findAdminById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    try {
      return this.productsService.createAdmin(adminProductCreateSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid product payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    try {
      return this.productsService.updateAdmin(id, adminProductUpdateSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid product payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productsService.deleteAdmin(id);
  }
}
