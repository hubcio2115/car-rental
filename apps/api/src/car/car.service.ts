import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CarsRepository } from "./cars.repository.js";
import { Car } from "../db/schema.js";
import { CreateCarRequest } from "./create-car-request.dto.js";
import type { Pageable } from "../lib/pageable.dto.js";
import { type CarFilter } from "./car-filter.dto.js";

@Injectable()
export class CarService {
  constructor(@Inject() private readonly cars: CarsRepository) {}

  async getById(id: Car["id"]) {
    const car = await this.cars.findById(id);

    if (!car) {
      throw new NotFoundException("Car not found");
    }

    return car;
  }

  async deleteById(id: Car["id"]) {
    await this.cars.deleteById(id);
  }

  async create(request: CreateCarRequest) {
    const { vinExists, registrationNumberExists } =
      await this.cars.existsByRegistrationNumberAndVin(request.registrationNumber, request.vin);

    if (vinExists) {
      throw new ConflictException("VIN already registerd.");
    }

    if (registrationNumberExists) {
      throw new ConflictException("Registration number already registered.");
    }

    return this.cars.create(request);
  }

  async list(filter: CarFilter, pageable: Pageable) {
    return this.cars.list(filter, pageable);
  }
}
