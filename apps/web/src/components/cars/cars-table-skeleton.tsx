import { Skeleton } from "$components/ui/skeleton";
import { PAGE_SIZE } from "~/lib/cars/search-params";

export function CarsTableSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-4 w-28" />

      <div className="flex flex-col">
        <Skeleton className="h-8 w-full" />

        {Array.from({ length: PAGE_SIZE }, (_, row) => (
          <div key={row} className="flex items-center gap-4 border-b border-border/60 px-2 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
