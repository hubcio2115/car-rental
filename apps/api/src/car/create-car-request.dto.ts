import { createInsertSchema } from "drizzle-orm/zod";
import { cars } from "../db/schema.js";
import { z } from "zod";

export const createCarRequestSchema = createInsertSchema(cars, {
  vin: (s) => s.length(17), // varchar(17) only caps the length
  year: (s) => s.min(1886).max(new Date().getFullYear() + 1),
  seats: (s) => s.positive(),
  doors: (s) => s.positive(),
  pricePerDay: (s) => s.positive(),
}).omit({ id: true });

export type CreateCarRequest = z.infer<typeof createCarRequestSchema>;
