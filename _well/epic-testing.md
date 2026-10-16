---
type: epic
description: "Reset how publicpersona is tested so it matches the testing note: the end state for this repo, what is right, missing, wrong or should not be there, and the tasks that get it there. Reference when picking the next task for Design, or when checking where the reset stands."
status: active
belongs_to: "[[publicpersona]]"
---
Reset how [[publicpersona]] is tested, so that it matches [[testing]]. A refactor, not a fill-in: what is in the repo has no claim to stay because it is there.
- [[#End state]] what the repo is when the reset is done
- [[#Where things stand]] right, missing, wrong, should not be there
- [[#Tasks]] ready for Design, each with what it needs first
- [[#Parked]] what waits, and on what
- [[#Stale things seen]] not part of the reset

- [[testing]]: the chain this works toward
- [[shit_sdlc]]: the loop each task goes through
- [[ci-cd]]: the check set, and smoke checks

---
## End state

- **the chain**
	- test files
		- unit and integration: `*.test.ts` and `*.test.tsx`, beside the code they test
		- end to end and contract: `tests/*.spec.ts`
		- no shell script is a test
	- runner config: `vitest.config.mts` and `playwright.config.ts`, at the repo root
	- commands: `pnpm test` calls Vitest; `npx playwright test` calls Playwright
	- one command: `./check.sh` runs format, lint, types, unit, integration, the image build, then end to end and contract against that image
	- pipeline: `.github/workflows/checks.yml` calls `./check.sh` on every push to a pull request
	- main: the ruleset requires the `checks` run
	- `README.md` names the commands, and lists each part with its kind and its path
- **the parts**
	- logic, with unit tests
		- heatmap grid: count to tier, gap fill, week columns, month labels
		- activity rules: date from a timestamp, language share and order, repo order, the total
		- photo rules: the form of an asset id, the sizes allowed, images only
		- nav active rule
		- repo card formatting
		- gallery behaviour: open, close, next and previous with wrap, the keys
	- adapters, with integration tests on replayed responses
		- the Forgejo client
		- the Immich client, the only place that talks to Immich
	- wiring, with end to end tests: the pages, the layout and the route handlers, behind the built image
		- `/code` and `/photos` are `async` Server Components, so end to end is their only cover
	- borders, with contract tests
		- `GET /api/health`: the node's health check calls it
		- the image: its source label, port 3000, user 1000, a read-only root

## Where things stand

*As read at GitHub main `7e5a973`. Read from the code; no command of the repo was run.*

- **right**
	- `./check.sh` is the one command, and the README names it
	- `checks.yml` calls it on every push to a pull request, under a 10 minute limit
	- the ruleset on main requires `checks`
	- the image build is in the check set, and pushes nothing
- **missing**
	- every test file the chain names
	- both runner configs, and both commands
	- the unit, integration, end to end and contract steps in `check.sh`
	- the parts list in the README
	- captured responses for Forgejo and Immich
	- any written promise for the site: no spec says what a page must do
- **wrong**
	- no rule can be reached through a public surface: `tier`, `isActive`, `langColor` and `formatDate` are private; the heatmap rules sit in a render function and read the clock
	- `src/lib/forgejo.ts` mixes the client with the rules
	- two places talk to Immich: the client, and the route handler's own `fetch`
	- `/photos` has no failure path: with no `IMMICH_SHARE_KEY` the page errors, and the README says it has "nothing to show"
- **should not be there**
	- `tests/e2e/dev-container.sh`, `tests/e2e/pipeline.sh`, `tests/e2e/ship.sh`: no runner finds them and no command calls them
	- the README line that points at `dev-container.sh`
	- `.forgejo/workflows/build.yaml`: a second pipeline

## Tasks

Each one merges alone and leaves main releasable. The promises are Design's to write and get agreed.

- [ ] **remove-shell-tests**: the three scripts, the folder `tests/e2e/` and the README line are gone
	- a `chore`: verified by the checks and the real run, with no new test
	- needs first: nothing
- [ ] **remove-forgejo-pipeline**: `.forgejo/workflows/build.yaml`, the lines that name `.forgejo`, and the README text about the other server are gone
	- a `chore`: verified by the checks and the real run, with no new test
	- the node runs the image from ghcr.io
	- needs first: nothing
- **unit track**
	- [ ] **unit-heatmap**: Vitest is set up, and the heatmap grid is logic with unit tests
		- brings `vitest.config.mts`, `pnpm test`, the step in `check.sh`, and the parts list and the command in the README
		- the grid takes the day as input, so no test reads the clock
		- needs first: nothing
	- [ ] **unit-activity-rules**: the activity rules are logic with unit tests; `forgejo.ts` only talks to Forgejo
		- needs first: unit-heatmap
	- [ ] **unit-photo-rules**: the photo rules are logic with unit tests
		- needs first: unit-heatmap
	- [ ] **unit-interface-rules**: unit tests for the nav active rule, the repo card formatting and the gallery
		- Design settles: the time zone of the dates on the repo card; whether the gallery test needs a DOM library
		- needs first: unit-heatmap
	- [ ] **integration-immich**: the thumbnail fetch lives in the Immich client, and the client has integration tests on replayed responses
		- the share key is stripped from what is captured
		- covers the album read, a share that is not an album, a 404, and any other upstream failure
		- needs first: unit-photo-rules
- **end to end track**
	- [ ] **e2e-first-journey**: Playwright is set up, with one journey: home, to projects, to a write-up
		- brings `playwright.config.ts`, the command, the step in `check.sh` after the image build, and the command in the README
		- Design settles: where the browsers run, since the dev container has no image tool; where Playwright's output goes, since it must stay out of the repo folder
		- needs first: nothing
	- [ ] **contract-health-and-image**: contract tests hold `/api/health` and the shape of the image, against the built image
		- needs first: e2e-first-journey
	- [ ] **photos-without-key**: what `/photos` shows with no key is agreed, an end to end test holds it for `/code` and `/photos`, and `/photos` passes
		- needs first: e2e-first-journey

The two tracks do not depend on each other.

## Parked

- **integration-forgejo**: waits on `/code` reading GitHub in place of Forgejo; a test of the old client would be thrown away
- **smoke checks**: live calls to the outside services, and the `/code` and `/photos` journeys with real data
	- waits on the tests above
	- open: where one runs for a mesh-only service, and how the owner is told

## Stale things seen

- `README.md`, "Ship it", says the node pulls from Forgejo; the node's unit file names ghcr.io
- `publicpersona.md` says CI runs on Forgejo, and points at an `AGENTS.md` that is not in the tree
- `.dockerignore` names `AGENTS.md` and `lessons.md`, which do not exist
- `_well/spec-ship.md` has status `review`; its pull request is merged
- `deploy/` holds Kubernetes manifests for a cluster that no longer runs the site
