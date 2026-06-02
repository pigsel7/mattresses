import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards
} from "@nestjs/common";
import { ZodError } from "zod";
import { AdminSessionGuard } from "../auth/auth.guard";
import { adminSettingUpdateSchema } from "./admin-settings.schema";
import { SettingsService } from "./settings.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAllAdmin();
  }

  @Patch(":key")
  update(@Param("key") key: string, @Body() body: unknown) {
    try {
      return this.settingsService.updateAdmin(key, adminSettingUpdateSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid setting payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }
}
