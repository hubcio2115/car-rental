"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { TYPE_LABEL, priceFormat } from "$lib/cars/format";
import { carQueries } from "$lib/cars/queries";
import { RentCarPanel } from "$components/rentals/rent-car-panel";
import { CarStatusLabel } from "./car-status";

const LABEL_CLASS = "text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase";

interface CarDetailsProps {
  carId: number;
}

export function CarDetails({ carId }: CarDetailsProps) {
  const { data: car } = useSuspenseQuery(carQueries.detail(carId));

  const specs = [
    { label: "Type", value: TYPE_LABEL[car.type] },
    { label: "Seats", value: `${car.seats} seats` },
    { label: "Doors", value: `${car.doors} doors` },
    { label: "Registration", value: car.registrationNumber },
    { label: "VIN", value: car.vin },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-7 gap-y-3.5 border-b border-border pb-3.5">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-balance">{car.model}</h1>
            <span className="font-mono text-muted-foreground tabular-nums">{car.year}</span>
            <CarStatusLabel status={car.status} />
          </div>

          <ul className="flex flex-wrap gap-x-4.5 gap-y-1 font-mono text-[13px] text-muted-foreground">
            {specs.map((spec) => (
              <li key={spec.label} className="break-all">
                <span className="sr-only">{spec.label}: </span>
                {spec.value}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={LABEL_CLASS}>Price per day</span>
          <span className="font-mono text-[22px] font-medium tabular-nums">
            {priceFormat.format(car.pricePerDay)}{" "}
            <span className="font-sans text-sm font-normal text-muted-foreground">zl</span>
          </span>
        </div>
      </div>

      <RentCarPanel carId={carId} pricePerDay={car.pricePerDay} />
    </div>
  );
}
