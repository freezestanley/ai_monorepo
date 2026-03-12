module.exports = {
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.2" } },
  plugins: ["react-refresh", "prettier"],
  rules: {
    // 'react-refresh/only-export-components': 'warn',
    "react/no-unknown-property": "off",
    "react/prop-types": "off",
    "prettier/prettier": [
      "warn",
      {
        semi: false
      }
    ],
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off",
    "no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/display-name": "off",
    "no-prototype-builtins": "off",
    "react/jsx-key": "off",
    semi: ["error", "never"]
  }
}
