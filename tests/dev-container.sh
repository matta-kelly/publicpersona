#!/usr/bin/env bash
# Checks the spec in _well/spec-dev-container.md. Run from the repo root, on the host.
set -euo pipefail

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "ok: $1"; }

# Every step that waits has a limit, so a hang fails with what it was waiting for.
# wait_for <seconds> <what> <devcontainer verb> [args...]
wait_for() {
  local limit=$1 what=$2 verb=$3 code=0
  shift 3
  timeout -k 5 "$limit" npx --yes @devcontainers/cli "$verb" \
    --workspace-folder . --docker-path podman "$@" >/dev/null || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then fail "gave up after ${limit}s waiting for: $what"; fi
  [ "$code" -eq 0 ] || fail "$what"
}

[ -f .devcontainer/devcontainer.json ] || fail "no .devcontainer/devcontainer.json"
wait_for 300 "the container to start under rootless podman" up
pass "container starts"

wait_for 30 "packages installed when the container was created" exec test -x node_modules/.bin/next
pass "packages installed on create"

for cmd in lint typecheck build; do
  wait_for 300 "pnpm $cmd to pass in the container" exec pnpm -s "$cmd"
done
pass "lint, typecheck and build pass"

for dir in node_modules .next .pnpm-store; do
  [ -e "$dir" ] || continue
  count=$(find "$dir" -type f | wc -l)
  [ "$count" -eq 0 ] || fail "$count files under $dir on the host"
done
pass "no packages or build output on the host"

foreign=$(find . -path ./.git -prune -o -path ./node_modules -prune -o -path ./.next -prune \
  -o ! -user "$(id -un)" -print | wc -l)
[ "$foreign" -eq 0 ] || fail "$foreign files in the repo are not owned by $(id -un)"
pass "files written by the container belong to the host user"

probe=src/hook-probe.ts
trap 'git rm -q --cached --force "$probe" 2>/dev/null || true; rm -f "$probe"' EXIT
echo "export {};" > "$probe"
git add "$probe"
out=$(./.githooks/pre-commit 2>&1) || fail "the pre-commit hook blocks a commit made on the host"
echo "$out" | grep -qi "container" || fail "the hook does not say the checks run in the container"
pass "host commits are not blocked by the hook"

for section in "## Run it" "## Check it"; do
  awk -v s="$section" '$0==s{on=1;next} /^## /{on=0} on' README.md | grep -qi "container" \
    || fail "README section '$section' does not mention the container"
done
pass "README points at the container"
