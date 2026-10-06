import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/**
 * One Postgres per test run, migrated with the real migrations so the exclusion constraint and
 * enum types match production. The dev database is never touched.
 */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer("postgres:18-alpine").start();
  const databaseUrl = container.getConnectionUri();

  const db = drizzle(databaseUrl);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.$client.end();

  project.provide("databaseUrl", databaseUrl);

  return async () => {
    await container.stop();
  };
}
