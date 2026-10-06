import { createInsertSchema } from "drizzle-orm/zod";
import { cars } from "../db/schema.js";
import { z } from "zod";

// Drops all whitespace and uppercases, so "kr 1234" and "KR1234" are the same plate.
const identifier = z.string().transform((s) => s.replace(/\s+/g, "").toUpperCase());

export const createCarRequestSchema = createInsertSchema(cars, {
  model: (s) => s.trim().min(1).max(64),
  year: (s) => s.min(1886).max(new Date().getFullYear() + 1),
  registrationNumber: identifier.pipe(z.string().min(1).max(16)),
  // 17 chars, excluding I, O and Q to avoid digit confusion
  vin: identifier.pipe(
    z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Must be a valid 17 character VIN"),
  ),
  seats: (s) => s.min(1).max(9),
  doors: (s) => s.min(1).max(6),
  // Matches the numeric(10, 2) column: 8 integer digits, 2 fractional
  pricePerDay: (s) => s.positive().max(99_999_999.99).multipleOf(0.01),
})
  .omit({ id: true })
  .meta({ id: "CreateCarRequest" });

export type CreateCarRequest = z.infer<typeof createCarRequestSchema>;
