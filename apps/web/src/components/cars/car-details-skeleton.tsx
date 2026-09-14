import { Skeleton } from "$components/ui/skeleton";

const CALENDAR_MONTHS = 3;

export function CarDetailsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-7 gap-y-3.5 border-b border-border pb-3.5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {Array.from({ length: CALENDAR_MONTHS }, (_, month) => (
          <Skeleton key={month} className="h-72 w-63 max-w-full" />
        ))}
      </div>

      <Skeleton className="h-14 w-full" />
    </div>
  );
}
