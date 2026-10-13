---
type: spec
description: "Make ./check.sh run only the steps a change needs: a change to notes ends after format and lint, a change to unit tests ends after the unit step, and every other change runs the whole set. Reference for what the change must do and how it is checked."
status: done
---
## Need

- `./check.sh` runs every step for every change: 85 s in the pipeline, 33 s on a machine
- some kinds of change have steps with nothing to catch
	- notes (a Markdown file under `_well/`, `README.md`): no step after format can find a fault in them
	- unit tests and captured answers: the browser install (20 s), the image build (36 s), the start and the browser tests are idle
- the rule: the command runs only the steps that the change needs, and a skip is the same on a machine and in the pipeline ([[ci-cd#Checks]])
- how often: of 38 checks runs, 2 were notes only and 3 were notes and unit tests only

## Done looks like

### Acceptance criteria

- 1: `./check.sh` reads the files the change touched: against the merge base with `origin/main`, with files not yet committed and files not yet tracked counted
- 2: every changed file is a Markdown file under `_well/` or is `README.md`: the command ends after lint, exit 0, and says which steps it left out
- 3: every changed file is one of those, or `src/**/*.test.ts`, `src/**/*.test.tsx` or under `src/lib/*-captured/`: the command ends after the unit step, exit 0, and says which steps it left out
- 4: any other changed file, no changed file, or no answer from git: the whole set runs
- 5: the files of criteria 2 and 3 are in `.dockerignore`, so the image cannot hold them; the image holds the same files as before
- 6: in the pipeline the job `checks` always starts and always reports; it is never pending ([[github-guide#Actions]])
- 7: the pipeline installs the browsers only when the browser tests run
- 8: `README.md`, "Check it", says what the command leaves out, and when

### Out of scope

- the ship run on a notes-only merge: [[task-ship-on-notes-only]]
- the other trims of the pipeline: [[task-pipeline-trims]]
- a skip for a change to end to end tests only, or to the `Dockerfile` only: the gain is 8 s or less

### Approach

- a trial patch exists and was tried on six cases in a scratch clone: a note, the README, a unit test, a failing unit test, an untracked file, no change
- `checks.yml` checks out with the history the merge base needs
- the lists in `check.sh` and in `.dockerignore` are safe only together, so they go in one pull request
- the browser install stays a step of `checks.yml`. It asks `check.sh` for its plan, and runs only when the plan holds the browser tests

## Tests

- none: a `ci` change is verified [[conventions#^verifies|by its type]]
	- the checks accept it
	- the real run proves it: one pull request each for a notes-only change, a unit-test-only change and a source change, with the steps that ran read from the log
	- break it once, for each skip: a fault in a source file, pushed with a note, still fails the whole set
