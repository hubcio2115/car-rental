import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import * as z from "zod";

import { $serverFetch } from "$lib/api/server-fetch";
import { carQueries } from "$lib/cars/queries";
import { STALE_TIME_SECONDS, getQueryClient } from "$lib/get-query-client";
import { CarDetails } from "$components/cars/car-details";
import { CarDetailsSkeleton } from "$components/cars/car-details-skeleton";
import { CarsBackLink } from "$components/cars/cars-back-link";
import { notFound } from "next/navigation";

const carIdSchema = z.coerce.number().int().positive();

export default function CarPage({ params }: PageProps<"/cars/[carId]">) {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-5 px-5 pt-7 pb-14">
      <CarsBackLink />

      <Suspense fallback={<CarDetailsSkeleton />}>
        {params.then(({ carId }) => (
          <CarData carId={carId} />
        ))}
      </Suspense>
    </main>
  );
}

interface CarDataProps {
  carId: string;
}

async function CarData({ carId: rawCarId }: CarDataProps) {
  "use cache: private";
  cacheLife({ stale: STALE_TIME_SECONDS });

  const carId = carIdSchema.safeParse(rawCarId);
  if (!carId.success) return notFound();

  const qc = getQueryClient();
  await qc.query(carQueries.detail(carId.data, $serverFetch));

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CarDetails carId={carId.data} />
    </HydrationBoundary>
  );
}
