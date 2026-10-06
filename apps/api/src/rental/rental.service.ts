import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Car, Rental, User } from "../db/schema.js";
import { CreateRentalRequest } from "./create-rental-request.dto.js";
import { UserSession } from "@thallesp/nestjs-better-auth";
import { CarService } from "../car/car.service.js";
import { RentalRepository } from "./rental.repository.js";
import { pgError } from "../db/errors.js";
import { FinishRentalRequest } from "./finish-rental.dto.js";

const MAX_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// All dates below are `YYYY-MM-DD` strings, so `<`/`>` compare them chronologically.
@Injectable()
export class RentalService {
  constructor(
    @Inject() private readonly carService: CarService,
    @Inject() private readonly rentals: RentalRepository,
  ) {}

  async create(
    carId: Car["id"],
    { startDate, endDate }: CreateRentalRequest,
    session: UserSession,
  ) {
    if (startDate < today()) {
      throw new BadRequestException("A rental can't start in the past");
    }

    if (endDate < startDate) {
      throw new BadRequestException("A rental must end on or after its start date");
    }

    const days = dayCount(startDate, endDate);
    if (days > MAX_DAYS) {
      throw new BadRequestException(`A rental can last at most ${MAX_DAYS} days`);
    }

    const car = await this.carService.getById(carId);

    try {
      const [rental] = await this.rentals.create({
        carId: car.id,
        accountId: session.user.id,
        startDate,
        endDate,
        totalPrice: car.pricePerDay * days,
      });

      if (!rental) {
        throw new InternalServerErrorException("Rental insert returned no row");
      }

      return toRentalView(rental, car);
    } catch (err) {
      // The exclusion constraint is the real double-booking guard: concurrent requests for
      // overlapping days can't both commit, whatever was checked beforehand.
      if (pgError(err)?.constraint === "ex_rentals_no_overlap") {
        throw new ConflictException("This car is already rented on some of those dates");
      }

      throw err;
    }
  }

  /** The car's current and upcoming bookings, flagging the caller's own. */
  async bookingsForCar(carId: Car["id"], session: UserSession) {
    await this.carService.getById(carId);

    const bookings = await this.rentals.findBookingsForCar(carId, today());

    return bookings.map((booking) => ({
      startDate: booking.startDate,
      endDate: booking.endDate,
      mine: booking.accountId === session.user.id,
    }));
  }

  async mine(session: UserSession) {
    const bookings = await this.rentals.findRentalsByAccount(session.user.id);

    return bookings.map(({ cars: car, rentals: rental }) => toRentalView(rental, car));
  }

  async cancel(rentalId: Rental["id"], session: UserSession) {
    const rental = await this.#owned(rentalId, session.user.id);

    if (rental.startDate <= today()) {
      throw new ConflictException("Only upcoming rentals can be cancelled");
    }

    await this.rentals.delete(rentalId);
  }

  async finish(rentalId: Rental["id"], req: FinishRentalRequest, session: UserSession) {
    const rental = await this.#owned(rentalId, session.user.id);
    const now = today();
    const { startDate: start, endDate: end } = rental;
    const newEnd = req.endDate;

    if (start > now || end < now) {
      throw new ConflictException("Only active rentals can be finished early");
    }

    if (newEnd < now) {
      throw new BadRequestException("A rental can't finish in the past");
    }

    if (newEnd >= end) {
      throw new BadRequestException("A rental can only finish before its current end date");
    }

    rental.totalPrice =
      Math.round(((rental.totalPrice * dayCount(start, newEnd)) / dayCount(start, end)) * 100) /
      100;
    rental.endDate = newEnd;

    await this.rentals.update(rental);
  }

  /**
   * @throws {NotFoundException} when there's no rental with the id assign to the user.
   */
  async #owned(rentalId: Rental["id"], userId: User["id"]) {
    const [rental] = await this.rentals.findByIdAndAccountId(rentalId, userId);

    if (!rental) {
      throw new NotFoundException("Rental not found");
    }

    return rental;
  }
}

function toRentalView(rental: Rental, car: Car) {
  return {
    id: rental.id,
    carId: car.id,
    carModel: car.model,
    registrationNumber: car.registrationNumber,
    startDate: rental.startDate,
    endDate: rental.endDate,
    totalPrice: rental.totalPrice,
  };
}

/** Today in the server's timezone, as `YYYY-MM-DD`. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Inclusive day count, so a rental from the 3rd to the 5th lasts 3 days. */
function dayCount(start: string, end: string) {
  // Date-only ISO strings parse as UTC midnight, so the difference is an exact multiple of a day.
  return (Date.parse(end) - Date.parse(start)) / MS_PER_DAY + 1;
}
