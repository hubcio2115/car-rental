-- Hand-edited: drizzle-kit drops and recreates the types, which fails on existing rows ('SUV' isn't
-- a valid value of the new type). Renaming keeps every row and the role default, since Postgres
-- stores enum values by OID rather than by label.
ALTER TYPE "account-role" RENAME VALUE 'USER' TO 'user';--> statement-breakpoint
ALTER TYPE "account-role" RENAME VALUE 'ADMIN' TO 'admin';--> statement-breakpoint
ALTER TYPE "car-type" RENAME VALUE 'SUV' TO 'suv';--> statement-breakpoint
ALTER TYPE "car-type" RENAME VALUE 'SEDAN' TO 'sedan';--> statement-breakpoint
ALTER TYPE "car-type" RENAME VALUE 'VAN' TO 'van';
