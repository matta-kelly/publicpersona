#!/usr/bin/env bash
# Checks the spec in _well/spec-dev-container.md. Run from the repo root, on the host.
set -euo pipefail

cli() { npx --yes @devcontainers/cli "$1" --workspace-folder . --docker-path podman "${@:2}"; }
fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "ok: $1"; }

[ -f .devcontainer/devcontainer.json ] || fail "no .devcontainer/devcontainer.json"
cli up >/dev/null || fail "container does not start under rootless podman"
pass "container starts"

cli exec test -x node_modules/.bin/next || fail "packages were not installed when the container was created"
pass "packages installed on create"

for cmd in lint typecheck build; do
  cli exec pnpm -s "$cmd" >/dev/null || fail "pnpm $cmd does not pass in the container"
done
pass "lint, typecheck and build pass"

for dir in node_modules .next .pnpm-store; do
  count=$(find "$dir" -type f 2>/dev/null | wc -l)
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
