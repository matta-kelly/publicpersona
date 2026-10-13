---
type: spec
description: "Run publicpersona's toolchain in a dev container, so its packages and build output stay in Podman volumes and out of the repo folder. Reference for what the change must do and how it is checked."
status: done
---
## Need

- the repo folder sits inside an Obsidian vault, and Obsidian loads every file in it
- installing or building on the host writes tens of thousands of files there
	- `node_modules`: the packages
	- `.next`: the build cache
	- `.pnpm-store`: pnpm puts its store at the root of the project's filesystem when that differs from home
- so today no Node command can be run here at all, which blocks every later change, tests included

## Done looks like

### Acceptance criteria

- `.devcontainer/devcontainer.json` exists, and the container starts under rootless Podman
- creating the container installs the packages, with no second command
- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass inside the container
- after the install and the build, the repo folder on the host has no files under `node_modules`, `.next` or `.pnpm-store`
- every file the container writes into the repo folder is owned by the host user
- a commit made on the host, with TypeScript staged, is not blocked by the pre-commit hook
	- the hook says the checks run in the container
- the README's "Run it" and "Check it" sections give the container as the way to run commands

### Approach

- image: `mcr.microsoft.com/devcontainers/javascript-node:22`
- the repo is mounted at its host path, not `/workspaces/...`
	- `.next` stores absolute paths
- `--userns=keep-id:uid=1000,gid=1000`, remote user `node`
- three named volumes
	- `publicpersona-node-modules` on `node_modules`
	- `publicpersona-next` on `.next`
	- `publicpersona-pnpm-store` on the pnpm store, with `store-dir` pointed at it
- on create: hand the volumes to `node`, turn on pnpm 9.15.0 through corepack, `pnpm install --frozen-lockfile`
- the hook: when the packages are not present, print one line and exit 0

### Out of scope

- the pipeline: it stays as it is
- the `Dockerfile` and the image that ships
- adding a test tool for the site itself

## Tests

- none: the change is a `chore`, and is verified by its type ([[conventions]], "what verifies a change, by its type")
