import { Skeleton } from "$components/ui/skeleton";

const SPEC_ROWS = 5;

export function CarDetailsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[236px_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-24" />

        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-3.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <div className="flex flex-col border-t border-border">
        {Array.from({ length: SPEC_ROWS }, (_, row) => (
          <div key={row} className="flex items-center gap-4 border-b border-border px-2 py-3">
            <Skeleton className="h-4 w-24 sm:w-36" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
