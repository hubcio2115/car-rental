import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cacheLife } from "next/cache";
import { Suspense } from "react";

import { $serverFetch } from "$lib/api/server-fetch";
import { carQueries } from "$lib/cars/queries";
import { STALE_TIME_SECONDS, getQueryClient } from "$lib/get-query-client";
import { loadCarSearchParams, type CarFilters } from "$lib/cars/search-params";
import { CarsView } from "$components/cars/cars-view";
import { CarsTableSkeleton } from "$components/cars/cars-table-skeleton";

export default function CarsPage({ searchParams }: PageProps<"/cars">) {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-4 px-5 pt-7 pb-14">
      <h1 className="text-lg font-semibold tracking-tight">Cars</h1>

      <Suspense fallback={<CarsTableSkeleton />}>
        {loadCarSearchParams(searchParams).then((filters) => (
          <CarsData filters={filters} />
        ))}
      </Suspense>
    </main>
  );
}

interface CarsDataProps {
  filters: CarFilters;
}

async function CarsData({ filters }: CarsDataProps) {
  "use cache: private";
  cacheLife({ stale: STALE_TIME_SECONDS });

  const qc = getQueryClient();
  await qc.query(carQueries.list(filters, $serverFetch)).catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CarsView />
    </HydrationBoundary>
  );
}
