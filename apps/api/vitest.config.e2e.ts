import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: "./",
    include: ["**/*.e2e-spec.ts"],
    // AppModule validates env on boot. The pg pool is lazy, so tests that
    // don't query never actually connect.
    env: {
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/car_rental",
    },
  },
});
