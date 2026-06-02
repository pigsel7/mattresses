import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { resolve } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? true;

  app.enableCors({
    credentials: true,
    origin: corsOrigin
  });
  app.setGlobalPrefix("api");
  app.useStaticAssets(resolve(process.cwd(), "apps/backend/uploads"), {
    prefix: "/uploads/"
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
