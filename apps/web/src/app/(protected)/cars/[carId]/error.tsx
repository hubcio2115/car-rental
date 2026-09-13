"use client";

import { Button } from "$components/ui/button";
import { CarsBackLink } from "$components/cars/cars-back-link";

interface CarErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function CarError({ retry }: CarErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-5 px-5 pt-7 pb-14">
      <CarsBackLink />

      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-lg border border-border p-6"
      >
        <p className="font-medium">Could not load this car</p>

        <Button variant="outline" size="sm" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </main>
  );
}
