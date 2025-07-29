import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      "tailwind.config.cjs"
    ]
  }
];