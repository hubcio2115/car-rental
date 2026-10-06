import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIES } from "~/lib/auth/session-cookie";
import { verifySession } from "~/lib/auth/verify-session";

const PUBLIC_PATHNAMES = ["/register", "/login"];

function isPublicPathname(pathname: string): boolean {
  return PUBLIC_PATHNAMES.some((pub) => pathname === pub || pathname.startsWith(`${pub}/`));
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (isPublicPathname(pathname)) return NextResponse.next();

  const cookie = SESSION_COOKIES.map((name) => request.cookies.get(name)).find(Boolean);
  const state = await verifySession(cookie);
  if (state !== "valid") {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
