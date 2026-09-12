"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "$components/ui/pagination";
import { serializeCarSearchParams, type CarFilters } from "~/lib/cars/search-params";

const WINDOW = 1;

const DISABLED_LINK = {
  role: "link",
  "aria-disabled": true,
  className: "pointer-events-none opacity-50",
};

interface CarPaginationProps {
  filters: CarFilters;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
}

export function CarPagination({ filters, totalPages, onPageChange }: CarPaginationProps) {
  const pathname = usePathname();
  const pageIndex = filters.page;

  function linkTo(page: number) {
    return {
      href: serializeCarSearchParams(pathname, { ...filters, page }),
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        onPageChange(page);
      },
    };
  }

  return (
    <Pagination className="mx-0 justify-start">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious {...(pageIndex === 0 ? DISABLED_LINK : linkTo(pageIndex - 1))} />
        </PaginationItem>

        {pageItems(pageIndex, totalPages).map((item) =>
          item.kind === "gap" ? (
            <PaginationItem key={`gap-after-${item.after}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item.page}>
              <PaginationLink
                isActive={item.page === pageIndex}
                className="font-mono tabular-nums"
                {...linkTo(item.page)}
              >
                {item.page + 1}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            {...(pageIndex >= totalPages - 1 ? DISABLED_LINK : linkTo(pageIndex + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

type PageItem = { kind: "page"; page: number } | { kind: "gap"; after: number };

/** First and last page always show, with a window around the current one and gaps between. */
function pageItems(pageIndex: number, totalPages: number): PageItem[] {
  const pages = new Set<number>([0, totalPages - 1]);

  for (let offset = -WINDOW; offset <= WINDOW; offset++) {
    const page = pageIndex + offset;
    if (page >= 0 && page < totalPages) pages.add(page);
  }

  const ordered = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];

  ordered.forEach((page, index) => {
    const previous = ordered[index - 1];
    if (previous !== undefined && page - previous > 1) items.push({ kind: "gap", after: previous });
    items.push({ kind: "page", page });
  });

  return items;
}
