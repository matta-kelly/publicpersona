---
type: spec
description: "Make the three rules of the interface pieces of logic with a unit test for each edge: which link of the nav is active, how a repo card writes its commits, its date and its languages, and what the gallery does on open, close, next, previous and a key. Reference for the promises of the three parts, the questions the owner has to answer (the time zone of the date among them), why the gallery needs no DOM library, the public surface of each part, what the three components look like after, the lines this change owns in the shared files, and how each criterion is checked."
status: design
---
## Need

- the rules of the interface cannot be tested where they are
	- `isActive` is private in `src/components/Nav.tsx`
	- `langColor` and `formatDate` are private in `src/components/RepoCard.tsx`; the commits, the shares and the widths are written inside its JSX
	- open, close, next, previous and the keys of the gallery sit in the hooks of `src/app/photos/Gallery.tsx`
	- a test of a rule would have to draw a component in a fake browser, so it would not be a unit test ([[testing]], "a good test")
- two rules of the repo card take their answer from the machine
	- the date is written in the time zone of the server process
	- the number of commits is written in the language of the server process
	- neither is named anywhere: the card reads the same on the node only because the node sets neither
- no spec says what the nav, the repo card or the gallery must do
	- the promises below are read from the code at main `a284687`
	- two of them say something else than the code does today: C1 and C9
	- eight choices are listed under "The questions"; each one is the owner's to accept or refuse in Design review

## Done looks like

### The questions

Each one has an answer written into the promises. Another answer sends this spec back to Design before the Factory starts.

- **Q1, the time zone of the date on a repo card** (C4): the epic gives this to Design
	- as written: UTC, named in the code
	- why
		- the heatmap on the same page puts a contribution on its UTC date (`_well/spec-unit-activity-rules.md`, A1), and the grid ends on the UTC date
		- the node sets no time zone, so the live site shows the UTC date today: nothing changes there
		- GitHub, the next host of `/code`, writes every moment in UTC
	- cost of the answer as written: a repo made at 17:00 in San Diego on 1 March reads `Created Mar 2, 2025`
	- what changes: on a machine that is not on UTC (`pnpm dev` on a laptop in San Diego), the card now shows the UTC date
	- the other answers
		- San Diego (`America/Los_Angeles`): the owner's day; then the card and the heatmap of one page disagree about a day
		- the date as the host wrote it (the first ten characters): depends on the time zone of the host's server
		- the visitor's zone: the card becomes a Client Component, and the server and the browser draw a different text
- **Q2, one commit** (C1)
	- as written: `1 commit`; every other number, 0 also, has `commits`
	- today: `1 commits`. This is a `fix`: the live site changes for a repo with exactly one commit in the last 12 months
	- the other answer: `1 commits` stays; then the test `are written as 1 commit for a repo with one` is written again
- **Q3, the colours of the languages** (C8, C9)
	- as written: the table of 13 languages that is in the code today, and grey for any other
	- 11 of the 13 are the colour GitHub gives the language today; `CSS` is the one GitHub gave before (`#563d7c`, now `#663399`); `Butane` is not a language at GitHub, and its colour is the owner's
	- the table is the promise. A colour changes by a change to this table, in a spec
- **Q4, a share too small to write** (C6)
	- as written: a share below 0.05% reads `0.0%`, as today
	- the other answer: `<0.1%`
- **Q5, a page below a link** (N3)
	- as written: `/projects/stateball` keeps Projects active, as today
	- so the address of a picture, `/photos/img/<id>`, is below Photos; no page is drawn there
- **Q6, whether the gallery test needs a DOM library**: the epic gives this to Design
	- as written: no. No package comes in; `package.json` and `pnpm-lock.yaml` do not change
	- why
		- every rule the epic names is a rule about one number: which photo is open after something happens. It needs the open photo, what happened, and how many photos there are. It needs no document
		- a DOM library (jsdom or happy-dom, with a library that draws React into it) would test that the buttons and the key listener are connected to the rule. That is wiring, and wiring is held end to end ([[testing]], "which kind")
		- a fake browser is a fake: a unit test that needs one has a subject that is not logic ([[testing]], "a good test")
	- cost of the answer as written: no test holds the wiring of the gallery until `/photos` has an end to end journey. See "Out of scope"
- **Q7, the zone the unit tests run in**
	- as written: every unit test runs with the time zone `America/Los_Angeles`, by one line in `vitest.config.mts`
	- why: the pipeline and the dev container are on UTC. There, a card that reads the local time gives the UTC date, so no test of C4 could fail
		- seen on the build made for the run: with the line, three tests of C4 fail when the zone is taken out of the code; without the line, none
		- the 48 tests on main pass with the line
	- the other answer: no line; C4 is then held on the pipeline by the check of R2 alone, as the activity rules are by their R1
	- the language of the server cannot be set this way: Node reads it once, when it starts. C2 keeps a check (R2)
- **Q8, the `Photo` of the gallery**
	- as written: `Gallery.tsx` takes `Photo` from `src/lib/photos.ts` and loses its own
	- `_well/spec-unit-photo-rules.md` left the gallery its own copy, since that change did not touch the file. This one does

### The parts

Three parts. Each is logic, so its tests are unit tests ([[testing]], "which kind"). None reads the clock, the time zone or the language of the machine, the network, the document or anything of the environment.

**Nav active rule**

- path: `src/lib/nav.ts`
- one function is its public surface; it imports nothing

```ts
/** Whether the link to `href` is the active one on the page at `pathname`. */
export function isActiveLink(pathname: string, href: string): boolean;
```

- what goes in
	- `pathname`: the path of the page, as `usePathname` of Next.js gives it: it starts with `/`, and has no query and no fragment
	- `href`: the path a link of the nav leads to: `/`, or a path with no slash at the end
- what comes out: `true` when the nav marks that link

**Repo card formatting**

- path: `src/lib/repo-card.ts`
- one function is its public surface; the types below are exported with it

```ts
import type { RepoSummary } from "./activity";

/** One language of a repo, as its card shows it. */
export interface RepoCardLanguage {
  name: string;
  /** The name and the share, as text. */
  label: string;
  /** A CSS colour. */
  color: string;
  /** A CSS width: the language's piece of the bar. */
  width: string;
}

/** The texts of a repo's card that are made from its numbers and its date. */
export interface RepoCardView {
  commits: string;
  created: string;
  languages: RepoCardLanguage[];
}

export function repoCardView(repo: RepoSummary): RepoCardView;
```

- what goes in: a repo, as `activitySummary` gives it
	- `createdAt`: a moment in ISO 8601 form, with `Z` or an offset
	- `commitsLast12mo`: a whole number of 0 or more
	- `languages`: in the order the card shows them; `pct` is a share from 0 to 1
- what comes out: the texts the card writes as they are, and for each language its label, its colour and its width

**Gallery behaviour**

- path: `src/lib/gallery.ts`
- two functions are its public surface; the type below is exported with them

```ts
import type { ThumbnailSize } from "./photos";

/** One thing a visitor does in the gallery. */
export type GalleryEvent =
  | { type: "open"; index: number }
  | { type: "close" }
  | { type: "next" }
  | { type: "previous" }
  /** `key` is the `key` of a `KeyboardEvent`. */
  | { type: "key"; key: string };

/**
 * The open photo after an event: its place in the list, from 0, or `null` for none.
 * `open` is the open photo before the event, and `count` the number of photos.
 */
export function galleryStep(
  open: number | null,
  event: GalleryEvent,
  count: number,
): number | null;

/** The address of the picture of a photo, on this site. */
export function pictureAddress(id: string, place: "grid" | "open"): string;
```

- `galleryStep`
	- what goes in
		- `open`: `null`, or a whole number from 0 to `count - 1`
		- `event`: what happened. `index` of `open` is a whole number from 0 to `count - 1`. `key` is any text
		- `count`: the number of photos, a whole number of 0 or more; with `open` not `null`, 1 or more
	- what comes out: the open photo after the event, in the same form as `open`
- `pictureAddress`
	- what goes in: the id of a photo of the gallery, and the place the picture is drawn in
	- what comes out: the address the browser asks this site for
	- `ThumbnailSize` comes from `src/lib/photos.ts`, so the typecheck holds that the gallery asks only for a size the photo rules allow

### Acceptance criteria: the promises

Each one is true or false of the functions above. Each one is decided in a logic part, so each one is held by unit tests.

The nav, by `isActiveLink`. The links of the site are Home at `/`, Projects at `/projects`, Code at `/code` and Photos at `/photos`.

- **N1** the Home link is active on the home page, and on no other page
- **N2** any other link is active on its own page
- **N3** any other link is active on every page below its own, however deep (Q5)
	- its own page written with a slash at the end counts as below it
- **N4** a link is not active on a page that only looks like its own
	- a page whose name starts with the same letters: `/codex` is not Code
	- a page below another link that has its name: `/projects/code` is not Code
	- its own page in another case: `/Projects` is not Projects
- **N5** on a page below a link, that link is the only active one; on a page that no link leads to, no link is active
	- true for the four links of the site: none of them is below another

The repo card, by `repoCardView`.

- **C1** the commits read as the number, a space and `commits`; for exactly one commit, `1 commit` (Q2)
- **C2** the number has a comma after each group of three digits from the right, as in US English: `1,000`, `1,234,567`
	- the same wherever the server runs
- **C3** the creation date reads `Created Mar 1, 2025`: the word, the month as its three first letters in English, the day with no zero in front, a comma, the year in four digits
- **C4** the date is the UTC date of the moment the repo was made (Q1)
	- the same whatever offset the host writes the moment with, and wherever the server runs
- **C5** the card has one language for each language of the repo, in the order of the repo; a repo with no language has none
- **C6** the label of a language is its name, a space, and its share as a percentage with one decimal: `TypeScript 75.0%`
	- rounded to the nearest tenth; a share exactly halfway goes up
	- so a share below 0.05% reads `0.0%` (Q4)
- **C7** the width of a language in the bar is its share as a percentage with two decimals: `75.00%`
- **C8** a language of the table has the colour of the table (Q3)

| Language   | Colour    |
| ---------- | --------- |
| TypeScript | `#3178c6` |
| JavaScript | `#f1e05a` |
| Python     | `#3572A5` |
| Go         | `#00ADD8` |
| Rust       | `#dea584` |
| YAML       | `#cb171e` |
| Shell      | `#89e051` |
| SQL        | `#e38c00` |
| CSS        | `#563d7c` |
| HTML       | `#e34c26` |
| Dockerfile | `#384d54` |
| Butane     | `#cccccc` |
| Markdown   | `#083fa1` |

- **C9** any other language is grey, `#9ca3af`
	- the name is compared as the host gave it: `typescript` is not in the table
	- new: today a language named like a property that every object has (`constructor`) gets no colour at all. No host gives such a name; the promise has no exception for it

The gallery, by `galleryStep` and `pictureAddress`.

- **G1** opening a photo opens that photo, also when another one is open
- **G2** closing leaves no photo open
- **G3** next opens the photo after the open one; from the last photo, the first
- **G4** previous opens the photo before the open one; from the first photo, the last
- **G5** in a gallery of one photo, next and previous keep that photo open
- **G6** three keys do something: Escape closes, the right arrow is next, the left arrow is previous
- **G7** any other key changes nothing
- **G8** with no photo open, closing, next, previous and every key change nothing: only opening a photo opens one
- **G9** the picture of a photo in the grid is asked for at `/photos/img/<id>?size=thumbnail`, and the picture of the open photo at `/photos/img/<id>?size=preview`

### Acceptance criteria: the code around the rules

Each one is checked on the branch, from the repo root.

- **R1** the three logic files read no clock, no local time, no network, no document and nothing of the environment
	- check: `git grep -nE 'toLocale|Date\.now|new Date\(\)|fetch|process\.|document|window' -- src/lib/nav.ts src/lib/repo-card.ts src/lib/gallery.ts` prints nothing and exits 1
	- check: `git grep -n '^import' -- src/lib/nav.ts src/lib/repo-card.ts src/lib/gallery.ts` prints two lines, and both start with `import type`
- **R2** the card names its language and its time zone
	- check: `git grep -c '"en-US"' -- src/lib/repo-card.ts` prints `src/lib/repo-card.ts:2`
	- check: `git grep -c 'timeZone: "UTC"' -- src/lib/repo-card.ts` prints `src/lib/repo-card.ts:1`
	- why a check and not a test: no test can change the language of a server that has started
- **R3** the three components hold no rule
	- check: `git grep -nE 'toFixed|toLocale|startsWith|#[0-9a-fA-F]{6}|size=|"Escape"|"Arrow|% photos\.length' -- src/components/Nav.tsx src/components/RepoCard.tsx src/app/photos/Gallery.tsx` prints nothing and exits 1
- **R4** `Photo` is declared in one place (Q8)
	- check: `git grep -n 'interface Photo' -- src` prints one line, and it is in `src/lib/photos.ts`
- **R5** the three components draw the same as before, but for C1 and C9
	- check: each file is the one under "Approach"; `git diff origin/main...HEAD --numstat -- src/components src/app` prints these three lines
		- `15	28	src/app/photos/Gallery.tsx`
		- `2	6	src/components/Nav.tsx`
		- `12	44	src/components/RepoCard.tsx`
	- check: `pnpm typecheck` holds the shapes between the rules and the components; `pnpm lint` holds the hooks of the gallery
	- no test holds the three components: see "Out of scope"

### Acceptance criteria: the chain

Each one is checked on the branch, from the repo root.

- **S1** `pnpm test`, in the dev container, finds six test files and passes
	- check: it shows `Test Files  6 passed (6)` and `Tests  157 passed (157)`, and returns with exit code 0
	- 157 is the 48 tests on main `a284687`, the 32 of unit-photo-rules, and the 77 of this spec
	- when main has another number of unit tests by then: the numbers are those of main, plus three files and 77 tests
	- Vitest colours these lines, in a pipe also; a check by `grep` looks for `157 passed`
- **S2** `./check.sh`, on the host, exits 0
	- check: the line with `157 passed` comes before the first line of the image build
- **S3** the `checks` run on the last commit of the pull request of this branch passes, and ran the unit tests
	- check: `gh pr checks test/unit-interface-rules` shows `checks` as `pass`
	- check: `gh run view <run id> --log | grep -c -F '157 passed'` prints `1`
- **S4** the three test files are the ones from Design
	- check: `git diff <the commit that added them> HEAD -- src/lib/nav.test.ts src/lib/repo-card.test.ts src/lib/gallery.test.ts` prints nothing
- **S5** the unit tests run in `America/Los_Angeles` (Q7)
	- check: `vitest.config.mts` is the one under "Approach"
	- check: S7
- **S6** `README.md` lists the three parts, as "Approach" gives them
	- check: the format check of S2, and review
- **S7** the branch changes twelve paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `A	_well/spec-unit-interface-rules.md`
		- `M	src/app/photos/Gallery.tsx`
		- `M	src/components/Nav.tsx`
		- `M	src/components/RepoCard.tsx`
		- `A	src/lib/gallery.test.ts`
		- `A	src/lib/gallery.ts`
		- `A	src/lib/nav.test.ts`
		- `A	src/lib/nav.ts`
		- `A	src/lib/repo-card.test.ts`
		- `A	src/lib/repo-card.ts`
		- `M	vitest.config.mts`
	- so `package.json` and `pnpm-lock.yaml` do not change: the branch installs nothing, and the rule on the age of a package has nothing to check
	- so `check.sh`, `tests/`, `.github/`, `src/lib/photos.ts` and `src/app/code/page.tsx` do not change

Checked in Code review, by breaking it once on purpose:

- **S8** in `src/lib/repo-card.ts`, the line `timeZone: "UTC",` is taken out; then `./check.sh` exits with a code that is not 0, a test named `is the UTC date, in the first second of that day` is shown as failed, and the image build does not start
	- this one break shows the rule of C4 and the line of S5 together
	- the change is thrown away after

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

**Needs first**

- unit-photo-rules is on main: `src/lib/photos.ts` exports `ThumbnailSize` and `Photo`
	- the branch takes main in by a merge before the first commit of the build
	- when it is not on main: the build does not start

**The nav**

- new file `src/lib/nav.ts`, with the surface given under "The parts", the comment of that block included
	- the rule moves from `isActive` in `src/components/Nav.tsx`, as it is; only the name changes

```ts
export function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- `src/components/Nav.tsx`
	- a new line `import { isActiveLink } from "@/lib/nav";`, directly after the line that imports `ThemeToggle`
	- the function `isActive` and the empty line after it are gone
	- the line `const active = isActive(pathname, l.href);` becomes `const active = isActiveLink(pathname, l.href);`
	- no other line changes; the list `links` stays in the component

**The repo card**

- new file `src/lib/repo-card.ts`, with the surface given under "The parts", the comments of that block included
	- `repoCardView` is the only exported function; what it uses inside is not exported
- under the two interfaces, in this order

```ts
// A Map has no key of its own making, so a language named like a property of every object gets no colour from it.
const LANGUAGE_COLORS = new Map([
  ["TypeScript", "#3178c6"],
  ["JavaScript", "#f1e05a"],
  ["Python", "#3572A5"],
  ["Go", "#00ADD8"],
  ["Rust", "#dea584"],
  ["YAML", "#cb171e"],
  ["Shell", "#89e051"],
  ["SQL", "#e38c00"],
  ["CSS", "#563d7c"],
  ["HTML", "#e34c26"],
  ["Dockerfile", "#384d54"],
  ["Butane", "#cccccc"],
  ["Markdown", "#083fa1"],
]);

const OTHER_LANGUAGE_COLOR = "#9ca3af";

// The locale and the time zone are named, so the card reads the same wherever the server runs.
const WHOLE_NUMBER = new Intl.NumberFormat("en-US");
const DAY = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function repoCardView(repo: RepoSummary): RepoCardView {
  const commits = repo.commitsLast12mo;
  return {
    commits: `${WHOLE_NUMBER.format(commits)} ${commits === 1 ? "commit" : "commits"}`,
    created: `Created ${DAY.format(new Date(repo.createdAt))}`,
    languages: repo.languages.map((language) => ({
      name: language.name,
      label: `${language.name} ${(language.pct * 100).toFixed(1)}%`,
      color: LANGUAGE_COLORS.get(language.name) ?? OTHER_LANGUAGE_COLOR,
      width: `${(language.pct * 100).toFixed(2)}%`,
    })),
  };
}
```

- `src/components/RepoCard.tsx`, after the change, in full

```tsx
import type { RepoSummary } from "@/lib/activity";
import { repoCardView } from "@/lib/repo-card";

export default function RepoCard({ repo }: { repo: RepoSummary }) {
  const view = repoCardView(repo);

  return (
    <li className="rounded-md border border-black/5 p-5 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {repo.name}
          </a>
        </h3>
        <span className="text-muted text-sm whitespace-nowrap">{view.commits}</span>
      </div>

      {repo.description && <p className="text-muted mt-2 text-sm">{repo.description}</p>}

      <p className="text-muted mt-3 text-xs">{view.created}</p>

      {view.languages.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            {view.languages.map((l) => (
              <div
                key={l.name}
                style={{ width: l.width, backgroundColor: l.color }}
                title={l.label}
              />
            ))}
          </div>
          <ul className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {view.languages.map((l) => (
              <li key={l.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span>{l.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
```

- what stays in the component, and why it is not a rule of the formatting
	- the name, the link and the description of the repo: written as the activity rules gave them
	- no paragraph for an empty description, and no bar for a repo with no language: what is drawn, decided from an empty text and from the empty list of C5

**The gallery**

- new file `src/lib/gallery.ts`, with the surface given under "The parts", the comments of that block included
	- `galleryStep` and `pictureAddress` are the only exported functions; what they use inside is not exported
- under the type `GalleryEvent`, in this order

```ts
const KEY_EVENTS = new Map<string, GalleryEvent>([
  ["Escape", { type: "close" }],
  ["ArrowRight", { type: "next" }],
  ["ArrowLeft", { type: "previous" }],
]);

export function galleryStep(
  open: number | null,
  event: GalleryEvent,
  count: number,
): number | null {
  switch (event.type) {
    case "open":
      return event.index;
    case "close":
      return null;
    case "next":
      return open === null ? null : (open + 1) % count;
    case "previous":
      return open === null ? null : (open - 1 + count) % count;
    case "key": {
      const meant = KEY_EVENTS.get(event.key);
      return meant ? galleryStep(open, meant, count) : open;
    }
  }
}

const SIZES: Record<"grid" | "open", ThumbnailSize> = { grid: "thumbnail", open: "preview" };

export function pictureAddress(id: string, place: "grid" | "open"): string {
  return `/photos/img/${id}?size=${SIZES[place]}`;
}
```

- `src/app/photos/Gallery.tsx`, after the change, from its first line down to the line `const current = ...`, which stays

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { galleryStep, pictureAddress, type GalleryEvent } from "@/lib/gallery";
import type { Photo } from "@/lib/photos";

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const count = photos.length;
  const send = useCallback(
    (event: GalleryEvent) => setOpenIndex((open) => galleryStep(open, event, count)),
    [count],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => send({ type: "key", key: e.key });
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, send]);

```

- `src/app/photos/Gallery.tsx`, below that line: seven lines change, and no other
	- `onClick={() => setOpenIndex(i)}` becomes `onClick={() => send({ type: "open", index: i })}`
	- ``src={`/photos/img/${p.id}?size=thumbnail`}`` becomes `src={pictureAddress(p.id, "grid")}`
	- `onClick={close}`, on the dialog, becomes `onClick={() => send({ type: "close" })}`
	- `prev();` becomes `send({ type: "previous" });`
	- `next();` becomes `send({ type: "next" });`
	- `close();`, in the button, becomes `send({ type: "close" });`
	- ``src={`/photos/img/${current.id}?size=preview`}`` becomes `src={pictureAddress(current.id, "open")}`
- what stays in the component, and why it is not a rule of the behaviour
	- the key listener on the document while a photo is open, the page that does not scroll behind an open photo, the click on the dark area that closes and the click on the photo that does not: the connection of the browser to the rule
	- the texts `Photo 2 of 5`, `2 / 5`, `Open <file name>`, and the labels of the three buttons

**The runner config**

`vitest.config.mts`, after the change, in full:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest's default also matches *.spec.ts, and tests/*.spec.ts belongs to Playwright.
    include: ["src/**/*.test.{ts,tsx}"],
    // The pipeline's clock is on UTC, where a rule that reads the local time gives the UTC answer.
    // San Diego is never on UTC, so there it gives a different one, and a test fails.
    env: { TZ: "America/Los_Angeles" },
  },
});
```

**The shared files: the lines this change owns**

Each place is given by the text of a line, as the file is on main `a284687`. Every line not named here is not this change's.

- `check.sh`, `package.json`, `pnpm-lock.yaml`: no line
- `vitest.config.mts`: the three lines above, and no other
- `README.md`, one place: the table under `## Parts`
	- three new rows, directly after the row that starts `| photo rules`
	- `pnpm format`, in the dev container, gives the padding
	- with the row of unit-photo-rules on main, the table then reads

```md
| Part                 | Kind  | Test | Path                      |
| -------------------- | ----- | ---- | ------------------------- |
| heatmap grid         | logic | unit | `src/lib/heatmap-grid.ts` |
| activity rules       | logic | unit | `src/lib/activity.ts`     |
| photo rules          | logic | unit | `src/lib/photos.ts`       |
| nav active rule      | logic | unit | `src/lib/nav.ts`          |
| repo card formatting | logic | unit | `src/lib/repo-card.ts`    |
| gallery behaviour    | logic | unit | `src/lib/gallery.ts`      |
```

- `README.md`, continued
	- no other line: the row of `src/lib/` in the table of `## Layout` already says `logic, and the clients for the two outside services`

**Commits and the pull request**

- the branch is `test/unit-interface-rules`, made from main `a284687`
	- main comes in again only by a merge; never a rebase, never a force push
- the tests are on the branch before any code
- then, in this order
	- `refactor(nav): move the active rule into logic`: `src/lib/nav.ts`, `src/components/Nav.tsx`
	- `refactor(photos): move the gallery behaviour into logic`: `src/lib/gallery.ts`, `src/app/photos/Gallery.tsx`
	- `refactor(code): move the repo card formatting into logic`: `src/lib/repo-card.ts`, `src/components/RepoCard.tsx`
		- in this commit, the commits always read `commits`, and the colours are a plain object read by `LANG_COLORS[name] ?? "#9ca3af"`, as the component did; two tests fail, one of C1 and one of C9
	- `fix(code): write one commit in the singular`: `src/lib/repo-card.ts`
	- `fix(code): give grey to every language that is not in the table`: `src/lib/repo-card.ts`
		- the file is now the one above; all 157 tests pass
	- `test: run the unit tests in a time zone that is not UTC`: `vitest.config.mts`
	- `docs(readme): list the three parts of the interface`: `README.md`
- the pull request: the owner opens it, as a draft, from this branch
	- title: `test: add the interface rules and their unit tests`
	- body, one line: `Spec: _well/spec-unit-interface-rules.md`

### Out of scope

- a test of `Nav`, `RepoCard` or `Gallery` as drawn: wiring, held end to end ([[testing]], "which kind")
	- the nav: the journey `tests/first-journey.spec.ts` goes through it today; it does not look at which link is marked
	- the repo card and the gallery: `/code` and `/photos` need real data, so their journeys are smoke checks, parked in the epic
	- until then: the typecheck and the lint hold the three components, Code review reads R5, and the owner looks at the three after the deploy
	- an end to end test that the nav marks the link of the page: a new promise of wiring, and no task holds it
- the texts of the gallery: `Photo 2 of 5`, `2 / 5`, `Open <file name>`, the labels of the buttons
- a key pressed with Alt, Ctrl, Shift or the command key: read as the key alone, as today
	- so Alt with the left arrow, which is Back in some browsers, also moves the gallery
- an `open` event for a place that is not in the list, a `count` that does not match the list, and a list that changes while a photo is open: none comes from the component
- an id in `pictureAddress` that is not an asset id: `galleryPhotos` gives the ids, and the route refuses any other (`_well/spec-unit-photo-rules.md`, I5)
- the list of the four links, their order and their labels
- a link of the nav that is below another link of the nav: there is none; with one, N5 is written again
- a `pathname` with a query, a fragment, or two slashes in a row: `usePathname` gives none
- a creation date that is not a moment in ISO 8601 form, a number of commits below 0 or not whole, a share outside 0 to 1: none comes from the activity rules
- the shares of a card that do not add up to 100.0% after rounding
- two languages of one repo with the same name: none comes from a host
- the colour GitHub gives a language today, and a language that is missing from the table (Q3)
- the name, the link and the description of the repo on the card
- the heatmap's own texts (`1 contributions`, the total): `_well/spec-unit-heatmap.md` left them out, and no task holds them
- `src/lib/photos.ts`, `src/app/photos/page.tsx`, the route handler: the task unit-photo-rules
- any other row in the parts list
- any package, `check.sh`, the Playwright config, the pipeline, the dev container, the `Dockerfile`
- the stale things the epic lists

### Going back

- revert the squash commit on main
	- the rules go back into the three components; `1 commits` is back
	- the unit tests run in the zone of the machine again
	- nothing outside `src/`, `README.md` and `vitest.config.mts` changes; the image and the pipeline are the same

## Tests

Three files, each beside the code it tests; found by `vitest.config.mts`; run by `pnpm test`. Kind: unit. 77 tests.

- how the expected results were made
	- the nav: each path is written out, and the answer is read from N1 to N5
	- the repo card: each text is written out by hand from C1 to C9
		- each moment is written with its offset, and the UTC date it stands for is in the name of the test or in a comment
		- each share is a division written in the test: 1 of 16 is 6.25%
		- the colours are the table of C8
	- the gallery: each place is counted by hand, from 0, in a gallery of 5, 2 or 1 photos
	- none is taken from a run of the code
- every test goes through `isActiveLink`, `repoCardView`, `galleryStep` or `pictureAddress`; none draws a component, none reads the clock, and none needs a fake
- failing today: each file imports a module that is not there (`./nav`, `./repo-card`, `./gallery`)
	- seen: `pnpm test`, in the dev container, on this branch: `Test Files  3 failed | 2 passed (5)`, `Tests  48 passed (48)`, and for each of the three `Error: Cannot find module`
- each of the 77 was also seen to fail alone, against a build of the rules made for the run, broken in one place at a time (56 breaks), and thrown away
	- with that build unbroken, and `src/lib/photos.ts` as its spec gives it: all 77 pass, in UTC and in `America/Los_Angeles`, and `pnpm format:check`, `pnpm lint` and `pnpm typecheck` pass
	- with that build holding the rules as the components hold them today, in `America/Los_Angeles`, five tests fail
		- `are written as 1 commit for a repo with one`: Q2
		- `is grey for a language with the name of something every object has`: C9
		- `is the UTC date, in the first second of that day`, `is the UTC date when the host writes the moment with an offset behind UTC`, `is in the new year from midnight UTC on 1 January`: Q1; in UTC, where the node is, these three pass

`src/lib/nav.test.ts`. Part: nav active rule. 14 tests.

| Test | Criterion |
| ---- | --------- |
| the Home link: is active on the home page | N1 |
| the Home link: is not active on the page of another link | N1 |
| the Home link: is not active on a page below another link | N1 |
| a link other than Home: is active on its own page | N2 |
| a link other than Home: is active on a page directly below its own | N3 |
| a link other than Home: is active on a page two levels below its own | N3 |
| a link other than Home: is active on its own page written with a slash at the end | N3 |
| a link other than Home: is not active on the home page | N2, N3 |
| a link other than Home: is not active on the page of another link | N2, N3 |
| a link other than Home: is not active on a page whose name only starts with the same letters | N4 |
| a link other than Home: is not active on a page below another link that has its name | N4 |
| a link other than Home: is not active on its own page written in another case | N4 |
| a page that no link leads to: has no active link | N5 |
| a page below a link: has that link as its only active link | N5 |

`src/lib/repo-card.test.ts`. Part: repo card formatting. 31 tests.

| Test | Criterion |
| ---- | --------- |
| the commits of a repo: are written as 0 commits for a repo with none | C1 |
| the commits of a repo: are written as 1 commit for a repo with one | C1 |
| the commits of a repo: are written as 2 commits for a repo with two | C1 |
| the commits of a repo: have no comma below a thousand | C2 |
| the commits of a repo: have a comma after the thousands | C2 |
| the commits of a repo: have a comma after the millions also | C2 |
| the creation date of a repo: is written as the word Created, the month in three letters, the day and the year | C3 |
| the creation date of a repo: has a day of two digits written in full | C3 |
| the creation date of a repo: names May, June, July and September in three letters, with no full stop | C3 |
| the creation date of a repo: is the UTC date, in the first second of that day | C4 |
| the creation date of a repo: is the UTC date, in the last second of that day | C4 |
| the creation date of a repo: is the UTC date when the host writes the moment with an offset behind UTC | C4 |
| the creation date of a repo: is the UTC date when the host writes the moment with an offset ahead of UTC | C4 |
| the creation date of a repo: is in the old year in the last second of 31 December UTC | C4, C3 |
| the creation date of a repo: is in the new year from midnight UTC on 1 January | C4, C3 |
| the creation date of a repo: is 29 February for a repo made on the leap day | C3 |
| the languages of a card: are an empty list for a repo with no language | C5 |
| the languages of a card: are one for each language of the repo, in the order of the repo | C5 |
| the label of a language: is its name, a space, and its share as a percentage with one decimal | C6 |
| the label of a language: says 100.0% for the only language of a repo | C6 |
| the label of a language: rounds a third down and two thirds up | C6 |
| the label of a language: rounds a share that is exactly halfway up | C6 |
| the label of a language: says 0.0% for a share below a twentieth of a percent | C6 |
| the width of a language in the bar: is its share as a percentage with two decimals | C7 |
| the width of a language in the bar: is 100.00% for the only language of a repo | C7 |
| the width of a language in the bar: keeps the hundredths of a third and of two thirds | C7 |
| the width of a language in the bar: is not 0 for a share that the label writes as 0.0% | C7 |
| the colour of a language: is the one the table gives, for each language of the table | C8 |
| the colour of a language: is grey for a language that is not in the table | C9 |
| the colour of a language: is grey for a language of the table written in another case | C9 |
| the colour of a language: is grey for a language with the name of something every object has | C9 |

`src/lib/gallery.test.ts`. Part: gallery behaviour. 32 tests.

| Test | Criterion |
| ---- | --------- |
| opening a photo: opens the first photo when it is chosen | G1 |
| opening a photo: opens a photo in the middle when it is chosen | G1 |
| opening a photo: opens the last photo when it is chosen | G1 |
| opening a photo: opens the photo that is chosen when another one is open | G1 |
| closing: leaves no photo open | G2 |
| closing: changes nothing when no photo is open | G8 |
| next: opens the photo after the open one | G3 |
| next: opens the last photo from the one before it | G3 |
| next: opens the first photo from the last one | G3 |
| next: keeps the only photo of a gallery open | G5 |
| next: changes nothing when no photo is open | G8 |
| previous: opens the photo before the open one | G4 |
| previous: opens the first photo from the one after it | G4 |
| previous: opens the last photo from the first one | G4 |
| previous: keeps the only photo of a gallery open | G5 |
| previous: changes nothing when no photo is open | G8 |
| a gallery of two photos: goes from the second photo to the first with next | G3 |
| a gallery of two photos: goes from the first photo to the second with previous | G4 |
| the Escape key: closes the open photo | G6 |
| the Escape key: changes nothing when no photo is open | G8 |
| the right arrow key: opens the photo after the open one | G6 |
| the right arrow key: opens the first photo from the last one | G6, G3 |
| the right arrow key: opens no photo when none is open | G8 |
| the left arrow key: opens the photo before the open one | G6 |
| the left arrow key: opens the last photo from the first one | G6, G4 |
| the left arrow key: opens no photo when none is open | G8 |
| any other key: leaves the open photo open, for a letter | G7 |
| any other key: leaves the open photo open, for the up and the down arrow | G7 |
| any other key: leaves the open photo open, for Enter, the space bar and Tab | G7 |
| any other key: opens no photo when none is open | G8 |
| the address of a picture: asks for the thumbnail of the photo, in the grid | G9 |
| the address of a picture: asks for the preview of the photo, when the photo is open | G9 |

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- C1 and C9, each a `fix`: a test, written first and kept
- N1 to N5, C2 to C8, G1 to G9, behaviour that had no test: a test, written first and kept
	- the branch type is `test`; the conventions give no line for it, so each piece is verified as its own type
- R1 to R5, a `refactor`: the tests that exist still pass, and the checks given with each one
	- no test holds the three components; until the later tasks, the typecheck and the lint hold them, Code review reads R5, and the owner looks at the nav, `/code` and `/photos` after the deploy
- S1 to S5, S7, S8, the chain: the checks accept it (S2, S3), and the real run proves it (S3, on the pull request)
	- a smoke check watches it after: none is there yet; it is parked in the epic
- S6, `docs`: the format check, and review
