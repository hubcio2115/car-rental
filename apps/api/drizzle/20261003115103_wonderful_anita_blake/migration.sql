CREATE TYPE "account-role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "car-type" AS ENUM('SUV', 'SEDAN', 'VAN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp(6) with time zone,
	"refresh_token_expires_at" timestamp(6) with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp(6) with time zone NOT NULL,
	"updated_at" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" bigserial PRIMARY KEY,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"registration_number" text NOT NULL UNIQUE,
	"vin" varchar(17) NOT NULL UNIQUE,
	"seats" smallint NOT NULL,
	"doors" smallint NOT NULL,
	"price_per_day" numeric(10,2) NOT NULL,
	"type" "car-type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" bigserial PRIMARY KEY,
	"car_id" bigint NOT NULL,
	"account_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_price" numeric(12,2) NOT NULL,
	CONSTRAINT "ck_rentals_dates" CHECK ("end_date" >= "start_date")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL UNIQUE,
	"expires_at" timestamp(6) with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp(6) with time zone NOT NULL,
	"updated_at" timestamp(6) with time zone NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp(6) with time zone NOT NULL,
	"updated_at" timestamp(6) with time zone NOT NULL,
	"role" "account-role" DEFAULT 'USER'::"account-role" NOT NULL,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp(6) with time zone
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp(6) with time zone NOT NULL,
	"created_at" timestamp(6) with time zone NOT NULL,
	"updated_at" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "ix_rentals_account" ON "rentals" ("account_id","start_date");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_car_id_cars_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id");--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_account_id_users_id_fkey" FOREIGN KEY ("account_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;