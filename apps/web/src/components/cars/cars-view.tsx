"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { Suspense, useDeferredValue, useEffect, useState } from "react";

import { carQueries } from "~/lib/cars/queries";
import { carSearchParams, type CarFiltersUpdate } from "~/lib/cars/search-params";
import { useQueryStates } from "nuqs";
import { CarFiltersCard } from "./car-filters";
import { CarSearch } from "$components/cars/car-search";
import { CarsTable } from "$components/cars/cars-table";
import { CarsTableBoundary } from "$components/cars/cars-table-error";
import { CarsTableSkeleton } from "$components/cars/cars-table-skeleton";

const SEARCH_DEBOUNCE_MS = 300;

export function CarsView() {
  const [filters, setFilters] = useQueryStates(carSearchParams, { clearOnDefault: true });

  const deferredFilters = useDeferredValue(filters);

  const queryClient = useQueryClient();
  const isPending =
    filters !== deferredFilters &&
    queryClient.getQueryData(carQueries.list(filters).queryKey) === undefined;

  function changeFilters(next: CarFiltersUpdate) {
    const resetsPage = !("page" in next) && !("sort" in next);
    void setFilters(resetsPage ? { ...next, page: 0 } : next);
  }

  const [searchDraft, setSearchDraft] = useState(filters.q);
  const debouncedSearch = useDebounce(searchDraft, SEARCH_DEBOUNCE_MS);

  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    setSearchDraft(filters.q);
  }

  useEffect(() => {
    if (debouncedSearch !== searchDraft || debouncedSearch === filters.q) return;

    void setFilters({ q: debouncedSearch === "" ? null : debouncedSearch, page: 0 });
  }, [debouncedSearch, searchDraft, filters.q, setFilters]);

  function clearFilters() {
    void setFilters({
      q: null,
      type: null,
      status: null,
      minPrice: null,
      maxPrice: null,
      seats: null,
      doors: null,
      minYear: null,
      maxYear: null,
      page: null,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <CarSearch value={searchDraft} onChange={setSearchDraft} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
        <CarFiltersCard filters={filters} onChange={changeFilters} onClear={clearFilters} />

        <CarsTableBoundary>
          <Suspense fallback={<CarsTableSkeleton />}>
            <CarsTable filters={deferredFilters} onChange={changeFilters} isPending={isPending} />
          </Suspense>
        </CarsTableBoundary>
      </div>
    </div>
  );
}
