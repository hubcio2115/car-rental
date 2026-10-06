import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import type { Database } from "../db/db.js";
import { Car, cars, type NewCar } from "../db/schema.js";
import { and, asc, desc, eq, getColumns, gte, ilike, inArray, lte, SQL } from "drizzle-orm";
import { CarFilter } from "./car-filter.dto.js";
import { Page, Pageable } from "../lib/pageable.dto.js";
import { carStatus, type CarStatus } from "./car-status.js";

// Every car read includes its derived status. Doubles as the sortable column lookup.
const carWithStatus = { ...getColumns(cars), status: carStatus };

export type CarWithStatus = Car & { status: CarStatus };

@Injectable()
export class CarsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findById(id: Car["id"]) {
    const [car] = await this.db.select(carWithStatus).from(cars).where(eq(cars.id, id));
    return car;
  }

  deleteById(id: Car["id"]) {
    return this.db.delete(cars).where(eq(cars.id, id));
  }

  async create(newCar: NewCar) {
    const [car] = await this.db.insert(cars).values(newCar).returning();
    return car;
  }

  createMany(newCars: NewCar[]) {
    return this.db.insert(cars).values(newCars);
  }

  count() {
    return this.db.$count(cars);
  }

  /**
   * Combines the filter's populated fields with AND. Within a set field the values are OR'd,
   * so `?type=suv&type=sedan&minYear=2020` reads as "an SUV or a sedan, from 2020 or later".
   */
  #matching(filter: CarFilter): SQL | undefined {
    const q = filter.q?.trim();

    return and(
      q ? ilike(cars.model, `%${this.#escapeLike(q)}%`) : undefined,
      filter.type?.length ? inArray(cars.type, filter.type) : undefined,
      filter.status?.length ? inArray(carStatus, filter.status) : undefined,
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
  ): Promise<Page<CarWithStatus>> {
    const where = this.#matching(filter);
    const sortBy = carWithStatus[column];

    const [content, totalElements] = await Promise.all([
      this.db
        .select(carWithStatus)
        .from(cars)
        .where(where)
        // `id` breaks ties, so paging through equal sort values is stable.
        .orderBy(direction === "asc" ? asc(sortBy) : desc(sortBy), asc(cars.id))
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
