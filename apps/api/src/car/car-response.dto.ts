import { z } from "zod";
import { carSchema } from "../db/schema.js";
import { pageSchema } from "../lib/pageable.dto.js";
import { carStatuses } from "./car-status.js";

export const carResponseSchema = carSchema
  .extend({ status: z.enum(carStatuses).describe("Derived: rented while a rental covers today") })
  .meta({ id: "Car" });

export type CarResponse = z.infer<typeof carResponseSchema>;

export const carPageSchema = pageSchema(carResponseSchema).meta({ id: "CarPage" });

export type CarPage = z.infer<typeof carPageSchema>;
