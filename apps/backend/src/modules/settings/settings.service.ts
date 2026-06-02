import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AdminSettingDto } from "./admin-settings.types";

type AdminSetting = {
  id: string;
  key: string;
  label: string | null;
  value: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AdminSettingUpdateInput = {
  label?: string;
  isPublic?: boolean;
  value: string;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings() {
    const settings = await this.prisma.shopSetting.findMany({
      where: { isPublic: true }
    });
    const values = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      address: values.get("shop_address") ?? "г. Симферополь",
      contactPhone: values.get("contact_phone") ?? ""
    };
  }

  async findAllAdmin() {
    const settings = await this.prisma.shopSetting.findMany({
      orderBy: [{ key: "asc" }]
    });

    return settings.map((setting) => this.mapAdminSetting(setting));
  }

  async updateAdmin(key: string, input: AdminSettingUpdateInput) {
    const normalizedKey = key.trim();

    if (!normalizedKey) {
      throw new BadRequestException("Invalid setting key");
    }

    const updated = await this.prisma.shopSetting.upsert({
      where: { key: normalizedKey },
      update: {
        label: input.label === undefined ? undefined : this.normalizeOptionalString(input.label),
        isPublic: input.isPublic,
        value: input.value
      },
      create: {
        key: normalizedKey,
        label: this.normalizeOptionalString(input.label),
        isPublic: input.isPublic ?? false,
        value: input.value
      }
    });

    return this.mapAdminSetting(updated);
  }

  private mapAdminSetting(setting: AdminSetting): AdminSettingDto {
    return {
      id: setting.id,
      key: setting.key,
      label: setting.label ?? undefined,
      value: setting.value,
      isPublic: setting.isPublic,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString()
    };
  }

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed ? trimmed : null;
  }
}
