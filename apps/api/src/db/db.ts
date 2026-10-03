import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./schema.js";

export type Database = ReturnType<typeof drizzle>;

export function createConnection(url: string): Database {
  return drizzle(url, { relations });
}
