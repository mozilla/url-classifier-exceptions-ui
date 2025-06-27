import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import css from "@eslint/css";
import { configs as litConfigs } from "eslint-plugin-lit";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
  { ...litConfigs["flat/recommended"], files: ["src/**/*.{js,ts}", "scripts/**/*.{js,ts}"] },
]);
