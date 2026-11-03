import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error", "log"] }],
    },
  },
  {
    // O domínio é puro: sem I/O nem código do servidor ou da UI
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/server/*",
            "@/features/*",
            "@/components/*",
            "@/app/*",
            "next/*",
            "react",
            "node:*",
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    ".claude/**",
    ".open-next/**",
    ".wrangler/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "cloudflare-env.d.ts",
    "src/content/foods.generated.ts",
  ]),
]);
