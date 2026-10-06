import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * The OpenAPI document, built from the routes' zod schemas. Named schemas (`.meta({ id })`)
 * become components, which is what the web app's generated types are keyed by.
 */
export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Cars rental")
    .setDescription("Car rental API")
    .setVersion("1.0")
    .addTag("cars-rental")
    .build();

  return SwaggerModule.createDocument(app, config);
}
