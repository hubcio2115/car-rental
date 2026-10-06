import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CarService } from "./car.service.js";
import { type CreateCarRequest, createCarRequestSchema } from "./create-car-request.dto.js";
import { carFilterSchema, type CarFilter } from "./car-filter.dto.js";
import {
  type CarPage,
  carPageSchema,
  type CarResponse,
  carResponseSchema,
} from "./car-response.dto.js";
import { type Pageable, pageableSchema } from "../lib/pageable.dto.js";
import { idParam } from "../lib/id-param.dto.js";
import { AuthGuard } from "@thallesp/nestjs-better-auth";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

// Return types are pinned to the documented schemas, so the spec can't drift from the code.
@Controller("car")
@ApiTags("Cars")
@UseGuards(AuthGuard)
export class CarController {
  constructor(@Inject() private readonly carService: CarService) {}

  @Get()
  @ApiOperation({ summary: "List cars matching the given filters" })
  @ApiOkResponse({ standardSchema: carPageSchema })
  getCars(
    @Query({ schema: carFilterSchema }) filter: CarFilter,
    @Query({ schema: pageableSchema }) pageable: Pageable,
  ): Promise<CarPage> {
    return this.carService.list(filter, pageable);
  }

  @Get(":carId")
  @ApiOperation({ summary: "Get one car by id" })
  @ApiOkResponse({ standardSchema: carResponseSchema })
  getCarById(@Param("carId", { schema: idParam }) carId: number): Promise<CarResponse> {
    return this.carService.getById(carId);
  }

  @Post()
  @ApiOperation({ summary: "Register a car" })
  @ApiCreatedResponse({ standardSchema: carResponseSchema })
  create(@Body({ schema: createCarRequestSchema }) body: CreateCarRequest): Promise<CarResponse> {
    return this.carService.create(body);
  }

  @Delete(":carId")
  @ApiOperation({ summary: "Delete a car by id" })
  @ApiOkResponse()
  deleteById(@Param("carId", { schema: idParam }) carId: number) {
    return this.carService.deleteById(carId);
  }
}
