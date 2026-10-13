---
type: spec
description: "Bring Playwright into publicpersona with one end to end journey, home to projects to the Stateball write-up, run by check.sh against the image it has just built. Reference for the five promises the journey holds, where the browser runs, where the output goes, which lines of the shared files the change owns, and how it is checked."
status: done
---
## Need

- nothing checks that the site works as a whole
	- `check.sh` stops after the image build: the image is built and never started
	- a page that fails to render, a link that goes nowhere, or a picture that does not load reaches the node with every check green
- no spec says what the site must do
	- so there is no promise to test: the ones below are read from the code as it is at main `8a883a6`, and each needs the owner's yes
- the repo has no end to end runner
	- per [[testing]], a Next.js repo uses Playwright: `playwright.config.ts` at the root, files in `tests/*.spec.ts`, against the production build
- two limits of this repo stand in the way, and are settled here
	- the dev container has no tool that builds or starts an image, and `check.sh` runs on the host
	- the repo folder sits in a notes vault, so no tool may write its output there ([[spec-dev-container]])

## Done looks like

### Acceptance criteria

Promises of the site. Each one is true or false of the built image, as a visitor with a browser sees it. Part: wiring (the pages and the layout, behind the image's real entry point). Kind: end to end.

- **P1**: the home page, `/`, shows the photo: a picture with the alternative text `Matthew Kelly`, and the picture loads
- **P2**: on the home page, the nav has a link named `Projects`, and a click on it opens `/projects`
- **P3**: `/projects` has the top heading `Projects`
- **P4**: on `/projects`, the page body has a link whose name starts with `Stateball`, and a click on it opens `/projects/stateball`
- **P5**: `/projects/stateball` has a top heading that starts with `Stateball`

The setup. Each one is checked on the branch, from the repo root.

- **S1**: `./check.sh`, on the host, passes, and the journey is among the tests that Playwright shows as passed
	- holds in a checkout whose dev container does not exist yet: the script creates it, and no second command is needed
- **S2**: the journey runs after the image build, against the image that the same run built
	- check, by reading `check.sh`: the `run` line comes after the `build` line and names the tag that the `build` line writes, `publicpersona:check`
- **S3**: when `./check.sh` ends, pass or fail, no container named `publicpersona-check` is left
	- check: `podman ps -a --filter name='^publicpersona-check$' --format '{{.Names}}'` prints nothing
- **S4**: a journey that fails makes `./check.sh` exit non-zero
	- shown by the breaks under [[#Tests]]
- **S5**: a run of `./check.sh` writes no test output into the repo folder
	- check: `test ! -e test-results && test ! -e playwright-report` exits 0
	- check: `git status --porcelain --ignored` prints the same before and after a second run of `./check.sh`
- **S6**: the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks <number>` shows `checks` as `pass`
	- the job's limit stays `timeout-minutes: 10`
- **S7**: one version of Playwright, written in two places
	- check: `git grep -c -F '"@playwright/test": "1.64.0"' -- package.json` prints `package.json:1`
	- check: `git grep -c -F 'playwright@1.64.0' -- .devcontainer/Dockerfile` prints `.devcontainer/Dockerfile:1`
- **S8**: `README.md` names the command
	- check: `git grep -c -F 'npx playwright test' -- README.md` prints `README.md:1`
- **S9**: the Factory does not edit the test
	- check: `git log --format=%s origin/main..HEAD -- tests/first-journey.spec.ts` prints one line, `test(e2e): add the first journey`
- **S10**: the branch changes ten paths and no other; none is under `src/`
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `A	.devcontainer/Dockerfile`
		- `M	.devcontainer/devcontainer.json`
		- `M	.github/workflows/checks.yml`
		- `M	README.md`
		- `A	_well/spec-e2e-first-journey.md`
		- `M	check.sh`
		- `M	package.json`
		- `A	playwright.config.ts`
		- `M	pnpm-lock.yaml`
		- `A	tests/first-journey.spec.ts`

### What is settled

- **where the browser runs**: where pnpm runs
	- on a dev machine: in the dev container, which gets Chromium and its system libraries
	- in the pipeline: on the runner, which installs Chromium as a step of the toolchain setup
	- `check.sh` calls Playwright through `$PNPM`, the value that already says how to call pnpm in each place. No new value from the environment
- **where the image runs**: on the host, started and removed by `check.sh` with `$ENGINE`
	- container name `publicpersona-check`, the image's port 3000 published on `127.0.0.1:3210`
	- started with no secret: no `IMMICH_SHARE_KEY`, no `FORGEJO_API_TOKEN`
- **how the browser reaches the image**: `http://127.0.0.1:3210`, the same in both places
	- for this, the dev container uses the host's network (`--network=host`)
	- the dev container of `que` on this machine does the same, for the same reason
- **where the output goes**: `/tmp/publicpersona-playwright`
	- in the dev container this is the container's own `/tmp`; on the runner it is the runner's
	- the reporter is `list`: it prints to the terminal and writes no file
	- no trace, no screenshot, no HTML report
- **where the browsers are kept**: in a Podman volume, `publicpersona-browsers`, mounted on `/home/node/.cache`
- **the version**: Playwright 1.64.0, exact
- **the browser**: Chromium only, at the `Desktop Chrome` size
- **the write-up**: Stateball, the first one on the projects page
- **the commit type**: `test`. The change adds a test and what runs it, and no behaviour of the site

### Approach

In this order. The packages come first: the new dev container runs Playwright when it is created, so Playwright has to be in the lockfile before the container is changed.

- the dev container, as it is on main: `npx @devcontainers/cli up --workspace-folder . --docker-path podman`
- in it: `pnpm add -D -E @playwright/test@1.64.0`
	- `package.json` gains one line, the first entry of `devDependencies`: `"@playwright/test": "1.64.0",`
	- `pnpm-lock.yaml` changes with it. No hand edit
	- no line is added to `scripts`
- new file `.devcontainer/Dockerfile`, these three lines

```
FROM mcr.microsoft.com/devcontainers/javascript-node:22
# Chromium needs system libraries that the base image lacks. The version is the one of @playwright/test in package.json.
RUN npx --yes playwright@1.64.0 install-deps chromium
```

- `.devcontainer/devcontainer.json`, edit 1 of 4: the line `"image": "mcr.microsoft.com/devcontainers/javascript-node:22",` becomes these two

```
  // Chromium needs system libraries that the plain Node image does not hold.
  "build": { "dockerfile": "Dockerfile" },
```

- edit 2 of 4: the `runArgs` line becomes these two; the comment above it stays

```
  // The host's network lets the browser reach the image that check.sh starts on the host, at 127.0.0.1.
  "runArgs": ["--userns=keep-id:uid=1000,gid=1000", "--network=host"],
```

- edit 3 of 4: `mounts` gains a fourth entry, after the entry for the pnpm store, which gains a comma

```
    // Playwright keeps its browsers under .cache; in a volume they outlive the container.
    "source=publicpersona-browsers,target=/home/node/.cache,type=volume"
```

- edit 4 of 4: `postCreateCommand` becomes this line; the comment above it stays

```
  "postCreateCommand": "sudo chown node:node node_modules .next /home/node/.pnpm-store /home/node/.cache && corepack enable --install-directory /usr/local/share/npm-global/bin && pnpm install --frozen-lockfile && pnpm exec playwright install chromium"
```

- the dev container, again, from the new files: the same `up` command with `--remove-existing-container`
- new file `playwright.config.ts`, at the repo root, with the text below
	- a test may take 30 seconds, and one expectation 5 seconds: both limits are written out, per [[conventions#Waiting]]
	- no `webServer`, no `retries`, no `workers`: `check.sh` starts the site, and a test that fails once has failed

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // The repo folder sits in a notes vault that loads every file in it, so nothing is written there.
  outputDir: "/tmp/publicpersona-playwright",
  reporter: "list",
  // A test left on .only would pass the checks while the others never ran.
  forbidOnly: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    // check.sh publishes the port of the image on this address.
    baseURL: "http://127.0.0.1:3210",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- `check.sh`: the lines below are added after the last line of the file, the `build` line. An empty line stands before them. No line that is in the file today changes
	- `pnpm exec playwright test` runs the same program as `npx playwright test`, the command that [[testing]] names; `$PNPM` is the one handle the script has
	- the wait asks from inside the container, with the `wget` that the image holds, so the host needs no new tool
	- the wait has a limit of 30 seconds, and the failure says what it waited for

```sh
# The end to end tests drive the image that was just built. It starts here, on the host:
# the dev container has no tool that runs an image.
SITE=publicpersona-check
# A run that was killed leaves its container behind, and the name and the port stay taken.
"$ENGINE" rm -f "$SITE" >/dev/null 2>&1 || true
trap '"$ENGINE" rm -f "$SITE" >/dev/null 2>&1 || true' EXIT
# The port is the one in playwright.config.ts.
"$ENGINE" run -d --name "$SITE" -p 127.0.0.1:3210:3000 publicpersona:check >/dev/null

if ! timeout -k 5 30 bash -c 'until "$0" exec "$1" wget -q -O /dev/null http://127.0.0.1:3000/api/health 2>/dev/null; do sleep 1; done' "$ENGINE" "$SITE"; then
  echo "check.sh: gave up after 30s waiting for: the site to answer in the container $SITE" >&2
  "$ENGINE" logs "$SITE" >&2 || true
  exit 1
fi

$PNPM exec playwright test
```

- `.github/workflows/checks.yml`: these two lines are added, with an empty line before them, between the step `- run: pnpm install --frozen-lockfile` and the comment above the `./check.sh` step. No other line changes

```yaml
      # The browsers are part of the toolchain: check.sh drives Chromium and installs nothing.
      - run: pnpm exec playwright install --with-deps chromium
```

- `README.md`: four edits, given under [[#Lines this change owns]]
- then `pnpm format`, in the dev container. It changes no file outside the ten paths
- the Factory's commit: `test(e2e): set up Playwright and run the journey in check.sh`
- the pull request title: `test: add the first end to end journey`

### Lines this change owns

Line numbers are those of main `8a883a6`. The task unit-heatmap edits the same three files; no line below is one that it needs.

- `check.sh`
	- owns: every line after line 30, the `build` line. All of them are new
	- does not touch: lines 1 to 30. A unit test step goes between line 27 and line 29, and is not this change's
- `package.json`
	- owns: one new line in `devDependencies`, `"@playwright/test": "1.64.0",`, before line 28
	- does not touch: `scripts`, and every line that is in the file today
- `pnpm-lock.yaml`
	- a generated file, with no owned lines. The change that merges second rebases on main and runs `pnpm install` in the dev container to write it again
- `README.md`
	- "Run it": owns line 22. It becomes
		- ``Creating the container installs the packages and Chromium, the browser that the end to end tests drive. In VS Code, **Reopen in Container** does the same, and its terminal is then inside the container.``
	- "Run it": owns one new paragraph, after line 22 and the empty line 23
		- ``The container uses the host's network, so a port that is open on the host is open in the container, and the other way round. When a file under `.devcontainer/` changes, create the container again: run the `up` command with `--remove-existing-container`.``
	- "Check it": owns one new paragraph, after line 38 and the empty line 39
		- ``After the image build, it starts that image as a container named `publicpersona-check` on `127.0.0.1:3210`, runs the end to end tests against it, and removes the container. The tests are `tests/*.spec.ts`. Playwright runs them in Chromium, in the dev container; `npx playwright test`, in the container, runs them alone while the site answers on that port. Their output goes to `/tmp/publicpersona-playwright` in the container, not to the repo folder. Run one `./check.sh` at a time on a machine: each run first removes the container of that name.``
	- does not touch: line 38, the sentence that lists the checks and says "the three `pnpm` checks". It is unit-heatmap's. The new paragraph starts "After the image build", so the two read in order whichever merges first
	- does not touch: the parts list, which unit-heatmap brings
	- "Layout": owns two new rows, directly below the `check.sh` row, line 71. Both are narrower than the table, so no other row is padded again

```
| `playwright.config.ts`         | the Playwright config: where the end to end tests are, and what they drive    |
| `tests/`                       | end to end tests (`*.spec.ts`): they drive the built image in a browser       |
```


### Out of scope

- every file under `src/`: the site does not change
- `/code` and `/photos`, and what they show with no key: the task photos-without-key
- `/api/health` and the shape of the image: the task contract-health-and-image
	- `check.sh` asks `/api/health` only to know that the server is up
- the other two write-ups, the link back from a write-up, the footer, the theme switch, the tab title
- the words of the bio, and the words of a write-up past the start of its heading
- which nav link is marked as the current page: a rule, so a unit test (the task unit-interface-rules)
- a second browser, and a phone-sized window
- Vitest, the unit test step, the parts list
	- one thing for unit-heatmap to hold: its Vitest config must not take `tests/*.spec.ts` as its own. Vitest's default pattern matches `*.spec.ts`
- two runs of `./check.sh` at the same time on one machine
	- they share the tag `publicpersona:check` today, and now the container name and the port
- the volumes of the dev container are shared by every checkout of the repo on the machine, a worktree included. Unchanged
- `Dockerfile`, `ship.yml`, the ruleset, the node
- a smoke check

### After the merge

- on each dev machine, once: create the dev container again, per the README
	- until then `./check.sh` fails at the Playwright step: the old container has no Chromium, and is not on the host's network

### Going back

- revert the squash commit on main
	- the site and the image that ships do not change in either direction: no file under `src/` is touched, and `@playwright/test` is not in Next's standalone output
- on a dev machine: create the dev container again, then `podman volume rm publicpersona-browsers`

## Tests

- `tests/first-journey.spec.ts`
	- test: `reaches the Stateball write-up from home, through the projects page`
	- criteria: P1, P2, P3, P4, P5
	- part: wiring. Kind: end to end
	- one test for the five, per [[testing]]: end to end has one test per main journey
	- depends on no live outside thing
		- the image starts with no key and no token
		- the three pages and the layout call no outside service: no `fetch` is in their modules, and the photo is served by the image itself
- seen to fail, in Code review: one break for each promise, each on a commit that is never pushed. `./check.sh` must exit non-zero, and Playwright must name the line given
	- P1: `src/app/page.tsx`, `src="/profile-picture.jpg"` becomes `src="/no-such-picture.jpg"`. Fails at one of the two expectations on the photo
	- P2: `src/components/Nav.tsx`, `{ href: "/projects", label: "Projects" }` becomes `{ href: "/project", label: "Projects" }`. Fails at `toHaveURL("/projects")`
	- P3: `src/app/projects/page.tsx`, the `h1` text `Projects` becomes `Work`. Fails at the `Projects` heading
	- P4: `src/app/projects/page.tsx`, `slug: "stateball"` becomes `slug: "stateball-x"`. Fails at `toHaveURL("/projects/stateball")`
	- P5: `src/app/projects/stateball/page.tsx`, the `h1` text starts `The Stateball` in place of `Stateball`. Fails at the last expectation
- the setup, S1 to S10, gets no test. It is verified as [[conventions]] has it for `ci` and `chore`
	- the checks accept it: the `checks` run on the pull request, which now starts the image and runs the journey
	- the real run proves it: that same run. Nothing of this change runs on a merge or on the node
	- a smoke check watches it after: none applies. The change touches no call to an outside thing
	- [[conventions]] has no line for what verifies a `test` change; the three lines above are this spec's reading
