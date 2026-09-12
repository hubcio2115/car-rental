"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTable, type SortingState } from "@tanstack/react-table";
import { cn } from "cn";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$components/ui/table";
import { carQueries } from "~/lib/cars/queries";
import {
  PAGE_SIZE,
  type CarFilters,
  type CarFiltersUpdate,
  type CarSort,
} from "~/lib/cars/search-params";
import { CarPagination } from "./car-pagination";
import { NUMERIC_COLUMNS, carColumns, carTableFeatures } from "./car-columns";

interface CarsTableProps {
  filters: CarFilters;
  onChange: (next: CarFiltersUpdate) => void;
  /** True while a filter or page change is still resolving, see the note in cars-view.tsx. */
  isPending: boolean;
}

export function CarsTable({ filters, onChange, isPending }: CarsTableProps) {
  const { data } = useSuspenseQuery(carQueries.list(filters));

  const rows = data.content ?? [];
  const totalElements = data.page?.totalElements ?? 0;
  const totalPages = data.page?.totalPages ?? 0;

  const table = useTable({
    features: carTableFeatures,
    columns: carColumns,
    data: rows,

    manualSorting: true,
    manualPagination: true,
    rowCount: totalElements,

    sortDescFirst: false,

    getRowId: (car) => String(car.id),

    state: {
      sorting: toSortingState(filters.sort),
      pagination: { pageIndex: filters.page, pageSize: PAGE_SIZE },
    },

    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(toSortingState(filters.sort)) : updater;

      onChange({ sort: fromSortingState(next), page: 0 });
    },

    onPaginationChange: (updater) => {
      const current = { pageIndex: filters.page, pageSize: PAGE_SIZE };
      const next = typeof updater === "function" ? updater(current) : updater;

      onChange({ page: next.pageIndex });
    },
  });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[13px] text-muted-foreground tabular-nums">
          {describeRange(filters.page, rows.length, totalElements)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table className={cn("transition-opacity", isPending && "opacity-50")}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const numeric = NUMERIC_COLUMNS.has(header.column.id);
                  const sorted = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={ariaSort(sorted)}
                      className={cn(
                        "text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase",
                        numeric && "text-right",
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "group/sort inline-flex items-center gap-1 rounded-sm uppercase transition-colors hover:text-foreground",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            numeric && "flex-row-reverse",
                            sorted === false && "text-muted-foreground",
                          )}
                        >
                          <table.FlexRender header={header} />
                          <SortIcon direction={sorted} />
                        </button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={carColumns.length} className="py-10 text-center">
                  <span className="text-muted-foreground">
                    No cars match these filters. Try widening the price or year range.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "whitespace-nowrap",
                        NUMERIC_COLUMNS.has(cell.column.id) && "text-right font-mono tabular-nums",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <CarPagination
          filters={filters}
          totalPages={totalPages}
          onPageChange={(pageIndex) => onChange({ page: pageIndex })}
        />
      ) : null}
    </div>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === false) {
    return (
      <ArrowUpIcon
        aria-hidden="true"
        className="size-3 opacity-0 group-hover/sort:opacity-40 group-focus-visible/sort:opacity-40"
      />
    );
  }

  return direction === "asc" ? (
    <ArrowUpIcon aria-hidden="true" className="size-3" />
  ) : (
    <ArrowDownIcon aria-hidden="true" className="size-3" />
  );
}

function ariaSort(direction: false | "asc" | "desc"): "ascending" | "descending" | "none" {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return "none";
}

function describeRange(pageIndex: number, pageRows: number, total: number): string {
  if (total === 0) return "No cars";

  const first = pageIndex * PAGE_SIZE + 1;
  return `${first} to ${first + pageRows - 1} of ${total}`;
}

function toSortingState(sort: CarSort): SortingState {
  const [id, direction] = sort.split(",");
  return id === undefined ? [] : [{ id, desc: direction === "desc" }];
}

function fromSortingState(sorting: SortingState): CarSort {
  const first = sorting[0];
  if (first === undefined) return "id,asc";

  return `${first.id},${first.desc ? "desc" : "asc"}` as CarSort;
}
