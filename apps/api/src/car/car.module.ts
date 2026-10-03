import { Module } from "@nestjs/common";
import { DatabaseModule } from "../db/database.module.js";

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [],
})
export class CarsModule {}
