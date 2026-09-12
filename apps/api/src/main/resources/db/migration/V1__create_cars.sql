CREATE TABLE cars
(
    id                  BIGSERIAL PRIMARY KEY,
    model               TEXT           NOT NULL,
    year                INT            NOT NULL,
    registration_number TEXT           NOT NULL UNIQUE,
    vin                 VARCHAR(17)    NOT NULL UNIQUE,
    seats               SMALLINT       NOT NULL,
    doors               SMALLINT       NOT NULL,
    price_per_day       NUMERIC(10, 2) NOT NULL,
    status              TEXT           NOT NULL DEFAULT 'AVAILABLE',
    type                TEXT           NOT NULL
);

CREATE TABLE users
(
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'USER'
);
