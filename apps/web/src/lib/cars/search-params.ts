import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";

import { CAR_STATUSES, CAR_TYPES, type CarQuery } from "~/lib/api/types";

export const PAGE_SIZE = 12;

export const CAR_SORTS = [
  "id,asc",
  "model,asc",
  "model,desc",
  "year,asc",
  "year,desc",
  "type,asc",
  "registrationNumber,asc",
  "seats,asc",
  "seats,desc",
  "doors,asc",
  "doors,desc",
  "pricePerDay,asc",
  "pricePerDay,desc",
  "status,asc",
] as const;

export type CarSort = (typeof CAR_SORTS)[number];

export const DEFAULT_SORT: CarSort = "id,asc";

export const carSearchParams = {
  q: parseAsString.withDefault(""),
  type: parseAsArrayOf(parseAsStringLiteral(CAR_TYPES)).withDefault([]),
  status: parseAsArrayOf(parseAsStringLiteral(CAR_STATUSES)).withDefault([]),
  minPrice: parseAsFloat,
  maxPrice: parseAsFloat,
  seats: parseAsArrayOf(parseAsInteger).withDefault([]),
  doors: parseAsArrayOf(parseAsInteger).withDefault([]),
  minYear: parseAsInteger,
  maxYear: parseAsInteger,
  sort: parseAsStringLiteral(CAR_SORTS).withDefault(DEFAULT_SORT),
  page: parseAsInteger.withDefault(0),
};

export type CarFilters = inferParserType<typeof carSearchParams>;

export type CarFiltersUpdate = Partial<{ [K in keyof CarFilters]: CarFilters[K] | null }>;

export const loadCarSearchParams = createLoader(carSearchParams);

export function activeFilterCount(filters: CarFilters): number {
  return [
    filters.q !== "",
    filters.type.length > 0,
    filters.status.length > 0,
    filters.seats.length > 0,
    filters.doors.length > 0,
    filters.minPrice !== null,
    filters.maxPrice !== null,
    filters.minYear !== null,
    filters.maxYear !== null,
  ].filter(Boolean).length;
}

export function toCarQuery(filters: CarFilters): CarQuery {
  return {
    ...(filters.q === "" ? {} : { q: filters.q }),
    ...(filters.type.length > 0 ? { type: [...filters.type] } : {}),
    ...(filters.status.length > 0 ? { status: [...filters.status] } : {}),
    ...(filters.seats.length > 0 ? { seats: [...filters.seats] } : {}),
    ...(filters.doors.length > 0 ? { doors: [...filters.doors] } : {}),
    ...(filters.minPrice === null ? {} : { minPrice: filters.minPrice }),
    ...(filters.maxPrice === null ? {} : { maxPrice: filters.maxPrice }),
    ...(filters.minYear === null ? {} : { minYear: filters.minYear }),
    ...(filters.maxYear === null ? {} : { maxYear: filters.maxYear }),
    sort: [filters.sort],
    page: filters.page,
    size: PAGE_SIZE,
  };
}
