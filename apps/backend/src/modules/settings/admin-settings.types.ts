export type AdminSettingDto = {
  id: string;
  key: string;
  label?: string;
  value: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};
