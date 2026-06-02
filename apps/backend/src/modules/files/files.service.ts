import {
  BadRequestException,
  Injectable,
  InternalServerErrorException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml"
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class FilesService {
  private readonly uploadDir = resolve(process.cwd(), "apps/backend/uploads/images");

  async saveImage(file: UploadedImageFile | undefined, publicBaseUrl: string) {
    if (!file) {
      throw new BadRequestException("Image file is required");
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Only jpg, png, webp and svg images are allowed");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException("Image must be 5MB or smaller");
    }

    const extension = this.getSafeExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}${extension}`;

    try {
      await mkdir(this.uploadDir, { recursive: true });
      await writeFile(resolve(this.uploadDir, filename), file.buffer);
    } catch (error) {
      throw new InternalServerErrorException("Could not save image");
    }

    const urlPath = `/uploads/images/${filename}`;

    return {
      filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `${publicBaseUrl}${urlPath}`
    };
  }

  private getSafeExtension(originalName: string, mimeType: string) {
    const extension = extname(originalName).toLowerCase();

    if ([".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(extension)) {
      return extension;
    }

    if (mimeType === "image/jpeg") {
      return ".jpg";
    }

    if (mimeType === "image/png") {
      return ".png";
    }

    if (mimeType === "image/webp") {
      return ".webp";
    }

    return ".svg";
  }
}
