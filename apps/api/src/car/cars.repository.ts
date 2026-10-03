import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import type { Database } from "../db/db.js";
import { Car, cars } from "../db/schema.js";
import { and, asc, desc, eq, gte, ilike, inArray, lte, SQL, sql } from "drizzle-orm";
import { CreateCarRequest } from "./create-car-request.dto.js";
import { CarFilter } from "./car-filter.dto.js";
import { Page, Pageable } from "../lib/pageable.dto.js";

@Injectable()
export class CarsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findById(id: Car["id"]) {
    const [car] = await this.db.select().from(cars).where(eq(cars.id, id));
    return car;
  }

  async existsByVin(vin: Car["vin"]) {
    const car = await this.db.select().from(cars).where(eq(cars.vin, vin));
    return car.length > 0;
  }

  async existsByRegistrationNumber(registrationNumber: Car["registrationNumber"]) {
    const car = await this.db
      .select()
      .from(cars)
      .where(eq(cars.registrationNumber, registrationNumber));

    return car.length > 0;
  }

  async existsByRegistrationNumberAndVin(
    registrationNumber: Car["registrationNumber"],
    vin: Car["vin"],
  ) {
    const [result] = await this.db
      .select({
        vinExists: sql<boolean>`exists (
        select 1 from ${cars}
        where ${eq(cars.vin, vin)}
      )`,
        registrationNumberExists: sql<boolean>`exists(
        select 1 from ${cars}
        where ${eq(cars.registrationNumber, registrationNumber)}
      )`,
      })
      .from(cars);

    return result ?? { vinExists: false, registrationNumberExists: false };
  }

  deleteById(id: Car["id"]) {
    return this.db.delete(cars).where(eq(cars.id, id));
  }

  async create(newCar: CreateCarRequest) {
    const [car] = await this.db.insert(cars).values(newCar).returning();
    return car;
  }

  /**
   * Combines the filter's populated fields with AND. Within a set field the values are OR'd,
   * so `?type=SUV&type=SEDAN&minYear=2020` reads as "an SUV or a sedan, from 2020 or later".
   */
  #matching(filter: CarFilter): SQL | undefined {
    const q = filter.q?.trim();

    return and(
      q ? ilike(cars.model, `%${this.#escapeLike(q)}%`) : undefined,
      filter.type?.length ? inArray(cars.type, filter.type) : undefined,
      filter.seats?.length ? inArray(cars.seats, filter.seats) : undefined,
      filter.doors?.length ? inArray(cars.doors, filter.doors) : undefined,
      filter.minPrice !== undefined ? gte(cars.pricePerDay, filter.minPrice) : undefined,
      filter.maxPrice !== undefined ? lte(cars.pricePerDay, filter.maxPrice) : undefined,
      filter.minYear !== undefined ? gte(cars.year, filter.minYear) : undefined,
      filter.maxYear !== undefined ? lte(cars.year, filter.maxYear) : undefined,
    );
  }

  // `%` and `_` in user input would otherwise act as wildcards. Postgres LIKE escapes with `\` by default.
  #escapeLike(value: string) {
    return value.replace(/[\\%_]/g, "\\$&");
  }

  async list(
    filter: CarFilter,
    { page, size, sort: [column, direction] }: Pageable,
  ): Promise<Page<Car>> {
    const where = and(this.#matching(filter));

    const [content, totalElements] = await Promise.all([
      this.db
        .select()
        .from(cars)
        .where(where)
        .orderBy(direction === "asc" ? asc(cars[column]) : desc(cars[column]))
        .limit(size)
        .offset(page * size),
      this.db.$count(cars, where),
    ]);

    return {
      content,
      page: { size, number: page, totalElements, totalPages: Math.ceil(totalElements / size) },
    };
  }
}
