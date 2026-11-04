import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/", "tmp/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      "no-console": ["error", { allow: ["error", "warn"] }],
      eqeqeq: "error",
      "max-depth": ["error", 3],
    },
  },
  {
    // The browser must never reach the network or the model at runtime.
    files: ["web/**/*.ts", "src/core/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", "fetch", "XMLHttpRequest", "WebSocket", "localStorage"],
      "no-restricted-imports": [
        "error",
        { patterns: ["@anthropic-ai/*", "node:*", "*/pipeline/*"] },
      ],
    },
  },
  {
    files: ["src/pipeline/cli/**/*.ts"],
    rules: { "no-console": "off" },
  },
  {
    // Tests index into known fixtures; a failed assertion is the right failure mode.
    files: ["tests/**/*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
);
