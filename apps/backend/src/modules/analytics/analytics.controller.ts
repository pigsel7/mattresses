import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards
} from "@nestjs/common";
import { ZodError } from "zod";
import { AdminSessionGuard } from "../auth/auth.guard";
import { AnalyticsService } from "./analytics.service";
import { trackPageViewSchema } from "./analytics.schema";

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("analytics/page-view")
  trackPageView(@Body() body: unknown) {
    try {
      return this.analyticsService.trackPageView(trackPageViewSchema.parse(body));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid analytics payload",
          issues: error.issues
        });
      }

      throw error;
    }
  }

  @UseGuards(AdminSessionGuard)
  @Get("admin/analytics")
  getAdminSummary() {
    return this.analyticsService.getAdminSummary();
  }
}
