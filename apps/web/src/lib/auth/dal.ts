import "server-only";

import { $serverFetch } from "~/lib/api/server-fetch";
import type { User } from "~/lib/api/types";

export async function getSession(): Promise<User | null> {
  "use cache: private";

  const { data, error } = await $serverFetch<User>("/auth/me");
  if (error !== null) return null;

  return {
    ...data,
    roles: data.roles
      .filter((role) => role.startsWith("ROLE_"))
      .map((role) => role.slice("ROLE_".length)),
  };
}
