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
// A colour under dark:, after any other variants such as hover:.
const aDarkColour = String.raw`/\bdark:(?:[\w-]+:)*(?:bg|text|border(?:-[xytrblse])?|divide|outline|ring|decoration|fill|stroke|shadow|from|via|to|caret|accent|placeholder)-/`;

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
  ...inAClassList(aDarkColour).map((selector) => ({
    selector,
    message:
      "A colour that changes with the theme is a token in src/app/globals.css, with its light and its dark value. Use the token.",
  })),
  {
    selector: "JSXOpeningElement[name.name='h1'] > JSXAttribute[name.name='className']",
    message: "A page title has no class. Its style is the h1 rule in src/app/globals.css.",
  },
];

// A folder named for a kind of code gathers modules that have different users. A module is
// beside the one thing that uses it.
const inAKindFolder = {
  selector: "Program",
  message:
    "No folder under src/ is named lib, utils or components. Put the module beside the one thing that uses it.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "no-restricted-syntax": ["error", ...layoutRules] } },
  {
    files: ["src/**/{lib,utils,components}/**"],
    rules: { "no-restricted-syntax": ["error", ...layoutRules, inAKindFolder] },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
