"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "$components/ui/input";
import { Label } from "$components/ui/label";

interface CarSearchProps {
  value: string;
  onChange: (next: string) => void;
}

export function CarSearch({ value, onChange }: CarSearchProps) {
  return (
    <div className="relative flex">
      <Label htmlFor="car-search" className="sr-only">
        Search cars by model
      </Label>

      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />

      <Input
        id="car-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by model"
        autoComplete="off"
        spellCheck={false}
        className="h-10 pl-9"
      />
    </div>
  );
}
