import type { AdminSettingDto } from "@mattress/shared";
import { AdminSettingSchema, AdminSettingsListSchema } from "@mattress/shared";
import { apiClient } from "./client";

export type AdminSettingInput = {
  isPublic?: boolean;
  label?: string;
  value: string;
};

export function getAdminSettings() {
  return apiClient<AdminSettingDto[]>("/api/admin/settings").then((data) =>
    AdminSettingsListSchema.parse(data)
  );
}

export function updateAdminSetting(key: string, payload: AdminSettingInput) {
  return apiClient<AdminSettingDto>(`/api/admin/settings/${key}`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  }).then((data) => AdminSettingSchema.parse(data));
}
