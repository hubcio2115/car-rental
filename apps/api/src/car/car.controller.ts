import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CarService } from "./car.service.js";
import { type CreateCarRequest, createCarRequestSchema } from "./create-car-request.dto.js";
import { carFilterSchema, type CarFilter } from "./car-filter.dto.js";
import { type Pageable, pageableSchema } from "../lib/pageable.dto.js";

@Controller("cars")
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Get()
  getCars(
    @Query({ schema: carFilterSchema }) filter: CarFilter,
    @Query({ schema: pageableSchema }) pageable: Pageable,
  ) {
    return this.carService.list(filter, pageable);
  }

  @Post()
  create(@Body({ schema: createCarRequestSchema }) body: CreateCarRequest) {
    return this.carService.create(body);
  }
}
