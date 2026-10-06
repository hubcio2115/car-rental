/**
 * Writes the OpenAPI document to `openapi.json`, which apps/web generates its API types from.
 * Run with `pnpm openapi`. Needs no database: the app is created but never started, and the pg
 * pool only connects on the first query. Env placeholders cover the config validation.
 */
import { writeFile } from "node:fs/promises";

process.env.DATABASE_URL ??= "postgres://openapi@localhost/unused";
process.env.BETTER_AUTH_SECRET ??= "Xq7mR2vL9pK4wN8tB3cF6hJ1sD5gZ0yA"; // placeholder, never used to sign
process.env.BETTER_AUTH_URL ??= "http://localhost:8080";

// Imported after the env is filled in, since the config is validated at import time.
const { createApp } = await import("./app.js");
const { createOpenApiDocument } = await import("./swagger.js");

const app = await createApp({ logger: false });
const document = createOpenApiDocument(app);
await app.close();

await writeFile("openapi.json", `${JSON.stringify(document, null, 2)}\n`);
