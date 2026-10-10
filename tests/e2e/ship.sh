#!/usr/bin/env bash
# Checks the merge half of _well/spec-ship.md: what exists only after the pull request merges.
# Run from the repo root, on the host, right after the merge, before another merge moves main.
# Needs no login to the registry: every registry read is anonymous, as a node's pull is.
set -uo pipefail

repo=matta-kelly/publicpersona
image=matta-kelly/publicpersona
source_label=https://github.com/matta-kelly/publicpersona
failed=0

fail() { echo "FAIL: $1" >&2; failed=1; }
pass() { echo "ok: $1"; }

# Main as GitHub has it, not as this checkout last saw it.
sha=$(timeout 30 git ls-remote origin refs/heads/main | cut -f1)
[ -n "$sha" ] || { echo "FAIL: gave up after 30s waiting for: main's commit from origin" >&2; exit 1; }
tag="sha-${sha::7}"

# ── a merge to main starts the ship run, and it passes ───────────────────────
# GitHub starts a run some seconds after a push. Looking once finds nothing, so look until it is there.
run=""
deadline=$((SECONDS + 120))
while [ -z "$run" ] && [ "$SECONDS" -lt "$deadline" ]; do
  run=$(timeout 30 gh api "repos/$repo/actions/runs?head_sha=$sha&event=push" \
    --jq '[.workflow_runs[] | select(.name == "ship")][0].id // empty' 2>/dev/null || true)
  [ -n "$run" ] || sleep 5
done

if [ -z "$run" ]; then
  fail "gave up after 120s waiting for: a ship run to start for main's commit ${sha::7}"
else
  code=0
  timeout -k 5 600 gh run watch "$run" --repo "$repo" --exit-status >/dev/null 2>&1 || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then
    fail "gave up after 600s waiting for: the ship run $run to finish"
  elif [ "$code" -ne 0 ]; then
    fail "the ship run $run did not pass"
  else
    pass "the merge started a ship run, and it passed"
  fi
fi

# ── the image is in the registry, for anyone, under both tags ────────────────
python3 - "$image" "$tag" "$source_label" <<'PY' || failed=1
import json, sys, urllib.error, urllib.request

image, tag, source_label = sys.argv[1:4]
registry = "https://ghcr.io"
accept = ", ".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])
failed = False

def fail(msg):
    global failed
    failed = True
    print(f"FAIL: {msg}", file=sys.stderr)

def ok(msg):
    print(f"ok: {msg}")

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

opener = urllib.request.build_opener(NoRedirect)

def get(path, token=None):
    headers = {"Accept": accept}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(registry + path, headers=headers)
    try:
        res = opener.open(req, timeout=30)
    except urllib.error.HTTPError as err:
        if err.code not in (301, 302, 303, 307, 308):
            raise
        # The registry hands a layer off to a store that takes a signed address, not the token.
        res = urllib.request.urlopen(err.headers["Location"], timeout=30)
    with res:
        return res.headers.get("Docker-Content-Digest"), json.load(res)

def manifest(ref, token):
    try:
        return get(f"/v2/{image}/manifests/{ref}", token)
    except urllib.error.HTTPError as err:
        return None, err.code

# A private or missing package gives no anonymous token; the registry does not say which.
try:
    _, body = get(f"/token?scope=repository:{image}:pull")
    token = body.get("token")
except (urllib.error.URLError, TimeoutError) as err:
    token = None
if not token:
    fail(f"ghcr.io/{image} cannot be pulled without a login: it is missing, or it is private")
    sys.exit(1)
ok(f"ghcr.io/{image} can be pulled without a login")

by_commit, found = manifest(tag, token)
if not by_commit:
    fail(f"no image tagged {tag} for main's commit (registry answered {found})")
    sys.exit(1)
ok(f"an image tagged {tag} exists for main's commit")

latest, _ = manifest("latest", token)
if latest == by_commit:
    ok("latest is the same image as main's commit")
else:
    fail(f"latest is {latest}, not the image of main's commit {by_commit}")

# One build can hold several manifests (per platform, plus build records); the node runs linux/amd64.
if "manifests" in found:
    amd64 = [m for m in found["manifests"]
             if m.get("platform", {}).get("os") == "linux" and m["platform"].get("architecture") == "amd64"]
    if not amd64:
        fail(f"the image tagged {tag} has no linux/amd64 build")
        sys.exit(1)
    _, found = manifest(amd64[0]["digest"], token)
_, config = get(f"/v2/{image}/blobs/{found['config']['digest']}", token)

label = (config.get("config", {}).get("Labels") or {}).get("org.opencontainers.image.source")
if label == source_label:
    ok("the image names the repo it was built from")
else:
    fail(f"the image's source label is {label!r}, not {source_label!r}")

sys.exit(1 if failed else 0)
PY

exit "$failed"
