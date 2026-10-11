---
type: spec
description: "Build publicpersona's image on GitHub on every merge to main and publish it to ghcr.io, check the image build on every pull request, and put the whole check set behind one command. Reference for what the change must do and how it is checked."
status: design
depends_on:
  - "[[spec-checks]]"
---
## Need

- GitHub checks a change, but builds no image
	- the image is built by a runner on another server, and kept in that server's registry
	- a merge on GitHub reaches the node only if main is also pushed to that server by hand
- a pull request can merge with an image build that is broken
	- the checks run `pnpm build`, not the `Dockerfile`
- the checks are four lines in the pipeline file, not one command
	- a person or an agent cannot run the same set before a push
- `tests/e2e/pipeline.sh` looks for a run before GitHub has started it
	- run right after a push, it fails with nothing wrong
- the README's "Ship it" and "Layout" sections describe the other server

## Done looks like

### Acceptance criteria

On a pull request:

- `./check.sh`, run from the repo root, runs the whole check set and passes: format check, lint, typecheck, image build
	- the image build pushes nothing
- the `checks` run on this spec's own pull request passes
- the `checks` job runs on `ubuntu-24.04`
- a pull request starts the `checks` run and no other run
- the `checks` job may read the repo and nothing else
- a newer `checks` run on the same pull request cancels the older one
- the ruleset on main still requires `checks`

On a merge to main:

- every push to main starts a `ship` run, and nothing else starts one
	- a merge that changes only a `.md` file also builds: one image per commit on main
- the `ship` run for the merge of this spec passes
- the `ship` job runs on `ubuntu-24.04`
- the `ship` job may read the repo and write packages, and nothing else
	- no stored password: the push uses the run's own `GITHUB_TOKEN`
- `ship` runs queue; none is cancelled, running or waiting
- `ghcr.io/matta-kelly/publicpersona:sha-<first 7 characters of the commit>` exists for main's commit
- `ghcr.io/matta-kelly/publicpersona:latest` is the same image as that tag
- the image can be pulled with no login
- the image's label `org.opencontainers.image.source` is `https://github.com/matta-kelly/publicpersona`

In both pipeline files:

- every job has a time limit of ten minutes or less
- every action that is not under `actions/` is pinned to a full commit hash

Unchanged:

- the pipeline file under `.forgejo/`

Checked in code review, by reading:

- the README's "Check it" section gives `./check.sh` as the one command
- the README's "Ship it" and "Layout" sections describe the two files under `.github/workflows/` and the image on ghcr.io
	- "Ship it" says that the node still pulls from the other server until the node switch
- `tests/e2e/pipeline.sh` waits for a run to start before it watches the run

Checked in code review, by breaking it once on purpose:

- a throwaway pull request with a `Dockerfile` that cannot build shows a failed `checks` run, and the merge is refused

### Approach

- `check.sh`, at the repo root: the one command
	- runs, in order, and stops at the first failure
		- `pnpm format:check`
		- `pnpm lint`
		- `pnpm typecheck`
		- image build: `<engine> build -t publicpersona:check .`
	- `pnpm build` is not a separate item: the image build runs it
	- two values come from the environment, since the toolchain differs per place
		- `PNPM`: how to call pnpm
			- default: through the dev container, `npx --yes @devcontainers/cli exec --workspace-folder . --docker-path podman pnpm`
			- with the default, the script starts the dev container first (`up`), under a time limit
		- `ENGINE`: the tool that builds the image
			- default: `podman`
	- runs on the host, not in the dev container: the dev container has no tool that builds an image
- `.github/workflows/checks.yml`
	- `runs-on: ubuntu-24.04`
	- `concurrency`: group `checks-${{ github.ref }}`, `cancel-in-progress: true`
	- steps: check out, corepack, Node 22, `pnpm install --frozen-lockfile`, then `./check.sh` with `PNPM=pnpm` and `ENGINE=docker`
		- the four `pnpm` check lines go; the pipeline calls the command and adds nothing
	- job name, rights and time limit stay as they are
- `.github/workflows/ship.yml`, new
	- `name: ship`; trigger: `push` to `main`, with no path filter
	- `concurrency`: group `ship`, `queue: max`, no `cancel-in-progress`
		- with the default queue, a waiting run is cancelled by a newer one, and that commit gets no image
	- file-level `permissions: contents: read`
	- one job, `ship`, on `ubuntu-24.04`, `timeout-minutes: 10`
		- `permissions`: `contents: read`, `packages: write`
		- steps
			- check out
			- `docker login ghcr.io` as `${{ github.actor }}`, the password is `${{ secrets.GITHUB_TOKEN }}` on stdin
			- `docker build` with two tags: `sha-${GITHUB_SHA::7}` and `latest`
			- `docker push --all-tags ghcr.io/matta-kelly/publicpersona`
	- plain `docker` commands, no action from outside GitHub
		- the build is the same command that `check.sh` ran on the pull request
		- nothing to pin, and nothing from a third party sees the token
		- considered and not taken: the `docker/login-action`, `docker/metadata-action` and `docker/build-push-action` set from GitHub's example. It adds three pinned actions to do what three lines do
- `Dockerfile`: `LABEL org.opencontainers.image.source=https://github.com/matta-kelly/publicpersona` in the `run` stage
	- this is what links the package to the repo
- `README.md`: "Check it", "Ship it" and "Layout"
- `tests/e2e/pipeline.sh` and `tests/e2e/ship.sh`: written by Design, on this branch. The builder does not edit them

### The package is public

- it must be public
	- the node pulls with no credential, and the repo is public
	- the registry lets anyone pull a public image with no login
- how it becomes public
	- a package that a workflow creates with `GITHUB_TOKEN` takes the visibility of the repo the workflow runs in
	- the repo is public, so the first `ship` run is expected to publish a public package, with no step by hand
- GitHub's pages do not fully agree, so the test decides
	- another page says a new package is private by default, and that a linked package takes the repo's access but not its visibility
	- `tests/e2e/ship.sh` pulls with no login. If that fails while the run passed, the package is private
	- then the owner makes it public, once, in the package's settings: Danger Zone, Change visibility, Public
		- no API call does this
		- it cannot be made private again
- no secret is in the image: `.dockerignore` keeps `.env` and `.env.*` out, and secrets arrive at run time

### Out of scope

- the node switch: `monkeybusiness` still pulls `forgejo.monk3y.xyz/mkultra/publicpersona:latest`. That is a change in `dazoo`
	- until then, a merge on GitHub publishes to ghcr.io and the node does not take it
- removal of `.forgejo/workflows/build.yaml`
	- it goes in a later change, after the node pulls from ghcr.io and is seen healthy
	- the same change removes the `forgejo` remote and the `.forgejo` lines in `.dockerignore` and `.prettierignore`
- the `deploy/` folder: Kubernetes manifests for a cluster that no longer runs this site
- the `/code` page, which reads the other server's API (`src/lib/forgejo.ts`)
- tests for the site itself
- signed build records (attestations) for the image
- pinning `actions/checkout` and `actions/setup-node` to a commit hash: they are GitHub's own

### Going back

- revert the squash commit on main
	- `ship.yml` and `check.sh` go; `checks.yml` runs the four lines again
	- nothing that runs changes: the node never pulled from ghcr.io
- the package stays on ghcr.io
	- the owner can delete it in the package's settings
- one image only: pin its `sha-` tag; no image is ever overwritten except `latest`

### Sources

- [Publishing and installing a package with GitHub Actions](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions): `packages: write`; a package created by a workflow takes the repo's visibility; the repo gets admin on it
- [Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry): `GITHUB_TOKEN` login; public images pulled with no login; default visibility is private
- [Configuring a package's access control and visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility): access is inherited, visibility is not; public cannot go back to private
- [Connecting a repository to a package](https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package): the `org.opencontainers.image.source` label
- [Publishing Docker images](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-docker-images): GitHub's example, the alternative not taken
- [Control the concurrency of workflows and jobs](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs): `cancel-in-progress`, and `queue: max`
- [[ci-cd]]: the rules both pipeline files follow

## Tests

- `tests/e2e/pipeline.sh`: the pull request half
	- run from the repo root, on the host, on this branch, after the push
	- every block runs; the script exits non-zero if one fails
	- fails today, for these reasons
		- no `./check.sh`
		- the `checks` job ran on `ubuntu-latest`
		- no `.github/workflows/ship.yml`
		- `checks` has no `concurrency`
	- passes today, and must still pass: the `checks` run, its rights, its time limit, the ruleset, `.forgejo/` unchanged
	- waits at most 120 seconds for the run to start, and 600 seconds for it to finish
- `tests/e2e/ship.sh`: the merge half
	- can pass only after the merge to main: the image is built from main's commit
	- run from the repo root, on the host, right after the merge, before another merge moves main
	- waits at most 120 seconds for the `ship` run to start, and 600 seconds for it to finish; each registry read has a limit of 30 seconds
	- fails today: no `ship` run for main's commit, and no package that can be pulled with no login
	- if it fails after the merge, the merge is reverted, per [[shit_sdlc#Loop|Ship]]
