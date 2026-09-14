import type { components, paths } from "./schema";

type Json200<T> = T extends {
  responses: { 200: { content: { "application/json": infer Body } } };
}
  ? Body
  : never;

export type Car = components["schemas"]["Car"];
export type CarType = Car["type"];
export type CarStatus = Car["status"];

export type CarPage = Json200<paths["/car"]["get"]>;

export type CarQuery = NonNullable<paths["/car"]["get"]["parameters"]["query"]>;

export type User = Json200<paths["/auth/me"]["get"]>;

export type Booking = components["schemas"]["Booking"];
export type Rental = components["schemas"]["RentalView"];
export type CreateRentalRequest = components["schemas"]["CreateRentalRequest"];

export const CAR_TYPES = ["SEDAN", "SUV", "VAN"] as const satisfies readonly CarType[];

export const CAR_STATUSES = ["AVAILABLE", "RENTED"] as const satisfies readonly CarStatus[];
