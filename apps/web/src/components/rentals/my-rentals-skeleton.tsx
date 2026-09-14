import { Skeleton } from "$components/ui/skeleton";

const ROWS = 4;

export function MyRentalsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <Skeleton className="h-5 w-20" />

      <div className="flex flex-col border-t border-border">
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="flex items-center gap-6 border-b border-border px-2 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
