import { z } from "zod";
import { carSchema, rentalSchema } from "../db/schema.js";

export const rentalViewSchema = rentalSchema
  .pick({ id: true, carId: true, startDate: true, endDate: true, totalPrice: true })
  .extend({
    carModel: carSchema.shape.model,
    registrationNumber: carSchema.shape.registrationNumber,
  })
  .meta({ id: "RentalView" });

export type RentalView = z.infer<typeof rentalViewSchema>;

/** A day range on a car's calendar, flagging the caller's own. */
export const bookingSchema = rentalSchema
  .pick({ startDate: true, endDate: true })
  .extend({ mine: z.boolean() })
  .meta({ id: "Booking" });

export type Booking = z.infer<typeof bookingSchema>;
