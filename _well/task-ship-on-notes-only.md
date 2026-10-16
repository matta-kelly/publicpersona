---
type: task
description: "Decide whether a merge that changes only notes builds and ships an image: today it does, and the node deploys the same site again. Reference when picking this up; the decision is the owner's."
status: planned
belongs_to: "[[publicpersona]]"
---
A merge that changes no file of the image still builds one and deploys it. Decide if it should.
- [[#What is known]] the count, and the two rules that pull apart
- [[#Open]] the two answers
- [[#Done means]] how to tell it is finished

- [[publicpersona]]: the repo this belongs to
- [[ci-cd#Image]]: built once per commit on main, tagged `sha-<short commit>`
- [[ci-cd#Pipeline file]]: a run starts only when a file it reads has changed

---
## What is known

- 6 of 20 ship runs built an image from unchanged inputs, about 47 s each
- each moved `latest`, so the node deployed the same site again
- two lines of [[ci-cd]] disagree here: an image per commit on main, and a run only when a file it reads has changed

## Open

- for now ship stays as it is: every commit on main has its image
- still open: [[ci-cd]] holds both lines, and does not say which one a ship run follows

- ship lists the files it reads
	- no build and no deploy for a notes-only merge
	- some commits on main then have no `sha-` tag, so "pin the tag of an earlier commit" does not work for those commits
- ship stays as it is
	- every commit has its image
	- the node restarts for nothing, about six times in twenty

## Done means

- the owner has chosen
- [[ci-cd]] says which of its two lines holds
- `ship.yml` matches
