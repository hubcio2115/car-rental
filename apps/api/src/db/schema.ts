import {
  bigint,
  bigserial,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  smallint,
  text,
  varchar,
  snakeCase,
} from "drizzle-orm/pg-core";
import { defineRelations, sql } from "drizzle-orm";

export const carType = pgEnum("car-type", ["SUV", "SEDAN", "VAN"]);
export const accountRole = pgEnum("account-role", ["USER", "ADMIN"]);

export const cars = snakeCase.table("cars", {
  id: bigserial({ mode: "number" }).primaryKey(),
  model: text().notNull(),
  year: integer().notNull(),
  registrationNumber: text().notNull().unique(),
  vin: varchar({ length: 17 }).notNull().unique(),
  seats: smallint().notNull(),
  doors: smallint().notNull(),
  pricePerDay: numeric({ precision: 10, scale: 2, mode: "number" }).notNull(),
  type: carType().notNull(),
});

export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;

export const users = snakeCase.table("users", {
  id: bigserial({ mode: "number" }).primaryKey(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: accountRole().notNull().default("USER"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const rentals = snakeCase.table(
  "rentals",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    carId: bigint({ mode: "number" })
      .notNull()
      .references(() => cars.id),
    accountId: bigint({ mode: "number" })
      .notNull()
      .references(() => users.id),
    startDate: date().notNull(),
    endDate: date().notNull(),
    totalPrice: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
  },
  (t) => [
    check("ck_rentals_dates", sql`${t.endDate} >= ${t.startDate}`),
    index("ix_rentals_account").on(t.accountId, t.startDate),
  ],
);

export type Rental = typeof users.$inferSelect;
export type NewRental = typeof users.$inferInsert;

export const relations = defineRelations({ users, rentals, cars }, (r) => ({
  rentals: {
    car: r.one.cars({
      from: r.rentals.carId,
      to: r.cars.id,
    }),
    rentee: r.one.users({
      from: r.rentals.accountId,
      to: r.users.id,
    }),
  },
}));
