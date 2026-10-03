CREATE TABLE "cars" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"registration_number" text NOT NULL,
	"vin" varchar(17) NOT NULL,
	"seats" smallint NOT NULL,
	"doors" smallint NOT NULL,
	"price_per_day" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "cars_registrationNumber_unique" UNIQUE("registration_number"),
	CONSTRAINT "cars_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"car_id" bigint NOT NULL,
	"account_id" bigint NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	CONSTRAINT "ck_rentals_dates" CHECK ("rentals"."end_date" >= "rentals"."start_date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_rentals_account" ON "rentals" USING btree ("account_id","start_date");--> statement-breakpoint
-- Hand-written: Drizzle can't express exclusion constraints.
-- btree_gist lets one gist index combine plain equality (car_id) with range overlap (the dates).
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
-- The single guard against double booking: two concurrent requests for overlapping
-- days can't both commit, whatever the application checked beforehand.
ALTER TABLE "rentals" ADD CONSTRAINT "ex_rentals_no_overlap" EXCLUDE USING gist ("car_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&);
