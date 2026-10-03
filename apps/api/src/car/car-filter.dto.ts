import { z } from "zod";
import { carType } from "../db/schema.js";

function set<T extends z.ZodType>(item: T) {
  return z
    .preprocess((v) => (v === undefined || Array.isArray(v) ? v : [v]), z.array(item))
    .optional();
}

const year = z.coerce
  .number()
  .int()
  .min(1886)
  .max(new Date().getFullYear() + 1);
const price = z.coerce.number().nonnegative().multipleOf(0.01);

export const carFilterSchema = z.object({
  q: z.string().max(64).optional(),
  type: set(z.enum(carType.enumValues)),
  minPrice: price.optional(),
  maxPrice: price.optional(),
  seats: set(z.coerce.number().int().min(1).max(9)),
  doors: set(z.coerce.number().int().min(1).max(6)),
  minYear: year.optional(),
  maxYear: year.optional(),
});

export type CarFilter = z.infer<typeof carFilterSchema>;
