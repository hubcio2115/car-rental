import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { type Database } from "../db/db.js";
import { Car, cars, Rental, rentals, User, users, type NewRental } from "../db/schema.js";
import { and, desc, eq, gte } from "drizzle-orm";

@Injectable()
export class RentalRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  create(newRental: NewRental) {
    return this.db.insert(rentals).values(newRental).returning();
  }

  update(rental: Rental) {
    return this.db.update(rentals).set(rental).where(eq(rentals.id, rental.id));
  }

  findBookingsForCar(carId: Car["id"], date: Rental["endDate"]) {
    return this.db
      .select()
      .from(rentals)
      .where(and(eq(rentals.carId, carId), gte(rentals.endDate, date)))
      .orderBy(rentals.startDate);
  }

  findRentalsByAccount(userId: User["id"]) {
    return this.db
      .select()
      .from(rentals)
      .innerJoin(cars, eq(cars.id, rentals.carId))
      .where(eq(rentals.accountId, userId))
      .orderBy(desc(rentals.startDate));
  }

  findByIdAndAccountId(rentalId: Rental["id"], userId: User["id"]) {
    return this.db
      .select()
      .from(rentals)
      .where(and(eq(rentals.id, rentalId), eq(rentals.accountId, userId)));
  }

  delete(rentalId: Rental["id"]) {
    return this.db.delete(rentals).where(eq(rentals.id, rentalId));
  }
}
