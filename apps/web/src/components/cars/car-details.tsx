"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { TYPE_LABEL, priceFormat } from "$lib/cars/format";
import { carQueries } from "$lib/cars/queries";
import { CarStatusLabel } from "./car-status";

const LABEL_CLASS = "text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase";

interface CarDetailsProps {
  carId: number;
}

export function CarDetails({ carId }: CarDetailsProps) {
  const { data: car } = useSuspenseQuery(carQueries.detail(carId));

  const specs = [
    { label: "Type", value: TYPE_LABEL[car.type], mono: false },
    { label: "Seats", value: car.seats, mono: true },
    { label: "Doors", value: car.doors, mono: true },
    { label: "Registration", value: car.registrationNumber, mono: true },
    { label: "VIN", value: car.vin, mono: true },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-xl font-semibold tracking-tight text-balance">{car.model}</h1>
        <span className="font-mono text-muted-foreground tabular-nums">{car.year}</span>
        <CarStatusLabel status={car.status} />

        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-3.5">
          <span className={LABEL_CLASS}>Price per day</span>
          <span className="font-mono text-[22px] font-medium tabular-nums">
            {priceFormat.format(car.pricePerDay)}{" "}
            <span className="text-sm font-normal text-muted-foreground">zl</span>
          </span>
        </div>
      </div>

      <dl className="flex flex-col border-t border-border text-sm">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-4 border-b border-border px-2 py-2.5 sm:grid-cols-[160px_minmax(0,1fr)]"
          >
            <dt className={LABEL_CLASS}>{spec.label}</dt>
            <dd
              className={
                spec.mono ? "font-mono tracking-[0.02em] break-all tabular-nums" : undefined
              }
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
