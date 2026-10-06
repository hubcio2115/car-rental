import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: "./",
    include: ["**/*.e2e-spec.ts"],
    // Starts a throwaway Postgres and migrates it. Needs Docker running.
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    // Every file truncates the one shared database, so they can't run side by side.
    fileParallelism: false,
    hookTimeout: 120_000,
    env: {
      BETTER_AUTH_SECRET: "e2e-secret-that-is-long-enough-for-better-auth",
      BETTER_AUTH_URL: "http://localhost:8080",
    },
  },
});
