---
type: spec
description: "Remove the three shell scripts under tests/e2e, the folder, and the README line that points at one of them, so that no shell script in publicpersona stands as a test. Reference for what the change must remove, what it must leave alone, and how it is checked."
status: done
---
## Need

- three shell scripts sit under `tests/e2e/` as if they were tests
	- `dev-container.sh`, `pipeline.sh`, `ship.sh`
	- no runner finds them: the repo has no runner config
	- no command calls them: `check.sh` does not, and neither pipeline file does
	- so a pass or a fail from one of them reaches nobody, and main does not require it
- each one checks a change to the setup that is merged, not something the site does
	- per [[testing]], a change to the setup gets no test
- the README's "Check it" section gives `./tests/e2e/dev-container.sh` as a check
	- a reader takes it as part of the check set, and it is not
- `tests/` is where the runner config will look for end to end and contract tests (`tests/*.spec.ts`)
	- the folder `tests/e2e/` is not part of that layout

## Done looks like

### Acceptance criteria

Each one is checked on the branch, from the repo root, against `origin/main`.

Gone:

- no file is tracked under `tests/`
	- check: `git ls-files tests` prints nothing
- a fresh checkout of the branch has no `tests` folder
	- check: `test ! -e tests` exits 0
- `README.md` does not name `tests/e2e`
	- check: `git grep -n 'tests/e2e' -- README.md` prints nothing and exits 1

Nothing else:

- the change to `README.md` is two lines removed and none added
	- check: `git diff --numstat origin/main...HEAD -- README.md` prints `0	2	README.md`
- the branch changes five paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `M	_well/spec-remove-shell-tests.md`
		- `D	tests/e2e/dev-container.sh`
		- `D	tests/e2e/pipeline.sh`
		- `D	tests/e2e/ship.sh`

Still works:

- the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks <number>` shows `checks` as `pass`
- after the merge, the `ship` run for main's new commit passes
	- check: `gh run list --workflow ship.yml --branch main --limit 1 --json headSha,conclusion` shows main's commit with `success`

### Approach

- `git rm -r tests/e2e`
	- this removes the three scripts; git keeps no empty folder, so `tests/e2e/` and `tests/` go with them
- `README.md`, section "Check it": remove two lines
	- the line that reads: `` `./tests/e2e/dev-container.sh`, run on the host, checks the container itself. ``
	- the empty line after it
	- then one empty line stands between the `pnpm format` line and `## Ship it`, which is what the format check accepts
- one commit holds both: `chore(tests): remove the shell scripts under tests/e2e`
- the pull request title: `chore: remove the shell scripts under tests/e2e`
- no file is added; this spec is edited, for the two lines that name it and for its status; no other file is edited

### Out of scope

- a replacement for what the scripts checked
	- the dev container, the settings of the two pipeline files, the ruleset, and the published image have no automated check after this change
	- the contract tests for the image are a later task; the others are setup, and get none
- the specs that name the scripts: `spec-dev-container.md`, `spec-format.md`, `spec-checks.md`, `spec-ship.md`
	- each one defines a change that is merged; they stay as they are
- any test runner, runner config, test file or test command
- `check.sh` and the two files under `.github/workflows/`
- every other part of `README.md`, the stale lines in "Ship it" included
- `.forgejo/workflows/build.yaml`

### Going back

- revert the squash commit on main
	- the three scripts and the README line come back
	- nothing that runs changes: no command, pipeline or image uses the scripts

## Tests

- none: the change is a `chore`, and is verified by its type ([[conventions]], "what verifies a change, by its type")
	- the checks accept it: the `checks` run on the pull request
		- its format check reads `README.md`; its image build copies the repo without the scripts
	- the real run proves it: the `ship` run on main, after the merge
		- on failure the merge is reverted, per [[shit_sdlc#Loop|Ship]]
	- a smoke check watches it after: none applies
		- the repo has no smoke check yet, and this change touches no call to an outside thing
- the other acceptance criteria are read from git, by the commands given with each one
