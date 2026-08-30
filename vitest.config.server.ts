import { defineConfig } from "vite";

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: ["server/**/*.test.ts", "netlify/functions/**/*.test.ts"],
  },
});
