import { cn } from "cn";

import type { CarStatus } from "$lib/api/types";
import { STATUS_LABEL } from "$lib/cars/format";

const DOT_CLASS: Record<CarStatus, string> = {
  AVAILABLE: "bg-available",
  RENTED: "bg-rented",
};

interface CarStatusLabelProps {
  status: CarStatus;
}

export function CarStatusLabel({ status }: CarStatusLabelProps) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <i aria-hidden="true" className={cn("size-1.5 rounded-[1px]", DOT_CLASS[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
