import { sql } from "drizzle-orm";
import { cars, rentals } from "../db/schema.js";

export const carStatuses = ["available", "rented"] as const;
export type CarStatus = (typeof carStatuses)[number];

/**
 * Derived rather than stored: a car is rented while today falls inside one of its rentals.
 * Correlates on `cars.id`, so it only works in queries that select from `cars`.
 *
 * Columns are spelled out with explicit qualifiers: drizzle renders column refs unqualified in a
 * single-table select list, where a bare `id` inside the subquery would resolve to `rentals.id`.
 */
export const carStatus = sql<CarStatus>`(case when exists (
  select 1 from ${rentals} r
  where r.car_id = ${cars}.id
    and daterange(r.start_date, r.end_date, '[]') @> current_date
) then 'rented' else 'available' end)`;
