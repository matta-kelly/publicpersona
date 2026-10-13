# publicpersona

My personal site: who I am, what I have built, and how I think. Live at [home.monk3y.xyz](https://home.monk3y.xyz).

- `/` bio
- `/projects` write-ups of things I have built
- `/code` my repositories, read live from the git host's API
- `/photos` a gallery, read live from a shared Immich album

Built with Next.js 16, React 19, TypeScript and Tailwind 4.

## Parts

Each part of the code, the kind of test that holds it, and where it is. A test file sits beside the code it tests.

| Part           | Kind  | Test | Path                      |
| -------------- | ----- | ---- | ------------------------- |
| heatmap grid   | logic | unit | `src/lib/heatmap-grid.ts` |
| activity rules | logic | unit | `src/lib/activity.ts`     |
| photo rules    | logic | unit | `src/lib/photos.ts`       |

The borders are the surfaces that another system depends on. A contract test holds each one, against the built image, started the way the node starts it. Both are in `tests/health-and-image.spec.ts`.

| Border       | Depends on it                         | Test     | Path                          |
| ------------ | ------------------------------------- | -------- | ----------------------------- |
| health check | the node's health command             | contract | `src/app/api/health/route.ts` |
| image        | the node's unit file, which starts it | contract | `Dockerfile`                  |

## Run it

Every command runs in the dev container, which holds Node 22 and pnpm. The packages and the build cache stay in Podman volumes, out of the repo folder. Needs Podman and Node on the host.

```sh
npx @devcontainers/cli up --workspace-folder . --docker-path podman
cp .env.example .env.local
npx @devcontainers/cli exec --workspace-folder . --docker-path podman pnpm dev
```

Creating the container installs the packages and Chromium, the browser that the end to end tests drive. In VS Code, **Reopen in Container** does the same, and its terminal is then inside the container.

The container uses the host's network, so a port that is open on the host is open in the container, and the other way round. When a file under `.devcontainer/` changes, create the container again: run the `up` command with `--remove-existing-container`.

The site is then at http://localhost:3000.

`.env.local` holds two values, both described in `.env.example`. Without them the site still runs; `/photos` and `/code` have nothing to show.

The install also turns on the pre-commit hook in `.githooks/`, which runs the lint and the typecheck on staged TypeScript. A commit made on the host skips them, since the packages are only in the container.

## Check it

On the host, from the repo root:

```sh
./check.sh
```

It runs the whole check set in this order, and stops at the first failure:

1. the format check
2. the lint
3. the typecheck
4. the unit tests
5. the image build, which runs `pnpm build` and pushes nothing
6. the end to end and contract tests, against the image that step 5 built

Needs Podman and Node on the host. Steps 1 to 4 run in the dev container, which the script starts.

After the image build, it starts that image as a container named `publicpersona-check` on `127.0.0.1:3210`, runs the end to end and contract tests against it, and removes the container. It starts the image the way the node does: a read-only root, user 1000, no capabilities, and the same `PORT` and `HOSTNAME`. The tests are `tests/*.spec.ts`. Playwright runs them in the dev container, the end to end tests in Chromium; `npx playwright test`, in the container, runs them alone while the site answers on that port. Their output goes to `/tmp/publicpersona-playwright` in the container, not to the repo folder. Run one `./check.sh` at a time on a machine: each run first removes the container of that name.

The pipeline runs the same command. Two values from the environment say which tools to use:

| Value    | Says                           | Default                   |
| -------- | ------------------------------ | ------------------------- |
| `PNPM`   | how to call pnpm               | through the dev container |
| `ENGINE` | the tool that builds the image | `podman`                  |

`pnpm test`, in the container, runs the unit tests alone, once.

`pnpm format`, in the container, applies Prettier to the whole repo.

## Ship it

Merging to `main` builds and publishes the image. Two files under `.github/workflows/` do the work, on GitHub's runners.

1. `checks.yml` runs `./check.sh` on every pull request into `main`. The ruleset on `main` refuses a merge until it passes.
2. `ship.yml` runs on every push to `main`. It builds the image and pushes it to `ghcr.io/matta-kelly/publicpersona` twice: as `sha-<first 7 characters of the commit>`, and as `latest`.

The image is public: anyone can pull it with no login.

The node, `monkeybusiness`, runs `latest` from ghcr.io and takes each new image by itself: a merge is the deploy.

To roll back, pin the node to the `sha-` tag of an earlier commit.

## Layout

| Path                           | Holds                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `src/app/`                     | pages and routes (Next.js App Router)                                         |
| `src/components/`              | shared interface pieces                                                       |
| `src/lib/`                     | logic, and the clients for the two outside services                           |
| `public/`                      | images and other static files                                                 |
| `vitest.config.mts`            | the runner config: says which files are unit tests                            |
| `Dockerfile`                   | the image: a multi-stage build ending in Next's standalone server             |
| `check.sh`                     | the one command that runs the whole check set                                 |
| `playwright.config.ts`         | the Playwright config: where the end to end tests are, and what they drive    |
| `tests/`                       | end to end and contract tests (`*.spec.ts`): they run against the built image |
| `.github/workflows/checks.yml` | the pipeline for a pull request: runs `check.sh`                              |
| `.github/workflows/ship.yml`   | the pipeline for a merge to `main`: builds the image and pushes it to ghcr.io |
