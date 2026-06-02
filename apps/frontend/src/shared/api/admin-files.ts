import { apiBaseUrl } from "./client";

export type UploadedImage = {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
};

export async function uploadAdminImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}/api/admin/files/images`, {
    body: formData,
    cache: "no-store",
    credentials: "include",
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Image upload failed with ${response.status}`);
  }

  return response.json() as Promise<UploadedImage>;
}
