---
type: spec
description: "Hold the two borders of publicpersona that the node depends on, the health route and the image, with a contract test under Playwright against the built image, which check.sh now starts the way the node's unit file starts it. Reference for the four promises and the line of the dependent system each one comes from, how each is checked, what a browser cannot see and is left out, the lines this change owns in the shared files, and how it is verified."
status: design
---
## Need

- two surfaces of the site are used by another system, and no test holds either
	- the health route, `GET /api/health`: the node's health command calls it every 30 seconds
	- the image: the node starts it with a fixed set of flags and values, and two other containers on the node call it on port 3000
- the written form of what the node needs is its unit file, `nodes/mutable/monkeybusiness/publicpersona/publicpersona.container` in the repo `dazoo`
	- each promise below names the line of that file, or of another dependent system, that it comes from
	- a thing that no other system depends on is not a promise, and is listed under [[#Out of scope]] with the reason
- `check.sh` starts the image with no flag and no value from the environment
	- so no check sees the image the way the node runs it: a change that needs a writable root, or root rights, passes every check and fails on the node
- `check.sh` waits for the site by asking `/api/health` for a good answer
	- so a health route that answers with an error never reaches a test: the script gives up at the wait, and says only that the site did not answer
- per [[testing]], a border gets a contract test, and a Next.js repo runs it under Playwright, in the same config as the end to end tests, against the built image
	- Playwright sees the image only through HTTP
	- so a promise of the image is written as what the site does when the image is started in a given way, and `check.sh` is what starts it that way

## Done looks like

### The parts

- **health check**: a border. Path: `src/app/api/health/route.ts`
	- what goes in: `GET /api/health`
	- what comes out: an HTTP status
- **image**: a border. Path: `Dockerfile`
	- what goes in: the flags and the values that the unit file starts it with
	- what comes out: the site, on port 3000

Neither part is new, and neither file changes.

### Acceptance criteria: the promises

Each one is true or false of the built image. Each one needs the owner's yes. Part: border. Kind: contract.

- **H1**: `GET /api/health` answers with status 200
	- from the unit file: `HealthCmd=wget -qO- http://127.0.0.1:3000/api/health || exit 1`
	- `wget` exits 0 on a good status and non-zero on an error status; nothing reads what it prints
- **I1**: started with `PORT=3000` and `HOSTNAME=0.0.0.0`, the site answers on port 3000 to a caller that is outside the container
	- from the unit file: `Environment=PORT=3000` and `Environment=HOSTNAME=0.0.0.0`
	- from `cloudflared.container`, beside it: `#   home.${DOMAIN}      -> http://publicpersona:3000`
	- from `etc/dazoo/homepage/services.yaml`, beside it: `siteMonitor: http://publicpersona:3000`
- **I2**: the site serves when it runs as user 1000, with every capability dropped and no way to get a new privilege
	- from the unit file: `User=1000`, `DropCapability=ALL`, `NoNewPrivileges=true`
	- one promise for the three lines: together they say that the process has no rights above those of user 1000
- **I3**: the site serves when the root of the container is read-only and no volume is mounted
	- from the unit file: `ReadOnly=true`, under the comment `# Stateless: the old pod ran with a read-only root and no volumes; keep that.`

"Serves", in I2 and I3, is the result of H1: `GET /api/health` answers with status 200.

How each one is checked: by one contract test, under Playwright, against the image that the same run of `./check.sh` built.

- the test sends `GET /api/health` and expects status 200
- the request goes to `127.0.0.1:3210`, where `check.sh` publishes port 3000 of the container. So it comes from outside the container (I1)
- `check.sh` starts the container with the flags and the values of the unit file (S2). So the answer comes from an image that runs as user 1000 with no capability (I2) on a read-only root (I3), and that was given `PORT=3000` and `HOSTNAME=0.0.0.0` (I1)
- the test cannot see how the container was started. That half of I1, I2 and I3 is held by S2, which is checked by reading `check.sh`

### Acceptance criteria: the setup

Each one is checked on the branch, from the repo root.

- **S1**: `./check.sh`, on the host, passes, and Playwright's part of its output says `2 passed`
	- the two are the first journey and the contract test. So the first journey also passes against an image that is started the way the node starts it
- **S2**: `check.sh` starts the image with the flags and the values of the unit file
	- check: `git grep -c -F -e '--read-only --user 1000 --cap-drop ALL --security-opt no-new-privileges' -- check.sh` prints `check.sh:1`
	- check: `git grep -c -F -e '--env NODE_ENV=production --env PORT=3000 --env HOSTNAME=0.0.0.0' -- check.sh` prints `check.sh:1`
	- check, by reading: both lines are part of the one `run` command in the file
- **S3**: the wait in `check.sh` ends when the site gives any HTTP answer; it does not decide whether the answer is good
	- check: `git grep -c -F -e 'wget -q -S -O /dev/null http://127.0.0.1:3000/api/health 2>&1 | grep -q "HTTP/"' -- check.sh` prints `check.sh:1`
	- shown by the break for H1 under [[#Tests]]: Playwright names the failure, not the wait
- **S4**: the `checks` run on the last commit of this spec's pull request passes, and its log says `2 passed`
	- check: `gh pr checks <number>` shows `checks` as `pass`
	- check: `gh run view <run id> --log | grep -c -F '2 passed'` prints `1` or more
	- this run is the first that starts the image with these flags under Docker; see "the engines" under [[#What is settled]]
- **S5**: the Factory edits no test
	- check: `git log --format=%s origin/main..HEAD -- tests/health-and-image.spec.ts` prints one line, `test(contract): add the health and image contract`
	- check: `git diff --quiet origin/main...HEAD -- tests/first-journey.spec.ts` exits 0
- **S6**: `README.md` lists the two borders, and says how the image is started
	- check: `git grep -c -F 'It starts the image the way the node does' -- README.md` prints `README.md:1`
	- check: `git grep -c -E '^\| (health check|image) ' -- README.md` prints `README.md:2`
- **S7**: the branch changes four paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	README.md`
		- `A	_well/spec-contract-health-and-image.md`
		- `M	check.sh`
		- `A	tests/health-and-image.spec.ts`
	- so no file under `src/` changes, the `Dockerfile` does not change, and `package.json` and `pnpm-lock.yaml` do not change
	- the rule on a package younger than 24 hours holds with nothing to check: the change installs no package

### What is settled

- **what a promise of the image is**: what the site does when the image is started as the node starts it
	- the unit file sets the user, the port, the address and the read-only root by itself. So it does not depend on what the image has as its own default for any of them
	- it does depend on the image working under those settings
- **where the start is written**: in the `run` line of `check.sh`, copied from the unit file
	- the unit file is in another repo, so no check compares the two. When the start lines of the unit file change, the `run` line changes with them, in a change of its own
	- the secrets of the unit file are not copied: the container starts with no `IMMICH_SHARE_KEY` and no `FORGEJO_API_TOKEN`, as it does today. A test never depends on a live outside thing
- **one test for the four promises**
	- the four differ only in the situation, and there is one container, so there is one situation
	- four tests would send the same request four times, and no test could tell which flag it was checking
- **the wait asks, the test decides**
	- the wait in `check.sh` takes any HTTP answer as "the site is up"
	- a break that stops the site from starting, or from listening inside the container on port 3000, still ends at the wait: nothing can be tested before the site is up. `check.sh` exits non-zero, and prints the log of the container
- **the engines**: the same flags for Podman and for Docker
	- under Podman, on a dev machine and on the node, `--read-only` leaves `/tmp`, `/run`, `/var/tmp` and `/dev/shm` writable, in memory
	- under Docker, in the pipeline, `--read-only` does not. So the pipeline is stricter than the node, and never weaker
	- if the site one day needs `/tmp`, the pipeline fails and the node would not: that goes back to Design
- **the commit type**: `test`. The change adds a test and changes what the tests run against, and no behaviour of the site
- **the test file**: `tests/health-and-image.spec.ts`, found by the config that is there. `playwright.config.ts` does not change

### Approach

- `check.sh`, edit 1 of 2: the `run` line. The line

```sh
"$ENGINE" run -d --name "$SITE" -p 127.0.0.1:3210:3000 publicpersona:check >/dev/null
```

- becomes these seven lines. The comment above it, `# The port is the one in playwright.config.ts.`, stays, directly above them

```sh
# The flags and the values are those of the node's unit file, publicpersona.container in dazoo.
# The image promises to serve when it is started that way, and a test can only show that
# against a container that is.
"$ENGINE" run -d --name "$SITE" -p 127.0.0.1:3210:3000 \
  --read-only --user 1000 --cap-drop ALL --security-opt no-new-privileges \
  --env NODE_ENV=production --env PORT=3000 --env HOSTNAME=0.0.0.0 \
  publicpersona:check >/dev/null
```

- `check.sh`, edit 2 of 2: the wait. The line that starts `if ! timeout -k 5 30 bash -c 'until "$0" exec "$1" wget` becomes these two; the empty line above it stays

```sh
# Any answer means the site is up. Whether the answer is good is for the tests to say.
if ! timeout -k 5 30 bash -c 'until "$0" exec "$1" wget -q -S -O /dev/null http://127.0.0.1:3000/api/health 2>&1 | grep -q "HTTP/"; do sleep 1; done' "$ENGINE" "$SITE"; then
```

- how the new wait works: with `-S`, the `wget` of the image prints the status line of the answer, for a good status and for an error status. It prints no line with `HTTP/` while nothing answers
- no other line of `check.sh` changes: the limit of 30 seconds, the message, the log, the `trap`, and the Playwright line stay
- `README.md`: four edits, given under [[#Lines this change owns]]
- then `pnpm format`, in the dev container. It changes no file outside the four paths
- the Factory's commit: `test(contract): start the image the way the node does in check.sh`
- the pull request title: `test: add the health and image contract test`

### Lines this change owns

Every place is given by the text of a line. The task unit-activity-rules is in Design at the same time: it changes files under `src/lib/` and may change `README.md`.

- `check.sh`
	- owns: the line that starts `"$ENGINE" run -d --name "$SITE"`, and the three comment lines new above it
	- owns: the line that starts `if ! timeout -k 5 30 bash -c 'until`, and the comment line new above it
	- does not touch: any other line
- `README.md`, under `## Parts`
	- owns: one new paragraph and one new table, the text below, directly above the line `## Run it`, with one empty line before the paragraph and one after the table
	- does not touch: the table whose first line starts `| Part`, and the sentence above it that starts `Each part of the code`. A row for the activity rules goes into that table, and is not this change's
	- a table of its own, so that the two changes merge in either order with no conflict: one unchanged line, the empty line under the first table, stays between them

```
The borders are the surfaces that another system depends on. A contract test holds each one, against the built image, started the way the node starts it. Both are in `tests/health-and-image.spec.ts`.

| Border       | Depends on it                         | Test     | Path                          |
| ------------ | ------------------------------------- | -------- | ----------------------------- |
| health check | the node's health command             | contract | `src/app/api/health/route.ts` |
| image        | the node's unit file, which starts it | contract | `Dockerfile`                  |
```

- `README.md`, under `## Check it`
	- owns: the line `6. the end to end tests, against the image that step 5 built`. It becomes
		- `6. the end to end and contract tests, against the image that step 5 built`
	- owns: the line that starts `After the image build, it starts that image as a container named`. It becomes
		- ``After the image build, it starts that image as a container named `publicpersona-check` on `127.0.0.1:3210`, runs the end to end and contract tests against it, and removes the container. It starts the image the way the node does: a read-only root, user 1000, no capabilities, and the same `PORT` and `HOSTNAME`. The tests are `tests/*.spec.ts`. Playwright runs them in the dev container, the end to end tests in Chromium; `npx playwright test`, in the container, runs them alone while the site answers on that port. Their output goes to `/tmp/publicpersona-playwright` in the container, not to the repo folder. Run one `./check.sh` at a time on a machine: each run first removes the container of that name.``
	- does not touch: the lines `4. the unit tests` and the one that starts `` `pnpm test`, in the container ``
- `README.md`, under `## Layout`
	- owns: the row that starts ``| `tests/` ``. It becomes the row below, which has the same width, so no other row is padded again
	- does not touch: the row that starts ``| `src/lib/` ``, or any other row

```
| `tests/`                       | end to end and contract tests (`*.spec.ts`): they run against the built image |
```

### Out of scope

- the label `org.opencontainers.image.source` on the image
	- no line of the unit file depends on it. The registry does: the `Dockerfile` says `# Links the package on ghcr.io to the repo it was built from.`, and [[ci-cd]] says an image "carries a label that names the repo it was built from"
	- a label is not in any HTTP answer, so Playwright cannot see it, whatever way the image is started
	- [[testing]] gives a contract test no other runner. What holds this promise is not decided in the notes, and this spec does not decide it
- that the image holds `wget`
	- the health command of the unit file runs `wget` inside the container, so the node depends on it
	- Playwright cannot see it. The wait in `check.sh` runs the image's `wget`, so a missing `wget` stops `check.sh` at the wait today, and after this change. That is a side effect of the setup, and no test
	- whether that is enough is not decided in the notes
- what the image has as its own default: the `USER node` line, the `EXPOSE 3000` line, and the `ENV` lines of the `Dockerfile`
	- no other system depends on them: the unit file sets each one itself
- the body of the answer of `/api/health`
	- nothing reads it: the health command only uses the exit code of `wget`
- `MemoryMax=512M` in the unit file
	- systemd sets it on the service, not as a flag of the container, and one request shows nothing about memory
- the tag of the image, `latest`, and `AutoUpdate=registry`: the ship pipeline's, see [[spec-ship]]
- `GET /` for the homepage monitor (`siteMonitor`): the first journey opens `/` and holds what it shows
- `/code` and `/photos`, and what they show with no key: the task photos-without-key
- every file under `src/`, the `Dockerfile`, `playwright.config.ts`, `package.json`, the dev container, `checks.yml`, `ship.yml`
- the unit file, and every other file of `dazoo`
- a check that compares the `run` line of `check.sh` with the unit file
- the message `Failed to write image to cache` in the log of the container
	- with a read-only root, Next cannot keep a picture that it has made smaller, so it makes it again on each request and writes this line. The picture is still served. The node has the same today

### After the merge

- nothing to do on a dev machine: the dev container does not change

### Going back

- revert the squash commit on main
	- the site and the image that ships are the same in both directions: no file under `src/` changes, and the `Dockerfile` does not change

## Tests

- `tests/health-and-image.spec.ts`
	- test: `answers GET /api/health with status 200 when started the way the node starts it`
	- criteria: H1, I1, I2, I3
	- part: border (the health check, and the image). Kind: contract
	- its expected result, 200, comes from the health command of the unit file: `wget` must exit 0
	- goes through the public surface: one HTTP request to the published port
	- depends on no live outside thing: the container starts with no key and no token, and the health route calls nothing
	- its limits are those of `playwright.config.ts`: 30 seconds for the test
	- today, on the branch, before the Factory's commit: it passes, since the health route is there and answers 200. Until S2 is built it shows H1 only
- seen to fail, in Code review: one break for each promise, each on a commit that is never pushed. `./check.sh` must exit non-zero, and Playwright must name the line given
	- H1: `src/app/api/health/route.ts`, the line `return Response.json({ ok: true });` becomes `return Response.json({ ok: true }, { status: 503 });`
		- fails at `expect(response.status()).toBe(200);`, with `Received: 503`
		- the same break, with the wait as it is on main, ends at the wait and never reaches Playwright. That is what S3 changes
	- I1: `Dockerfile`, the line `CMD ["node", "server.js"]` becomes `CMD ["sh", "-c", "HOSTNAME=127.0.0.1 exec node server.js"]`
		- the site then listens inside the container only. The wait passes, since it asks from inside
		- fails at `const response = await request.get("/api/health");`. The first journey fails too
	- I2: `src/app/api/health/route.ts` gets a first line `import { readFileSync } from "node:fs";`, an empty line after it, and, as the first line in `GET`, `readFileSync("/etc/shadow");`
		- only user 0 can read that file
		- fails at `expect(response.status()).toBe(200);`, with `Received: 500`
	- I3: `src/app/api/health/route.ts` gets a first line `import { writeFileSync } from "node:fs";`, an empty line after it, and, as the first line in `GET`, `writeFileSync("/home/node/health-seen", "");`
		- user 1000 owns that folder, so only the read-only root stops the write
		- fails at `expect(response.status()).toBe(200);`, with `Received: 500`
- seen by Design, in a trial outside the repo and outside the dev container's volumes, with images that are now removed
	- the image of main `07f2a7e`, started with the flags of S2, and with `/tmp` read-only as under Docker: `/api/health`, `/` and `/projects` answer 200, and the photo is served
	- the test, against a container of that image with the flags of S2: passes
	- the test, against an image with the H1 break: fails at the line given, with `Received: 503`
	- the new wait, against the image with the H1 break: ends as "up"; the wait of main does not end
	- a site that listens on `127.0.0.1` in the container: no answer through the published port, under Podman
	- in the container of S2: a write to `/home/node` is refused as a read-only file system, and `/etc/shadow` cannot be read
	- not seen: the flags under Docker. S4 is the first run that has them
- the setup, S1 to S7, gets no test. It is verified as [[conventions]] has it for `ci` and `chore`
	- the checks accept it: the `checks` run on the pull request, which now starts the image the way the node does
	- the real run proves it: that same run. Nothing of this change runs on a merge or on the node
	- a smoke check watches it after: none applies. The change touches no call to an outside thing
	- [[conventions]] has no line for what verifies a `test` change; the three lines above are this spec's reading, the same as in [[spec-e2e-first-journey]]
