import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "web",
  base: "/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // One small bundle; no runtime requests beyond the page's own files.
    assetsInlineLimit: 0,
  },
  test: {
    root: ".",
    include: ["tests/**/*.test.ts"],
  },
});
