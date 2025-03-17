import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        LeopardWeb: "readonly",
        leopardModel: "readonly",
      },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["off"],
    },
  },
];
