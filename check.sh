#!/usr/bin/env bash
# The whole check set, cheapest first. Run from the repo root, on the host:
# the dev container has no tool that builds an image.
set -euo pipefail

# The toolchain differs per place, so both come from the environment.
ENGINE=${ENGINE:-podman}

# The steps this change needs, read from the files it changed since it left main: committed,
# not yet committed, and not yet tracked.
# Notes, which are Markdown files: no step after the lint reads them. Any other file under
# _well/ is not a note: the typecheck reads a TypeScript file wherever it is.
# Unit tests and the captured answers they replay: the image does not hold them
# (.dockerignore), so the image build and the end to end tests cannot see them.
# Any other file, no file, or no answer from git: the whole set.
notes='_well/.*\.md$|README\.md$'
unit_tests='src/.*\.test\.tsx?$|src/(.*/)?[^/]+-captured/'
needs=all
# A rename counts as the two files it is, so a source file moved into the notes is still seen.
if base=$(git merge-base origin/main HEAD 2>/dev/null) &&
  changed=$(git diff --name-only --no-renames "$base" 2>/dev/null &&
    git ls-files --others --exclude-standard 2>/dev/null) &&
  [ -n "$changed" ]; then
  if ! grep -qvE "^($notes)" <<<"$changed"; then
    needs=notes
  elif ! grep -qvE "^($notes|$unit_tests)" <<<"$changed"; then
    needs=unit
  fi
fi

# The pipeline asks before it sets up the toolchain: it installs the browser only for a run
# that drives one.
if [ "${1:-}" = --plan ]; then
  echo "$needs"
  exit 0
fi

if [ -z "${PNPM:-}" ]; then
  # exec needs a running container, and the first start installs the packages.
  code=0
  up=$(timeout -k 5 300 npx --yes @devcontainers/cli up --workspace-folder . --docker-path podman) || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then
    echo "check.sh: gave up after 300s waiting for: the dev container to start" >&2
    exit 1
  elif [ "$code" -ne 0 ]; then
    echo "check.sh: the dev container did not start" >&2
    exit 1
  fi

  # The CLI takes about a second to find the container again on each call. It names the
  # container once, when it starts it, and podman reaches it by that name with no search.
  # The user and the folder are those of .devcontainer/devcontainer.json.
  container=$(sed -n 's/.*"containerId":"\([0-9a-f]*\)".*/\1/p' <<<"$up")
  if [ -z "$container" ]; then
    echo "check.sh: the dev container started, and its name is not in the answer: $up" >&2
    exit 1
  fi
  PNPM="podman exec --user node --workdir $PWD $container pnpm"
fi

$PNPM format:check
$PNPM lint
if [ "$needs" = notes ]; then
  echo "check.sh: every changed file is a Markdown note. Left out: the typecheck, the unit and integration tests, the image build, the end to end and contract tests"
  exit 0
fi
$PNPM typecheck
$PNPM test
if [ "$needs" = unit ]; then
  echo "check.sh: every changed file is a note, a unit or integration test, or a captured answer. Left out: the image build, the end to end and contract tests"
  exit 0
fi

# Runs pnpm build inside the image, so a broken Dockerfile and a broken build both fail here.
"$ENGINE" build -t publicpersona:check .

# The end to end tests drive the image that was just built. It starts here, on the host:
# the dev container has no tool that runs an image.
SITE=publicpersona-check
# A run that was killed leaves its container behind, and the name and the port stay taken.
"$ENGINE" rm -f "$SITE" >/dev/null 2>&1 || true
trap '"$ENGINE" rm -f "$SITE" >/dev/null 2>&1 || true' EXIT
# The port is the one in playwright.config.ts.
# The flags and the values are those of the node's unit file, publicpersona.container in dazoo.
# The image promises to serve when it is started that way, and a test can only show that
# against a container that is.
"$ENGINE" run -d --name "$SITE" -p 127.0.0.1:3210:3000 \
  --read-only --user 1000 --cap-drop ALL --security-opt no-new-privileges \
  --env NODE_ENV=production --env PORT=3000 --env HOSTNAME=0.0.0.0 \
  publicpersona:check >/dev/null

# Any answer means the site is up. Whether the answer is good is for the tests to say.
if ! timeout -k 5 30 bash -c 'until "$0" exec "$1" wget -q -S -O /dev/null http://127.0.0.1:3000/api/health 2>&1 | grep -q "HTTP/"; do sleep 1; done' "$ENGINE" "$SITE"; then
  echo "check.sh: gave up after 30s waiting for: the site to answer in the container $SITE" >&2
  "$ENGINE" logs "$SITE" >&2 || true
  exit 1
fi

$PNPM exec playwright test
