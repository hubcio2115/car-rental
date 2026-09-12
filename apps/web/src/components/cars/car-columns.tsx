"use client";

import {
  createColumnHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { cn } from "cn";

import type { Car } from "~/lib/api/types";

export const carTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
});

const helper = createColumnHelper<typeof carTableFeatures, Car>();

const TYPE_LABEL: Record<Car["type"], string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
};

const priceFormat = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const NUMERIC_COLUMNS: ReadonlySet<string> = new Set([
  "year",
  "seats",
  "doors",
  "pricePerDay",
]);

export const carColumns = helper.columns([
  helper.accessor("model", {
    header: "Model",
    cell: (ctx) => <span className="font-medium">{ctx.getValue()}</span>,
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
    cell: (ctx) => {
      const rented = ctx.getValue() === "RENTED";

      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <i
            aria-hidden="true"
            className={cn("size-1.5 rounded-[1px]", rented ? "bg-rented" : "bg-available")}
          />
          {rented ? "Rented" : "Available"}
        </span>
      );
    },
  }),
]);
