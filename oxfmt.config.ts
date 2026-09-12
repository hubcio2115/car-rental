import { defineConfig } from "oxfmt";

export default defineConfig({
  singleQuote: false,
  semi: true,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  arrowParens: "always",
  sortPackageJson: false,

  sortTailwindcss: {
    stylesheet: "./apps/web/src/app/globals.css",
    functions: ["cn", "cva"],
    preserveWhitespace: true,
  },

  ignorePatterns: ["node_modules", "dist", ".next", "pnpm-lock.yaml", ".agents/**"],
});
