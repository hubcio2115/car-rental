import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { connection } from "next/server";
import { Suspense } from "react";

import { $serverFetch } from "~/lib/api/server-fetch";
import { carQueries } from "~/lib/cars/queries";
import { getQueryClient } from "$lib/get-query-client";
import { loadCarSearchParams } from "~/lib/cars/search-params";
import { CarsView } from "$components/cars/cars-view";
import { CarsTableSkeleton } from "$components/cars/cars-table-skeleton";

export default function CarsPage(props: PageProps<"/cars">) {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-4 px-5 pt-7 pb-14">
      <h1 className="text-lg font-semibold tracking-tight">Cars</h1>

      <Suspense fallback={<CarsTableSkeleton />}>
        <CarsResults searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function CarsResults({ searchParams }: Pick<PageProps<"/cars">, "searchParams">) {
  await connection();

  const filters = await loadCarSearchParams(searchParams);
  const qc = getQueryClient();

  void qc.query(carQueries.list(filters, $serverFetch)).catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CarsView />
    </HydrationBoundary>
  );
}
