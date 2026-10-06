import { defineConfig } from "drizzle-kit";

// drizzle-kit loads .env itself. DATABASE_URL is only needed by migrate/studio.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
