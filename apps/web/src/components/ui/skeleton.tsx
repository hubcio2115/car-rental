import { cn } from "cn";

/** Static on purpose: a pulsing or shimmering placeholder repaints every frame. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
