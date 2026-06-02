import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  controllers: [FilesController],
  imports: [AuthModule],
  providers: [FilesService]
})
export class FilesModule {}
