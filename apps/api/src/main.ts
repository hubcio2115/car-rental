import { ConfigService } from "@nestjs/config";
import type { Env } from "./env.js";
import { SwaggerModule } from "@nestjs/swagger";
import { createApp } from "./app.js";
import { createOpenApiDocument } from "./swagger.js";

const app = await createApp();

const config = app.get<ConfigService<Env, true>>(ConfigService);

// API docs are a development aid only.
if (config.get("NODE_ENV", { infer: true }) === "development") {
  SwaggerModule.setup("api", app, () => createOpenApiDocument(app), {
    jsonDocumentUrl: "swagger/json",
  });
}

await app.listen(config.get("PORT", { infer: true }));
