# publicpersona

My personal site: who I am, what I have built, and how I think. Live at [home.monk3y.xyz](https://home.monk3y.xyz).

- `/` bio
- `/projects` write-ups of things I have built
- `/code` my repositories, read live from the git host's API
- `/photos` a gallery, read live from a shared Immich album

Built with Next.js 16, React 19, TypeScript and Tailwind 4.

## Run it

Every command runs in the dev container, which holds Node 22 and pnpm. The packages and the build cache stay in Podman volumes, out of the repo folder. Needs Podman and Node on the host.

```sh
npx @devcontainers/cli up --workspace-folder . --docker-path podman
cp .env.example .env.local
npx @devcontainers/cli exec --workspace-folder . --docker-path podman pnpm dev
```

Creating the container installs the packages. In VS Code, **Reopen in Container** does the same, and its terminal is then inside the container.

The site is then at http://localhost:3000.

`.env.local` holds two values, both described in `.env.example`. Without them the site still runs; `/photos` and `/code` have nothing to show.

The install also turns on the pre-commit hook in `.githooks/`, which runs the lint and the typecheck on staged TypeScript. A commit made on the host skips them, since the packages are only in the container.

## Check it

On the host, from the repo root:

```sh
./check.sh
```

It runs the whole check set and stops at the first failure: the format check, the lint, the typecheck, and the image build. The image build runs `pnpm build` and pushes nothing. Needs Podman and Node on the host; the three `pnpm` checks run in the dev container, which the script starts.

The pipeline runs the same command. Two values from the environment say which tools to use:

| Value    | Says                           | Default                   |
| -------- | ------------------------------ | ------------------------- |
| `PNPM`   | how to call pnpm               | through the dev container |
| `ENGINE` | the tool that builds the image | `podman`                  |

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
| `src/lib/`                     | clients for the two outside services                                          |
| `public/`                      | images and other static files                                                 |
| `Dockerfile`                   | the image: a multi-stage build ending in Next's standalone server             |
| `check.sh`                     | the one command that runs the whole check set                                 |
| `.github/workflows/checks.yml` | the pipeline for a pull request: runs `check.sh`                              |
| `.github/workflows/ship.yml`   | the pipeline for a merge to `main`: builds the image and pushes it to ghcr.io |
