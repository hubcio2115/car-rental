import { Module } from "@nestjs/common";
import { CarController } from "./car.controller.js";
import { CarService } from "./car.service.js";
import { CarsRepository } from "./cars.repository.js";
import { CarSeeder } from "./car.seeder.js";

@Module({
  imports: [],
  controllers: [CarController],
  providers: [CarService, CarsRepository, CarSeeder],
  exports: [CarService],
})
export class CarsModule {}
