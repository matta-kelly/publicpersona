---
type: spec
description: "Give /photos a page of its own for when the album cannot be read, and hold with end to end tests what /code and /photos show when the site has no key for the outside service. Reference for the two promises and the words a visitor reads, the questions the owner has to answer, the one file the build changes, what stays out, and how each test is seen to fail."
status: done
---
## Need

- `/photos` has no failure path
	- with no `IMMICH_SHARE_KEY`, the client throws, nothing catches it, and the visitor gets the error page of Next.js in place of the site
	- the same happens on the node when the key is there and Immich does not answer: any failure of the album read ends the same way
	- `README.md` says that without the two values "the site still runs; `/photos` and `/code` have nothing to show". For `/photos` that is false today
- `/code` has a failure path, and no test holds it
	- with no `FORGEJO_API_TOKEN` it shows its own page with one sentence
- no spec says what either page must show in that state
- the checks already run in that state
	- `check.sh` starts the built image with no secret ([[spec-contract-health-and-image]], "where the start is written")
	- so an end to end test can hold both pages, and reach no outside service

### What a visitor sees today

Seen by Design, against an image built from main `881cad7`, started with the `run` line of `check.sh`.

- `/code`, no token
	- the site's page: the nav, the footer, and between them the heading `Code` and the sentence `Activity unavailable right now. Try again later.`
	- status 200
	- the log of the container: `forgejo activity fetch failed Error: FORGEJO_API_TOKEN is not set`
- `/photos`, no key
	- not the site's page: no nav, no footer, no link back
	- a heading: `Application error: a server-side exception has occurred while loading 127.0.0.1 (see the server logs for more information).`
	- under it: `Digest: 3943990561`
	- status 500
	- the log of the container: `Error: IMMICH_SHARE_KEY is not set`
- neither page calls its outside service in that state
	- in `src/lib/forgejo.ts` and in `src/lib/immich.ts`, the token or the key is read while the arguments of `fetch` are built, so the throw comes before any call

## Done looks like

### The questions

Each one has an answer written into the promises. Another answer sends this spec back to Design before the Factory starts.

- **Q1, the words on `/photos`** (P1)
	- as written: the heading `Photos`, and the sentence `Photos unavailable right now. Try again later.`
	- the heading is the name of the page in the nav. With an album, the heading is the name of the album, which the site does not have in this state
	- the sentence has the form of the one on `/code`
- **Q2, the words on `/code`** (C1)
	- as written: what it shows today, the heading `Code` and the sentence `Activity unavailable right now. Try again later.`
	- "Try again later" does not help when the cause is a missing token. The visitor cannot act on the cause, and the log names it for the owner
	- the other answer: new words, and then a change to `src/app/code/page.tsx`
- **Q3, one page for every cause** (P1)
	- as written: `/photos` shows the same page whenever the album read fails: no key, Immich does not answer, the share is not an album
	- `/code` does the same today
	- the other answer: a page of its own for "no key". The visitor gains nothing from it, and the page would have to know why the client failed
- **Q4, the status**
	- as written: not a promise. Both pages answer 200 in this state, since each one is a page that rendered
	- the App Router gives a page no call that sets a status such as 503
	- cost: a monitor that reads only the status takes the page as good. The homepage monitor in `dazoo` asks `/`, not these pages
- **Q5, two tests** (see [[#Tests]])
	- as written: one test for each page
	- each page decides for itself, in its own `catch`: two edges, two tests
	- the two pages are not steps of one journey: neither leads to the other
	- the other answer: one test that opens both. Then a failure on `/code` hides what `/photos` does

### The parts

- **`/photos` page**: wiring. Path: `src/app/photos/page.tsx`
	- what goes in: the album from the Immich client, or the client's failure
	- what comes out: the gallery, or the page of P1
- **`/code` page**: wiring. Path: `src/app/code/page.tsx`. No change

Neither part is new. Both are `async` Server Components, so end to end is the lowest kind that can show a promise of theirs ([[testing]], "Runner config").

### Acceptance criteria: the promises

Each one is true or false of the built image, as a visitor with a browser sees it. Each one needs the owner's yes. Part: wiring. Kind: end to end.

"The body of the site's page" is the area between the nav and the footer. So the nav is on the page, and the visitor can leave.

- **C1**: when the site has no Forgejo token, `/code` shows, in the body of the site's page, the top heading `Code` and the sentence `Activity unavailable right now. Try again later.` (Q2)
- **P1**: when the site has no Immich key, `/photos` shows, in the body of the site's page, the top heading `Photos` and the sentence `Photos unavailable right now. Try again later.` (Q1)

### Acceptance criteria: the code around the promises

Each one is checked on the branch, from the repo root.

- **R1**: `/photos` shows the page of P1 for every failure of the album read, not only for a missing key (Q3)
	- check, by reading `src/app/photos/page.tsx`: one `try` around the call to `getShare`, and a `catch` that names no kind of error
	- no test holds the other causes: each one needs Immich to answer, and an end to end test never depends on a live outside thing ([[testing]])
	- which failures the client reports is the task integration-immich
- **R2**: the page writes the cause to the log
	- check: `git grep -c -F 'console.error("immich share fetch failed", err);' -- src/app/photos/page.tsx` prints `src/app/photos/page.tsx:1`
	- without it the owner has no trace: Next.js logs only an error that nothing caught
- **R3**: `src/lib/immich.ts` does not change
	- check: `git diff --numstat origin/main...HEAD -- src/lib/immich.ts` prints nothing
- **R4**: `/photos` with an album shows the same as before
	- check: review of the diff of `src/app/photos/page.tsx`; it is the one under [[#Approach]]. `pnpm typecheck` holds the shapes
	- no test holds the page with an album: it needs real data, so a smoke check, which is parked in the epic

### Acceptance criteria: the chain

- **S1**: `./check.sh`, on the host, exits 0, and Playwright's part of its output says `4 passed`
	- the four: the first journey, the contract test, and the two of this spec
- **S2**: the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks <number>` shows `checks` as `pass`
- **S3**: the Factory edits no test
	- check: `git log --format=%s origin/main..HEAD -- tests/` prints one line, `test(e2e): add the pages without a key`
- **S4**: the branch changes three paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `A	_well/spec-photos-without-key.md`
		- `M	src/app/photos/page.tsx`
		- `A	tests/without-keys.spec.ts`
	- so `src/lib/immich.ts`, the route handler, `src/app/code/page.tsx`, `check.sh`, `README.md`, `package.json` and `pnpm-lock.yaml` do not change
	- the rule on a package younger than 24 hours holds with nothing to check: the change installs no package

### What is settled

- **the type**: `fix`. The site promises a page and gives an error. The branch is `fix/photos-without-key`
- **where the failure is caught**: in the page, the same way as in `/code`
	- Next.js names two ways. A failure that is expected is handled where it happens, and the page renders what to say. An `error.tsx` file is for the failure nobody expected
	- a missing key and an outside service that does not answer are expected
	- an `error.tsx` would be a new client component and a second way of doing what `/code` does with a `try` and a `catch`
- **the client stays as it is**: `getShare` throws, as today; the page decides what the visitor sees
	- so this change and integration-immich touch no common file
- **the state the tests need**: the image started with no secret, as `check.sh` starts it
	- against a site that has the key, the test of P1 fails. `npx playwright test`, alone, is for the site that `check.sh` starts, as `README.md` says
- **the test file**: `tests/without-keys.spec.ts`, found by the config that is there

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

- `src/app/photos/page.tsx`: the line `  const share = await getShare();` becomes the twelve lines below. No other line of the file changes

```tsx
  let share;
  try {
    share = await getShare();
  } catch (err) {
    console.error("immich share fetch failed", err);
    return (
      <article>
        <h1 className="text-3xl font-semibold tracking-tight">Photos</h1>
        <p className="text-muted mt-4">Photos unavailable right now. Try again later.</p>
      </article>
    );
  }
```

- the classes are those of the same two elements in `src/app/code/page.tsx`
- no comment is added: the code says what it does
- then `pnpm format:check`, in the dev container: it passes with no change
- the Factory's commit: `fix(photos): show the site's page when the album cannot be read`
- the pull request title: the same line
	- body, one line: `Spec: _well/spec-photos-without-key.md`

### Lines this change owns

- `src/app/photos/page.tsx`
	- owns: the line `  const share = await getShare();`
	- does not touch: the imports, `export const dynamic`, the line with `galleryPhotos`, and every line from `return (` on
- no line of any other file that is on main

### Out of scope

- `GET /photos/img/<id>` with no key
	- status 500 with an empty body, since the Immich client throws for a missing key
	- no visitor gets there from `/photos` in this state: the page of P1 has no picture
- what the Immich client reports, and for which answers of Immich: integration-immich
- `src/lib/forgejo.ts` and `src/app/code/page.tsx`: no change
	- the text of `/code` with data says the code is not on GitHub. It waits on `/code` reading GitHub, as the epic has it
- the status of either page (Q4)
- the journey to each page through the nav: the first journey holds a nav link; which link is marked is unit-interface-rules
- `/photos` and `/code` with real data: a smoke check, parked in the epic
- `README.md`
	- the sentence "Without them the site still runs; `/photos` and `/code` have nothing to show" is true after this change, as it stands
	- the parts list has no row for a wiring part today. No task of the epic brings one
- the log line of Next.js for the failure, which goes away: the page's own line replaces it (R2)
- `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`, every package

### After the merge

- on the node the key is set, so nothing changes while Immich answers
- when Immich does not answer, a visitor of `/photos` gets the page of P1 in place of the error page

### Going back

- revert the squash commit on main
	- `/photos` gives the error page again when the album cannot be read; the test of P1 goes with the revert

## Tests

Both in `tests/without-keys.spec.ts`; found by `playwright.config.ts`; run by `./check.sh` against the image it has just built.

| Test | Criterion | Part | Kind |
| ---- | --------- | ---- | ---- |
| shows that the activity is unavailable on /code when the site has no Forgejo token | C1 | `/code` page, wiring | end to end |
| shows that the photos are unavailable on /photos when the site has no Immich key | P1 | `/photos` page, wiring | end to end |

- how the expected results were made: the words are those of C1 and P1, written out in the test
- each test opens the page by its address and reads what is in the `main` area; neither reads the status
- neither depends on a live outside thing
	- the container has no token and no key, and each client throws before its `fetch` (see [[#What a visitor sees today]])
- the limits are those of `playwright.config.ts`: 30 seconds for a test, 5 seconds for an expectation
- the format check, the lint and the typecheck pass with the test file on the branch

Seen to fail, in Code review: one break for each promise, each on a commit that is never pushed. `./check.sh` must exit non-zero, and Playwright must name the test.

- P1: in `src/app/photos/page.tsx`, the `h1` text `Photos` becomes `Gallery`. The test of P1 fails at the expectation on the heading
- C1: in `src/app/code/page.tsx`, the words `right now` are taken out of the sentence. The test of C1 fails at the expectation on the sentence

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- C1, P1, a `fix`: a test, written first and kept
- R1 to R4: the checks given with each one, in Code review
- S1 to S4, the chain: the checks accept it, and the real run proves it, on the pull request
	- a smoke check watches it after: none applies. The change touches no call to an outside thing
