import { queryOptions } from "@tanstack/react-query";

import { $fetch, type Fetcher } from "~/lib/api/fetch";
import { springErrorDetail } from "~/lib/api/problem";
import type { CarPage } from "~/lib/api/types";
import { toCarQuery, type CarFilters } from "./search-params";

export const carQueries = {
  all: () => ["cars"] as const,

  lists: () => [...carQueries.all(), "list"] as const,

  list: (filters: CarFilters, fetcher: Fetcher = $fetch) =>
    queryOptions({
      queryKey: [...carQueries.lists(), filters] as const,
      queryFn: async () => {
        const { data, error } = await fetcher<CarPage>("/car", { query: toCarQuery(filters) });

        if (error !== null) {
          throw new Error(springErrorDetail(error) ?? "Could not load cars.");
        }

        return data;
      },
    }),
};
