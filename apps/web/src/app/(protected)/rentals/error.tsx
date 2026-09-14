"use client";

import { Button } from "$components/ui/button";

interface RentalsErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function RentalsError({ retry }: RentalsErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-4 px-5 pt-7 pb-14">
      <h1 className="text-lg font-semibold tracking-tight">My rentals</h1>

      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-lg border border-border p-6"
      >
        <p className="font-medium">Could not load your rentals</p>

        <Button variant="outline" size="sm" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </main>
  );
}
