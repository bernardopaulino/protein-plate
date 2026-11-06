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
  {
    // O three só chega pelo chunk lazy (src/features/plate-3d/lazy-plate.tsx): importá-lo noutro
    // sítio metia-o no JavaScript da página (e nos prefetches dos links para ela)
    files: ["src/**/*.{ts,tsx}"],
    // (o domínio já tem a sua regra, mais restrita: uma segunda substituía-a)
    ignores: [
      "src/domain/**",
      "src/features/plate-3d/plate-3d.tsx",
      "src/features/plate-3d/scene/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["three", "three/*", "@react-three/*"],
              message: "O three só se importa em src/features/plate-3d/plate-3d.tsx e scene/.",
            },
            {
              group: [
                "**/scene/plate-scene",
                "**/scene/model-library",
                "**/plate-3d/plate-3d",
                "./plate-3d",
              ],
              message:
                "Usa o LazyPlate3D (lazy-plate.tsx): o chunk do three só se pede quando deve.",
            },
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
    // O backoffice: os tipos gerados pelo wrangler e a pasta do wrangler dev
    "admin/cloudflare-env.d.ts",
    "admin/.wrangler/**",
  ]),
]);
