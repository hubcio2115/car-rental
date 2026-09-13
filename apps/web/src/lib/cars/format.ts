import type { CarStatus, CarType } from "$lib/api/types";

export const TYPE_LABEL: Record<CarType, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
};

export const STATUS_LABEL: Record<CarStatus, string> = {
  AVAILABLE: "Available",
  RENTED: "Rented",
};

/** Prices arrive as plain zloty amounts; render them with the "zl" unit next to the number. */
export const priceFormat = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
