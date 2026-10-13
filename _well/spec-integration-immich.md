---
type: spec
description: "Make the Immich client the only place that talks to Immich, and hold it with integration tests on answers captured from the live Immich: the album read and the thumbnail fetch. Reference for the promises of the client, the questions the owner has to answer, the client's public surface, how the answers are captured, stripped and replayed, what the client and the route look like after, the lines this change owns in the shared files, and how each criterion is checked."
status: review
---
## Need

- two places talk to Immich
	- the client, `src/lib/immich.ts`: the album read
	- the route handler, `src/app/photos/img/[id]/route.ts`: its own `fetch` for one picture, with an address the client builds for it
	- so the share key leaves the client inside an address, and what the site does with an answer of Immich is decided in wiring, where no test below end to end can reach it
- the client has no test
	- an adapter is held by integration tests on the real answers of its outside thing, captured and replayed ([[testing]], "kinds of test")
	- no captured answer of Immich is in the repo
- no spec says what the client must do
	- the promises below are read from the code at main `881cad7`, and from the answers of the live Immich, version 2.5.6, as captured for this spec
	- the live answers differ from what the code and the spec of the photo rules assume, in two places; both are under "The questions"

## Done looks like

### The questions

Each one has an answer written into the promises. Another answer sends this spec back to Design before the Factory starts.

- **Q1, a picture that Immich does not have for the share** (T2)
	- what Immich really answers: status 400, with the text `Not found or no asset.view access`. Not 404
	- today: the route reads 400 as a failure of Immich, so the site answers 502 `Upstream error` for the address of a picture that is not in the album
	- as written: the client says "not found" for a 400, and the site answers 404 `Not found`
	- Immich answers 400 to a thumbnail call in two more cases, and both get the same answer
		- an id in upper case: the same text. The spec of the photo rules says Immich accepts both cases (its Q1); the live Immich does not
		- an id that is not a version 4 UUID: the text `id must be a UUID`
- **Q2, a 404 from Immich** (T3)
	- today: the route answers 404 for a 404 of Immich
	- no 404 could be captured. The source of Immich 2.5.6 has one for this call: `Asset media not found`, for an asset of the share whose picture file is missing (`server/src/services/asset-media.service.ts`, line 252)
	- as written: a 404 is one of the other failures, so the site answers 502
	- the other answer: 404 is also "not found". Cost: a line of the client that no captured answer and no test holds
- **Q3, Immich cannot be reached** (T4)
	- today: the `fetch` of the route throws, and the site answers 500 with an empty body
	- as written: the client says "upstream failure", and the site answers 502 `Upstream error`
	- no answer can be captured for this one, since there is none. Its test makes `fetch` reject with a `TypeError`, which is what the Fetch standard says `fetch` does. It is the only test with no captured answer behind it
- **Q4, what the client gives of an asset** (A2)
	- today: every field Immich sends for an asset goes to the page: the path of the file, the camera, the place. The photo rules then keep four
	- as written: the client gives five fields (id, type, file name, width, height) and nothing else. It is the shape `AlbumAsset` of the photo rules
	- so `ImmichAsset` and `AssetType` go; nothing else uses them, nor `fileCreatedAt`
- **Q5, the text of a failure of the album read** (A4)
	- today: `Immich <path>: <status> <status text>`. Immich answers over HTTP/2, which has no status text, so the text ends in a space
	- as written: `Immich <path>: <status>`, and nothing else
- **Q6, a share that is not an album** (A5): **no test: capture missing**
	- the client decides it today: it fails with `Share is not an album-type link (type=...)`
	- no real answer could be captured: Immich has no such share for this site, and the share key cannot make one
	- as written: the promise is A5, and the capture and the test are missing. See "What is missing"
- **Q7, the captured picture**
	- one small picture of the album is in the repo, which is public: a landscape with no person in it, 377 by 250, 14 kB
	- the site already hands out the same bytes at `/photos/img/fbe63138-5d28-4273-a650-8fca7f097640`
	- the other answer: another asset; the capture script names it in one line

Seen, and not decided here:

- **HEAD**: Next.js answers a HEAD of the route by running `GET`, so a HEAD makes a full call to Immich and drops the body
	- it is wiring; the client has no HEAD. No promise here, and no change
- **a time limit**: neither call to Immich has one, so a call that hangs holds the request
	- [[conventions]], "Waiting", names a step in a test, a job in the pipeline and a command an agent runs; it does not name a call of the site
	- a new promise; no task holds it
- **an asset with no width or no height**: Immich's API description allows `null` for both
	- the live album has 232 assets, all of the type `IMAGE`; each one has a number for both
	- so no real answer with a `null` exists to capture, and no promise is made for one. The type stays `number`

### The part

- name: Immich client
- kind: adapter, so its tests are integration tests ([[testing]], "which kind")
- path: `src/lib/immich.ts`
- two functions are its public surface; the types below are exported with them

```ts
/** The album of the share, as far as the site reads it. */
export interface Share {
  albumName: string;
  assets: AlbumAsset[];
}

/** One picture, as Immich sent it. The body can be read once. */
export interface Thumbnail {
  body: ReadableStream<Uint8Array>;
  contentType: string | null;
  etag: string | null;
}

/** Why there is no picture: Immich does not have it for the share, or Immich failed. */
export interface ThumbnailFailure {
  failed: "not-found" | "upstream";
}

export function getShare(): Promise<Share>;

export function getThumbnail(request: ThumbnailRequest): Promise<Thumbnail | ThumbnailFailure>;
```

- `getShare`
	- what goes in: nothing
	- what comes out: the album of the share. When Immich gives none, the promise it returns is rejected with an `Error`
- `getThumbnail`
	- what goes in: a `ThumbnailRequest` of the photo rules, as it is
	- what comes out: the picture, or why there is none. It does not reject for anything Immich does
- `AlbumAsset` and `ThumbnailRequest` come from `src/lib/photos.ts`; the client imports the two types and nothing else
- `upstreamThumbnailUrl`, `ImmichAsset` and `AssetType` are gone
- the share key comes from the environment, `IMMICH_SHARE_KEY`, and is read only in this file
- where this change meets the task photos-without-key
	- the two changes share no file: that task changes `src/app/photos/page.tsx` and no line of the client; this change does not touch the page
	- that task relies on two things of `getShare`, and both stay as on main
		- it fails by a rejected promise, for no key and for every failure of the album read; it never gives a value in place of the album
		- with no key it fails with `IMMICH_SHARE_KEY is not set` before any call to Immich: `getKey` is called while the address is built
	- `getKey` stays exactly as it is on main
	- `GET /photos/img/<id>` with no key: as on main, status 500 with an empty body
		- in `getThumbnail`, `getKey` is called before the `try`, so a missing key is not read as a failure of Immich, and no call is made
		- no promise and no test here: every test sets a key. No visitor reaches that address from the page of that task when there is no key
		- another answer for it is a new promise; no task holds it

### Acceptance criteria: the promises

Each one is true or false of the two functions. Each one is decided in the client, so each one is held by integration tests on captured answers.

The share key:

- **K1** every call to Immich carries the share key of the environment, as `key` in the query

The album read, by `getShare`:

- **A1** the album has the name Immich gave for the album of the share
- **A2** an asset has the id, the type, the file name, the width and the height Immich gave, and nothing else of what Immich sent (Q4)
- **A3** the assets are in the order Immich gave
- **A4** when Immich answers a call with a failure, the album read fails with the text `Immich <path of the call>: <status>`, and nothing else (Q5)
	- so the share key is not in the text
- **A5** when the share is not an album, the album read fails with the text `Immich /api/shared-links/me: the share is not an album` (Q6)
	- **no test: its capture is missing**

The thumbnail fetch, by `getThumbnail`:

- **T1** the picture has the bytes, the content type and the etag that Immich sent
- **T2** when Immich answers 400, there is no picture, and the reason is "not found" (Q1)
- **T3** when Immich answers with any other failure, there is no picture, and the reason is "upstream" (Q2)
- **T4** when Immich cannot be reached, there is no picture, and the reason is "upstream" (Q3)
- **T5** the call asks Immich for the size the request gives
- **T6** the id of the request is one part of the path of the call, whatever text it is
	- the photo rules let only an asset id through. The type of a `ThumbnailRequest` is text, so a caller that skips the rules can hand over any text
	- so no text can make the call go to another address of Immich with the share key

### Acceptance criteria: the code around the client

Each one is checked on the branch, from the repo root.

- **R1** the client is the only place that talks to Immich
	- check: `git grep -n -E 'fetch\(|immich\.monk3y' -- src ':!src/lib/immich.ts' ':!src/lib/immich.test.ts' ':!src/lib/immich-captured' ':!src/lib/forgejo.ts'` prints nothing and exits 1
- **R2** the share key is read in one file
	- check: `git grep -l IMMICH_SHARE_KEY -- src` prints `src/lib/immich.test.ts` and `src/lib/immich.ts`, and no other line
- **R3** nothing hands the address of a call out of the client
	- check: `git grep -n -E 'upstreamThumbnailUrl|ImmichAsset|AssetType' -- src` prints nothing and exits 1
- **R4** the route handler answers
	- an id or a size outside the rules: as before, status 400 with `Bad asset id` or `Bad size`
	- "not found": status 404, with the text `Not found`
	- "upstream": status 502, with the text `Upstream error`
	- a picture: status 200, the body, `content-type` and `etag` when the picture has them, and `cache-control: public, max-age=86400, s-maxage=86400, immutable`
	- check: the file is the one under "Approach"; review of its diff. The route is wiring: no test holds it until a later task
- **R5** the page does not change
	- check: `git diff --numstat origin/main...HEAD -- src/app/photos/page.tsx` prints nothing

### Acceptance criteria: the chain

Each one is checked on the branch, from the repo root.

- **S1** `pnpm test`, in the dev container, finds four test files and passes
	- check: it shows `Test Files  4 passed (4)` and `Tests  87 passed (87)`, and returns with exit code 0
	- 87 is the 80 tests on main `881cad7` and the 7 of this spec
	- when main has more tests by then: the numbers are those of main, plus one file and 7 tests
- **S2** `./check.sh`, on the host, exits 0
- **S3** the `checks` run on the last commit of the pull request of this branch passes
	- check: `gh pr checks test/integration-immich` shows `checks` as `pass`
- **S4** the test file and the captured answers are the ones from Design
	- check: `git diff <the commit that added them> HEAD -- src/lib/immich.test.ts src/lib/immich-captured` prints nothing
- **S5** `README.md` lists the part, as "Approach" gives it
	- check: the format check of S2, and review
- **S6** the share key is in no file of the branch
	- check: `git grep -c -F -e "$(bw get notes immich-publicpersona-share)" $(git rev-list origin/main..HEAD)` prints nothing and exits 1
- **S7** the branch changes these paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `A	_well/spec-integration-immich.md`
		- `M	src/app/photos/img/[id]/route.ts`
		- `A	src/lib/immich-captured/album.json`
		- `A	src/lib/immich-captured/share-link-wrong-key.json`
		- `A	src/lib/immich-captured/share-link.json`
		- `A	src/lib/immich-captured/thumbnail-id-with-a-path.json`
		- `A	src/lib/immich-captured/thumbnail-not-in-share.json`
		- `A	src/lib/immich-captured/thumbnail-wrong-key.json`
		- `A	src/lib/immich-captured/thumbnail.json`
		- `A	src/lib/immich-captured/thumbnail.webp`
		- `A	src/lib/immich.test.ts`
		- `M	src/lib/immich.ts`
	- so `package.json` and `pnpm-lock.yaml` do not change: the branch installs nothing

Checked in Code review, by breaking it once on purpose:

- **S8** in `src/lib/immich.ts`, `res.status === 400` becomes `res.status === 404`; then `./check.sh` exits with a code that is not 0, and the test `is not found when Immich answers 400: the share does not hold the asset` is shown as failed
	- the change is thrown away after

### Captured answers

**What is captured**

Each file under `src/lib/immich-captured/` is one call to the live Immich, version 2.5.6, and its answer.

| File | The call | Immich answered |
| ---- | -------- | --------------- |
| `share-link.json` | `GET /api/shared-links/me` | 200, the share link |
| `album.json` | `GET /api/albums/<the id the share link gave>` | 200, the album |
| `share-link-wrong-key.json` | `GET /api/shared-links/me`, with a key Immich does not know | 401, `Invalid share key` |
| `thumbnail.json`, `thumbnail.webp` | `GET /api/assets/<an asset of the album>/thumbnail?size=thumbnail` | 200, a WebP picture; its bytes are the second file |
| `thumbnail-not-in-share.json` | `GET /api/assets/00000000-0000-4000-8000-000000000000/thumbnail?size=preview` | 400, `Not found or no asset.view access` |
| `thumbnail-wrong-key.json` | the thumbnail call, with a key Immich does not know | 401, `Invalid share key` |
| `thumbnail-id-with-a-path.json` | `GET /api/assets/..%2F..%2Fshared-links%2Fme/thumbnail?size=thumbnail` | 400, `id must be a UUID` |

- a file holds
	- `request`: the method, the address with no query, and the query with no key
	- `response`: the status, the headers `content-type` and `etag`, and the body as JSON, or `bodyFile` for the picture
- none was written by hand, and none was built from Immich's API description

**What is stripped**

- the share key
	- from every call: `key` is not in `request.query`
	- from the answer of the share link, which holds it in its field `key`: see the next rule
	- the script fails when the key is in any file it wrote
- every value that is not needed
	- in the two answers with data of a person (the share link and the album), every text becomes `"stripped"` and every number becomes `0`
	- but for: the type of the share and the id of its album; the name of the album; of each asset the id, type, file name, width and height. The site shows all of these to a visitor but the id of the album, which is in the address of the second call
	- the names of the fields, their order, the booleans and the nulls stay, so the shape is the one Immich sent
	- so no address, name or id of the owner, no path of a file, no camera, no date and no place is in the repo
- the album is cut to its first three assets, of 232
- every header but `content-type` and `etag`. Immich set no cookie
- the picture is as Immich sent it. It holds a colour profile and no other data about the photo

**How the capture is run**

- where the key comes from: the Vaultwarden item `immich-publicpersona-share`, which `.env.example` names; on the owner's machine it is read with `bw`
- save the script below outside the repo, and run it from the repo root: `IMMICH_SHARE_KEY=$(bw get notes immich-publicpersona-share) bash <the script>`
- then, in the dev container: `pnpm exec prettier --write src/lib/immich-captured`
- then `git grep -c -F -e "$(bw get notes immich-publicpersona-share)"`, which prints nothing
- needs `curl` and `jq` on the host
- a new capture is a task for Design, not for the Factory: the expected values in the test file are read from the captured files

```bash
#!/usr/bin/env bash
# Captures the answers of the live Immich that src/lib/immich.test.ts replays.
# Run from the repo root, on a machine that can reach Immich:
#   IMMICH_SHARE_KEY=$(bw get notes immich-publicpersona-share) bash capture-immich.sh
# The share key is read from the environment, and is in no file this writes.
set -euo pipefail

: "${IMMICH_SHARE_KEY:?the share key of the album, from the environment}"
BASE=https://immich.monk3y.xyz
OUT=src/lib/immich-captured
# An asset of the album with no person in it; its small picture is 14 kB.
ASSET=fbe63138-5d28-4273-a650-8fca7f097640
# In the form of an asset id, and no asset of Immich.
NO_ASSET=00000000-0000-4000-8000-000000000000
# A key Immich does not know.
WRONG_KEY=not-a-share-key

# The answers as Immich sent them hold the key, so they stay in memory, and go when this ends.
RAW=$(mktemp -d -p "${XDG_RUNTIME_DIR:?}")
trap 'rm -rf "$RAW"' EXIT
mkdir -p "$OUT"

# Every text becomes "stripped" and every number 0, but for the paths that $keep names.
# The names, the order, the booleans and the nulls stay, so the shape is the one Immich sent.
STRIP='
  def strip(keep):
    reduce paths(type == "string" or type == "number") as $p (.;
      if ($p | keep) then .
      else setpath($p; if (getpath($p) | type) == "string" then "stripped" else 0 end)
      end);
'

# call <name> <path> <query without the key> <key> <jq filter for the body>
call() {
  local name=$1 path=$2 query=$3 key=$4 filter=$5 status
  status=$(curl -sS --max-time 30 -H 'Accept: application/json' \
    -D "$RAW/$name.headers" -o "$RAW/$name.body" -w '%{http_code}' \
    "$BASE$path?${query:+$query&}key=$key")
  jq -n --arg url "$BASE$path" --arg query "$query" --argjson status "$status" \
    --rawfile headers "$RAW/$name.headers" --slurpfile body "$RAW/$name.body" "$STRIP"'
    {
      request: {
        method: "GET",
        url: $url,
        query: ($query | split("&") | map(select(. != "") | split("=") | {(.[0]): .[1]}) | add // {})
      },
      response: {
        status: $status,
        headers: ($headers | gsub("\r"; "") | split("\n")
          | map(capture("^(?<name>[^:]+): (?<value>.*)$") | .name |= ascii_downcase
              | select(.name == "content-type" or .name == "etag") | {(.name): .value})
          | add),
        body: ($body[0] | '"$filter"')
      }
    }' >"$OUT/$name.json"
}

call share-link /api/shared-links/me "" "$IMMICH_SHARE_KEY" \
  'strip(. == ["type"] or . == ["album", "id"])'
ALBUM=$(jq -r .response.body.album.id "$OUT/share-link.json")
call album "/api/albums/$ALBUM" "" "$IMMICH_SHARE_KEY" \
  '.assets |= .[0:3]
   | strip(. == ["albumName"]
       or (.[0] == "assets" and (.[2] | IN("id", "type", "originalFileName", "width", "height"))))'
call share-link-wrong-key /api/shared-links/me "" "$WRONG_KEY" .
call thumbnail-not-in-share "/api/assets/$NO_ASSET/thumbnail" size=preview "$IMMICH_SHARE_KEY" .
call thumbnail-wrong-key "/api/assets/$ASSET/thumbnail" size=thumbnail "$WRONG_KEY" .
# An id that is not in the form of one, written the way the client must write it: as one part of the path.
call thumbnail-id-with-a-path "/api/assets/..%2F..%2Fshared-links%2Fme/thumbnail" size=thumbnail "$IMMICH_SHARE_KEY" .

# The picture: its body is not JSON, so it is a file of its own, as Immich sent it.
status=$(curl -sS --max-time 30 -D "$RAW/thumbnail.headers" -o "$OUT/thumbnail.webp" -w '%{http_code}' \
  "$BASE/api/assets/$ASSET/thumbnail?size=thumbnail&key=$IMMICH_SHARE_KEY")
jq -n --arg url "$BASE/api/assets/$ASSET/thumbnail" --argjson status "$status" \
  --rawfile headers "$RAW/thumbnail.headers" '
  {
    request: { method: "GET", url: $url, query: { size: "thumbnail" } },
    response: {
      status: $status,
      headers: ($headers | gsub("\r"; "") | split("\n")
        | map(capture("^(?<name>[^:]+): (?<value>.*)$") | .name |= ascii_downcase
            | select(.name == "content-type" or .name == "etag") | {(.name): .value})
        | add),
      bodyFile: "thumbnail.webp"
    }
  }' >"$OUT/thumbnail.json"

if grep -r -q -F -e "$IMMICH_SHARE_KEY" "$OUT"; then
  echo "capture: the share key is in a file under $OUT" >&2
  exit 1
fi
echo "capture: wrote $(ls "$OUT" | wc -l) files to $OUT; the share key is in none"
```

**How the answers are replayed**

- no package. The platform gives all of it, and all of it is on main
	- Vitest 5.0.3: `vi.stubGlobal` puts a function in the place of `fetch`; `vi.stubEnv` sets the share key of a test
	- Node 22: `Response`, `URL`, `node:fs`, `node:crypto`, `node:util`
	- TypeScript reads a `.json` file as a module (`resolveJsonModule` is on)
- the function `immichAnswers`, in the test file, takes the captured files of one test
	- a call of the client gets the captured answer whose method, address and query are the same, and only when the call also carries the share key of the test
	- any other call gets no answer, and the test fails for it: a call that Immich was never seen to answer cannot pass
- what a package would add (MSW, nock): the call would go through the real `fetch` of Node before it is answered. The client hands `fetch` one address and reads one `Response`, and both are the same with the function above
- when the captured answers go stale: Immich changes and the files do not. A smoke check tells ([[ci-cd]], "Smoke checks"); it is parked in the epic

### What is missing

- **the capture and the test of A5**, a share that is not an album
	- needs: a share link of Immich of the type `INDIVIDUAL`, and its key
		- in Immich: select one photo with no person in it, Share, Create link
		- the key is the last part of the address of the share
		- save it as a Vaultwarden Secure Note named `immich-publicpersona-share-individual`, notes = the raw key; then `bw sync`
	- then Design adds one call to the script, one file and one test
		- the call: `call share-link-individual /api/shared-links/me "" "$IMMICH_INDIVIDUAL_SHARE_KEY" 'strip(. == ["type"])'`
		- the file: `src/lib/immich-captured/share-link-individual.json`
		- the test: `the album of the share: fails when the share is not an album`, with the text of A5 as its expected result
		- S1 then says 88 tests, and S7 has one more line
	- the share link can be deleted after the capture
	- decided in Design review: the change goes on with no test for A5. The line of the client is held by nothing until the capture is there

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

**The client**

`src/lib/immich.ts`, after the change, whole:

```ts
import type { AlbumAsset, ThumbnailRequest } from "./photos";

const IMMICH_BASE = "https://immich.monk3y.xyz";

/** The album of the share, as far as the site reads it. */
export interface Share {
  albumName: string;
  assets: AlbumAsset[];
}

/** One picture, as Immich sent it. The body can be read once. */
export interface Thumbnail {
  body: ReadableStream<Uint8Array>;
  contentType: string | null;
  etag: string | null;
}

/** Why there is no picture: Immich does not have it for the share, or Immich failed. */
export interface ThumbnailFailure {
  failed: "not-found" | "upstream";
}

function getKey(): string {
  const key = process.env.IMMICH_SHARE_KEY;
  if (!key) {
    throw new Error("IMMICH_SHARE_KEY is not set");
  }
  return key;
}

interface SharedLinkMeResponse {
  album: { id: string } | null;
  type: "ALBUM" | "INDIVIDUAL";
}

interface AlbumResponse {
  albumName: string;
  assets: AlbumAsset[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${IMMICH_BASE}${path}?key=${encodeURIComponent(getKey())}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600, tags: ["immich-share"] },
  });
  if (!res.ok) {
    throw new Error(`Immich ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getShare(): Promise<Share> {
  const link = await fetchJson<SharedLinkMeResponse>("/api/shared-links/me");
  if (link.type !== "ALBUM" || !link.album) {
    throw new Error("Immich /api/shared-links/me: the share is not an album");
  }
  const album = await fetchJson<AlbumResponse>(`/api/albums/${link.album.id}`);
  return {
    albumName: album.albumName,
    assets: album.assets.map(({ id, type, originalFileName, width, height }) => ({
      id,
      type,
      originalFileName,
      width,
      height,
    })),
  };
}

export async function getThumbnail(
  request: ThumbnailRequest,
): Promise<Thumbnail | ThumbnailFailure> {
  const params = new URLSearchParams({ key: getKey(), size: request.size });
  const url = `${IMMICH_BASE}/api/assets/${encodeURIComponent(request.id)}/thumbnail?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", redirect: "manual" });
  } catch {
    return { failed: "upstream" };
  }
  if (res.status === 400) {
    return { failed: "not-found" };
  }
  if (!res.ok || !res.body) {
    return { failed: "upstream" };
  }
  return {
    body: res.body,
    contentType: res.headers.get("content-type"),
    etag: res.headers.get("etag"),
  };
}
```

- what stays as on main: `IMMICH_BASE`, `getKey`, the options of the two `fetch` calls (`Accept`, `next`, `cache`, `redirect`)
- what no test holds, and why it is there
	- `!res.body`: the type of a body allows `null`, and a picture needs one. No answer of Immich with status 200 and no body was seen
	- `redirect: "manual"`: a redirect is then a failure, and the share key is not sent on to another address. Immich sent none
	- `!link.album`, and the text of A5: see "What is missing"

**The route handler**

`src/app/photos/img/[id]/route.ts`, after the change, whole:

```ts
import { NextRequest } from "next/server";
import { getThumbnail } from "@/lib/immich";
import { thumbnailRequest } from "@/lib/photos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = thumbnailRequest(id, req.nextUrl.searchParams.get("size"));
  if ("refused" in request) {
    const text = request.refused === "id" ? "Bad asset id" : "Bad size";
    return new Response(text, { status: 400 });
  }

  const thumbnail = await getThumbnail(request);
  if ("failed" in thumbnail) {
    return thumbnail.failed === "not-found"
      ? new Response("Not found", { status: 404 })
      : new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  if (thumbnail.contentType) headers.set("content-type", thumbnail.contentType);
  if (thumbnail.etag) headers.set("etag", thumbnail.etag);
  headers.set("cache-control", "public, max-age=86400, s-maxage=86400, immutable");

  return new Response(thumbnail.body, { status: 200, headers });
}
```

**The shared files: the lines this change owns**

Each place is given by the text of a line, as the file is on main `881cad7`. Every line not named here is not this change's.

- `check.sh`, `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`, `.prettierignore`: no line
	- `pnpm test` already finds `src/lib/immich.test.ts`, so the integration tests run in the step of the unit tests
- `README.md`, four places
	- the table under `## Parts`: one new row, directly after the row that starts `| photo rules`

```md
| Immich client  | adapter | integration | `src/lib/immich.ts`       |
```

- `README.md`, continued
	- `pnpm format`, in the dev container, gives the padding of the table
	- the line `4. the unit tests` becomes `4. the unit and integration tests`
	- the line that starts `` `pnpm test`, in the container `` becomes: `` `pnpm test`, in the container, runs the unit and integration tests alone, once. ``
	- in the table under `## Layout`, the row of `vitest.config.mts` becomes: `the runner config: says which files are unit and integration tests`
	- in the same table, one new row, directly after the row of `src/lib/`: `src/lib/immich-captured/`, `answers of the live Immich, captured; the integration tests replay them`

**Commits and the pull request**

- the branch is `test/integration-immich`, made from main `881cad7`
	- main comes in again only by a merge; never a rebase, never a force push
- the spec, the tests and the captured answers are on the branch before any code
- then, in this order
	- `fix(photos): move the thumbnail fetch into the Immich client`: `src/lib/immich.ts`, `src/app/photos/img/[id]/route.ts`
		- all 87 tests pass after this commit
		- a `fix`: the site answers 404 where it answered 502 (Q1), and 502 where it answered 500 (Q3)
	- `docs(readme): list the Immich client`: `README.md`
- the pull request: the owner opens it, as a draft, from this branch
	- title: `test: add the Immich client's integration tests`
	- body, one line: `Spec: _well/spec-integration-immich.md`

### Out of scope

- what the site does with no share key: the task photos-without-key
- what `/photos` shows when the album read fails: the page has no failure path today, and no task but photos-without-key touches it
- the photo rules, `src/lib/photos.ts`, and their tests
	- the spec of the photo rules says Immich accepts an id in upper case (its Q1). The live Immich answers 400. The rule stays; after this change the site answers 404 for such an id. Whether the rule changes is the owner's
- HEAD, a time limit, an asset with no width or height: see "Seen, and not decided here"
- a test of the route handler or of `/photos`: wiring, held end to end, and with real data by a smoke check; both are later tasks
- the smoke check that tells when the captured answers are stale: parked in the epic
- the Forgejo client
- any package, `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`
- the stale things the epic lists

### Going back

- revert the squash commit on main
	- the thumbnail fetch goes back into the route handler, and the site answers as before: 502 for a picture that is not in the album, 500 when Immich cannot be reached
	- nothing outside `src/`, `_well/` and `README.md` changes; the image and the pipeline are the same

## Tests

All in `src/lib/immich.test.ts`, beside the code; found by `vitest.config.mts`; run by `pnpm test`. Part: Immich client. Kind: integration. 7 tests.

- how the expected results were made
	- the name of the album, the ids, the file names, the widths, the heights, the content type and the etag: read from the captured files, which hold what the live Immich sent
	- the bytes of the picture: the SHA-256 of `thumbnail.webp`, by `sha256sum`
	- the two reasons and the text of a failure: from the promises
	- none is taken from a run of the code
- every test goes through `getShare` or `getThumbnail`, and checks what comes back
- one test per edge that the client decides. The size (T5) and the key (K1) have no test of their own: a call with another size or with no key gets no captured answer, so the tests named for them below fail
- failing today, on main `881cad7`: all 7
	- the five of the picture: `getThumbnail is not a function`
	- the album: the client gives every field Immich sent, not five (A2)
	- the failure of the album read: the text ends in a space (A4)
- each of the 7 was also seen to fail alone, against a build of the client made for the run, broken in one place, and thrown away
	- with that build unbroken, all 87 tests pass, and `pnpm typecheck`, `pnpm lint` and `pnpm format:check` pass

| Test | Criterion |
| ---- | --------- |
| the album of the share: has the name of the album, and of each asset the id, type, file name, width and height, in the order Immich gave | A1, A2, A3, K1 |
| the album of the share: fails with the call and the status, and nothing else, when Immich answers with a failure | A4 |
| the picture of a request: is the bytes, the content type and the etag that Immich sent | T1, K1 |
| the picture of a request: is not found when Immich answers 400: the share does not hold the asset | T2, T5 |
| the picture of a request: is an upstream failure when Immich answers with any other failure | T3 |
| the picture of a request: is an upstream failure when Immich cannot be reached | T4 |
| the picture of a request: stays in the place of the id in the address, whatever text the id is | T6 |
| none: the capture is missing | A5 |

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- K1, A1 to A4, T1 to T6: a test, written first and kept
- A5: nothing, until its capture is there
- R1 to R5: the checks given with each one; R4 by review, since the route is wiring
- S1 to S4, S6 to S8, the chain: the checks accept it (S2, S3), and the real run proves it (S3, on the pull request)
- S5, `docs`: the format check, and review
