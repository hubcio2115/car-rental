import { mutationOptions } from "@tanstack/react-query";
import { rentalQueries } from "./queries";
import type { CreateRentalRequest, FinishRentalRequest, Rental } from "$lib/api/types";
import { $fetch } from "$lib/api/fetch";
import { springErrorDetail } from "$lib/api/problem";

export const rentalMutations = {
  cancel: () =>
    mutationOptions({
      mutationKey: [...rentalQueries.all(), "cancel"] as const,
      mutationFn: async (rentalId: number) => {
        const { error } = await $fetch(`/rentals/${rentalId}`, { method: "DELETE" });

        if (error !== null) {
          throw new Error(springErrorDetail(error) ?? "Could not cancel this rental.");
        }
      },
    }),

  finish: () =>
    mutationOptions({
      mutationKey: [...rentalQueries.all(), "finish"] as const,
      mutationFn: async ({ rentalId, ...body }: FinishRentalRequest & { rentalId: number }) => {
        const { error } = await $fetch(`/rentals/${rentalId}/finish`, { method: "POST", body });

        if (error !== null) {
          throw new Error(springErrorDetail(error) ?? "Could not finish this rental.");
        }
      },
    }),

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
