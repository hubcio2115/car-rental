import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function CarsBackLink() {
  return (
    <Link
      href="/cars"
      className="inline-flex w-fit items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
      Cars
    </Link>
  );
}
