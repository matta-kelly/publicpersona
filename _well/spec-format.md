---
type: spec
description: "Bring every file in publicpersona in line with the formatter, and add a way to check it. Reference for what the change must do and how it is checked."
status: factory
---
## Need

- 21 files do not match the formatter today
- a format check in the pipeline would fail on its first run
- until the repo is formatted once, every later change carries formatting noise in its diff

## Done looks like

### Acceptance criteria

- `pnpm format:check` passes in the dev container
- `pnpm lint`, `pnpm typecheck` and `pnpm build` still pass
- the formatter leaves `pnpm-lock.yaml`, `_well/` and `.forgejo/` alone
- running `pnpm format` a second time changes nothing

### Approach

- add `.prettierignore` with three entries
	- `pnpm-lock.yaml`: generated, never edited by hand or by a tool other than pnpm
	- `_well/`: vault notes, which use tabs for nested lists
	- `.forgejo/`: the pipeline, which this change must not touch
- run `pnpm format` in the dev container
- commit what it writes, and nothing else

### Out of scope

- any edit made by hand
- changes to the lint rules or the formatter's settings
- the pipeline

## Tests

- `pnpm format:check`: the script is added with this spec, and fails today on 21 files
- `tests/e2e/dev-container.sh` still passes
