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
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { defineRelations, sql } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";

export const carType = pgEnum("car-type", ["suv", "sedan", "van"]);
export const accountRole = pgEnum("account-role", ["user", "admin"]);

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

export const carSchema = createSelectSchema(cars);

export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;

export const users = snakeCase.table("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
  role: accountRole().notNull().default("user"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { precision: 6, withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = snakeCase.table(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const accounts = snakeCase.table(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      precision: 6,
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      precision: 6,
      withTimezone: true,
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verifications = snakeCase.table(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/**
 * Dates are inclusive whole days kept as `YYYY-MM-DD` strings, so they compare lexically and
 * never pick up a time or timezone. Double booking is prevented by the `ex_rentals_no_overlap`
 * exclusion constraint, which drizzle can't express and lives in a custom migration.
 */
export const rentals = snakeCase.table(
  "rentals",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    carId: bigint({ mode: "number" })
      .notNull()
      .references(() => cars.id),
    accountId: text()
      .notNull()
      .references(() => users.id),
    startDate: date({ mode: "string" }).notNull(),
    endDate: date({ mode: "string" }).notNull(),
    totalPrice: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
  },
  (t) => [
    check("ck_rentals_dates", sql`${t.endDate} >= ${t.startDate}`),
    index("ix_rentals_account").on(t.accountId, t.startDate),
  ],
);

export const rentalSchema = createSelectSchema(rentals);

export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;

export const relations = defineRelations({ users, rentals, cars, sessions, accounts }, (r) => ({
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
  sessions: {
    owner: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  accounts: {
    owner: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
    }),
  },
}));
