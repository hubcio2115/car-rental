import { betterAuth } from "better-auth";
import { Database } from "../db/db.js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { sessions, users, verifications, accounts } from "../db/schema.js";

/**
 * better-auth reads its secret and base URL from `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
 * Requests that carry cookies must come from `webOrigin`, which is its CSRF protection.
 */
export function createAuth(db: Database, webOrigin: string) {
  return betterAuth({
    trustedOrigins: [webOrigin],

    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        users,
        sessions,
        verifications,
        accounts,
      },
    }),

    emailAndPassword: {
      enabled: true,
      // Registering doesn't log in; the web app sends the new user to the login page.
      autoSignIn: false,
    },

    plugins: [admin()],

    user: {
      modelName: "users",
    },

    session: {
      modelName: "sessions",
    },

    account: {
      modelName: "accounts",
    },

    verification: {
      modelName: "verifications",
    },
  });
}
