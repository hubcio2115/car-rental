import { z } from "zod";

export const envSchema = z.object({
  // Development seeds the fleet and serves Swagger. Defaults to it, like Spring's `dev` profile did.
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),

  // The only origin allowed to call the API with credentials (CORS) or change state with them (CSRF).
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;
