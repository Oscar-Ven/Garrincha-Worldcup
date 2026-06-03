import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      // What to measure
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/prisma.ts",      // singleton wrapper, no logic to test
        "src/lib/i18n.ts",        // thin server-only cookie reader
        "src/lib/flags.ts",       // static lookup table
        "src/lib/translations.ts", // static data
        "src/lib/ui-demo-data.ts", // static demo fixtures
      ],
      // Reporters
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "./coverage",
      // Soft thresholds — fail CI if coverage drops below these minimums.
      // Raise them as integration tests are added.
      thresholds: {
        statements: 40,
        branches: 35,
        functions: 40,
        lines: 40,
      },
    },
  },
});
