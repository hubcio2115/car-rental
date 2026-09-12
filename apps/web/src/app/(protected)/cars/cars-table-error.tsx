"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { catchError, type ErrorInfo } from "next/error";

import { Button } from "$components/ui/button";

function CarsTableErrorFallback(_props: unknown, { error, retry }: ErrorInfo) {
  const { reset } = useQueryErrorResetBoundary();

  const message = error instanceof Error ? error.message : "Could not load cars.";

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-border p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="font-medium">Could not load cars</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          reset();
          retry();
        }}
      >
        Try again
      </Button>
    </div>
  );
}

export const CarsTableBoundary = catchError(CarsTableErrorFallback);
