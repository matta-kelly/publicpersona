# publicpersona

My personal site: who I am, what I have built, and how I think. Live at [home.monk3y.xyz](https://home.monk3y.xyz).

- `/` bio
- `/projects` write-ups of things I have built
- `/code` my repositories, read live from the git host's API
- `/photos` a gallery, read live from a shared Immich album

Built with Next.js 16, React 19, TypeScript and Tailwind 4.

## Run it

Needs Node 22 and pnpm.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

The site is then at http://localhost:3000.

`.env.local` holds two values, both described in `.env.example`. Without them the site still runs; `/photos` and `/code` have nothing to show.

`pnpm install` also turns on the pre-commit hook in `.githooks/`, which runs the lint and the typecheck on staged TypeScript.

## Check it

```sh
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm format` applies Prettier to the whole repo.

## Ship it

Merging to `main` is the deploy.

1. CI runs the lint and the build.
2. CI builds a container image and pushes it twice: tagged with the commit, and as `latest`.
3. The host runs `latest` and pulls a new image by itself.

To roll back, pin the host to the tag of an earlier commit.

## Layout

| Path | Holds |
|---|---|
| `src/app/` | pages and routes (Next.js App Router) |
| `src/components/` | shared interface pieces |
| `src/lib/` | clients for the two outside services |
| `public/` | images and other static files |
| `Dockerfile` | the image: a multi-stage build ending in Next's standalone server |
| `.forgejo/workflows/build.yaml` | the CI pipeline |
