import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import type { Env } from "./env.js";
import { StandardSchemaValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

const swaggerConfig = new DocumentBuilder()
  .setTitle("Cars rental")
  .setDescription("Car rental API")
  .setVersion("1.0")
  .addTag("cars-rental")
  .build();

function documentFactory() {
  return SwaggerModule.createDocument(app, swaggerConfig);
}

SwaggerModule.setup("api", app, documentFactory, { jsonDocumentUrl: "swagger/json" });

app.enableShutdownHooks();

app.useGlobalPipes(new StandardSchemaValidationPipe());

const config = app.get<ConfigService<Env, true>>(ConfigService);
await app.listen(config.get("PORT", { infer: true }));
