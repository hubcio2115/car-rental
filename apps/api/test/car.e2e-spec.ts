import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Database } from "../src/db/db.js";
import type { Car } from "../src/db/schema.js";
import { bootApp, client, day, insertCar, insertRental, resetDatabase, signIn } from "./helpers.js";

type Page = { content: (Car & { status: string })[]; page: Record<string, number> };

/**
 * Covers the request binding and guards that would otherwise fail silently or as a 500, and the
 * filter behaviour that isn't obvious from reading it: how values combine, which bounds are
 * inclusive, that a search term can't smuggle in LIKE wildcards, and that status follows
 * whichever rental covers today.
 */
describe("cars", () => {
  let app: NestFastifyApplication;
  let db: Database;
  let user: Awaited<ReturnType<typeof signIn>>;

  beforeAll(async () => {
    ({ app, db } = await bootApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    user = await signIn(app, "cars@test.example");

    // One at a time, so ids (the default sort) follow this order.
    await insertCar(db, {
      model: "Toyota Corolla",
      year: 2020,
      type: "sedan",
      seats: 5,
      doors: 4,
      pricePerDay: 150,
    });
    const rav4 = await insertCar(db, {
      model: "Toyota RAV4",
      year: 2022,
      type: "suv",
      seats: 5,
      doors: 5,
      pricePerDay: 250,
    });
    const sorento = await insertCar(db, {
      model: "Kia Sorento",
      year: 2024,
      type: "suv",
      seats: 7,
      doors: 5,
      pricePerDay: 300,
    });
    const vito = await insertCar(db, {
      model: "Mercedes Vito",
      year: 2018,
      type: "van",
      seats: 9,
      doors: 5,
      pricePerDay: 400,
    });
    await insertCar(db, {
      model: "50% Discount Special",
      year: 2021,
      type: "sedan",
      seats: 5,
      doors: 4,
      pricePerDay: 99,
    });

    await rent(rav4.id, day(-1), day(1)); // out today
    await rent(sorento.id, day(-3), day(-1)); // back yesterday
    await rent(vito.id, day(1), day(2)); // leaves tomorrow
  });

  function rent(carId: number, startDate: string, endDate: string) {
    return insertRental(db, { carId, accountId: user.userId, startDate, endDate, totalPrice: 1 });
  }

  async function models(query: string) {
    const response = await user.get(`/car?${query}`);
    expect(response.statusCode).toBe(200);
    return response.json<Page>().content.map((car) => car.model);
  }

  it("requires a session", async () => {
    const response = await client(app).get("/car");
    expect(response.statusCode).toBe(401);
  });

  it("uses the paged envelope", async () => {
    const response = await user.get("/car?size=2");

    expect(response.json<Page>().page).toEqual({
      size: 2,
      number: 0,
      totalElements: 5,
      totalPages: 3,
    });
    expect(response.json<Page>().content).toHaveLength(2);
  });

  it("binds a comma separated list and the repeated form as the same set", async () => {
    expect(await models("type=suv,sedan")).toHaveLength(4);
    expect(await models("type=suv&type=sedan")).toHaveLength(4);
  });

  it("falls back to the default order for an unknown sort", async () => {
    const response = await user.get("/car?sort=bogusColumn,asc");
    expect(response.statusCode).toBe(200);
  });

  it("rejects a year outside the allowed range", async () => {
    const response = await user.get("/car?minYear=1500");
    expect(response.statusCode).toBe(400);
  });

  it("matches q as a case-insensitive substring of the model", async () => {
    expect(await models("q=corolla")).toEqual(["Toyota Corolla"]);
    expect(await models("q=OYOT")).toEqual(["Toyota Corolla", "Toyota RAV4"]);
  });

  it("escapes LIKE wildcards in q rather than widening the search", async () => {
    expect(await models("q=%25")).toEqual(["50% Discount Special"]);
    expect(await models("q=_")).toEqual([]);
  });

  it("ORs values within a field and ANDs separate fields", async () => {
    expect(await models("type=suv,van")).toHaveLength(3);
    expect(await models("type=suv,van&status=available")).toEqual(["Kia Sorento", "Mercedes Vito"]);
  });

  it("marks a car rented only while a rental covers today", async () => {
    expect(await models("status=rented")).toEqual(["Toyota RAV4"]);

    const { content } = (await user.get("/car")).json<Page>();
    expect(content.filter((car) => car.status === "rented").map((car) => car.model)).toEqual([
      "Toyota RAV4",
    ]);
  });

  it("includes both endpoints of price and year bounds", async () => {
    expect(await models("minPrice=250&maxPrice=300")).toEqual(["Toyota RAV4", "Kia Sorento"]);
    expect(await models("minYear=2020&maxYear=2020")).toEqual(["Toyota Corolla"]);
  });

  it("filters seats and doors on exact counts", async () => {
    expect(await models("seats=7,9")).toEqual(["Kia Sorento", "Mercedes Vito"]);
    expect(await models("doors=4")).toHaveLength(2);
  });

  it("gets a car by id, and 404s an unknown one", async () => {
    const car = await insertCar(db, { model: "Skoda Octavia" });

    const found = await user.get(`/car/${car.id}`);
    expect(found.json()).toMatchObject({
      model: "Skoda Octavia",
      vin: car.vin,
      status: "available",
    });

    const missing = await user.get(`/car/${Number.MAX_SAFE_INTEGER}`);
    expect(missing.statusCode).toBe(404);
  });

  it("normalizes plates before the unique index, naming the duplicated field", async () => {
    const newCar = {
      model: "Mazda 6",
      year: 2022,
      vin: "JTDABCDEFGH000001",
      seats: 5,
      doors: 4,
      pricePerDay: 120,
      type: "sedan",
    };

    const created = await user.post("/car", { ...newCar, registrationNumber: "kr 9999" });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ registrationNumber: "KR9999", status: "available" });

    const duplicate = await user.post("/car", {
      ...newCar,
      vin: "JTDABCDEFGH000002",
      registrationNumber: "KR9999",
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toMatchObject({ field: "registrationNumber" });
  });

  it("refuses a state change from another origin, even with a valid session", async () => {
    const car = await insertCar(db);

    const forged = await client(app, {
      cookie: user.cookie,
      origin: "https://evil.example",
    }).delete(`/car/${car.id}`);
    expect(forged.statusCode).toBe(403);

    const genuine = await user.delete(`/car/${car.id}`);
    expect(genuine.statusCode).toBe(200);
  });
});
