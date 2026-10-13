---
type: spec
description: "Give the site a tab icon: a cube, served as a PNG that every page links and as /favicon.ico. Reference for what the browser tab shows today, the two promises, the files that keep them, and the tests."
status: factory
---

## Need

- the site has no icon
	- no page names one in its head
	- `/favicon.ico` answers 404
	- so the browser tab shows its blank default
- the owner chose the art: the cube from [3dicons](https://3dicons.co), colour render, dynamic angle
	- license: CC0, so no credit line is owed on the site

## Done looks like

### Acceptance criteria: the promises

Each one is true or false of the built image. Part: wiring. Kind: end to end.

- **T1** the head of `/` has a `link` with `rel="icon"` and `type="image/png"`, and a request for its address is answered with status 200 and `content-type: image/png`
- **T2** a request for `/favicon.ico` is answered with status 200 and `content-type: image/x-icon`

### Approach

- two files in `src/app/`, and no change to code
	- `icon.png`, 192 by 192
	- `favicon.ico`, which holds the sizes 16, 32 and 48
- Next.js serves both and writes the `link` tags, by its [file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- both come from one source picture: the cube, trimmed to its edges, on a clear square

### Choices made here

Each one is mine, and each can be changed in review.

- **the dynamic angle, not the isometric one**: at 16 pixels it fills more of the square
- **a clear background**: the cube reads on a light tab bar and on a dark one

### Out of scope

- an `apple-icon` for the iOS home screen. iOS paints a clear background black, so it needs a picture of its own
- the icon of the dashboard at `homepage.monk3y.xyz`

### Going back

- one revert of the merge commit. The site then has no icon again

## Tests

Both in `tests/tab-icon.spec.ts`, a new file; found by `playwright.config.ts`; run by `./check.sh` against the image it has just built.

- `links a tab icon from the home page that answers with a PNG image`: T1
- `answers GET /favicon.ico with an icon image`: T2
- how the expected results were made
	- the status and the content types: from T1 and T2. None is taken from a run of the code
- the first test opens `/`. The head comes from the one layout, so one page shows it
- T1 does not fix the address of the icon: Next.js adds a hash to it, and the hash is not a promise
- how each criterion is verified ([[conventions]], "what verifies a change, by its type")
	- T1, T2: a test, written first and kept
