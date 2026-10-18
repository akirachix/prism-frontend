import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["tests/**"],
    rules: {
      "react-hooks/globals": "off",
    },
  },
  {
    files: ["src/mocks/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/mockServiceWorker.js",
    "src/mocks/handlers/index.ts",
    "tests/routes/index.ts",
  ]),
]);

export default eslintConfig;
