import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSession } from "~/lib/auth/dal";

export async function GET(_req: NextRequest, _ctx: RouteContext<"/">) {
  const user = await getSession();

  if (!user) return redirect("/login");
  return redirect("/cars");
}
