import { defineConfig } from "drizzle-kit";

// drizzle-kit loads .env itself. DATABASE_URL is only needed by migrate/studio.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
