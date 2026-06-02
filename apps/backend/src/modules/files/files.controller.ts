import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AdminSessionGuard } from "../auth/auth.guard";
import { FilesService } from "./files.service";

type UploadRequest = {
  get(header: string): string | undefined;
  protocol: string;
};

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Controller("admin/files")
@UseGuards(AdminSessionGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("images")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 5 * 1024 * 1024
      }
    })
  )
  uploadImage(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Req() request: UploadRequest
  ) {
    const publicBaseUrl =
      process.env.PUBLIC_API_URL ??
      `${request.protocol}://${request.get("host") ?? "localhost:4000"}`;

    return this.filesService.saveImage(file, publicBaseUrl.replace(/\/$/, ""));
  }
}
