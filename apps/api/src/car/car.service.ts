import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CarsRepository } from "./cars.repository.js";
import { Car } from "../db/schema.js";
import { CreateCarRequest } from "./create-car-request.dto.js";
import type { Pageable } from "../lib/pageable.dto.js";
import { type CarFilter } from "./car-filter.dto.js";
import { pgError } from "../db/errors.js";

// Postgres' default names for the inline `unique()` columns on `cars`.
const FIELD_BY_CONSTRAINT = new Map([
  ["cars_vin_key", "vin"],
  ["cars_registration_number_key", "registrationNumber"],
]);

const FOREIGN_KEY_VIOLATION = "23503";

@Injectable()
export class CarService {
  constructor(@Inject() private readonly cars: CarsRepository) {}

  /**
   * @throws {NotFoundException} when car is not found.
   */
  async getById(id: Car["id"]) {
    const car = await this.cars.findById(id);

    if (!car) {
      throw new NotFoundException("Car not found");
    }

    return car;
  }

  /**
   * @throws {ConflictException} when the car has rentals, which keep referencing it.
   */
  async deleteById(id: Car["id"]) {
    try {
      await this.cars.deleteById(id);
    } catch (err) {
      if (pgError(err)?.code === FOREIGN_KEY_VIOLATION) {
        throw new ConflictException("A car with rentals can't be deleted");
      }

      throw err;
    }
  }

  /**
   * Uniqueness is left to the database's unique indexes, so concurrent requests can't both
   * register the same VIN or plate.
   *
   * @throws {ConflictException} naming the duplicated `field`.
   */
  async create(request: CreateCarRequest) {
    try {
      const car = await this.cars.create(request);

      if (!car) {
        throw new InternalServerErrorException("Car insert returned no row");
      }

      // A car that was just registered can't have rentals yet.
      return { ...car, status: "available" as const };
    } catch (err) {
      const field = FIELD_BY_CONSTRAINT.get(pgError(err)?.constraint ?? "");

      if (field) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: "Conflict",
          message: `A car with this ${field} already exists`,
          field,
        });
      }

      throw err;
    }
  }

  async list(filter: CarFilter, pageable: Pageable) {
    return this.cars.list(filter, pageable);
  }
}
