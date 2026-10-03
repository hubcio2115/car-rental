-- Lets one gist index combine plain equality (car_id) with range overlap (the dates).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Dates are inclusive whole days, so 3rd to 5th and 5th to 7th overlap on the 5th.
-- ex_rentals_no_overlap is the single guard against double booking: two concurrent requests for
-- overlapping days cannot both commit, whatever the application checked beforehand.
CREATE TABLE rentals
(
    id          BIGSERIAL PRIMARY KEY,
    car_id      BIGINT         NOT NULL REFERENCES cars (id),
    account_id  BIGINT         NOT NULL REFERENCES users (id),
    start_date  DATE           NOT NULL,
    end_date    DATE           NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    CONSTRAINT ck_rentals_dates CHECK (end_date >= start_date),
    CONSTRAINT ex_rentals_no_overlap EXCLUDE USING gist (
        car_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
);

CREATE INDEX ix_rentals_account ON rentals (account_id, start_date);

-- Status is now derived from rentals, see Car.status.
ALTER TABLE cars DROP COLUMN status;
