"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { parseISO, startOfToday } from "date-fns";
import { useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "$components/ui/button";
import { Calendar } from "$components/ui/calendar";
import { priceFormat } from "$lib/cars/format";
import { carQueries } from "$lib/cars/queries";
import {
  MAX_RENTAL_DAYS,
  formatDays,
  formatRange,
  rentalDays,
  toApiDate,
} from "$lib/rentals/format";
import { rentalQueries } from "$lib/rentals/queries";
import { rentalMutations } from "$lib/rentals/mutations";

interface RentCarPanelProps {
  carId: number;
  pricePerDay: number;
}

export function RentCarPanel({ carId, pricePerDay }: RentCarPanelProps) {
  const qc = useQueryClient();
  const { data: bookings } = useSuspenseQuery(rentalQueries.forCar(carId));
  const [range, setRange] = useState<DateRange | undefined>();
  const [today] = useState(startOfToday);

  const rent = useMutation({
    ...rentalMutations.create(carId),
    onSuccess: () => {
      setRange(undefined);

      return Promise.all([
        qc.invalidateQueries({ queryKey: rentalQueries.all() }),
        qc.invalidateQueries({ queryKey: carQueries.all() }),
      ]);
    },
  });

  const ranges = bookings.map((booking) => ({
    from: parseISO(booking.startDate),
    to: parseISO(booking.endDate),
    mine: booking.mine,
  }));
  const booked = ranges.filter((booking) => !booking.mine);
  const mine = ranges.filter((booking) => booking.mine);

  const start = range?.from;
  const end = range?.to ?? range?.from;
  const days = start !== undefined && end !== undefined ? rentalDays(start, end) : 0;

  function select(next?: DateRange) {
    setRange(next);
    if (!rent.isIdle) rent.reset();
  }

  function submit() {
    if (start === undefined || end === undefined) return;
    rent.mutate({ startDate: toApiDate(start), endDate: toApiDate(end) });
  }

  const message = rent.isError
    ? rent.error.message
    : rent.isSuccess
      ? `Rented ${formatRange(parseISO(rent.data.startDate), parseISO(rent.data.endDate))}`
      : "";

  return (
    <section aria-label="Rent this car" className="flex flex-col gap-5">
      <Calendar
        mode="range"
        selected={range}
        onSelect={select}
        disabled={[{ before: today }, ...ranges]}
        excludeDisabled
        max={MAX_RENTAL_DAYS - 1}
        modifiers={{ booked, mine }}
        modifiersClassNames={{
          booked: "hatch-booked opacity-100!",
          mine: "hatch-mine text-rented opacity-100!",
        }}
        numberOfMonths={3}
        weekStartsOn={1}
        startMonth={today}
        defaultMonth={today}
        showOutsideDays={false}
        className="p-0 [--cell-size:--spacing(9)]"
        classNames={{
          months: "relative flex flex-wrap gap-x-8 gap-y-4",
          month: "flex flex-col gap-4",
          today:
            "[&_button]:underline [&_button]:decoration-foreground/50 [&_button]:underline-offset-4",
        }}
      />

      <div className="flex flex-wrap items-center gap-x-7 gap-y-2.5 border-y border-border py-3">
        <span className={cn(days === 0 && "text-muted-foreground")}>
          {start !== undefined && end !== undefined
            ? formatRange(start, end)
            : "Pick dates on the calendar"}
        </span>

        {days > 0 ? (
          <span className="font-mono text-muted-foreground tabular-nums">
            {formatDays(days)} × {priceFormat.format(pricePerDay)} zl
          </span>
        ) : null}

        <span className="ml-auto font-mono text-lg font-medium tabular-nums">
          {priceFormat.format(days * pricePerDay)}{" "}
          <span className="font-sans text-sm font-normal text-muted-foreground">zl</span>
        </span>

        <Button
          type="button"
          onClick={submit}
          disabled={days === 0 || rent.isPending}
          className="cursor-pointer"
        >
          {rent.isPending ? "Renting" : days === 0 ? "Rent" : `Rent for ${formatDays(days)}`}
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-x-10 gap-y-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <ul
            aria-label="Legend"
            className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
          >
            <LegendItem swatch="hatch-booked">Booked</LegendItem>
            <LegendItem swatch="hatch-mine">Yours</LegendItem>
            <LegendItem swatch="rounded-[2px] bg-primary">Selected</LegendItem>
          </ul>

          <p
            role="status"
            className={cn(
              "min-h-5 text-[13px]",
              rent.isError ? "text-destructive" : "text-available",
            )}
          >
            {message}
          </p>
        </div>

        <section aria-labelledby="your-rentals" className="flex flex-col gap-3">
          <h2 id="your-rentals" className="text-sm font-semibold">
            Your rentals
          </h2>

          <ul className="flex flex-col border-t border-border font-mono text-[13px] tabular-nums">
            {mine.length === 0 ? (
              <li className="border-b border-border px-0.5 py-2 font-sans text-muted-foreground">
                No rentals of this car yet
              </li>
            ) : (
              mine.map((booking) => (
                <li
                  key={booking.from.getTime()}
                  className="flex items-baseline justify-between gap-4 border-b border-border px-0.5 py-2"
                >
                  <span>{formatRange(booking.from, booking.to)}</span>
                  <span className="text-muted-foreground">
                    {formatDays(rentalDays(booking.from, booking.to))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}

function LegendItem({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <i aria-hidden="true" className={cn("size-3", swatch)} />
      {children}
    </li>
  );
}
