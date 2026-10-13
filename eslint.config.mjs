import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// A class list is a string or a template string, wherever it is written.
const inAClassList = (pattern) => [
  `Literal[value=${pattern}]`,
  `TemplateElement[value.raw=${pattern}]`,
];

// 12 px is 0.75 rem. Tailwind's own smallest step, text-xs, is 12 px, so only a size in
// brackets can go under it.
const textUnder12Px = String.raw`/\btext-\[(?:(?:\d|1[01])(?:\.\d+)?px|0?\.(?:[0-6]\d*|7(?:[0-4]\d*)?)rem)\]/`;
// The column is its width and its place in the middle. Each alone is correct on other things.
const thePageColumn = String.raw`/\bmx-auto\b[^]*\bmax-w-3xl\b|\bmax-w-3xl\b[^]*\bmx-auto\b/`;

// Each of these was written more than once before it had one place, and lint is the cheapest
// thing that can see it: the browser tests see only the pages they open.
const layoutRules = [
  ...inAClassList(textUnder12Px).map((selector) => ({
    selector,
    message: "No text is under 12 px. The smallest size is text-xs.",
  })),
  ...inAClassList(thePageColumn).map((selector) => ({
    selector,
    message: "The page column is written once, as `column` in src/app/globals.css. Use `column`.",
  })),
  {
    selector: "JSXOpeningElement[name.name='h1'] > JSXAttribute[name.name='className']",
    message: "A page title has no class. Its style is the h1 rule in src/app/globals.css.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "no-restricted-syntax": ["error", ...layoutRules] } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
