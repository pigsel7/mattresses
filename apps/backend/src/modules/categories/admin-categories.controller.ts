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
import { adminCategoryCreateSchema, adminCategoryUpdateSchema } from "./admin-categories.schema";
import { CategoriesService } from "./categories.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/categories")
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAllAdmin();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.categoriesService.findAdminById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    try {
      return this.categoriesService.createAdmin(adminCategoryCreateSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid category payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    try {
      return this.categoriesService.updateAdmin(id, adminCategoryUpdateSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid category payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.deleteAdmin(id);
  }
}
