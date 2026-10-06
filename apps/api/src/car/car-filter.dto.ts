import { z } from "zod";
import { carType } from "../db/schema.js";
import { carStatuses } from "./car-status.js";

// Accepts both the repeated form `?type=suv&type=sedan` (what URLSearchParams produces) and the
// comma form `?type=suv,sedan`.
function set<T extends z.ZodType>(item: T) {
  return z
    .preprocess(
      (v) =>
        v === undefined
          ? v
          : [v].flat().flatMap((value) => (typeof value === "string" ? value.split(",") : [value])),
      z.array(item),
    )
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
  status: set(z.enum(carStatuses)),
  minPrice: price.optional(),
  maxPrice: price.optional(),
  seats: set(z.coerce.number().int().min(1).max(9)),
  doors: set(z.coerce.number().int().min(1).max(6)),
  minYear: year.optional(),
  maxYear: year.optional(),
});

export type CarFilter = z.infer<typeof carFilterSchema>;
