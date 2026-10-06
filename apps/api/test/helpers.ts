import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { getDrizzleToken } from "@nestjs/drizzle";
import { sql } from "drizzle-orm";
import { createApp } from "../src/app.js";
import type { Database } from "../src/db/db.js";
import { cars, rentals, type NewCar, type NewRental } from "../src/db/schema.js";

const WEB_ORIGIN = "http://localhost:3000";
const PASSWORD = "password123";

/** Boots the app with the same wiring as `main.ts`, ready for `app.inject`. */
export async function bootApp() {
  const app = await createApp();
  await app.init();
  // Fastify only accepts injected requests once its plugins have loaded
  await app.getHttpAdapter().getInstance().ready();

  return { app, db: app.get<Database>(getDrizzleToken()) };
}

export async function resetDatabase(db: Database) {
  await db.execute(
    sql`truncate ${rentals}, ${cars}, sessions, accounts, verifications, users restart identity cascade`,
  );
}

/**
 * Registers and signs in through better-auth, returning the user's id and request helpers that
 * send their session cookie from the web app's origin, like the browser would.
 */
export async function signIn(app: NestFastifyApplication, email: string) {
  await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email, password: PASSWORD, name: email },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    payload: { email, password: PASSWORD },
  });

  const cookie = [response.headers["set-cookie"] ?? []]
    .flat()
    .map((header) => header.split(";")[0])
    .join("; ");
  const { user } = response.json<{ user: { id: string } }>();

  return { userId: user.id, cookie, ...client(app, { cookie, origin: WEB_ORIGIN }) };
}

/** Request helpers sending fixed headers, e.g. none at all for an anonymous caller. */
export function client(app: NestFastifyApplication, headers: Record<string, string> = {}) {
  return {
    get: (url: string) => app.inject({ method: "GET", url, headers }),
    post: (url: string, payload?: object) => app.inject({ method: "POST", url, headers, payload }),
    delete: (url: string) => app.inject({ method: "DELETE", url, headers }),
  };
}

let carCount = 0;

/** Inserts a car directly. Plate and VIN are unique per call, since tests rarely care about them. */
export async function insertCar(db: Database, car: Partial<NewCar> = {}) {
  const n = String(++carCount).padStart(6, "0");

  const [inserted] = await db
    .insert(cars)
    .values({
      model: "Mazda CX-5",
      year: 2022,
      registrationNumber: `TST${n}`,
      vin: `TSTVIN00000${n}`,
      seats: 5,
      doors: 5,
      pricePerDay: 200,
      type: "suv",
      ...car,
    })
    .returning();

  if (!inserted) throw new Error("Car insert returned no row");
  return inserted;
}

/** Inserts a rental directly, skipping the API's rules, e.g. to get one that is already running. */
export async function insertRental(db: Database, rental: NewRental) {
  const [inserted] = await db.insert(rentals).values(rental).returning();

  if (!inserted) throw new Error("Rental insert returned no row");
  return inserted;
}

/** Today plus `offset` days, as the `YYYY-MM-DD` the API speaks. */
export function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
