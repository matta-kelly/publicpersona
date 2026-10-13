---
type: spec
description: "Put every page of the site right on a phone and on a desktop, and write each layout rule once: the two nav icons go to the right edge of the column on a phone, every link that stands alone gets a box that a finger can hit, the three write-ups get one frame, and the page column, the page title and the write-up frame each live in one place. Reference for the faults seen on the rendered pages with their numbers, the cause of each in the code, the owner's questions with a default and one other answer each, the exact code after the change, and the tests."
status: done
---
## Need

- on a phone the two icons of the nav (GitHub, theme) do not sit at the right edge. The owner saw it
- the owner's order
	- first: every page is right on a phone and on a desktop
	- second: where a layout fix lets the code get simpler or sturdier, take it
	- not wanted: a redesign, or a refactor that removes no fault and no duplication

### What was looked at

- the site as built from main `3bd2a1a`, started the way `check.sh` starts it
- every route: `/`, `/projects`, `/projects/stateball`, `/projects/dazoo`, `/projects/sabermetric-networks`, `/photos`, and an address that is no page
- three widths: 375 (phone), 768 (tablet), 1280 (desktop). Also 320 for sideways scroll. Light and dark
- the gallery of `/photos`, on the live site: the image of `check.sh` has no Immich key and shows no photo
- every number below is in CSS pixels, read from the rendered page with Chromium

The column of the site is 768 wide at most, with 24 of padding on each side.

| Width | Column, left edge | Column, right edge |
| ---- | ---- | ---- |
| 375 | 24 | 351 |
| 768 | 24 | 744 |
| 1280 | 280 | 1000 |

### The faults

| Fault | Where | What a visitor sees | Cause in the code |
| ---- | ---- | ---- | ---- |
| **F1** | nav, 375, every page | the two icons stand directly after the name, from 146 to 218. The right edge of the column is 351 | `src/components/Nav.tsx`: the one thing that pushes to the right is `sm:ml-auto` on the list of links, and it starts at 640. Under 640 nothing pushes the icons |
| **F2** | nav, footer, write-ups, 375 | links too small for a finger: nav links 16 tall, the name 20 tall, the two icons 36 by 36, footer links 16 tall, `← Projects` 16 tall | no link has a size of its own: each is as tall as its letters. The icons have `p-2.5` around a 16 icon |
| **F3** | the three write-ups, every width | `← Projects` sits on the title: 4 between its letters and the title. Between the title and the line under it: 16 | the header spaces its children with `space-y-4`, which sets a margin. The link is an inline element, and a margin above or below an inline element does nothing. Written three times, in the three `page.tsx` |
| **F4** | `/projects/sabermetric-networks`, every width | 24 between two paragraphs. On the two other write-ups: 16 | its paragraphs sit in a `div` with `space-y-6`. The two other pages each have their own copy of a `Section` component, with `space-y-4` |
| **F5** | `/projects/dazoo`, the first diagram | text of 11: the line under a box (`GitHub`), and the line over each pillar (`VIA BUTANE / IGNITION`). The smallest text anywhere else is 12 | `text-[11px]`, twice, in `src/app/projects/dazoo/page.tsx` |
| **F6** | `/photos`, 375, live | the title is the name of the album, `sentimentalsunshine`, one word. Its letters end at 363.5, which is 12.5 past the column. At 320 the whole page scrolls sideways (364 wide) | the title has no rule for a word that is longer than the line. The size of a title, `text-3xl font-semibold tracking-tight`, is written six times, in five files |

Nothing else was at fault. At 768 and at 1280 every page is right. No page scrolls sideways at 375. No picture leaves the column. Dark differs from light in colour only.

### The same thing written more than once

| What | Written | Where |
| ---- | ---- | ---- |
| the page column, `mx-auto max-w-3xl px-6` | 3 times | `Nav.tsx`, `layout.tsx`, `Footer.tsx` |
| the frame of a write-up: `← Projects`, the title, the repo link, the first lines | 3 times | the three `page.tsx` under `src/app/projects/` |
| `Section`, a heading over a run of paragraphs | 2 times, the same to the letter | `stateball/page.tsx`, `dazoo/page.tsx` |
| a picture with a border and a line under it | 2 times | `Figure` in `stateball/page.tsx`; by hand in `sabermetric-networks/page.tsx` |
| the size of a page title | 6 times | `projects/page.tsx`, `photos/page.tsx` (twice), the three write-ups |

Code that does nothing:

- `src/app/photos/page.tsx`: `prose prose-neutral dark:prose-invert` on the header. The repo has no package that defines these classes
- `src/app/page.tsx`: a `div` with `space-y-12` around one child. A space between children needs two

## Done looks like

### The questions

Each one is the owner's taste. Each has a default, which the promises and the code below are written for, and one other answer. Another answer sends this spec back to Design before the Factory starts.

- **Q1, the nav on a phone** (N1)
	- default: two rows, as today. Row one: the name at the left edge of the column, the two icons at the right edge. Row two: the three links, from the left edge
	- the other answer: one row. The three links from the left edge, the two icons at the right edge, and the name not shown under 640. `Home` leads where the name leads
- **Q2, how big a box a link gets** (T1)
	- default: 44 each way, for a link or a button that stands alone: the name, the nav links, the two icons, the footer links, `← Projects`
		- 44 is what Apple's guide asks for, and WCAG 2.2 at level AAA (2.5.5)
		- what it changes to the eye: on a phone the nav is 113 tall, not 101, and its links stand 24 apart, not 16, as on a desktop today. On a desktop the nav and the footer keep their height (69); the two icons stand 44 apart, not 36
		- a link inside a sentence stays as it is. So does the repo link under a write-up's title
	- the other answer: 24, the least that WCAG 2.2 asks at level AA (2.5.8). Then only the text links grow, and the nav on a phone keeps its height
- **Q3, which edge of an icon meets the edge of the column** (N1, N2)
	- default: the edge of its box. The theme button's box ends at 351 on a phone and at 1000 on a desktop, so the moon itself ends 14 before it
	- the other answer: the edge of the drawing. The moon ends on the edge, in line with `linkedin` in the footer, and the box reaches 14 past the column
- **Q4, the size of a page title on a phone** (T2)
	- default: 24 under 640, and 30 from 640 up, as today. A word longer than the line breaks
		- at 24, `sentimentalsunshine` is 272 wide and stays whole on a phone 375 wide, where the column is 327
		- the Stateball title takes three lines on a phone, not four
	- the other answer: 30 at every width. The long word then breaks: `sentimentalsunshin` and `e` on a phone 375 wide
- **Q5, the gap between paragraphs of the Sabermetric write-up** (W2)
	- default: 16, as on the two other write-ups
	- the other answer: 24 stays. Then W2 and its test go, and `Section` takes the gap as a value
- **Q6, the smallest text** (W3)
	- default: 12. The two lines of the Dazoo diagram go from 11 to 12
	- the other answer: 11 stays. Then W3 and its lint rule go
- **Q7, the width of the column**
	- default: no change. 768, which gives about 80 characters to a line on a desktop
	- the other answer: 672, about 70 characters to a line, which is easier to read and makes every page narrower

### The parts

All four are wiring: they put the page together and decide nothing that a unit test can read. So each promise is shown end to end, against the built image, at a stated width. That is the lowest kind that can show a position or a size.

- **page column**: new name, `column`, a utility in `src/app/globals.css`
	- what goes in: nothing. What comes out: a box in the middle of the page, 768 wide at most, with 24 of padding on each side
	- used by the nav, the page body and the footer
- **tap box**: new name, `tap`, a utility in `src/app/globals.css`
	- what comes out: a box at least 44 wide and 44 tall, as wide as what is in it, with what is in it in the middle of its height
- **nav** and **footer**: `src/components/Nav.tsx`, `src/components/ThemeToggle.tsx`, `src/components/Footer.tsx`. Changed
- **write-up frame**: new, `src/components/WriteUp.tsx`. Three components
	- `WriteUp`: in, `title`, `repo` (optional), `lede` (optional), and the body. Out, the article with `← Projects`, the title, the repo link, the first lines, and the body under them
	- `Section`: in, `title` (optional) and paragraphs. Out, the heading and the paragraphs, 16 apart
	- `Figure`: in, `src`, `alt`, `width`, `height`, `caption` (optional, `alt` when not given), `onWhite` (optional). Out, the picture as wide as the column, with a border, and the caption under it

`README.md` lists the logic, the adapter and the borders. No part of this change is one of them, so no line of it changes.

### Acceptance criteria: the promises

Each one is true or false of the built image, in Chromium, at the stated width.

- **N1** at 375 wide, on `/`: the box of the theme button ends at 351, the box of the GitHub link ends where the box of the theme button starts, and the middle of each is as high as the middle of the name (F1, Q1, Q3)
- **N2** at 1280 wide, on `/`: the name starts at 280, the box of the theme button ends at 1000, the GitHub link ends where the theme button starts, the link `Photos` ends before the GitHub link starts, and the middle of `Photos` and of the theme button is as high as the middle of the name (Q3)
	- true today. It holds the desktop nav in place while N1 changes the phone nav
- **T1** at 375 wide, on `/projects/stateball`: the box of each of these is 44 or more, both ways: the name, `Home`, `Projects`, `Photos`, the GitHub link, the theme button, `email`, `linkedin`, `← Projects` (F2, Q2)
- **W1** at 375 wide, on `/projects/stateball`: from the bottom of the letters of `← Projects` to the top of the title is 16 or more, and 20 or less (F3)
	- the header's gap is 16. The letters are 16 tall in a line 20 tall, so they end 2 above the edge of their line: 18
- **W2** at 1280 wide, on `/projects/sabermetric-networks`: from the bottom of the first paragraph to the top of the second is 16 (F4, Q5)
- **W3** at 375 wide, on `/projects/dazoo`, in the figure `Dazoo topology`: the text `GitHub` and the text `via Butane / Ignition` are each 12 in size (F5, Q6)
- **T2** at 375 wide: a page title of the one word `sentimentalsunshine` has no letter past 351 (F6, Q4)
- **P1** at 375 wide, each of the six pages is 375 wide: nothing scrolls sideways
	- true today. It holds every page inside a phone from here on

### Acceptance criteria: the code around the promises

Each one is checked on the branch, from the repo root.

- **R1** the page column is written once
	- check: `git grep -n 'max-w-3xl' -- src` prints one line, in `src/app/globals.css`
- **R2** the frame of a write-up is written once
	- check: `git grep -l -e 'larr; Projects' -e 'function Section' -e 'function Figure' -- src` prints `src/components/WriteUp.tsx`, and no other line
- **R3** the size of a page title is written once
	- check: `git grep -n 'text-3xl' -- src` prints one line, in `src/app/globals.css`
- **R4** no package is added or removed
	- check: `git diff --numstat origin/main...HEAD -- package.json pnpm-lock.yaml` prints nothing
- **R5** no word that a visitor reads changes, and no colour
	- check: review of the diff against [[#Approach]]. The caption of the Sabermetric picture and the first lines of two write-ups move from the page into a value, with the same words

### Acceptance criteria: the chain

- **S1** `pnpm test`, in the dev container, shows `Test Files  4 passed (4)` and `Tests  22 passed (22)`
- **S2** `./check.sh`, on the host, exits 0, and Playwright's part of its output says `13 passed`
	- the thirteen: the five of main, and the eight of this spec
- **S3** the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks fix/responsive-layout` shows `checks` as `pass`
- **S4** the Factory edits no test
	- check: `git diff <the last commit of Design> HEAD -- tests 'src/**/*.test.ts'` prints nothing
- **S5** the branch changes these paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `A	_well/spec-responsive-layout.md`
		- `M	src/app/globals.css`
		- `M	src/app/layout.tsx`
		- `M	src/app/page.tsx`
		- `M	src/app/photos/page.tsx`
		- `M	src/app/projects/dazoo/page.tsx`
		- `M	src/app/projects/page.tsx`
		- `M	src/app/projects/sabermetric-networks/page.tsx`
		- `M	src/app/projects/stateball/page.tsx`
		- `M	src/components/Footer.tsx`
		- `M	src/components/Nav.tsx`
		- `M	src/components/ThemeToggle.tsx`
		- `A	src/components/WriteUp.tsx`
		- `A	tests/layout.spec.ts`

Checked in Code review, by breaking it once on purpose. Each change is thrown away after.

- **S6** in `src/components/Nav.tsx`, `sm:order-none` is taken out; then `./check.sh` exits with a code that is not 0, and the test `puts the name, the links and the icons on one row on a desktop` is shown as failed
	- seen by Design, in the browser: without that class the theme button ends at 784 on a desktop, not at 1000
- **S7** in `src/app/projects/dazoo/page.tsx`, in `GitOpsFlow`, `flex-wrap` is taken out; then `./check.sh` exits with a code that is not 0, and the test `fits every page in the width of a phone, with nothing to scroll sideways` is shown as failed
	- seen by Design, in the browser: without that class the page is 409 wide on a phone

### What the site shows after the change

| Place | Width | What a visitor sees |
| ---- | ---- | ---- |
| nav | 375 | row one: the name from 24, the GitHub icon in a box from 263 to 307, the theme button in a box from 307 to 351. Row two: `Home`, `Projects`, `Photos`, the letters of `Home` from 24. 113 tall |
| nav | 768, 1280 | one row, as today: the name, the three links, the two icons. 69 tall, as today |
| footer | every | as today, 69 tall. The letters of `linkedin` end on the edge of the column, as today |
| a write-up | every | `← Projects`, then 18 of space, then the title. The rest as today |
| `/projects/sabermetric-networks` | every | paragraphs 16 apart |
| `/projects/dazoo` | every | the two small lines of the first diagram at 12 |
| a page title | under 640 | 24 in size. A word longer than the line breaks |
| a page title | 640 and up | 30 in size, as today |
| `/`, `/projects`, the gallery | every | as today, but for the nav and the title |

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

Design made every change below on a copy outside the repo, and built the image from the copy. On that image: the format check, the lint and the typecheck pass, the 22 unit tests pass, and all 13 Playwright tests pass. The copy is not on the branch. The changes are given as they were made, so they apply to main `3bd2a1a` as they stand.

**The three rules, in one place**

`src/app/globals.css`:

```diff
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -29,6 +29,23 @@
   --color-link-hover: var(--link-hover);
 }
 
+/* The one column of the site: the nav, the page body and the footer all sit in it. */
+@utility column {
+  @apply mx-auto w-full max-w-3xl px-6;
+}
+
+/* A link or a button that stands alone gets a box a finger can hit: 44 px each way. */
+@utility tap {
+  @apply flex min-h-11 w-fit min-w-11 items-center;
+}
+
+@layer base {
+  /* The title of a page. A title of one long word breaks before it leaves the column. */
+  h1 {
+    @apply text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl;
+  }
+}
+
 .link {
   color: var(--link);
   text-decoration-line: underline;
```

- `@utility` and `@apply` are Tailwind 4's own way to name a group of utilities ([Adding custom utilities](https://tailwindcss.com/docs/adding-custom-styles#adding-custom-utilities)). No package
- `column` holds what was written three times. `w-full` is in it: the page body needs it, and it does nothing wrong in the nav and the footer
- `tap` is a flex box as wide as what is in it. An underline set on it still reaches the letters, so the active link keeps its line
- the `h1` rule is in the base layer, so a class on one title can still change it. `wrap-anywhere` is `overflow-wrap: anywhere`

**The page body**

`src/app/layout.tsx`:

```diff
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -15,7 +15,7 @@
       <body className="flex min-h-screen flex-col">
         <Providers>
           <Nav />
-          <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
+          <main className="column flex-1 py-10">{children}</main>
           <Footer />
         </Providers>
       </body>
```

**The nav**

`src/components/Nav.tsx`:

```diff
--- a/src/components/Nav.tsx
+++ b/src/components/Nav.tsx
@@ -17,11 +17,11 @@
 
   return (
     <header className="border-b border-black/5 dark:border-white/10">
-      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 text-sm">
-        <Link href="/" className="font-medium">
+      <nav className="column flex flex-wrap items-center gap-x-6 py-3 text-sm">
+        <Link href="/" className="tap mr-auto font-medium">
           Matthew Kelly
         </Link>
-        <ul className="text-muted order-3 flex w-full gap-4 sm:order-none sm:ml-auto sm:w-auto sm:gap-6">
+        <ul className="text-muted order-last -mx-3 flex w-full sm:order-none sm:w-auto">
           {links.map((l) => {
             const active = isActiveLink(pathname, l.href);
             return (
@@ -30,7 +30,7 @@
                   href={l.href}
                   aria-current={active ? "page" : undefined}
                   className={twMerge(
-                    "hover:text-foreground",
+                    "tap hover:text-foreground px-3",
                     active && "text-foreground underline underline-offset-4",
                   )}
                 >
@@ -40,13 +40,13 @@
             );
           })}
         </ul>
-        <div className="flex items-center">
+        <div className="flex">
           <a
             href="https://github.com/matta-kelly"
             target="_blank"
             rel="noreferrer"
             aria-label="GitHub"
-            className="text-muted hover:text-foreground block rounded-md p-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
+            className="tap text-muted hover:text-foreground justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
           >
             <GitHubIcon />
           </a>
```

`src/components/ThemeToggle.tsx`:

```diff
--- a/src/components/ThemeToggle.tsx
+++ b/src/components/ThemeToggle.tsx
@@ -19,7 +19,7 @@
       type="button"
       aria-label="Toggle theme"
       onClick={() => setTheme(isDark ? "light" : "dark")}
-      className="text-muted hover:text-foreground rounded-md p-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
+      className="tap text-muted hover:text-foreground justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
     >
       <span suppressHydrationWarning>
         {mounted ? isDark ? <SunIcon /> : <MoonIcon /> : <MoonIcon />}
```

- `mr-auto` on the name is the one thing that pushes to the right, at every width. It takes the place of `sm:ml-auto` on the list, which started at 640: that is F1
- the list of links keeps `order-last w-full` under 640, so it is row two, and `sm:order-none sm:w-auto` from 640, so it is in the row
- each link has `px-3`, and the list has `-mx-3`. So the letters of `Home` still start on the edge of the column, the letters stand 24 apart at every width, and each box is 44 wide or more. `gap-4` and `sm:gap-6` go
- `py-3` and a row 44 tall give the nav the height that `py-4` and a row 36 tall gave it: 68, and 1 of border
- each icon is in a `tap` box with `justify-center`: 44 by 44, the icon in the middle. `p-2.5` goes
- the class string of the two icons is still written twice, in the two files. Two is not three: it stays

**The footer**

`src/components/Footer.tsx`:

```diff
--- a/src/components/Footer.tsx
+++ b/src/components/Footer.tsx
@@ -1,18 +1,18 @@
 export default function Footer() {
   return (
     <footer className="mt-12 border-t border-black/5 dark:border-white/10">
-      <div className="text-muted mx-auto flex max-w-3xl items-center justify-between px-6 py-6 text-sm">
+      <div className="column text-muted flex items-center justify-between py-3 text-sm">
         <span>© Matthew Kelly</span>
-        <ul className="flex gap-4">
+        <ul className="-mr-2 flex">
           <li>
-            <a href="mailto:mattakellyy@gmail.com" className="hover:text-foreground">
+            <a href="mailto:mattakellyy@gmail.com" className="tap hover:text-foreground px-2">
               email
             </a>
           </li>
           <li>
             <a
               href="https://www.linkedin.com/in/matthew-kelly-profile/"
-              className="hover:text-foreground"
+              className="tap hover:text-foreground px-2"
               rel="noreferrer"
               target="_blank"
             >
```

- each link has `px-2`, and the list has `-mr-2`: the letters stand 16 apart, as today, and `linkedin` still ends on the edge of the column
- `py-3` and a row 44 tall give the footer the height that `py-6` and a row 20 tall gave it

**The frame of a write-up**

`src/components/WriteUp.tsx`, new, whole:

```tsx
import Image from "next/image";
import Link from "next/link";

/** The frame of a project write-up: the way back, the title, the link to the repo, the first lines. */
export function WriteUp({
  title,
  repo,
  lede,
  children,
}: {
  title: string;
  /** The address of the repo with no scheme, as the page shows it. */
  repo?: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-10">
      <header className="flex flex-col gap-4">
        {/* The box is 44 tall and the line in it 20: the margin takes the 12 above and below back. */}
        <Link href="/projects" className="tap text-muted hover:text-foreground -my-3 text-sm">
          &larr; Projects
        </Link>
        <h1>{title}</h1>
        {repo && (
          <p className="text-sm">
            <a href={`https://${repo}`} target="_blank" rel="noreferrer" className="link">
              {repo}
            </a>
          </p>
        )}
        {lede && <p className="text-muted leading-relaxed">{lede}</p>}
      </header>
      {children}
    </article>
  );
}

/** A run of paragraphs and figures, under a heading when it has one. */
export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
      <div className="text-muted space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

/** A picture as wide as the column, with a line under it. The line is `alt` when no caption is given. */
export function Figure({
  src,
  alt,
  width,
  height,
  caption = alt,
  onWhite = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** For a picture with a clear background that was drawn for a white page. */
  onWhite?: boolean;
}) {
  return (
    <figure className="space-y-2">
      <div
        className={
          "overflow-hidden rounded-md border border-black/5 dark:border-white/10" +
          (onWhite ? " bg-white" : "")
        }
      >
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
      </div>
      <figcaption className="text-muted text-center text-xs">{caption}</figcaption>
    </figure>
  );
}
```

- the header is a flex column with a gap. A gap holds for every child, inline or not: that is F3
- `-my-3` on the way back: its box is 44 tall for the finger, and its line of text is 20 tall. Without the margin the box would push the title 12 further down, and itself 12 below the top of the page body
- `Section` with no `title` is a run of paragraphs. The Sabermetric write-up has no headings, and uses it that way: that is F4
- `onWhite` is for the one picture with a clear background that was drawn for a white page. It is `bg-white`, which that page has today

`src/app/projects/stateball/page.tsx`:

```diff
--- a/src/app/projects/stateball/page.tsx
+++ b/src/app/projects/stateball/page.tsx
@@ -1,5 +1,4 @@
-import Image from "next/image";
-import Link from "next/link";
+import { Figure, Section, WriteUp } from "@/components/WriteUp";
 
 export const metadata = {
   title: "Stateball · Matthew Kelly",
@@ -9,30 +8,11 @@
 
 export default function StateballPage() {
   return (
-    <article className="space-y-10">
-      <header className="space-y-4">
-        <Link href="/projects" className="text-muted hover:text-foreground text-sm">
-          &larr; Projects
-        </Link>
-        <h1 className="text-3xl font-semibold tracking-tight">
-          Stateball: a matchup-aware Monte Carlo on top of win expectancy
-        </h1>
-        <p className="text-sm">
-          <a
-            href="https://github.com/matta-kelly/stateball"
-            target="_blank"
-            rel="noreferrer"
-            className="link"
-          >
-            github.com/matta-kelly/stateball
-          </a>
-        </p>
-        <p className="text-muted leading-relaxed">
-          A live MLB win-probability engine. The build, end to end: the warehouse, the model, the
-          simulator, the calibration, and what it actually does on real games.
-        </p>
-      </header>
-
+    <WriteUp
+      title="Stateball: a matchup-aware Monte Carlo on top of win expectancy"
+      repo="github.com/matta-kelly/stateball"
+      lede="A live MLB win-probability engine. The build, end to end: the warehouse, the model, the simulator, the calibration, and what it actually does on real games."
+    >
       <Section title="1. The baseline: what raw win expectancy gives you">
         <p>
           Baseball is a discrete game wrapped around a chaotic core. One batter, one pitcher, a
@@ -350,36 +330,6 @@
           already encoded, and how naturally the calibration ended up agreeing with it.
         </p>
       </Section>
-    </article>
-  );
-}
-
-function Section({ title, children }: { title: string; children: React.ReactNode }) {
-  return (
-    <section className="space-y-4">
-      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
-      <div className="text-muted space-y-4 leading-relaxed">{children}</div>
-    </section>
-  );
-}
-
-function Figure({
-  src,
-  alt,
-  width,
-  height,
-}: {
-  src: string;
-  alt: string;
-  width: number;
-  height: number;
-}) {
-  return (
-    <figure className="space-y-2">
-      <div className="overflow-hidden rounded-md border border-black/5 dark:border-white/10">
-        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
-      </div>
-      <figcaption className="text-muted text-center text-xs">{alt}</figcaption>
-    </figure>
+    </WriteUp>
   );
 }
```

`src/app/projects/dazoo/page.tsx`:

```diff
--- a/src/app/projects/dazoo/page.tsx
+++ b/src/app/projects/dazoo/page.tsx
@@ -1,4 +1,4 @@
-import Link from "next/link";
+import { Section, WriteUp } from "@/components/WriteUp";
 
 export const metadata = {
   title: "Dazoo · Matthew Kelly",
@@ -8,18 +8,10 @@
 
 export default function DazooPage() {
   return (
-    <article className="space-y-10">
-      <header className="space-y-4">
-        <Link href="/projects" className="text-muted hover:text-foreground text-sm">
-          &larr; Projects
-        </Link>
-        <h1 className="text-3xl font-semibold tracking-tight">Dazoo</h1>
-        <p className="text-muted leading-relaxed">
-          A tour of the self-hosted platform that runs my photos, my media, some work pipelines, and
-          (increasingly) the laptop I&apos;m typing this on.
-        </p>
-      </header>
-
+    <WriteUp
+      title="Dazoo"
+      lede="A tour of the self-hosted platform that runs my photos, my media, some work pipelines, and (increasingly) the laptop I'm typing this on."
+    >
       <Topology />
 
       <Section title="Why I built this">
@@ -94,16 +86,7 @@
           else is just what runs on top of it.
         </p>
       </Section>
-    </article>
-  );
-}
-
-function Section({ title, children }: { title: string; children: React.ReactNode }) {
-  return (
-    <section className="space-y-4">
-      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
-      <div className="text-muted space-y-4 leading-relaxed">{children}</div>
-    </section>
+    </WriteUp>
   );
 }
 
@@ -140,7 +123,7 @@
 function Pillar({ heading, via, items }: { heading: string; via: string; items: string[] }) {
   return (
     <div className="flex flex-col items-center gap-2">
-      <span className="text-muted font-mono text-[11px] tracking-wide uppercase">via {via}</span>
+      <span className="text-muted font-mono text-xs tracking-wide uppercase">via {via}</span>
       <DiagramBox label={heading} />
       <ul className="text-muted mt-1 space-y-1 text-center text-xs">
         {items.map((item) => (
@@ -198,7 +181,7 @@
       }
     >
       <div className="text-sm font-medium">{label}</div>
-      {sublabel && <div className="text-muted font-mono text-[11px]">{sublabel}</div>}
+      {sublabel && <div className="text-muted font-mono text-xs">{sublabel}</div>}
     </div>
   );
 }
```

`src/app/projects/sabermetric-networks/page.tsx`:

```diff
--- a/src/app/projects/sabermetric-networks/page.tsx
+++ b/src/app/projects/sabermetric-networks/page.tsx
@@ -1,5 +1,4 @@
-import Image from "next/image";
-import Link from "next/link";
+import { Figure, Section, WriteUp } from "@/components/WriteUp";
 
 export const metadata = {
   title: "Sabermetric Networks · Matthew Kelly",
@@ -9,25 +8,8 @@
 
 export default function SabermetricNetworksPage() {
   return (
-    <article className="space-y-10">
-      <header className="space-y-4">
-        <Link href="/projects" className="text-muted hover:text-foreground text-sm">
-          &larr; Projects
-        </Link>
-        <h1 className="text-3xl font-semibold tracking-tight">Sabermetric Networks</h1>
-        <p className="text-sm">
-          <a
-            href="https://github.com/matta-kelly/Sabermetric_Networks"
-            target="_blank"
-            rel="noreferrer"
-            className="link"
-          >
-            github.com/matta-kelly/Sabermetric_Networks
-          </a>
-        </p>
-      </header>
-
-      <div className="text-muted space-y-6 leading-relaxed">
+    <WriteUp title="Sabermetric Networks" repo="github.com/matta-kelly/Sabermetric_Networks">
+      <Section>
         <p>
           Traditional baseball stats are agnostic to game impact. They count what happened but not
           when, against whom, or whether it actually moved the team toward a win.
@@ -43,22 +25,14 @@
           between them in each graph, one per matchup.
         </p>
 
-        <figure className="space-y-2">
-          <div className="overflow-hidden rounded-md border border-black/5 bg-white dark:border-white/10">
-            <Image
-              src="/projects/sabermetric-networks/network-re.png"
-              alt="Bipartite network of MLB pitchers (red) and batters (blue) for the 2023 season, node size scaled by BiRank-RE, edge opacity scaled by Run Expectancy"
-              width={1920}
-              height={975}
-              className="h-auto w-full"
-            />
-          </div>
-          <figcaption className="text-muted text-center text-xs">
-            The 2023 MLB season as a single graph. Pitchers in red, batters in blue, one edge per
-            matchup that produced an outcome. Node size scales with BiRank on RE; edge opacity with
-            the RE weight.
-          </figcaption>
-        </figure>
+        <Figure
+          src="/projects/sabermetric-networks/network-re.png"
+          alt="Bipartite network of MLB pitchers (red) and batters (blue) for the 2023 season, node size scaled by BiRank-RE, edge opacity scaled by Run Expectancy"
+          width={1920}
+          height={975}
+          caption="The 2023 MLB season as a single graph. Pitchers in red, batters in blue, one edge per matchup that produced an outcome. Node size scales with BiRank on RE; edge opacity with the RE weight."
+          onWhite
+        />
 
         <p>
           The RE graph and the WPA graph encode different things. RE traces the flow of run
@@ -89,7 +63,7 @@
           already accounts for who you faced; run on the WPA graph it does the same for wins, with
           leverage carried through from the weights.
         </p>
-      </div>
-    </article>
+      </Section>
+    </WriteUp>
   );
 }
```

**The three other pages**

`src/app/projects/page.tsx`:

```diff
--- a/src/app/projects/page.tsx
+++ b/src/app/projects/page.tsx
@@ -21,7 +21,7 @@
 export default function ProjectsPage() {
   return (
     <article>
-      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
+      <h1>Projects</h1>
       <ul className="mt-8 grid gap-4 sm:grid-cols-2">
         {PROJECTS.map((p) => (
           <li key={p.slug}>
```

`src/app/photos/page.tsx`:

```diff
--- a/src/app/photos/page.tsx
+++ b/src/app/photos/page.tsx
@@ -12,7 +12,7 @@
     console.error("immich share fetch failed", err);
     return (
       <article>
-        <h1 className="text-3xl font-semibold tracking-tight">Photos</h1>
+        <h1>Photos</h1>
         <p className="text-muted mt-4">Photos unavailable right now. Try again later.</p>
       </article>
     );
@@ -21,8 +21,8 @@
 
   return (
     <article>
-      <header className="prose prose-neutral dark:prose-invert">
-        <h1 className="text-3xl font-semibold tracking-tight">{share.albumName}</h1>
+      <header>
+        <h1>{share.albumName}</h1>
         <p className="text-muted mt-2">{photos.length} photos</p>
       </header>
       <Gallery photos={photos} />
```

`src/app/page.tsx`:

```diff
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -2,36 +2,33 @@
 
 export default function HomePage() {
   return (
-    <div className="space-y-12">
-      <section className="flow-root">
-        <Image
-          src="/profile-picture.jpg"
-          alt="Matthew Kelly"
-          width={2316}
-          height={3088}
-          priority
-          className="mb-6 h-auto w-56 rounded-md md:float-right md:mb-2 md:ml-6"
-        />
-        <div className="text-muted space-y-4 leading-relaxed">
-          <p>
-            In first grade I knew I was going to play baseball for a living and by third grade I
-            knew that wouldn&apos;t quite pan out&hellip;turns out I was a bit better with the box
-            score anyway. This sparked a lifelong curiosity of the stories numbers tell and an itch
-            for what they don&apos;t. These days that curiosity lives at Lotus and Luna, an
-            eCommerce business in San Diego, where I run data and operations: the pipelines and
-            dashboards, the systems underneath them, the slow work of figuring out what makes the
-            place go.
-          </p>
-          <p>
-            In my spare time I like to explore the world by &ldquo;solving&rdquo; my
-            &ldquo;problems&rdquo; with software, resulting in permanent servitude to the problems
-            which arise from deploying &amp; orchestrating said software across machines I own and
-            ones I rent from a large corporation in the sky, all for myself and a few family members
-            who didn&apos;t ask for any of it.
-          </p>
-          <p>Mostly I like the question more than the answer.</p>
-        </div>
-      </section>
-    </div>
+    <section className="flow-root">
+      <Image
+        src="/profile-picture.jpg"
+        alt="Matthew Kelly"
+        width={2316}
+        height={3088}
+        priority
+        className="mb-6 h-auto w-56 rounded-md md:float-right md:mb-2 md:ml-6"
+      />
+      <div className="text-muted space-y-4 leading-relaxed">
+        <p>
+          In first grade I knew I was going to play baseball for a living and by third grade I knew
+          that wouldn&apos;t quite pan out&hellip;turns out I was a bit better with the box score
+          anyway. This sparked a lifelong curiosity of the stories numbers tell and an itch for what
+          they don&apos;t. These days that curiosity lives at Lotus and Luna, an eCommerce business
+          in San Diego, where I run data and operations: the pipelines and dashboards, the systems
+          underneath them, the slow work of figuring out what makes the place go.
+        </p>
+        <p>
+          In my spare time I like to explore the world by &ldquo;solving&rdquo; my
+          &ldquo;problems&rdquo; with software, resulting in permanent servitude to the problems
+          which arise from deploying &amp; orchestrating said software across machines I own and
+          ones I rent from a large corporation in the sky, all for myself and a few family members
+          who didn&apos;t ask for any of it.
+        </p>
+        <p>Mostly I like the question more than the answer.</p>
+      </div>
+    </section>
   );
 }
```

**Commits and the pull request**

- the branch is `fix/responsive-layout`, made from main `3bd2a1a`
	- main comes in again only by a merge; never a rebase, never a force push
- the spec and the tests are on the branch before any code
- then, in this order
	- `fix(layout): put the nav right on a phone and write the column once`: `globals.css`, `layout.tsx`, `Nav.tsx`, `ThemeToggle.tsx`, `Footer.tsx`, `page.tsx`, `projects/page.tsx`, `photos/page.tsx`
	- `fix(projects): give the three write-ups one frame`: `WriteUp.tsx`, and the three `page.tsx` of the write-ups
		- all 13 Playwright tests pass after this commit
- the pull request is open, as a draft, from this branch
	- title: `fix(layout): put every page right on a phone and a desktop`
	- body, one line: `Spec: _well/spec-responsive-layout.md`

### Out of scope

Seen on the rendered pages, and left for a change of its own:

- the `Close` button of the open photo is 40 by 40, under the 44 of Q2
	- no test of this repo can open a photo: `check.sh` starts the site with no Immich key, so the gallery is never drawn. A promise with no test is not a promise. The gallery needs an end to end test first, against a stand-in for Immich that replays the captured answers
- the screenshots in the Stateball write-up cannot be read on a phone: each is 325 wide. To open a picture large is a new feature
- an address that is no page shows the 404 page of Next.js, in the nav and the footer of the site. It is right at every width. A page of the site's own is a new page

Seen in the code, and left:

- `border-black/5 dark:border-white/10` is written seven times. One colour token would hold it. It removes no layout fault
- the five files under `public/projects/stateball/` are copies of files under `public/posts/stateball/`, and no page reads them
- the gallery, its lightbox, the diagrams of the Dazoo write-up, the project cards

Not touched: any colour, any font, any word, any page, any package, `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`, `README.md`.

### Going back

- revert the squash commit on main. Nothing outside the repo changes with this spec

## Tests

All seven in `tests/layout.spec.ts`, a new file; found by `playwright.config.ts`; run by `./check.sh` against the image it has just built. Part: wiring. Kind: end to end.

| Test | Criterion | Today |
| ---- | --------- | ---- |
| keeps the two nav icons at the right edge of the column on a phone | N1 | fails: `Expected: 351`, `Received: 218.1875` |
| puts the name, the links and the icons on one row on a desktop | N2 | passes. Seen to fail by S6 |
| gives each link of the nav, the footer and the way back a box that a finger can hit | T1 | fails: `Expected: >= 44`, `Received: 20`, at the first link, the name |
| leaves the gap of the header between the way back and the title of a write-up | W1 | fails: `Expected: >= 16`, `Received: 4` |
| spaces the paragraphs of the Sabermetric write-up 16 apart, as the other write-ups do | W2 | fails: `Expected: 16`, `Received: 24` |
| keeps a page title of one long word inside the column on a phone | T2 | fails: `Expected: <= 351`, `Received: 363.546875` |
| fits every page in the width of a phone, with nothing to scroll sideways | P1 | passes. Seen to fail by S7 |

- W3 has no test. A lint rule in `eslint.config.mjs` holds it: no class list may name a text size under 12 px
	- lint is the cheapest thing that can see it, and it sees every file; a browser test sees only the pages it opens
- how the expected results were made
	- 351, 280 and 1000: the edges of the column, from its width and its padding. 44: Q2. 16: the gap of the header and of the paragraphs. None is taken from a run of the changed code
- each test reads what a visitor sees: a position, a size, a width, at a stated width of the window. None reads a class name
- the title test writes the word into the title of `/photos`
	- on the live site Immich gives that word, and an end to end test never depends on a live outside thing
	- the styles that lay the word out are the site's own, from the built image. The word is the name that the album has
- the two tests that pass today are there to hold what is right today. Each is seen to fail once, in Code review (S6, S7)
- seen today, on the image built from main `3bd2a1a` with the tests of this spec: `6 failed`, `7 passed`. The six are the five of the table that fail, and a test for W3 that the lint rule has replaced. The `checks` run on the commit of Design shows the same
	- so the `checks` run is red until the Factory's last commit, and for no other cause
- seen to pass: on the image built from Design's copy, `13 passed`
