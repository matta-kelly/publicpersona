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
