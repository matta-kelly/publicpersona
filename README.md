# publicpersona

Personal site. Lives at `home.monk3y.xyz`.

See [`AGENTS.md`](./AGENTS.md) for working with this repo and the
[`public-persona`](../../../thought-garden/public-persona.md) pod in
thought-garden for goals, scope, and architecture.

## Quick start

```sh
pnpm install
cp .env.example .env.local   # then fill values from Vaultwarden
pnpm dev                     # http://localhost:3000
```

The required env vars and the Vaultwarden items they come from are
documented in `.env.example`.

`pnpm install` also wires the pre-commit hook (`.githooks/pre-commit`,
runs lint + typecheck on staged TS changes).

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Local dev server with hot reload |
| `pnpm build` | Production build (catches type errors too) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit`, faster than `build` for type-only checks |
| `pnpm format` | Prettier across the repo |

## Deploy

Push to `main` on Forgejo → CI builds + pushes image, bumps `deploy/deployment.yaml`,
Flux reconciles on the home cluster. Live at `home.monk3y.xyz`.
