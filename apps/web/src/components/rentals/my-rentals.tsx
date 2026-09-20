"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { isBefore, parseISO, startOfToday, subDays } from "date-fns";
import Link from "next/link";
import { useState } from "react";

import { Button } from "$components/ui/button";
import { Calendar } from "$components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$components/ui/collapsible";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "$components/ui/table";
import type { Rental } from "$lib/api/types";
import { priceFormat } from "$lib/cars/format";
import {
  formatDay,
  formatRange,
  rentalDays,
  rentalState,
  shortenedPrice,
  toApiDate,
  type RentalState,
} from "$lib/rentals/format";
import { rentalMutations } from "$lib/rentals/mutations";
import { rentalQueries } from "$lib/rentals/queries";

const HEAD_CLASS =
  "text-[11px] font-medium tracking-[0.08em] whitespace-nowrap text-muted-foreground uppercase";

const LINK_CLASS =
  "rounded-sm font-medium underline decoration-foreground/30 underline-offset-3 transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

const WAS_CLASS = "ml-2 text-muted-foreground";

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

interface Notice {
  tone: "success" | "error";
  text: string;
}

export function MyRentals() {
  const qc = useQueryClient();
  const { data: rentals } = useSuspenseQuery(rentalQueries.mine());
  const [notice, setNotice] = useState<Notice>();
  const today = startOfToday();

  function refresh() {
    return qc.invalidateQueries({ queryKey: rentalQueries.all() });
  }

  const cancel = useMutation({ ...rentalMutations.cancel(), onSuccess: refresh });
  const finish = useMutation({ ...rentalMutations.finish(), onSuccess: refresh });

  function fail(error: Error) {
    setNotice({ tone: "error", text: error.message });
  }

  function cancelRental(rental: Rental) {
    setNotice(undefined);
    cancel.mutate(rental.id, {
      onSuccess: () => {
        setNotice({
          tone: "success",
          text: `Cancelled ${rental.carModel}, ${formatRange(parseISO(rental.startDate), parseISO(rental.endDate))}`,
        });
      },
      onError: fail,
    });
  }

  function finishRental(rental: Rental, endDate: Date) {
    setNotice(undefined);
    finish.mutate(
      { rentalId: rental.id, endDate: toApiDate(endDate) },
      {
        onSuccess: () => {
          setNotice({ tone: "success", text: `${rental.carModel} now ends ${formatDay(endDate)}` });
        },
        onError: fail,
      },
    );
  }

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
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-mono text-[13px] text-muted-foreground tabular-nums">
          {rentals.length} {rentals.length === 1 ? "rental" : "rentals"}
        </p>

        <p
          role="status"
          className={cn(
            "text-[13px]",
            notice?.tone === "error" ? "text-destructive" : "text-available",
          )}
        >
          {notice?.text}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={HEAD_CLASS}>Car</TableHead>

            <TableHead className={HEAD_CLASS}>Registration</TableHead>

            <TableHead className={HEAD_CLASS}>Dates</TableHead>

            <TableHead className={cn(HEAD_CLASS, "text-right")}>Days</TableHead>

            <TableHead className={cn(HEAD_CLASS, "text-right")}>Total</TableHead>

            <TableHead className={HEAD_CLASS}>State</TableHead>

            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        {rentals.map((rental) => (
          <RentalRow
            key={`${rental.id}:${rental.endDate}`}
            rental={rental}
            today={today}
            busy={
              (cancel.isPending && cancel.variables === rental.id) ||
              (finish.isPending && finish.variables.rentalId === rental.id)
            }
            onCancel={() => cancelRental(rental)}
            onFinish={(endDate) => finishRental(rental, endDate)}
          />
        ))}
      </Table>
    </div>
  );
}

interface RentalRowProps {
  rental: Rental;
  today: Date;
  /** A cancel or finish request for this rental is in flight. */
  busy: boolean;
  onCancel: () => void;
  onFinish: (endDate: Date) => void;
}

function RentalRow({ rental, today, busy, onCancel, onFinish }: RentalRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [endDate, setEndDate] = useState<Date>();

  const start = parseISO(rental.startDate);
  const end = parseISO(rental.endDate);
  const state = rentalState(start, end, today);

  const lastEnd = subDays(end, 1);
  const canFinish = state === "active" && !isBefore(lastEnd, today);

  function closePicker() {
    setPicking(false);
    setEndDate(undefined);
  }

  function submit() {
    if (endDate !== undefined) onFinish(endDate);
  }

  return (
    <Collapsible
      open={picking}
      onOpenChange={(open) => (open ? setPicking(true) : closePicker())}
      disabled={busy}
      render={<tbody className="group last:[&>tr:last-child]:border-0" />}
    >
      <TableRow
        className={cn(
          "group-data-open:border-b-transparent",
          state === "past" && "text-muted-foreground",
        )}
      >
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
          {priceFormat.format(rental.totalPrice)} <span className="text-muted-foreground">zl</span>
        </TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <i aria-hidden="true" className={cn("size-1.5 rounded-[1px]", STATE_DOT[state])} />
            {STATE_LABEL[state]}
          </span>
        </TableCell>

        <TableCell className="w-px text-right">
          {state === "upcoming" ? (
            confirming ? (
              <span className="inline-flex gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  Keep
                </Button>

                <Button variant="destructive" size="xs" disabled={busy} onClick={onCancel}>
                  {busy ? "Cancelling" : "Confirm cancel"}
                </Button>
              </span>
            ) : (
              <Button variant="ghost" size="xs" onClick={() => setConfirming(true)}>
                Cancel
              </Button>
            )
          ) : (
            canFinish && (
              <span className="inline-flex gap-1.5">
                <Button variant="outline" size="xs" disabled={busy} onClick={() => onFinish(today)}>
                  {busy && !picking ? "Finishing" : "Finish today"}
                </Button>

                <CollapsibleTrigger render={<Button variant="outline" size="xs" />}>
                  Pick date
                </CollapsibleTrigger>
              </span>
            )
          )}
        </TableCell>
      </TableRow>

      <CollapsibleContent render={<TableRow className="hover:bg-transparent" />}>
        <TableCell colSpan={7} className="pt-1 pb-5 whitespace-normal">
          <div className="flex flex-wrap items-start gap-x-12 gap-y-5">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              disabled={[{ before: today }, { after: lastEnd }]}
              modifiers={{ kept: { from: start, to: endDate ?? end } }}
              modifiersClassNames={{ kept: "hatch-mine opacity-100!" }}
              weekStartsOn={1}
              defaultMonth={today}
              startMonth={today}
              endMonth={lastEnd}
              showOutsideDays={false}
              className="p-0 [--cell-size:--spacing(9)]"
              classNames={{
                today:
                  "[&_button]:underline [&_button]:decoration-foreground/50 [&_button]:underline-offset-4",
              }}
            />

            <div className="flex flex-col gap-5 md:pt-9">
              {endDate === undefined ? (
                <p className="text-[13px] text-muted-foreground">Pick a new end date</p>
              ) : (
                <dl className="grid w-max grid-cols-[auto_auto] items-baseline gap-x-5 gap-y-2 text-[13px]">
                  <dt className={HEAD_CLASS}>Ends</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDay(endDate)}
                    <s className={WAS_CLASS}>{formatDay(end)}</s>
                  </dd>

                  <dt className={HEAD_CLASS}>Days</dt>
                  <dd className="font-mono tabular-nums">
                    {rentalDays(start, endDate)}
                    <s className={WAS_CLASS}>{rentalDays(start, end)}</s>
                  </dd>

                  <dt className={HEAD_CLASS}>Total</dt>
                  <dd className="font-mono tabular-nums">
                    {priceFormat.format(shortenedPrice(rental.totalPrice, start, end, endDate))}{" "}
                    <span className="text-muted-foreground">zl</span>
                    <s className={WAS_CLASS}>{priceFormat.format(rental.totalPrice)}</s>
                  </dd>
                </dl>
              )}

              <div className="flex gap-2">
                <Button size="sm" disabled={endDate === undefined || busy} onClick={submit}>
                  {busy
                    ? "Finishing"
                    : endDate === undefined
                      ? "Finish"
                      : `Finish on ${formatDay(endDate)}`}
                </Button>

                <Button variant="ghost" size="sm" onClick={closePicker}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </TableCell>
      </CollapsibleContent>
    </Collapsible>
  );
}
