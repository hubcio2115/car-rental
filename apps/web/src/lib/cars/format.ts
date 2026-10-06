import type { CarStatus, CarType } from "$lib/api/types";

export const TYPE_LABEL: Record<CarType, string> = {
  sedan: "Sedan",
  suv: "SUV",
  van: "Van",
};

export const STATUS_LABEL: Record<CarStatus, string> = {
  available: "Available Today",
  rented: "Rented Today",
};

export const priceFormat = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
