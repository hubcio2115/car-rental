import { mutationOptions } from "@tanstack/react-query";
import { rentalQueries } from "./queries";
import type { CreateRentalRequest, Rental } from "$lib/api/types";
import { $fetch } from "$lib/api/fetch";
import { springErrorDetail } from "$lib/api/problem";

export const rentalMutations = {
  create: (carId: number) =>
    mutationOptions({
      mutationKey: [...rentalQueries.all(), "create", carId] as const,
      mutationFn: async (body: CreateRentalRequest) => {
        const { data, error } = await $fetch<Rental>(`/car/${carId}/rentals`, {
          method: "POST",
          body,
        });

        if (error !== null) {
          throw new Error(springErrorDetail(error) ?? "Could not rent this car.");
        }

        return data;
      },
    }),
};
