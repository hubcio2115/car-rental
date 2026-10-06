import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { z } from "zod";
import { RentalService } from "./rental.service.js";
import { AuthGuard, Session, type UserSession } from "@thallesp/nestjs-better-auth";
import {
  type CreateRentalRequest,
  createRentalRequestSchema,
} from "./create-rental-request.dto.js";
import { Rental } from "../db/schema.js";
import { idParam } from "../lib/id-param.dto.js";
import { type FinishRentalRequest, finishRentalRequest } from "./finish-rental.dto.js";
import {
  type Booking,
  bookingSchema,
  type RentalView,
  rentalViewSchema,
} from "./rental-response.dto.js";

// Return types are pinned to the documented schemas, so the spec can't drift from the code.

@Controller()
@ApiTags("Rentals")
@UseGuards(AuthGuard)
export class RentalController {
  constructor(@Inject() private readonly rentalService: RentalService) {}

  @Post("car/:carId/rentals")
  @ApiOperation({ summary: "Rent a car for a range of whole days" })
  @ApiCreatedResponse({ standardSchema: rentalViewSchema })
  rent(
    @Param("carId", { schema: idParam }) carId: number,
    @Body({ schema: createRentalRequestSchema }) request: CreateRentalRequest,
    @Session() session: UserSession,
  ): Promise<RentalView> {
    return this.rentalService.create(carId, request, session);
  }

  @Get("car/:carId/rentals")
  @ApiOperation({ summary: "List a car's current and upcoming bookings" })
  @ApiOkResponse({ standardSchema: z.array(bookingSchema) })
  bookings(
    @Param("carId", { schema: idParam }) carId: number,
    @Session() session: UserSession,
  ): Promise<Booking[]> {
    return this.rentalService.bookingsForCar(carId, session);
  }

  @Get("rentals")
  @ApiOperation({ summary: "List the signed-in user's rentals, newest first" })
  @ApiOkResponse({ standardSchema: z.array(rentalViewSchema) })
  mine(@Session() session: UserSession): Promise<RentalView[]> {
    return this.rentalService.mine(session);
  }

  @Delete("rentals/:rentalId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancel one of the signed-in user's upcoming rentals" })
  @ApiNoContentResponse()
  cancel(
    @Param("rentalId", { schema: idParam }) rentalId: Rental["id"],
    @Session() session: UserSession,
  ) {
    return this.rentalService.cancel(rentalId, session);
  }

  @Post("rentals/:rentalId/finish")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Finish one of the signed-in user's active rentals early" })
  @ApiNoContentResponse()
  finish(
    @Param("rentalId", { schema: idParam }) rentalId: number,
    @Body({ schema: finishRentalRequest }) req: FinishRentalRequest,
    @Session() session: UserSession,
  ) {
    return this.rentalService.finish(rentalId, req, session);
  }
}
