"use client";

import {
  createColumnHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import Link from "next/link";

import type { Car } from "$lib/api/types";
import { TYPE_LABEL, priceFormat } from "$lib/cars/format";
import { CarStatusLabel } from "./car-status";

export const carTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
});

const helper = createColumnHelper<typeof carTableFeatures, Car>();

export const NUMERIC_COLUMNS: ReadonlySet<string> = new Set([
  "year",
  "seats",
  "doors",
  "pricePerDay",
]);

export const carColumns = helper.columns([
  helper.accessor("model", {
    header: "Model",
    cell: (ctx) => {
      const { id } = ctx.row.original;
      if (id === undefined) return <span className="font-medium">{ctx.getValue()}</span>;

      return (
        <Link
          href={`/cars/${id}`}
          className="rounded-sm font-medium underline decoration-foreground/30 underline-offset-3 transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {ctx.getValue()}
        </Link>
      );
    },
  }),

  helper.accessor("year", {
    header: "Year",
  }),

  helper.accessor("type", {
    header: "Type",
    cell: (ctx) => <span className="text-muted-foreground">{TYPE_LABEL[ctx.getValue()]}</span>,
  }),

  helper.accessor("seats", {
    header: "Seats",
  }),

  helper.accessor("doors", {
    header: "Doors",
  }),

  helper.accessor("registrationNumber", {
    header: "Registration",
    cell: (ctx) => <span className="font-mono text-muted-foreground">{ctx.getValue()}</span>,
  }),

  helper.accessor("pricePerDay", {
    header: "Price per day",
    cell: (ctx) => (
      <>
        {priceFormat.format(ctx.getValue())} <span className="text-muted-foreground">zl</span>
      </>
    ),
  }),

  helper.accessor("status", {
    header: "Status",
    cell: (ctx) => <CarStatusLabel status={ctx.getValue()} />,
  }),
]);
