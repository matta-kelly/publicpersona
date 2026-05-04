# publicpersona

Personal portfolio + blog. Public face on `home.monk3y.xyz`.

## Knowledge Hub

See [[public-persona]] in thought-garden for goals, scope, and architecture.
Lessons learned in `lessons.md` (in this repo).

## Structure

| Directory / file | Purpose |
|---|---|
| `src/app/` | Next.js App Router pages (`/`, `/projects`) |
| `src/components/` | Shared UI (`Nav`, `Footer`, `Providers`, `ThemeToggle`) |
| `public/` | Static assets (favicon, images) |
| `Dockerfile` | Multi-stage Node build → Next standalone runtime |
| `.forgejo/workflows/build.yaml` | CI: validate → build+push → bump deploy tag |
| `deploy/` | k8s manifests reconciled by Flux on `monkeybusiness` |

## Working with this repo

```sh
pnpm install                   # also wires pre-commit hook via prepare script
cp .env.example .env.local     # fill values from Vaultwarden
pnpm dev                       # http://localhost:3000
pnpm lint
pnpm typecheck                 # tsc --noEmit, faster than full build
pnpm build                     # produces .next/standalone/
```

## Required env vars

| Var | Purpose | Vaultwarden item |
|---|---|---|
| `IMMICH_SHARE_KEY` | Anonymous share key for the `/photos` album | `immich-publicpersona-share` |
| `FORGEJO_API_TOKEN` | Read access to Forgejo repos for `/code` | `forgejo-api-token` |

In production, both are pulled into the pod via `deploy/externalsecret.yaml`
and mounted as env from k8s Secrets. Locally, `.env.local` (gitignored)
holds the values; Next loads it automatically.

Manual image build (rare — CI does this):
```sh
docker build -t forgejo.monk3y.xyz/mkultra/publicpersona:dev .
docker run --rm -p 3000:3000 forgejo.monk3y.xyz/mkultra/publicpersona:dev
```

## Deploy

Flux on `monkeybusiness` watches this repo's `deploy/` via a `GitRepository`
defined in dazoo (`clusters/home/apps/publicpersona-source.yaml`). External
access goes through the home Cloudflare tunnel → `home.monk3y.xyz`. No Caddy.
