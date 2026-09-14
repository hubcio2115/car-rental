"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/cars", label: "Cars" },
  { href: "/rentals", label: "My rentals" },
] as const;

export function MainNav() {
  return (
    <Suspense fallback={<NavLinks pathname={null} />}>
      <CurrentNavLinks />
    </Suspense>
  );
}

function CurrentNavLinks() {
  const pathname = usePathname();

  return <NavLinks pathname={pathname} />;
}

interface NavLinksProps {
  pathname: string | null;
}

function NavLinks({ pathname }: NavLinksProps) {
  return (
    <nav aria-label="Main" className="flex items-center gap-4">
      {LINKS.map((link) => {
        const current =
          pathname !== null && (pathname === link.href || pathname.startsWith(`${link.href}/`));

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "rounded-sm text-[13px] transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
