import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { users } from "../db/schema.js";

export const currentUserSchema = z
  .object({
    user: createSelectSchema(users).pick({ id: true, email: true, name: true, role: true }),
  })
  .meta({ id: "CurrentUser" });

export type CurrentUser = z.infer<typeof currentUserSchema>;
