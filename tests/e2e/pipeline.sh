#!/usr/bin/env bash
# Checks the spec in _well/spec-checks.md. Run from the repo root, on the host, on the spec's branch.
set -euo pipefail

repo=matta-kelly/publicpersona
workflow=.github/workflows/checks.yml
branch=$(git branch --show-current)

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "ok: $1"; }

[ -f "$workflow" ] || fail "no $workflow"
python3 - "$workflow" <<'PY' || fail "the workflow does not run on pull requests into main with the four checks"
import sys, yaml
wf = yaml.safe_load(open(sys.argv[1]))
on = wf.get("on", wf.get(True))  # YAML reads a bare `on` key as the boolean true
assert "main" in on["pull_request"]["branches"]
runs = " ".join(step.get("run", "") for job in wf["jobs"].values() for step in job["steps"])
for check in ("format:check", "lint", "typecheck", "build"):
    assert f"pnpm {check}" in runs, check
PY
pass "a pull request into main runs format check, lint, typecheck and build"

# A run that never finishes must fail here, not hang.
timeout -k 5 600 gh pr checks "$branch" --repo "$repo" --watch --fail-fast >/dev/null \
  || fail "the run on this pull request did not pass within 600s"
gh pr checks "$branch" --repo "$repo" --json name,state \
  --jq '.[] | select(.name == "checks") | .state' | grep -qx SUCCESS \
  || fail "no passing run named checks on this pull request"
pass "the run passes on this pull request"

python3 - "$workflow" <<'PY' || fail "a job has no time limit, or one over ten minutes"
import sys, yaml
jobs = yaml.safe_load(open(sys.argv[1]))["jobs"]
assert jobs and all(0 < job.get("timeout-minutes", 0) <= 10 for job in jobs.values())
PY
pass "the run has a time limit of ten minutes"

timeout 60 gh api "repos/$repo/rules/branches/main" \
  --jq '.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context' \
  | grep -qx checks || fail "the ruleset on main does not require the run"
pass "main refuses a pull request whose run is failing or missing"

git diff --quiet github/main -- .forgejo || fail ".forgejo/ differs from main"
pass "the existing pipeline file is unchanged"
