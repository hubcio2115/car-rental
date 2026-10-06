-- Lets one gist index combine plain equality (car_id) with range overlap (the dates).
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint

-- Dates are inclusive whole days, so 3rd to 5th and 5th to 7th overlap on the 5th.
-- ex_rentals_no_overlap is the single guard against double booking: two concurrent requests for
-- overlapping days cannot both commit, whatever the application checked beforehand.
ALTER TABLE "rentals" ADD CONSTRAINT "ex_rentals_no_overlap" EXCLUDE USING gist (
	"car_id" WITH =,
	daterange("start_date", "end_date", '[]') WITH &&
);
