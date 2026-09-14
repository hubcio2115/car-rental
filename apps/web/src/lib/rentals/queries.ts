import { queryOptions } from "@tanstack/react-query";

import { $fetch, type Fetcher } from "$lib/api/fetch";
import { springErrorDetail } from "$lib/api/problem";
import type { Booking, Rental } from "$lib/api/types";

export const rentalQueries = {
  all: () => ["rentals"] as const,

  forCar: (carId: number, fetcher: Fetcher = $fetch) =>
    queryOptions({
      queryKey: [...rentalQueries.all(), "car", carId] as const,
      queryFn: async () => {
        const { data, error } = await fetcher<Booking[]>(`/car/${carId}/rentals`);

        if (error !== null) {
          throw new Error(springErrorDetail(error) ?? "Could not load this car's bookings.");
        }

        return data;
      },
    }),

  mine: (fetcher: Fetcher = $fetch) =>
    queryOptions({
      queryKey: [...rentalQueries.all(), "mine"] as const,
      queryFn: async () => {
        const { data, error } = await fetcher<Rental[]>("/rentals");

        if (error !== null) {
          throw new Error(springErrorDetail(error) ?? "Could not load your rentals.");
        }

        return data;
      },
    }),
};
