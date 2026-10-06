// Derived from schema.d.ts, which `pnpm gen:api` generates from apps/api's OpenAPI document.
import type { components, paths } from "./schema";

type JsonResponse<T, Status extends number> = T extends {
  responses: { [S in Status]: { content: { "application/json": infer Body } } };
}
  ? Body
  : never;

type JsonBody<T> = T extends { requestBody: { content: { "application/json": infer Body } } }
  ? Body
  : never;

export type Car = components["schemas"]["Car"];
export type CarType = Car["type"];
export type CarStatus = Car["status"];

export type CarPage = JsonResponse<paths["/car"]["get"], 200>;

export type CarQuery = NonNullable<paths["/car"]["get"]["parameters"]["query"]>;

export type User = JsonResponse<paths["/users/me"]["get"], 200>["user"];

export type Booking = components["schemas"]["Booking"];
export type Rental = components["schemas"]["RentalView"];
export type CreateRentalRequest = JsonBody<paths["/car/{carId}/rentals"]["post"]>;
export type FinishRentalRequest = JsonBody<paths["/rentals/{rentalId}/finish"]["post"]>;

// Listed in display order. `satisfies` fails on a value the API dropped, `Exhaustive` on one it added.
export const CAR_TYPES = ["sedan", "suv", "van"] as const satisfies readonly CarType[];
export const CAR_STATUSES = ["available", "rented"] as const satisfies readonly CarStatus[];

type Exhaustive<Listed, All> = [All] extends [Listed] ? true : never;
true satisfies Exhaustive<(typeof CAR_TYPES)[number], CarType>;
true satisfies Exhaustive<(typeof CAR_STATUSES)[number], CarStatus>;
