---
type: spec
description: "Bring the unit runner (Vitest) into publicpersona, and make the heatmap grid a piece of logic with a unit test for each edge of its rules. Reference for the promises of the grid, the exact setup of the runner, the lines this change owns in the shared files, and how each criterion is checked."
status: design
---
## Need

- the site has no test, and no runner
	- [[testing]] names a chain: test files, runner config, commands, one command, pipeline, main
	- the last three links are there: `./check.sh`, `checks.yml`, the ruleset on main
	- the first three are missing for unit tests: no `*.test.ts`, no `vitest.config.mts`, no `pnpm test`
- the rules of the heatmap cannot be tested where they are
	- they sit inside the render function of `src/components/Heatmap.tsx`
	- `tier` is private
	- the function reads the clock, so the same input gives a different grid each day
- no spec says what the heatmap must do
	- the promises below are read from the code at main `8a883a6`
	- they say what the code does today; each one is the owner's to accept or refuse in Design review

## Done looks like

### The part

- name: heatmap grid
- kind: logic, so its tests are unit tests ([[testing]], "which kind")
- path: `src/lib/heatmap-grid.ts`
- one function is its public surface

```ts
import type { HeatmapDay } from "./forgejo";

export interface HeatmapCell {
  date: string;
  count: number;
  tier: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapWeek {
  monthLabel: string | null;
  days: (HeatmapCell | null)[];
}

export function heatmapGrid(days: HeatmapDay[], today: string): HeatmapWeek[];
```

- what goes in
	- `days`: the entries, each a `date` as `YYYY-MM-DD` and a `count`, a whole number of 0 or more; in any order; at most one entry for a date
	- `today`: the last day of the grid, as `YYYY-MM-DD`
- what comes out
	- the weeks, oldest first
	- `monthLabel`: the text above the week, or `null` for none
	- `days`: always 7 places; place 0 is Sunday, place 6 is Saturday; `null` is a place with no day
- it reads no clock and no time zone: a date is a calendar day, and all arithmetic on it is in UTC

### Acceptance criteria: the promises

Each one is true or false of `heatmapGrid`. Each one is decided in the logic part, so each one is held by unit tests.

Range:

- **P1** the last day of the grid is `today`
- **P2** the first day of the grid is the Sunday on or before the day 364 days before `today`
	- so the grid holds 365 to 371 days
- **P3** the grid has 53 weeks, for every `today`
	- each week has 7 places, Sunday first
	- only the last week can have empty places, and only after `today`
	- when `today` is a Sunday, the last week holds that one day

Count:

- **P4** a day with no entry has a count of 0
- **P5** a day with an entry has the count of that entry; the order of the entries does not matter
- **P6** an entry for a day before the first day, or after `today`, is not in the grid

Tier:

- **P7** the tier of a day comes from its count

| Count      | Tier |
| ---------- | ---- |
| 0          | 0    |
| 1 to 2     | 1    |
| 3 to 5     | 2    |
| 6 to 9     | 3    |
| 10 or more | 4    |

Month labels:

- **P8** the first week always has a label: the month of its Sunday
- **P9** each later week has a label only when its Sunday is in a different month from the Sunday of the week before; the label is the month of its Sunday
	- so a month that starts on a Monday to a Saturday gets its label one week after the week that holds its first day
- **P10** two things follow from P8 and P9, and are accepted
	- the same month can be named twice: on the first week, and again near the end, when the grid starts and ends in that month
	- the first two weeks can both have a label, when the first week is the last of its month
- **P11** a label is the English name of the month in three letters: `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`, `Dec`

### Acceptance criteria: the component

- **C1** `src/components/Heatmap.tsx` gives `heatmapGrid` the UTC date of the moment the page is rendered, as `today`
	- this is what the page does today: the grid moves to the next day at 00:00 UTC, which is the afternoon in San Diego
	- check: the file reads the clock one time; `git grep -c 'new Date(' -- src/components/Heatmap.tsx` prints `src/components/Heatmap.tsx:1`
- **C2** `src/components/Heatmap.tsx` holds no rule of the grid
	- check: `git grep -nE 'getUTC|86400|MONTHS|function tier' -- src/components/Heatmap.tsx` prints nothing and exits 1
- **C3** the props of `Heatmap` are the same: `days` and `total`; `src/app/code/page.tsx` is not changed

### Acceptance criteria: the chain

Each one is checked on the branch, from the repo root.

- **S1** `vitest.config.mts` is at the repo root, and finds `src/lib/heatmap-grid.test.ts`
	- check: `pnpm test`, in the dev container, prints `Test Files  1 passed (1)` and `Tests  26 passed (26)`
- **S2** `pnpm test` runs Vitest one time and stops; it does not watch
	- check: the command of S1 returns to the prompt with exit code 0
- **S3** `./check.sh` runs the unit tests after the typecheck and before the image build
	- check: `./check.sh`, on the host, exits 0, and the line `Tests  26 passed (26)` comes before the first line of the image build
- **S4** the `checks` run on the last commit of this spec's pull request passes, and ran the unit tests
	- check: `gh pr checks <number>` shows `checks` as `pass`
	- check: `gh run view <run id> --log | grep -c 'Tests  26 passed (26)'` prints `1`
- **S5** the test file is the one from Design
	- check: `git diff <the commit that added it> HEAD -- src/lib/heatmap-grid.test.ts` prints nothing
- **S6** `README.md` has the parts list, the unit step and `pnpm test`, as "Approach" gives them
	- check: the format check of S3, and review
- **S7** the branch changes nine paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `A	_well/spec-unit-heatmap.md`
		- `M	check.sh`
		- `M	package.json`
		- `M	pnpm-lock.yaml`
		- `M	src/components/Heatmap.tsx`
		- `A	src/lib/heatmap-grid.test.ts`
		- `A	src/lib/heatmap-grid.ts`
		- `A	vitest.config.mts`

Checked in Code review, by breaking it once on purpose:

- **S8** in `src/lib/heatmap-grid.ts`, the limit of tier 1 is changed from 2 to 3; then `./check.sh` exits with a code that is not 0, a test named `is 2 for a count from 3 to 5` is shown as failed, and the image build does not start
	- the change is thrown away after

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

**The runner**

- in the dev container: `pnpm add -D vitest@5.0.3`
	- this is the pnpm command of the Vitest guide; pnpm 9 installs the `vite` that Vitest needs
	- 5.0.3, not 5.0.4: 5.0.4 is some hours old
	- Vitest 5 needs Node 22.12 or later; the dev container and the pipeline both run Node 22
	- no other package: no DOM library, no React plugin, no path plugin. The grid needs none. A later test that needs one brings it.
- `vitest.config.mts`, at the repo root, with exactly this content

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest's default also matches *.spec.ts, and tests/*.spec.ts belongs to Playwright.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- `package.json`: the script `"test": "vitest run"`
	- `vitest run`, not `vitest`: plain `vitest` watches when it has a terminal, and `check.sh` would then never end
- `check.sh`: one line, `$PNPM test`, directly after `$PNPM typecheck`

**The logic**

- new file `src/lib/heatmap-grid.ts`, with the surface given under "The part"
	- the type of `days` comes from `./forgejo` by `import type`, which is removed at build, so the test loads nothing of the client
	- the rules move here from `src/components/Heatmap.tsx`: `tier`, `MONTHS`, the fill, the weeks, the labels
	- `today` is read as a UTC day: `Date.parse(today + "T00:00:00Z")`, never a local time
- `src/components/Heatmap.tsx`
	- calls `heatmapGrid(days, new Date().toISOString().slice(0, 10))`, and draws what it returns
	- the label row shows `week.monthLabel`, or nothing for `null`
	- a cell uses `TIER_BG[day.tier]`; a `null` place is the empty `h-3 w-3` box, as today
	- `TIER_BG`, the `title` text, the legend and the caption stay in the component, with no change
	- the page shows the same as before the change

**The shared files: the lines this change owns**

Line numbers are those of main `8a883a6`. The task e2e-first-journey changes the same three files; every line not named here is not this change's.

- `check.sh`
	- one new line after line 27 (`$PNPM typecheck`): `$PNPM test`
	- lines 28 to 30 (the empty line, the comment and the image build) are not touched; what comes after the image build is not this change's
- `package.json`
	- one new line after line 14 (`"typecheck": "tsc --noEmit",`): `"test": "vitest run",`
	- line 34 (`"typescript": "^5"`) gets a comma, and one new line follows it: `"vitest": "^5.0.3"`
	- no other script, and no other package
- `pnpm-lock.yaml`: what `pnpm add -D vitest@5.0.3` writes
	- the second of the two tasks to merge will have a conflict here; it is solved by `pnpm install` after the rebase, never by hand
- `README.md`, four places
	- new section `## Parts`, put directly before line 12 (`## Run it`)

```md
## Parts

Each part of the code, the kind of test that holds it, and where it is. A test file sits beside the code it tests.

| Part         | Kind  | Test | Path                      |
| ------------ | ----- | ---- | ------------------------- |
| heatmap grid | logic | unit | `src/lib/heatmap-grid.ts` |
```

- `README.md`, continued
	- line 38 (the paragraph that starts `It runs the whole check set`) becomes

```md
It runs the whole check set in this order, and stops at the first failure:

1. the format check
2. the lint
3. the typecheck
4. the unit tests
5. the image build, which runs `pnpm build` and pushes nothing

Needs Podman and Node on the host. Steps 1 to 4 run in the dev container, which the script starts.
```

- `README.md`, continued
	- this change owns that whole block; a later step is a new item after item 5, added by the task that brings it
	- two new lines directly before line 47 (the `pnpm format` line): the line below, and an empty line

```md
`pnpm test`, in the container, runs the unit tests alone, once.
```

- `README.md`, continued
	- in the table of `## Layout`: line 68 (`src/lib/`) says `logic, and the clients for the two outside services`, and one new row follows line 69 (`public/`)

```md
| `src/lib/`                     | logic, and the clients for the two outside services                           |
| `public/`                      | images and other static files                                                 |
| `vitest.config.mts`            | the runner config: says which files are unit tests                            |
```

**Commits and the pull request**

- the tests are on the branch before any code
- then, in this order
	- `chore(test): set up Vitest and the unit step`: `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`, `check.sh`
	- `refactor(heatmap): move the grid rules into logic`: `src/lib/heatmap-grid.ts`, `src/components/Heatmap.tsx`
	- `docs(readme): list the parts and the unit command`: `README.md`
- the pull request title: `test: add the unit runner and the heatmap grid tests`

### Out of scope

- what the grid shows when `days` has two entries for one date
	- today the last entry wins, and no promise is made of it here
	- it is real on live data: Forgejo gives one entry for each 15 minutes, `src/lib/forgejo.ts` turns each into a date, so a day with work in two quarters of an hour has two entries, and its cell shows only the last
	- the rule that makes one entry for a date is "date from a timestamp", in the task unit-activity-rules
- a count below 0, a count that is not a whole number, and a `today` that is not a date: none can come from the callers
- the time zone of "today" (C1 keeps UTC), and the words of the `title` text (`1 contributions`)
- the total in the caption: an activity rule
- a test of the `Heatmap` component, or of `/code`: wiring, held end to end
- `src/lib/forgejo.ts`, `src/app/code/page.tsx`, and every other rule, part or page
- any row in the parts list but the heatmap grid: each later task adds the row of its part
- a DOM library, a coverage tool, a path plugin for `@/`
- Playwright, `tests/`, and any step after the image build
- `.github/workflows/checks.yml`, the dev container, the `Dockerfile`, the pre-commit hook: none needs a change
- the stale things the epic lists

### Going back

- revert the squash commit on main
	- the rules go back into the component; the page is the same before and after
	- the unit step leaves `check.sh`; the pipeline and the image do not change

## Tests

All in `src/lib/heatmap-grid.test.ts`, beside the code; found by `vitest.config.mts`; run by `pnpm test`. Part: heatmap grid. Kind: unit. 26 tests.

- how the expected results were made
	- each date and weekday is read from the calendar, and the reasoning is a comment in the test
	- none is taken from a run of the code
- failing today: the file imports `./heatmap-grid` and `vitest`, and neither is there

| Test | Criterion |
| ---- | --------- |
| the range of the grid: ends on today | P1 |
| the range of the grid: starts on the Sunday before the day 364 days before today | P2 |
| the range of the grid: starts on the day 364 days before today when that day is a Sunday | P2 |
| the range of the grid: holds 29 February when the range crosses one | P2 |
| the range of the grid: has 53 weeks | P3 |
| the range of the grid: still has 53 weeks when today is a Sunday | P3 |
| the range of the grid: gives a week its seven days in order, Sunday first | P3 |
| the range of the grid: leaves the places after today empty in the last week | P3 |
| the range of the grid: has only today in the last week when today is a Sunday | P3 |
| the count of a day: is 0 for a day with no entry | P4 |
| the count of a day: is the count of the entry for that day | P5 |
| the count of a day: does not depend on the order of the entries | P5 |
| the count of a day: leaves out an entry from before the first day | P6 |
| the count of a day: leaves out an entry from after today | P6 |
| the tier of a day: is 0 for a count of 0 | P7 |
| the tier of a day: is 1 for a count from 1 to 2 | P7 |
| the tier of a day: is 2 for a count from 3 to 5 | P7 |
| the tier of a day: is 3 for a count from 6 to 9 | P7 |
| the tier of a day: is 4 for a count of 10 or more | P7 |
| the month label of a week: is the month of its Sunday, for the first week | P8 |
| the month label of a week: is empty when its Sunday is in the same month as the Sunday before | P9 |
| the month label of a week: names a month that starts midweek on the first week whose Sunday is in it | P9 |
| the month label of a week: names a month that starts on a Sunday on the week of that Sunday | P9 |
| the month label of a week: names the same month twice when the grid starts and ends in it | P10 |
| the month label of a week: names two weeks in a row when the first week is the last of its month | P10 |
| the month label of a week: names each month of a year in three letters, in calendar order | P11, P9 |

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- P1 to P11, behaviour: a test, written first and kept
	- the branch type is `test`; the conventions give no line for it, so each piece is verified as its own type
- C1 to C3, a `refactor`: the tests still pass, and the checks given with each one
	- no test holds what the component draws; `/code` is an `async` Server Component that needs live data, so its hold is end to end and a smoke check, in later tasks
	- until then: Code review reads the component, and the owner looks at `/code` after the deploy
- S1 to S5, S7, S8, setup, as a `chore`: the checks accept it (S3, S4), and the real run proves it (S4, on the pull request)
	- a smoke check watches it after: none applies; the change calls no outside thing
- S6, `docs`: the format check, and review
