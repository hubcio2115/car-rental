"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { parseISO, startOfToday } from "date-fns";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$components/ui/table";
import { priceFormat } from "$lib/cars/format";
import { formatRange, rentalDays, rentalState, type RentalState } from "$lib/rentals/format";
import { rentalQueries } from "$lib/rentals/queries";

const HEAD_CLASS =
  "text-[11px] font-medium tracking-[0.08em] whitespace-nowrap text-muted-foreground uppercase";

const LINK_CLASS =
  "rounded-sm font-medium underline decoration-foreground/30 underline-offset-3 transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

const STATE_LABEL: Record<RentalState, string> = {
  active: "Active",
  upcoming: "Upcoming",
  past: "Past",
};

const STATE_DOT: Record<RentalState, string> = {
  active: "bg-rented",
  upcoming: "bg-foreground",
  past: "bg-muted-foreground/40",
};

export function MyRentals() {
  const { data: rentals } = useSuspenseQuery(rentalQueries.mine());
  const today = startOfToday();

  if (rentals.length === 0) {
    return (
      <p className="text-muted-foreground">
        No rentals yet.{" "}
        <Link href="/cars" className={cn(LINK_CLASS, "text-foreground")}>
          Browse cars
        </Link>{" "}
        to rent one.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="font-mono text-[13px] text-muted-foreground tabular-nums">
        {rentals.length} {rentals.length === 1 ? "rental" : "rentals"}
      </p>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={HEAD_CLASS}>Car</TableHead>
            <TableHead className={HEAD_CLASS}>Registration</TableHead>
            <TableHead className={HEAD_CLASS}>Dates</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>Days</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>Total</TableHead>
            <TableHead className={HEAD_CLASS}>State</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rentals.map((rental) => {
            const start = parseISO(rental.startDate);
            const end = parseISO(rental.endDate);
            const state = rentalState(start, end, today);

            return (
              <TableRow key={rental.id} className={cn(state === "past" && "text-muted-foreground")}>
                <TableCell>
                  <Link href={`/cars/${rental.carId}`} className={LINK_CLASS}>
                    {rental.carModel}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {rental.registrationNumber}
                </TableCell>
                <TableCell className="font-mono tabular-nums">{formatRange(start, end)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {rentalDays(start, end)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {priceFormat.format(rental.totalPrice)}{" "}
                  <span className="text-muted-foreground">zl</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <i
                      aria-hidden="true"
                      className={cn("size-1.5 rounded-[1px]", STATE_DOT[state])}
                    />
                    {STATE_LABEL[state]}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
