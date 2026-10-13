---
type: spec
description: "Make the photo rules of /photos a piece of logic with a unit test for each edge: which asset id a thumbnail request may carry, which sizes it may ask for, and which assets of the album are photos. Reference for the promises of the rules, the questions the owner has to answer, the public surface of the part, what the route, the page and the Immich client look like after, the lines this change owns in the shared files, and how each criterion is checked."
status: design
---
## Need

- the photo rules cannot be tested where they are
	- the form of an asset id and the sizes allowed sit in the route handler `src/app/photos/img/[id]/route.ts`, in front of a `fetch`
	- "images only" sits in `src/app/photos/page.tsx`, an `async` Server Component, which Vitest cannot test ([[testing]], "Runner config")
	- a test of a rule would need a fake of the network or of Next.js, so it would not be a unit test ([[testing]], "a good test")
- the task integration-immich comes next: it moves the thumbnail fetch into the Immich client
	- the client must get a request that is already checked, so it holds no rule
	- this change gives it that request, and leaves the fetch where it is
- no spec says what `/photos` must do
	- the promises below are read from the code at main `cff4c61`, and from Immich's API description (version 3.3.0-rc.0)
	- every one says what the site does today: this change is a `refactor` with tests, and the live site shows the same after
	- four of them are choices, listed under "The questions"; each one is the owner's to accept or refuse in Design review

## Done looks like

### The questions

Each one has an answer written into the promises. Another answer sends this spec back to Design before the Factory starts.

- **Q1, upper case in an asset id** (I2, I4)
	- as written: accepted, and handed on as it was given
	- Immich gives its ids in lower case, and accepts both cases
	- the other answers: refuse upper case; or accept it and hand it on in lower case
	- cost of the answer as written: one photo has more than one address on the site
- **Q2, the version of the UUID** (I3)
	- as written: not checked; any hexadecimal digits in the form are an asset id
	- Immich's API description allows only version 4
	- cost of the answer as written: a well-formed id of another version goes to Immich, and the site answers what it answers for any upstream failure
	- cost of the other answer: when Immich changes the version of its ids, every photo of the gallery is refused until the rule changes
- **Q3, the sizes** (Z1, Z3)
	- as written: `thumbnail` and `preview`, and no other
	- Immich has two more: `fullsize`, and `original`, which it marks as deprecated
	- so nobody gets the full file of a photo through the site
- **Q4, a size that is given and empty** (`?size=`) (Z3)
	- as written: refused
	- the other answer: read as no size, so `thumbnail`
- **Q5, what "images only" is** (G1)
	- as written: the rule of the gallery's list. A video, a sound file or any other asset of the album is not in the gallery
	- it is not a rule of the thumbnail request: the request checks the form of the id, not what the asset is
		- so the address of a video's id answers with the still picture Immich makes for it; the share key limits Immich to the assets of the share
		- a rule for that needs the album at the time of the request: a call to Immich, so not logic. It is a new promise, and no task holds it

### The part

- name: photo rules
- kind: logic, so its tests are unit tests ([[testing]], "which kind")
- path: `src/lib/photos.ts`
- two functions are its public surface; the types below are exported with them

```ts
/** The sizes of a picture the site hands out. Immich has more. */
export type ThumbnailSize = "thumbnail" | "preview";

/** A request for one picture that has passed the rules. */
export interface ThumbnailRequest {
  id: string;
  size: ThumbnailSize;
}

/** Which part of a request broke a rule. */
export interface ThumbnailRefusal {
  refused: "id" | "size";
}

/** One asset of the album, as far as the rules read it. */
export interface AlbumAsset {
  id: string;
  type: string;
  originalFileName: string;
  width: number;
  height: number;
}

/** What the gallery gets for one photo. It goes to the browser. */
export interface Photo {
  id: string;
  originalFileName: string;
  width: number;
  height: number;
}

export function thumbnailRequest(id: string, size: string | null): ThumbnailRequest | ThumbnailRefusal;

export function galleryPhotos(assets: AlbumAsset[]): Photo[];
```

- `thumbnailRequest`
	- what goes in
		- `id`: the text in the place of the id in the address `/photos/img/<id>`; any text
		- `size`: the value of `size` in the query; `null` when the query has none; any text
	- what comes out
		- a `ThumbnailRequest`: both are within the rules; this is what a call to Immich may be made from
		- a `ThumbnailRefusal`: one is not, and `refused` names it
- `galleryPhotos`
	- what goes in: the assets of the album, in the order the album gave them; `type` is any text
	- what comes out: the photos, for the gallery
- the part reads no clock, no network and nothing of the environment, and imports nothing
- `ThumbnailSize` moves here from `src/lib/immich.ts`; the client takes it from here

### Acceptance criteria: the promises

Each one is true or false of the two functions. Each one is decided in the logic part, so each one is held by unit tests.

The asset id of a request, by `thumbnailRequest`:

- **I1** an asset id is 36 characters: five groups of 8, 4, 4, 4 and 12 hexadecimal digits, with one hyphen between two groups
	- a hexadecimal digit is `0` to `9` or `a` to `f`
- **I2** the letters of an asset id can be in upper case or lower case (Q1)
- **I3** the version of the UUID is not checked (Q2)
- **I4** an asset id that is accepted goes on exactly as it was given (Q1)
- **I5** a request with any other text as its id is refused, and the refusal names the id
	- so no text but an asset id can be put into an address at Immich
	- any character before or after the 36 is "other text": a space, a line end, a brace, a part of a path

The size of a request, by `thumbnailRequest`:

- **Z1** two sizes are allowed: `thumbnail` and `preview` (Q3)
- **Z2** a request that gives no size gets `thumbnail`
- **Z3** a request with any other text as its size is refused, and the refusal names the size
	- "other text" includes `fullsize` and `original` (Q3), the empty text (Q4), an allowed size in another case, and an allowed size with a space
- **Z4** when the id and the size are both outside the rules, the refusal names the id

The photos of an album, by `galleryPhotos`:

- **G1** an asset is a photo when its type is exactly `IMAGE`; an asset of any other type is not in the list (Q5)
	- Immich's other types are `VIDEO`, `AUDIO` and `OTHER`; a type Immich does not have today is also not a photo
- **G2** the photos are in the order the album gave
- **G3** a photo has the id, the file name, the width and the height the album gave, and nothing else of the asset
	- what is in a photo goes to the browser
- **G4** an album with no image gives an empty list; an album with no asset also

### Acceptance criteria: the code around the rules

Each one is checked on the branch, from the repo root.

- **R1** `src/lib/photos.ts` reads no clock, no network and nothing of the environment, and imports nothing
	- check: `git grep -nE '^import|fetch|process\.|Date' -- src/lib/photos.ts` prints nothing and exits 1
- **R2** the route handler holds no rule
	- check: `git grep -nE 'UUID_RE|ALLOWED_SIZES|0-9a-f|"thumbnail"|"preview"' -- ':(literal)src/app/photos/img/[id]/route.ts'` prints nothing and exits 1
- **R3** the page holds no rule
	- check: `git grep -nE 'IMAGE|\.filter\(|\.map\(' -- src/app/photos/page.tsx` prints nothing and exits 1
- **R4** the sizes are named in one place
	- check: `git grep -n 'type ThumbnailSize' -- src` prints one line, and it is in `src/lib/photos.ts`
- **R5** the route handler answers as before
	- an id outside the rules: status 400, with the text `Bad asset id`
	- a size outside the rules: status 400, with the text `Bad size`
	- a request within the rules: the same call to Immich, and the same four answers after it (404, 502, and 200 with the same three headers)
	- check: the file is the one under "Approach"; review of its diff. No test holds the route until a later task
- **R6** `src/lib/immich.ts` sends the same calls as before; the diff is the one under "Approach" and no more
	- check: `git diff origin/main...HEAD --numstat -- src/lib/immich.ts` prints `2	2	src/lib/immich.ts`
- **R7** `/photos` shows the same as before
	- check: the page is the one under "Approach"; `pnpm typecheck` holds the shapes between the client, the rules, the page and the gallery

### Acceptance criteria: the chain

Each one is checked on the branch, from the repo root.

- **S1** `pnpm test`, in the dev container, finds three test files and passes
	- check: it shows `Test Files  3 passed (3)` and `Tests  80 passed (80)`, and returns with exit code 0
	- 80 is the 48 tests on main `cff4c61` and the 32 of this spec
	- when main has more unit tests by then: the numbers are those of main, plus one file and 32 tests
	- Vitest colours these lines, in a pipe also; a check by `grep` looks for `80 passed`
- **S2** `./check.sh`, on the host, exits 0
	- check: the line with `80 passed` comes before the first line of the image build
- **S3** the `checks` run on the last commit of the pull request of this branch passes, and ran the unit tests
	- check: `gh pr checks test/unit-photo-rules` shows `checks` as `pass`
	- check: `gh run view <run id> --log | grep -c -F '80 passed'` prints `1`
- **S4** the test file is the one from Design
	- check: `git diff <the commit that added it> HEAD -- src/lib/photos.test.ts` prints nothing
- **S5** `README.md` lists the part, as "Approach" gives it
	- check: the format check of S2, and review
- **S6** the branch changes seven paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `A	_well/spec-unit-photo-rules.md`
		- `M	src/app/photos/img/[id]/route.ts`
		- `M	src/app/photos/page.tsx`
		- `M	src/lib/immich.ts`
		- `A	src/lib/photos.test.ts`
		- `A	src/lib/photos.ts`
	- so `package.json` and `pnpm-lock.yaml` do not change: the branch installs nothing, and the rule on the age of a package has nothing to check
	- so `check.sh`, `vitest.config.mts`, `tests/`, `.github/` and `src/app/photos/Gallery.tsx` do not change

Checked in Code review, by breaking it once on purpose:

- **S7** in `src/lib/photos.ts`, `"fullsize"` is put into the list of the sizes allowed; then `./check.sh` exits with a code that is not 0, a test named `is refused when it is fullsize` is shown as failed, and the image build does not start
	- the change is thrown away after

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

**The logic**

- new file `src/lib/photos.ts`, with the surface given under "The part", the comments of that block included
	- it imports nothing
	- `thumbnailRequest` and `galleryPhotos` are the only exported functions; what they use inside is not exported
- the form of an id: the pattern moves from the route handler, as it is
	- `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- the sizes allowed: one list, `["thumbnail", "preview"]`, of the type `ThumbnailSize[]`
	- a size is allowed when the list includes it; the list is never used as the keys of an object
- `thumbnailRequest`, in this order
	- the id does not fit the pattern: `{ refused: "id" }`
	- `size` is `null`: `{ id, size: "thumbnail" }`
	- the list does not include `size`: `{ refused: "size" }`
	- else: `{ id, size }`
- `galleryPhotos`: the rule moves from `src/app/photos/page.tsx`, as it is
	- the assets whose `type` is `"IMAGE"`, by `===`
	- each one becomes a new object with `id`, `originalFileName`, `width` and `height`, and no other field
	- the list that came in is not changed

**The route handler**

`src/app/photos/img/[id]/route.ts`, after the change, from its first line down to the call to Immich. Every line after `redirect: "manual",` stays as it is.

```ts
import { NextRequest } from "next/server";
import { upstreamThumbnailUrl } from "@/lib/immich";
import { thumbnailRequest } from "@/lib/photos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = thumbnailRequest(id, req.nextUrl.searchParams.get("size"));
  if ("refused" in request) {
    const text = request.refused === "id" ? "Bad asset id" : "Bad size";
    return new Response(text, { status: 400 });
  }

  const upstream = await fetch(upstreamThumbnailUrl(request.id, request.size), {
    cache: "no-store",
    redirect: "manual",
  });
```

- `UUID_RE` and `ALLOWED_SIZES` are gone from it
- what stays in the route handler, and why it is not a photo rule
	- the two texts and the status 400: how the site says a refusal over HTTP
	- the `fetch` and what follows it: the task integration-immich moves them into the client, which then takes the `ThumbnailRequest`

**The page**

`src/app/photos/page.tsx`, after the change, from its first line down to the `return`. Every line from `return (` on stays as it is.

```tsx
import Gallery from "./Gallery";
import { getShare } from "@/lib/immich";
import { galleryPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const share = await getShare();
  const photos = galleryPhotos(share.assets);

```

**The client**

`src/lib/immich.ts`: two lines go in, two come out, and no other line changes.

- its first two lines become: `import type { ThumbnailSize } from "./photos";`, then an empty line
- the line `export type ThumbnailSize = "preview" | "thumbnail";` and the empty line after it are gone
- `AssetType`, `ImmichAsset`, `Share`, `getShare` and `upstreamThumbnailUrl`: no change
	- an `ImmichAsset` has every field of an `AlbumAsset`, so `galleryPhotos(share.assets)` needs no conversion

**The shared files: the lines this change owns**

Each place is given by the text of a line, as the file is on main `cff4c61`. Every line not named here is not this change's. The task contract-health-and-image is in the loop at the same time and may change `README.md` and `check.sh`.

- `check.sh`, `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`: no line
- `README.md`, one place: the table under `## Parts`
	- one new row, directly after the row that starts `| activity rules`
	- on main `cff4c61` the table then reads

```md
| Part           | Kind  | Test | Path                      |
| -------------- | ----- | ---- | ------------------------- |
| heatmap grid   | logic | unit | `src/lib/heatmap-grid.ts` |
| activity rules | logic | unit | `src/lib/activity.ts`     |
| photo rules    | logic | unit | `src/lib/photos.ts`       |
```

- `README.md`, continued
	- when main has more rows in that table by then: they stay, the new row still goes directly after the row that starts `| activity rules`, and `pnpm format`, in the dev container, gives the padding
	- no other line of `README.md`: the row of `src/lib/` in the table of `## Layout` already says `logic, and the clients for the two outside services`

**Commits and the pull request**

- the branch is `test/unit-photo-rules`, made from main `cff4c61`
	- main comes in again only by a merge; never a rebase, never a force push
- the tests are on the branch before any code
- then, in this order
	- `refactor(photos): move the photo rules into logic`: `src/lib/photos.ts`, `src/lib/immich.ts`, `src/app/photos/img/[id]/route.ts`, `src/app/photos/page.tsx`
		- all 80 tests pass after this commit
	- `docs(readme): list the photo rules`: `README.md`
- the pull request: the owner opens it, as a draft, from this branch
	- title: `test: add the photo rules and their unit tests`
	- body, one line: `Spec: _well/spec-unit-photo-rules.md`

### Out of scope

- the thumbnail fetch, `upstreamThumbnailUrl`, the share key, and what the route answers after the call to Immich (404, 502, the headers): the task integration-immich
- a rule that the asset of a request is an image, or is in the album (Q5)
- a rule on the kind of content Immich answers with: the route hands on the `content-type` Immich gives
- an asset with no width or no height
	- Immich's API description says both can be `null`; `ImmichAsset` in the client says both are a number
	- the shape of Immich's answer is the client's: integration-immich captures a real one, and decides
	- `AlbumAsset` and `Photo` say `number`, as the client does today
- an image whose id is not in the form of I1: none comes from Immich
- `src/app/photos/Gallery.tsx`
	- which size the grid asks for and which the open photo asks for, and the address it builds: the task unit-interface-rules
	- its own `Photo` interface stays; it has the same four fields, and the typecheck holds the two together
- the text `{n} photos` on the page, also for one photo
- what `/photos` shows with no key: the task photos-without-key
- a test of the route handler or of `/photos`: wiring, held end to end, and with real data by a smoke check; both are later tasks
- any other row in the parts list
- any package, `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`
- the stale things the epic lists

### Going back

- revert the squash commit on main
	- the rules go back into the route handler and the page; the site shows the same before and after
	- nothing outside `src/` and `README.md` changes; the image and the pipeline are the same

## Tests

All in `src/lib/photos.test.ts`, beside the code; found by `vitest.config.mts`; run by `pnpm test`. Part: photo rules. Kind: unit. 32 tests.

- how the expected results were made
	- each id is written out by hand, and what is wrong with it is in the name of the test or in a comment
	- the sizes and the types are the words of Immich's API description: `original`, `fullsize`, `preview`, `thumbnail`; `IMAGE`, `VIDEO`, `AUDIO`, `OTHER`
	- none is taken from a run of the code
- every test goes through `thumbnailRequest` or `galleryPhotos`; none reads the clock, and none needs a fake
- failing today: the file imports `./photos`, which is not there
- each of the 32 was also seen to fail alone, against a build of the rules made for the run, broken in one place, and thrown away
	- with that build unbroken, all 32 pass and `pnpm typecheck` passes

| Test | Criterion |
| ---- | --------- |
| the asset id of a request: is accepted as 8, 4, 4, 4 and 12 hexadecimal digits with a hyphen between | I1 |
| the asset id of a request: is accepted with its letters in upper case, and goes on as it was given | I2, I4 |
| the asset id of a request: is accepted whatever the version of the UUID | I3 |
| the asset id of a request: is refused when it is empty | I5 |
| the asset id of a request: is refused when it is one digit short | I5, I1 |
| the asset id of a request: is refused when it is one digit long | I5, I1 |
| the asset id of a request: is refused when it has no hyphens | I5, I1 |
| the asset id of a request: is refused when a hyphen is in another place | I5, I1 |
| the asset id of a request: is refused when it holds a letter after f | I5, I1 |
| the asset id of a request: is refused when text comes before it | I5 |
| the asset id of a request: is refused when text comes after it | I5 |
| the asset id of a request: is refused when a space comes before it | I5 |
| the asset id of a request: is refused when a line end comes after it | I5 |
| the asset id of a request: is refused when it is in braces | I5 |
| the size of a request: is thumbnail when the request gives thumbnail | Z1 |
| the size of a request: is preview when the request gives preview | Z1 |
| the size of a request: is thumbnail when the request gives no size | Z2 |
| the size of a request: is refused when it is fullsize | Z3 |
| the size of a request: is refused when it is original | Z3 |
| the size of a request: is refused when it is empty | Z3 |
| the size of a request: is refused when it is an allowed size in another case | Z3 |
| the size of a request: is refused when a space comes before an allowed size | Z3 |
| the size of a request: is refused when it is the name of something every object has | Z3 |
| a request with a bad id and a bad size: is refused for its id | Z4 |
| the photos of an album: hold an asset of the type IMAGE | G1 |
| the photos of an album: leave out a video | G1 |
| the photos of an album: leave out an asset of the type AUDIO, and one of the type OTHER | G1 |
| the photos of an album: leave out an asset of a type that is not one of Immich's four | G1 |
| the photos of an album: keep the order the album gave, with the other assets taken out | G2 |
| the photos of an album: give the id, file name, width and height of an image as the album gave them, and nothing else | G3 |
| the photos of an album: are an empty list for an album with no asset | G4 |
| the photos of an album: are an empty list for an album with no image | G4 |

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- I1 to I5, Z1 to Z4, G1 to G4, behaviour that had no test: a test, written first and kept
	- the branch type is `test`; the conventions give no line for it, so each piece is verified as its own type
- R1 to R7, a `refactor`: the tests that exist still pass, and the checks given with each one
	- no test holds the route handler or the page: the route calls Immich, and `/photos` is an `async` Server Component that needs live data
	- until the later tasks: the typecheck holds the shapes; Code review reads R5 and R6; the owner looks at `/photos` after the deploy
- S1 to S4, S6, S7, the chain: the checks accept it (S2, S3), and the real run proves it (S3, on the pull request)
	- a smoke check watches it after: none is there yet; it is parked in the epic
- S5, `docs`: the format check, and review
