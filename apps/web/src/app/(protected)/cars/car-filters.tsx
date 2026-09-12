"use client";

import { cn } from "cn";

import { Button } from "$components/ui/button";
import { Checkbox } from "$components/ui/checkbox";
import { Input } from "$components/ui/input";
import { Label } from "$components/ui/label";
import { CAR_STATUSES, CAR_TYPES, type CarStatus, type CarType } from "~/lib/api/types";
import {
  activeFilterCount,
  type CarFilters,
  type CarFiltersUpdate,
} from "~/lib/cars/search-params";

const SEAT_OPTIONS = [5, 7, 8, 9] as const;
const DOOR_OPTIONS = [4, 5] as const;

const TYPE_LABEL: Record<CarType, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
};

const STATUS_LABEL: Record<CarStatus, string> = {
  AVAILABLE: "Available",
  RENTED: "Rented",
};

interface CarFiltersProps {
  filters: CarFilters;
  onChange: (next: CarFiltersUpdate) => void;
  onClear: () => void;
}

export function CarFiltersCard({ filters, onChange, onClear }: CarFiltersProps) {
  const activeCount = activeFilterCount(filters);

  return (
    <aside className="flex flex-col gap-5 rounded-lg border border-border p-4">
      <FilterGroup label="Type">
        {CAR_TYPES.map((type) => (
          <CheckRow
            key={type}
            id={`type-${type}`}
            label={TYPE_LABEL[type]}
            checked={filters.type.includes(type)}
            onCheckedChange={(checked) => onChange({ type: toggle(filters.type, type, checked) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Status">
        {CAR_STATUSES.map((status) => (
          <CheckRow
            key={status}
            id={`status-${status}`}
            label={STATUS_LABEL[status]}
            checked={filters.status.includes(status)}
            onCheckedChange={(checked) =>
              onChange({ status: toggle(filters.status, status, checked) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Price per day">
        <RangeInputs
          idPrefix="price"
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          minPlaceholder="Min"
          maxPlaceholder="Max"
          onMinChange={(minPrice) => onChange({ minPrice })}
          onMaxChange={(maxPrice) => onChange({ maxPrice })}
        />
      </FilterGroup>

      <FilterGroup label="Seats">
        <ToggleRow
          options={SEAT_OPTIONS}
          selected={filters.seats}
          onToggle={(seat, pressed) => onChange({ seats: toggle(filters.seats, seat, pressed) })}
        />
      </FilterGroup>

      <FilterGroup label="Doors">
        <ToggleRow
          options={DOOR_OPTIONS}
          selected={filters.doors}
          onToggle={(door, pressed) => onChange({ doors: toggle(filters.doors, door, pressed) })}
        />
      </FilterGroup>

      <FilterGroup label="Year">
        <RangeInputs
          idPrefix="year"
          minValue={filters.minYear}
          maxValue={filters.maxYear}
          minPlaceholder="From"
          maxPlaceholder="To"
          onMinChange={(minYear) => onChange({ minYear })}
          onMaxChange={(maxYear) => onChange({ maxYear })}
        />
      </FilterGroup>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={activeCount === 0}
        className="self-start px-0 hover:bg-transparent hover:underline"
      >
        {activeCount === 0 ? "No filters" : `Clear all (${activeCount})`}
      </Button>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

interface CheckRowProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function CheckRow({ id, label, checked, onCheckedChange }: CheckRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label
        htmlFor={id}
        className={cn(
          "cursor-pointer font-normal",
          checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </Label>
    </div>
  );
}

interface ToggleRowProps {
  options: readonly number[];
  selected: readonly number[];
  onToggle: (option: number, pressed: boolean) => void;
}

function ToggleRow({ options, selected, onToggle }: ToggleRowProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const pressed = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            onClick={() => onToggle(option, !pressed)}
            className={cn(
              "h-7 min-w-8 rounded-md border px-2 font-mono text-[13px] transition-colors",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              pressed
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface RangeInputsProps {
  idPrefix: string;
  minValue: number | null;
  maxValue: number | null;
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

function RangeInputs({
  idPrefix,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
}: RangeInputsProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={`${idPrefix}-min`} className="sr-only">
        {minPlaceholder}
      </Label>
      <Input
        id={`${idPrefix}-min`}
        inputMode="numeric"
        value={minValue ?? ""}
        placeholder={minPlaceholder}
        onChange={(event) => onMinChange(parseNumber(event.target.value))}
        className="font-mono text-[13px] tabular-nums"
      />

      <span className="text-xs text-muted-foreground">to</span>

      <Label htmlFor={`${idPrefix}-max`} className="sr-only">
        {maxPlaceholder}
      </Label>
      <Input
        id={`${idPrefix}-max`}
        inputMode="numeric"
        value={maxValue ?? ""}
        placeholder={maxPlaceholder}
        onChange={(event) => onMaxChange(parseNumber(event.target.value))}
        className="font-mono text-[13px] tabular-nums"
      />
    </div>
  );
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toggle<T>(current: readonly T[], value: T, include: boolean): T[] {
  return include ? [...current, value] : current.filter((item) => item !== value);
}
