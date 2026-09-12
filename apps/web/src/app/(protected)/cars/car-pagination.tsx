"use client";

import { cn } from "cn";

import { Button } from "$components/ui/button";

const WINDOW = 1;

interface CarPaginationProps {
  pageIndex: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
}

export function CarPagination({ pageIndex, totalPages, onPageChange }: CarPaginationProps) {
  const items = pageItems(pageIndex, totalPages);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={pageIndex === 0}
        onClick={() => onPageChange(pageIndex - 1)}
      >
        Prev
      </Button>

      {items.map((item) =>
        item.kind === "gap" ? (
          <span
            key={`gap-after-${item.after}`}
            aria-hidden="true"
            className="px-1 text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={item.page}
            variant={item.page === pageIndex ? "default" : "outline"}
            size="sm"
            aria-current={item.page === pageIndex ? "page" : undefined}
            onClick={() => onPageChange(item.page)}
            className={cn("min-w-8 font-mono tabular-nums")}
          >
            {item.page + 1}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={pageIndex >= totalPages - 1}
        onClick={() => onPageChange(pageIndex + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

type PageItem = { kind: "page"; page: number } | { kind: "gap"; after: number };

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
