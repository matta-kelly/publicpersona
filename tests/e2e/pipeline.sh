#!/usr/bin/env bash
# Checks the pull request half of _well/spec-ship.md.
# Run from the repo root, on the host, on the spec's branch, after the branch is pushed
# and its pull request is open. tests/e2e/ship.sh checks the half that exists only after the merge.
set -uo pipefail

repo=matta-kelly/publicpersona
checks=.github/workflows/checks.yml
ship=.github/workflows/ship.yml
head=$(git rev-parse HEAD)
failed=0

# Every block runs, so one pass over the script shows every criterion that does not hold.
fail() { echo "FAIL: $1" >&2; failed=1; }
pass() { echo "ok: $1"; }

# ── one command runs the whole check set ─────────────────────────────────────
if [ ! -x ./check.sh ]; then
  fail "no ./check.sh to run the check set"
else
  code=0
  timeout -k 5 600 ./check.sh >/dev/null || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then
    fail "gave up after 600s waiting for: ./check.sh to finish"
  elif [ "$code" -ne 0 ]; then
    fail "./check.sh does not pass on this branch"
  else
    pass "./check.sh passes: format check, lint, typecheck and the image build"
  fi
fi

# ── the run on this pull request passes ──────────────────────────────────────
# GitHub starts a run some seconds after a push. Looking once finds nothing, so look until it is there.
run=""
deadline=$((SECONDS + 120))
while [ -z "$run" ] && [ "$SECONDS" -lt "$deadline" ]; do
  run=$(timeout 30 gh api "repos/$repo/actions/runs?head_sha=$head&event=pull_request" \
    --jq '[.workflow_runs[] | select(.name == "checks")][0].id // empty' 2>/dev/null || true)
  [ -n "$run" ] || sleep 5
done

if [ -z "$run" ]; then
  fail "gave up after 120s waiting for: a checks run to start for commit ${head::7} (is it pushed, with a pull request open?)"
else
  code=0
  timeout -k 5 600 gh run watch "$run" --repo "$repo" --exit-status >/dev/null 2>&1 || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then
    fail "gave up after 600s waiting for: the checks run $run to finish"
  elif [ "$code" -ne 0 ]; then
    fail "the checks run $run did not pass"
  else
    pass "the checks run on this pull request passes"
  fi

  labels=$(timeout 30 gh api "repos/$repo/actions/runs/$run/jobs" \
    --jq '.jobs[] | select(.name == "checks") | .labels | join(",")' 2>/dev/null || true)
  if [ "$labels" = "ubuntu-24.04" ]; then
    pass "the checks job ran on the pinned runner ubuntu-24.04"
  else
    fail "the checks job ran on '${labels:-nothing}', not on ubuntu-24.04"
  fi

  # Ship runs on a merge to main and never from a pull request.
  others=$(timeout 30 gh api "repos/$repo/actions/runs?head_sha=$head&event=pull_request" \
    --jq '[.workflow_runs[] | select(.name != "checks")] | length' 2>/dev/null || echo unknown)
  if [ "$others" = "0" ]; then
    pass "the pull request started the checks run and no other"
  else
    fail "the pull request started $others runs besides checks"
  fi
fi

# ── what the two pipeline files allow ────────────────────────────────────────
# Read from the parsed files: GitHub's API does not report a job's rights, limits or triggers.
if [ ! -f "$ship" ]; then
  fail "no $ship"
fi

python3 - "$checks" "$ship" <<'PY' || failed=1
import os, re, sys, yaml

failed = False

def fail(msg):
    global failed
    failed = True
    print(f"FAIL: {msg}", file=sys.stderr)

def ok(msg):
    print(f"ok: {msg}")

def load(path):
    if not os.path.isfile(path):
        return None
    wf = yaml.safe_load(open(path))
    wf["on"] = wf.get("on", wf.get(True))  # YAML reads a bare `on` key as the boolean true
    return wf

def rights(wf, job):
    # A job's own block replaces the file's block; it does not add to it.
    return job.get("permissions", wf.get("permissions"))

checks, ship = load(sys.argv[1]), load(sys.argv[2])
files = {"checks": checks, "ship": ship}
present = {name: wf for name, wf in files.items() if wf}

# triggers
if ship:
    on = ship["on"]
    if isinstance(on, dict) and list(on) == ["push"] and on["push"] == {"branches": ["main"]}:
        ok("ship starts on every push to main and on nothing else")
    else:
        fail(f"ship must start on every push to main and on nothing else; it starts on {on}")

# rights
if checks:
    got = {name: rights(checks, job) for name, job in checks["jobs"].items()}
    if list(got) == ["checks"] and got["checks"] == {"contents": "read"}:
        ok("the checks job may read the repo and nothing else")
    else:
        fail(f"checks must hold one job, checks, that may only read the repo; found {got}")
if ship:
    got = {name: rights(ship, job) for name, job in ship["jobs"].items()}
    if list(got) == ["ship"] and got["ship"] == {"contents": "read", "packages": "write"}:
        ok("the ship job may read the repo and write packages, and nothing else")
    else:
        fail(f"ship must hold one job, ship, that may read the repo and write packages; found {got}")

# time limits
for name, wf in present.items():
    limits = {job: body.get("timeout-minutes", 0) for job, body in wf["jobs"].items()}
    if all(isinstance(v, int) and 0 < v <= 10 for v in limits.values()):
        ok(f"every job in {name} has a time limit of ten minutes or less")
    else:
        fail(f"a job in {name} has no time limit, or one over ten minutes: {limits}")

# runners
if ship:
    runners = {job: body.get("runs-on") for job, body in ship["jobs"].items()}
    if all(v == "ubuntu-24.04" for v in runners.values()):
        ok("the ship job runs on the pinned runner ubuntu-24.04")
    else:
        fail(f"the ship job must run on ubuntu-24.04; found {runners}")

# actions from someone else
for name, wf in present.items():
    loose = [
        step["uses"]
        for body in wf["jobs"].values()
        for step in body.get("steps", [])
        if "uses" in step
        and not step["uses"].startswith(("actions/", "./"))
        and not re.fullmatch(r"[^@]+@[0-9a-f]{40}", step["uses"])
    ]
    if loose:
        fail(f"{name} uses an action from outside GitHub that is not pinned to a full commit: {loose}")
    else:
        ok(f"every action from outside GitHub in {name} is pinned to a full commit")

# a newer run replaces an older one
if checks:
    c = checks.get("concurrency")
    if isinstance(c, dict) and c.get("group") and c.get("cancel-in-progress") is True:
        ok("a newer checks run cancels the older one")
    else:
        fail(f"checks must cancel an older run when a newer one starts; concurrency is {c}")
if ship:
    c = ship.get("concurrency")
    if isinstance(c, dict) and c.get("group") and not c.get("cancel-in-progress") and c.get("queue") == "max":
        ok("ship runs queue, and none is cancelled")
    else:
        fail(f"ship runs must queue with none cancelled; concurrency is {c}")

sys.exit(1 if failed else 0)
PY

# ── main still refuses a change whose checks run is failing or missing ───────
if timeout 60 gh api "repos/$repo/rules/branches/main" \
  --jq '.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context' \
  | grep -qx checks; then
  pass "the ruleset on main still requires the checks run"
else
  fail "the ruleset on main does not require the checks run"
fi

# ── the pipeline on the other server ─────────────────────────────────────────
if git diff --quiet origin/main -- .forgejo; then
  pass "the pipeline file under .forgejo/ is unchanged"
else
  fail ".forgejo/ differs from main"
fi

exit "$failed"
