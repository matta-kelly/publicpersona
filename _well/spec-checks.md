---
type: spec
description: "Run publicpersona's checks on GitHub for every pull request, and make main refuse a change that fails them. Reference for what the change must do and how it is checked."
status: done
depends_on:
  - "[[spec-format]]"
---
## Need

- nothing on GitHub checks a change before it merges
- the ruleset on main cannot require checks, because none exist there
- the existing pipeline runs on another server and never sees a GitHub pull request

## Done looks like

### Acceptance criteria

- a pull request into main starts a run that does four things: format check, lint, typecheck, build
- on this spec's own pull request, that run passes
- the run has a time limit of ten minutes
- the ruleset on main requires the run: a pull request cannot merge while it is failing or missing
- the existing pipeline file under `.forgejo/` is unchanged

Checked in code review, by breaking it once on purpose:

- a throwaway pull request with a lint error shows a failed run, and the merge is refused

### Approach

- one file, `.github/workflows/checks.yml`
- trigger: pull requests into main
- one job, named `checks`, on `ubuntu-latest`, with `timeout-minutes: 10`
- the job may read the repo and nothing else: `permissions: contents: read`
- steps, in order
	- check out the code
	- turn on pnpm through corepack; the version comes from `packageManager` in `package.json`
	- set up Node 22, with the pnpm cache
	- `pnpm install --frozen-lockfile`
	- `pnpm format:check`
	- `pnpm lint`
	- `pnpm typecheck`
	- `pnpm build`
- once the run is green on this pull request: add `checks` as a required status check to the ruleset named `main`

### Out of scope

- building or pushing the image, and deploying
- the pipeline on the other server
- tests for the site itself
- a separate GitHub identity for agents

## Tests

- none: the change is a `ci`, and is verified by its type ([[conventions]], "what verifies a change, by its type")
