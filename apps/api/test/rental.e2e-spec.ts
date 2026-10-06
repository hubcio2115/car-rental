import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Database } from "../src/db/db.js";
import type { Car } from "../src/db/schema.js";
import { bootApp, day, insertCar, insertRental, resetDatabase, signIn } from "./helpers.js";

type Renter = Awaited<ReturnType<typeof signIn>>;

/**
 * Covers the booking rules end to end: inclusive day counting and pricing, that the database
 * refuses overlapping days, which ranges are rejected up front, what a renter can see of other
 * rentals, and cancelling or finishing a rental early.
 *
 * Dates are relative to today because the API rejects rentals that start in the past. Rentals
 * that are already running are inserted directly for the same reason.
 */
describe("rentals", () => {
  let app: NestFastifyApplication;
  let db: Database;
  let renter: Renter;
  let other: Renter;
  let car: Car;

  beforeAll(async () => {
    ({ app, db } = await bootApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    renter = await signIn(app, "renter@rental-test.example");
    other = await signIn(app, "other@rental-test.example");
    car = await insertCar(db, { model: "Mazda CX-5", pricePerDay: 200 });
  });

  function rent(startDate: string, endDate: string) {
    return renter.post(`/car/${car.id}/rentals`, { startDate, endDate });
  }

  async function finish(rentalId: number, endDate: string) {
    const response = await renter.post(`/rentals/${rentalId}/finish`, { endDate });
    return response.statusCode;
  }

  /** Inserts a rental directly, skipping the API's rules. */
  function book(owner: Renter, startDate: string, endDate: string, totalPrice: number) {
    return insertRental(db, {
      carId: car.id,
      accountId: owner.userId,
      startDate,
      endDate,
      totalPrice,
    });
  }

  it("prices the inclusive day count, and a rental covering today marks the car rented", async () => {
    const response = await rent(day(0), day(2));

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      carModel: "Mazda CX-5",
      startDate: day(0),
      endDate: day(2),
      totalPrice: 600,
    });

    const updated = await renter.get(`/car/${car.id}`);
    expect(updated.json()).toMatchObject({ status: "rented" });
  });

  it("treats a shared single day as an overlap", async () => {
    expect((await rent(day(3), day(5))).statusCode).toBe(201);
    expect((await rent(day(6), day(7))).statusCode).toBe(201);

    const overlapping = await rent(day(5), day(6));
    expect(overlapping.statusCode).toBe(409);
    expect(overlapping.json()).toMatchObject({
      message: "This car is already rented on some of those dates",
    });
  });

  it("rejects past starts, reversed ranges and rentals longer than 14 days", async () => {
    expect((await rent(day(-1), day(1))).statusCode).toBe(400);
    expect((await rent(day(4), day(2))).statusCode).toBe(400);
    expect((await rent(day(1), day(15))).statusCode).toBe(400);

    expect((await rent(day(1), day(14))).statusCode).toBe(201);
  });

  it("shares a car's calendar, but lists only the caller's own rentals", async () => {
    await book(other, day(1), day(2), 400);
    expect((await rent(day(4), day(4))).statusCode).toBe(201);

    const bookings = await renter.get(`/car/${car.id}/rentals`);
    expect(bookings.json()).toEqual([
      { startDate: day(1), endDate: day(2), mine: false },
      { startDate: day(4), endDate: day(4), mine: true },
    ]);

    const mine = await renter.get("/rentals");
    expect(mine.json()).toEqual([expect.objectContaining({ startDate: day(4) })]);
  });

  it("deletes a cancelled upcoming rental and frees its days", async () => {
    const upcoming = await book(renter, day(2), day(3), 400);

    expect((await renter.delete(`/rentals/${upcoming.id}`)).statusCode).toBe(204);
    expect((await renter.get("/rentals")).json()).toEqual([]);
    expect((await rent(day(2), day(3))).statusCode).toBe(201);
  });

  it("only cancels the caller's own upcoming rentals", async () => {
    const active = await book(renter, day(-1), day(1), 600);
    const others = await book(other, day(3), day(4), 400);

    expect((await renter.delete(`/rentals/${active.id}`)).statusCode).toBe(409);
    expect((await renter.delete(`/rentals/${others.id}`)).statusCode).toBe(404);
  });

  it("finishing early charges the booked daily rate for the days kept and frees the rest", async () => {
    // Booked at 100 a day, while the car now costs 200.
    const active = await book(renter, day(-1), day(3), 500);

    expect(await finish(active.id, day(1))).toBe(204);

    expect((await renter.get("/rentals")).json()).toEqual([
      expect.objectContaining({ endDate: day(1), totalPrice: 300 }),
    ]);
    expect((await rent(day(2), day(3))).statusCode).toBe(201);
  });

  it("finishes only between today and the current end, and only once started", async () => {
    const active = await book(renter, day(-1), day(2), 800);
    const upcoming = await book(renter, day(5), day(6), 400);

    expect(await finish(active.id, day(-1))).toBe(400);
    expect(await finish(active.id, day(2))).toBe(400);
    expect(await finish(upcoming.id, day(5))).toBe(409);
  });
});
