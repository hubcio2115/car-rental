import { differenceInCalendarDays, format, isAfter, isBefore, isSameDay } from "date-fns";

/** Longest rental in days, mirrors RentalService.MAX_DAYS on the API. */
export const MAX_RENTAL_DAYS = 14;

export function toApiDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function rentalDays(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1;
}

export function formatDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatDay(date: Date): string {
  return dayFormat.format(date);
}

export function formatRange(start: Date, end: Date): string {
  return isSameDay(start, end) ? formatDay(start) : `${formatDay(start)} to ${formatDay(end)}`;
}

export function shortenedPrice(total: number, start: Date, end: Date, newEnd: Date): number {
  return (total * rentalDays(start, newEnd)) / rentalDays(start, end);
}

export type RentalState = "active" | "upcoming" | "past";

export function rentalState(start: Date, end: Date, today: Date): RentalState {
  if (isBefore(end, today)) return "past";
  return isAfter(start, today) ? "upcoming" : "active";
}
