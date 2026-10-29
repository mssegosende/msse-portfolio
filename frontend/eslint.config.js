import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", "coverage", "playwright-report", "test-results"] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.ts", "*.config.ts"],
  })),
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["*.config.{js,cjs,ts}", "e2e/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  prettier,
];
