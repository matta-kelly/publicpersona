---
type: spec
description: "Make the activity rules of /code a piece of logic with unit tests, and leave the Forgejo client with nothing but the calls. Reference for the promises of the rules (the day of a contribution, the count of a day, the total, the language shares, the order of the repos), the open question of what one day's count is, what a git host has to hand to the rules, the lines this change owns in the shared files, and how each criterion is checked."
status: done
---
## Need

- the rules of `/code` cannot be tested where they are
	- they sit in `src/lib/forgejo.ts`, between the calls to Forgejo
	- a test of a rule would need a fake of the network, so it would not be a unit test ([[testing]], "a good test")
- `/code` is planned to read GitHub in place of Forgejo
	- the client will be thrown away; the rules must stay, with their tests
	- so the rules can name no host, and the client can hold no rule
- one rule is wrong on the live site today
	- Forgejo gives one entry for each quarter of an hour that has a contribution
	- the client turns each entry into a date, so a day with work in two quarters of an hour has two entries
	- the heatmap grid keeps the last entry for a date
	- so a cell shows the last quarter of an hour of a day, not the day; the total under the grid adds every entry, so it does not match the cells
	- `_well/spec-unit-heatmap.md` left this out and pointed here
- no spec says what `/code` must do
	- the promises below are read from the code at main `07f2a7e`
	- A2 is new; every other one says what the code does today
	- each one is the owner's to accept or refuse in Design review

## Done looks like

### The question: what one day's count is

- **A2, as written here**: the count of a day is the sum of the counts of the entries of that day
	- a day with 2, 3 and 4 contributions in three quarters of an hour shows 9
	- the cells then add up to the total
	- it changes what the live site shows: a `fix`
- **the other answer**: the count of a day is the count of its last entry, as today
	- then this spec goes back to Design before the Factory starts; nothing of it is built as it is
	- A2 is written again, and says which entry is "the last": the latest timestamp, or the last one the host gave
	- one test is written again: `is the sum of the entries of that day`
	- no `fix`: the live site shows the same as today
	- A4 stays, and gets one more line: the total is then larger than the sum of the cells
	- nothing else in this spec changes

### The part

- name: activity rules
- kind: logic, so its tests are unit tests ([[testing]], "which kind")
- path: `src/lib/activity.ts`
- one function is its public surface; the types below are exported with it

```ts
/** One count from the host, at one moment. */
export interface ContributionEntry {
  /** Seconds since 1970-01-01T00:00:00Z. */
  timestamp: number;
  count: number;
}

/** One repo, as the host gives it. */
export interface RepoSource {
  name: string;
  description: string;
  htmlUrl: string;
  createdAt: string;
  /** Bytes of code for each language name. */
  languageBytes: Record<string, number>;
  commitsLast12mo: number;
}

/** What a git host gives, before any rule. */
export interface ActivitySource {
  contributions: ContributionEntry[];
  repos: RepoSource[];
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface RepoLanguage {
  name: string;
  bytes: number;
  pct: number;
}

export interface RepoSummary {
  name: string;
  description: string;
  htmlUrl: string;
  createdAt: string;
  languages: RepoLanguage[];
  commitsLast12mo: number;
}

export interface ActivitySummary {
  totalContributionsLast12mo: number;
  heatmap: HeatmapDay[];
  repos: RepoSummary[];
}

export function activitySummary(source: ActivitySource): ActivitySummary;
```

- what goes in
	- `contributions`: any number of entries, in any order, with any number of entries for one day; `count` is a whole number of 0 or more
	- `repos`: in the order the host gave them; `languageBytes` can be empty; each number of bytes is a whole number above 0
- what comes out
	- `heatmap`: one entry for each day, as `YYYY-MM-DD`; this is what `heatmapGrid` takes as `days`
	- `totalContributionsLast12mo`: one number
	- `repos`: each repo with its `languages` in place of `languageBytes`; `pct` is a share from 0 to 1
- it reads no clock, no time zone, no network and nothing of the environment
- it names no host: a later client for GitHub gives the same `ActivitySource`, and no rule changes
	- a host that gives a date in place of a moment gives that date's 00:00:00 UTC as `timestamp`
- `HeatmapDay`, `RepoLanguage`, `RepoSummary` and `ActivitySummary` move here from `src/lib/forgejo.ts`, with every name and field as it is

### Acceptance criteria: the promises

Each one is true or false of `activitySummary`. Each one is decided in the logic part, so each one is held by unit tests.

The days:

- **A1** a contribution belongs to the UTC date of its timestamp
	- so work at 17:00 in San Diego, in summer, is on the next day's cell
	- this is what the page does today, and it matches the grid, which ends on the UTC date
- **A2** the count of a day is the sum of the counts of the entries of that day; the order of the entries does not matter
	- **no test for: the order of the entries**
	- the open question above
- **A3** the heatmap has one entry for each date that has an entry from the host, and none for any other date
	- the order of the entries is no promise: the grid takes any order

The total:

- **A4** the total is the sum of the counts of every entry the host gives; with no entry it is 0
	- **no test for: the total with no entry**
	- the rule cuts nothing to a range: "the last 12 months" in the caption is the range the host answers for
	- with A2, the total is the sum of the counts of the days

The languages of a repo:

- **A5** the share of a language is its bytes divided by the bytes of all languages of that repo
	- a share is a number from 0 to 1; the shares of a repo add up to 1
- **A6** the languages are in order of bytes, the most first; languages with equal bytes keep the order the host gave
	- **no test for: languages with equal bytes**
- **A7** a repo with no language has an empty list of languages
	- **no test**

The repos:

- **A8** the repos are in order of commits in the last 12 months, the most first; repos with equal commits keep the order the host gave
	- **no test for: repos with equal commits**
- **A9** every repo the host gives is in the list, a repo with no commits also; its name, description, link, creation date and number of commits are the ones the host gave
	- **no test for: a repo with no commits**
	- **no test for: the fields the host gave**

### Acceptance criteria: the code around the rules

Each one is checked on the branch, from the repo root.

- **R1** `src/lib/activity.ts` reads no clock, no local time, no network and nothing of the environment, and names no host
	- check: `git grep -nE 'getDate\(|getMonth\(|getFullYear\(|getHours\(|toLocale|Date\.now|new Date\(\)|fetch|process\.' -- src/lib/activity.ts` prints nothing and exits 1
	- check: `git grep -ni -e forgejo -e github -- src/lib/activity.ts` prints nothing and exits 1
	- check: `git grep -n '^import' -- src/lib/activity.ts` prints nothing and exits 1
	- why a check and not a test: the pipeline runs on UTC, so a rule that read the local time would pass every test there
- **R2** `src/lib/forgejo.ts` holds no rule: it sends the calls and gives an `ActivitySource`
	- check: `git grep -nE '\.sort\(|\.reduce\(|\.slice\(|pct' -- src/lib/forgejo.ts` prints nothing and exits 1
	- check: `git grep -n '^export' -- src/lib/forgejo.ts` prints one line, and it holds `export async function fetchActivity(): Promise<ActivitySource>`
- **R3** `src/lib/forgejo.ts` sends the same calls as before: the same four paths, the same headers, the same `revalidate` and tags, the same `since`
	- check: review of the diff of that file against "Approach"; no test holds the client until the task integration-forgejo, which is parked
- **R4** no file but the page takes anything from the client
	- check: `git grep -cE 'from "(@/lib|\.)/forgejo"' -- src` prints one line, `src/app/code/page.tsx:1`
- **R5** `src/app/code/page.tsx` shows the same two things as before: the page with the activity, or `Activity unavailable right now. Try again later.` when the client throws
	- check: `git diff origin/main...HEAD --stat -- src/app/code/page.tsx` shows 3 lines put in and 2 taken out; they are the lines under "Approach"
- **R6** `src/components/Heatmap.tsx`, `src/components/RepoCard.tsx` and `src/lib/heatmap-grid.ts` each change in one line: where the types come from
	- check: `git diff origin/main...HEAD --numstat -- src/components src/lib/heatmap-grid.ts` prints three lines, each `1	1	<path>`

### Acceptance criteria: the chain

Each one is checked on the branch, from the repo root.

- **S1** `pnpm test`, in the dev container, finds `src/lib/activity.test.ts` and passes
	- check: it names that file among the test files it ran, and returns with exit code 0
- **S2** `./check.sh`, on the host, exits 0
	- check: the result of the unit tests comes before the first line of the image build
- **S3** the `checks` run on the last commit of the pull request of this branch passes, and ran the unit tests
	- check: `gh pr checks test/unit-activity-rules` shows `checks` as `pass`
- **S4** the test file is the one from Design
	- check: `git diff <the commit that added it> HEAD -- src/lib/activity.test.ts` prints nothing
- **S5** `README.md` lists the part, as "Approach" gives it
	- check: the format check of S2, and review
- **S6** the branch changes nine paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `A	_well/spec-unit-activity-rules.md`
		- `M	src/app/code/page.tsx`
		- `M	src/components/Heatmap.tsx`
		- `M	src/components/RepoCard.tsx`
		- `A	src/lib/activity.test.ts`
		- `A	src/lib/activity.ts`
		- `M	src/lib/forgejo.ts`
		- `M	src/lib/heatmap-grid.ts`
	- so `package.json` and `pnpm-lock.yaml` do not change: the branch installs nothing, and the rule on the age of a package has nothing to check
	- so `check.sh`, `vitest.config.mts`, `tests/` and `.github/` do not change

Checked in Code review, by breaking it once on purpose:

- **S7** in `src/lib/activity.ts`, the count of a day is made to take the count of the entry in place of adding it; then `./check.sh` exits with a code that is not 0, a test named `is the sum of the entries of that day` is shown as failed, and the image build does not start
	- the change is thrown away after

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

**The logic**

- new file `src/lib/activity.ts`, with the surface given under "The part", the comments of that block included
	- it imports nothing
	- `activitySummary` is the only exported function; what it uses inside is not exported
- the day of an entry: `new Date(entry.timestamp * 1000).toISOString().slice(0, 10)`
	- `toISOString` is always UTC; no other way of making the date is used
- the days: the counts are added per date; the days are not put in order
- the total: the sum of `count` over `source.contributions`
- the languages of a repo: the rule moves from `fetchRepoLanguages` in `src/lib/forgejo.ts`, as it is
	- the sum of the bytes; when it is 0, an empty list
	- else one entry for each name, `pct` as `bytes / total`, sorted by `b.bytes - a.bytes`
- the repos: each `RepoSource` becomes a `RepoSummary`: `languageBytes` goes out, `languages` comes in, and every other field goes through by a spread
	- then sorted by `b.commitsLast12mo - a.commitsLast12mo`
	- the list in `source.repos` is not changed: the sort is on the new list
- `Array.prototype.sort` keeps the order of equal items, so A6 and A8 need no more code

**The client**

`src/lib/forgejo.ts`, after the change:

- its first line: `import type { ActivitySource, ContributionEntry, RepoSource } from "./activity";`, then an empty line
- the four interfaces `HeatmapDay`, `RepoLanguage`, `RepoSummary` and `ActivitySummary` are gone from it
- `FORGEJO_BASE`, `USER`, `REVALIDATE_SECONDS`, `getToken`, `api`, `apiHead`, `ForgejoHeatmapEntry`, `ForgejoRepo` and `fetchCommitCountSince`: no change
- `fetchHeatmap` becomes

```ts
async function fetchContributions(): Promise<ContributionEntry[]> {
  const raw = await api<ForgejoHeatmapEntry[]>(`/users/${USER}/heatmap`);
  return raw.map((d) => ({ timestamp: d.timestamp, count: d.contributions }));
}
```

- `fetchRepoLanguages` is gone; its call to the API moves into `fetchRepos`
- `fetchRepos` becomes

```ts
async function fetchRepos(): Promise<RepoSource[]> {
  const repos = await api<ForgejoRepo[]>(`/users/${USER}/repos?limit=50`);
  const since = new Date(Date.now() - 365 * 86400 * 1000).toISOString();
  return Promise.all(
    repos.map(async (r) => {
      const [languageBytes, commitsLast12mo] = await Promise.all([
        api<Record<string, number>>(`/repos/${USER}/${r.name}/languages`),
        fetchCommitCountSince(r.name, since),
      ]);
      return {
        name: r.name,
        description: r.description ?? "",
        htmlUrl: r.html_url,
        createdAt: r.created_at,
        languageBytes,
        commitsLast12mo,
      };
    }),
  );
}
```

- `getActivity` becomes

```ts
export async function fetchActivity(): Promise<ActivitySource> {
  const [contributions, repos] = await Promise.all([fetchContributions(), fetchRepos()]);
  return { contributions, repos };
}
```

- what stays in the client, and why it is not a rule
	- a description that Forgejo gives as `null` becomes `""`: the shape of Forgejo's answer
	- the number of commits read from the header `x-total-count`, and 0 when it is not there: the shape of Forgejo's answer
	- `since`, 365 days before now: part of the question the client asks; it reads the clock, so it cannot be in the logic

**The page and the components**

- `src/app/code/page.tsx`
	- the line `import { getActivity } from "@/lib/forgejo";` becomes two lines, in this order
		- `import { activitySummary } from "@/lib/activity";`
		- `import { fetchActivity } from "@/lib/forgejo";`
	- the line `activity = await getActivity();` becomes `activity = activitySummary(await fetchActivity());`
	- no other line changes; the call stays inside the `try`
- `src/components/Heatmap.tsx`: the line `import type { HeatmapDay } from "@/lib/forgejo";` becomes `import type { HeatmapDay } from "@/lib/activity";`
- `src/components/RepoCard.tsx`: the line `import type { RepoSummary } from "@/lib/forgejo";` becomes `import type { RepoSummary } from "@/lib/activity";`
- `src/lib/heatmap-grid.ts`: the line `import type { HeatmapDay } from "./forgejo";` becomes `import type { HeatmapDay } from "./activity";`
	- `src/lib/heatmap-grid.test.ts` is not touched

**The shared files: the lines this change owns**

Each place is given by the text of a line, as the file is on main `07f2a7e`. Every line not named here is not this change's.

- `check.sh`, `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`: no line
- `README.md`, one place: the table under `## Parts`
	- one new row, directly after the row that starts `| heatmap grid`
	- the first column gets two characters wider, so the formatter pads the three lines before the new row again
	- on main `07f2a7e` the table then reads

```md
| Part           | Kind  | Test | Path                      |
| -------------- | ----- | ---- | ------------------------- |
| heatmap grid   | logic | unit | `src/lib/heatmap-grid.ts` |
| activity rules | logic | unit | `src/lib/activity.ts`     |
```

- `README.md`, continued
	- when main has more rows in that table by then: they stay, the new row still goes directly after the row that starts `| heatmap grid`, and `pnpm format`, in the dev container, gives the padding
	- no other line of `README.md`: the row of `src/lib/` in the table of `## Layout` already says `logic, and the clients for the two outside services`

**Commits and the pull request**

- the branch is `test/unit-activity-rules`, made from main `07f2a7e`
	- main comes in again only by a merge; never a rebase, never a force push
- the tests are on the branch before any code
- then, in this order
	- `refactor(code): move the activity rules into logic`: `src/lib/activity.ts`, `src/lib/forgejo.ts`, `src/app/code/page.tsx`, `src/components/Heatmap.tsx`, `src/components/RepoCard.tsx`, `src/lib/heatmap-grid.ts`
	- `fix(code): count a day as the sum of its entries`: `src/lib/activity.ts`
		- one entry for each date, the counts added
	- `docs(readme): list the activity rules`: `README.md`
- the pull request: the owner opens it, as a draft, from this branch
	- title: `test: add the activity rules and their unit tests`
	- body, one line: `Spec: _well/spec-unit-activity-rules.md`

### Out of scope

- an entry with a count below 0, or a count that is not a whole number; a number of bytes of 0 or below; a language whose name is a whole number: none comes from a host
- the 365 days of `since`, and whether "the last 12 months" of the commits and of the total are the same range: the client's question to the host
- the time zone of a day (A1 keeps UTC), and the time zone of "today" in the grid
- the names `pct` and `totalContributionsLast12mo`
- what `RepoCard` does with a share, a colour or a date: the task unit-interface-rules
- a test of `src/lib/forgejo.ts`: the task integration-forgejo, parked until `/code` reads GitHub
- a test of `/code`: wiring, held end to end, and with real data by a smoke check; both are later tasks
- the client for GitHub, and the text of `/code` that says the code is not on GitHub
- `heatmapGrid`: it still takes at most one entry for a date, and A2 now gives it that
- any other row in the parts list
- any package, `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`
- the stale things the epic lists

### Going back

- revert the squash commit on main
	- the rules go back into the client, and a cell shows the last quarter of an hour of its day again
	- nothing outside `src/` and `README.md` changes; the image and the pipeline are the same

## Tests

All in `src/lib/activity.test.ts`, beside the code; found by `vitest.config.mts`; run by `pnpm test`. Part: activity rules. Kind: unit. 5 tests.

- how the expected results were made
	- each timestamp is worked out by hand from 2026-10-10T00:00:00Z = 1791590400, and the moment it stands for is a comment in the test
	- each share is worked out by hand: 700 of 1000 bytes is 0.7
	- none is taken from a run of the code
- every test goes through `activitySummary`; none reads the clock, and none needs a fake

| Test | Criterion |
| ---- | --------- |
| the count of a day: is the sum of the entries of that day | A2 |
| the count of a day: keeps two days apart at midnight UTC | A2, A1, A3 |
| the total: is the sum of every entry | A4 |
| the languages of a repo: puts the language with the most bytes first | A6, A5 |
| the repos: puts the repo with the most commits first | A8, A9 |
| none | A7 |

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- A2, a `fix`: a test, written first and kept
- A1, A3 to A6, A8, A9, behaviour that had no test: a test, written first and kept
	- the branch type is `test`; the conventions give no line for it, so each piece is verified as its own type
- A7: nothing
- R1 to R6, a `refactor`: the tests that exist still pass, and the checks given with each one
	- no test holds the client or the page: `/code` is an `async` Server Component that needs live data
	- until the later tasks: the typecheck holds the shapes between the client, the rules and the page; Code review reads R3; the owner looks at `/code` after the deploy
- S1 to S4, S6, S7, the chain: the checks accept it (S2, S3), and the real run proves it (S3, on the pull request)
	- a smoke check watches it after: none is there yet; it is parked in the epic
- S5, `docs`: the format check, and review
