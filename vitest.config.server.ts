import { defineConfig } from "vite";

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: ["server/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
