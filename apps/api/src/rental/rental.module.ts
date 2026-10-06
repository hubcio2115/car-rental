import { Module } from "@nestjs/common";
import { RentalController } from "./rental.controller.js";
import { RentalService } from "./rental.service.js";
import { RentalRepository } from "./rental.repository.js";
import { CarsModule } from "../car/car.module.js";

@Module({
  imports: [CarsModule],
  controllers: [RentalController],
  providers: [RentalService, RentalRepository],
})
export class RentalModule {}
