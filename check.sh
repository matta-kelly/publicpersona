#!/usr/bin/env bash
# The whole check set, cheapest first. Run from the repo root, on the host:
# the dev container has no tool that builds an image.
set -euo pipefail

# The toolchain differs per place, so both come from the environment.
ENGINE=${ENGINE:-podman}

if [ -z "${PNPM:-}" ]; then
  devcontainer="npx --yes @devcontainers/cli"
  PNPM="$devcontainer exec --workspace-folder . --docker-path podman pnpm"

  # exec needs a running container, and the first start installs the packages.
  code=0
  timeout -k 5 300 $devcontainer up --workspace-folder . --docker-path podman >/dev/null || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then
    echo "check.sh: gave up after 300s waiting for: the dev container to start" >&2
    exit 1
  elif [ "$code" -ne 0 ]; then
    echo "check.sh: the dev container did not start" >&2
    exit 1
  fi
fi

$PNPM format:check
$PNPM lint
$PNPM typecheck

# Runs pnpm build inside the image, so a broken Dockerfile and a broken build both fail here.
"$ENGINE" build -t publicpersona:check .

# The end to end tests drive the image that was just built. It starts here, on the host:
# the dev container has no tool that runs an image.
SITE=publicpersona-check
# A run that was killed leaves its container behind, and the name and the port stay taken.
"$ENGINE" rm -f "$SITE" >/dev/null 2>&1 || true
trap '"$ENGINE" rm -f "$SITE" >/dev/null 2>&1 || true' EXIT
# The port is the one in playwright.config.ts.
"$ENGINE" run -d --name "$SITE" -p 127.0.0.1:3210:3000 publicpersona:check >/dev/null

if ! timeout -k 5 30 bash -c 'until "$0" exec "$1" wget -q -O /dev/null http://127.0.0.1:3000/api/health 2>/dev/null; do sleep 1; done' "$ENGINE" "$SITE"; then
  echo "check.sh: gave up after 30s waiting for: the site to answer in the container $SITE" >&2
  "$ENGINE" logs "$SITE" >&2 || true
  exit 1
fi

$PNPM exec playwright test
