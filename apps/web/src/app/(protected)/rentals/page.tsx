import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cacheLife } from "next/cache";
import { Suspense } from "react";

import { $serverFetch } from "$lib/api/server-fetch";
import { STALE_TIME_SECONDS, getQueryClient } from "$lib/get-query-client";
import { rentalQueries } from "$lib/rentals/queries";
import { MyRentals } from "$components/rentals/my-rentals";
import { MyRentalsSkeleton } from "$components/rentals/my-rentals-skeleton";

export default function RentalsPage() {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-4 px-5 pt-7 pb-14">
      <h1 className="text-lg font-semibold tracking-tight">My rentals</h1>

      <Suspense fallback={<MyRentalsSkeleton />}>
        <RentalsData />
      </Suspense>
    </main>
  );
}

async function RentalsData() {
  "use cache: private";
  cacheLife({ stale: STALE_TIME_SECONDS });

  const qc = getQueryClient();
  await qc.query(rentalQueries.mine($serverFetch));

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <MyRentals />
    </HydrationBoundary>
  );
}
