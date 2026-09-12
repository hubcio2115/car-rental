import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, verifySession } from "~/lib/auth/verify-session";

const PUBLIC_PATHNAMES = ["/register", "/login"];

function isPublicPathname(pathname: string): boolean {
  return PUBLIC_PATHNAMES.some((pub) => pathname === pub || pathname.startsWith(`${pub}/`));
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (isPublicPathname(pathname)) return NextResponse.next();

  const state = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (state !== "valid") {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
