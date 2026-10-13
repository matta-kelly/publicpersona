---
type: spec
description: "Make /code read GitHub in place of Forgejo, so that publicpersona runs correctly with Forgejo turned off: one GitHub client, held by integration tests on answers captured from the live GitHub, and a /code page that says where the code is. Reference for what the site takes from Forgejo today, what GitHub gives in its place and under which limits, the questions the owner has to answer, the promises of the client and of the page, the captured answers, the two files as they are after the change, the lines this change owns in the shared files, and what changes in dazoo afterwards."
status: design
---
## Need

- Forgejo, the self-hosted git server, is being turned off
- the site calls Forgejo's API each time a visitor opens `/code`
	- so from that day `/code` shows the heading `Code` and `Activity unavailable right now. Try again later.`, for every visitor, with no end
	- nothing else of the site stops: `/`, `/projects`, `/photos` and `/api/health` do not call Forgejo
- the text of `/code` is false already: it says `None of this is on GitHub. My code lives on my own Forgejo instance`. All code hosting is on GitHub
- every link on a repo card points at the Forgejo server, which a visitor cannot reach: it is on the mesh only

### What the site takes from Forgejo today

Read from the code at main `c121c79`. One file talks to Forgejo: `src/lib/forgejo.ts`. One page uses it: `src/app/code/page.tsx`.

| What a visitor sees on `/code` | The call to Forgejo | How many calls |
| ---- | ---- | ---- |
| the heatmap: one square for each day of the last year, and the total `N contributions in the last 12 months` | `GET /users/mkultra/heatmap` | 1 |
| one card for each repo, private ones too: name, description, link, date of creation | `GET /users/mkultra/repos?limit=50` | 1 |
| on each card: the bar of languages | `GET /repos/mkultra/<repo>/languages` | 1 for each repo |
| on each card: `N commits`, the commits of the last 365 days | `HEAD /repos/mkultra/<repo>/commits?since=...&limit=1`, read from the header `x-total-count` | 1 for each repo |

- every call carries `FORGEJO_API_TOKEN`, a secret of the node
- the page is `force-dynamic`, so the `revalidate: 600` of the client does nothing: every visit makes every call ([Next.js, `dynamic`](https://nextjs.org/docs/app/guides/caching-without-cache-components#dynamic): `force-dynamic` sets every `fetch` of the page to `cache: 'no-store'`)

### Every place that names Forgejo

Found with four searches over the tracked files at main `c121c79`, and by reading each file of `src/`, `tests/`, `deploy/` and the root: the name (`forgejo`, `gitea`), the host (`monk3y`), the account (`mkultra`), and the words for it (`self-host`, `own instance`, `git host`, `token`, `private`).

| Place | What it holds | In this change |
| ---- | ---- | ---- |
| `src/lib/forgejo.ts` | the client: the address, the account, the token, the four calls | removed |
| `src/app/code/page.tsx` | the import, the text of the log, the two paragraphs about Forgejo | changed |
| `tests/without-keys.spec.ts` | the name of one test and one comment | changed, by Design |
| `.env.example` | `FORGEJO_API_TOKEN` and the two lines above it | changed |
| `README.md` | no line names Forgejo. `/code` is `read live from the git host's API` | one line changed, two rows added |
| `src/app/projects/dazoo/page.tsx` | the write-up of dazoo: `self-hosted git`, a box `dazoo repo / Forgejo`, the flow `git push, Forgejo, Flux, Talos cluster` | no change (Q7) |
| `deploy/deployment.yaml`, `deploy/externalsecret.yaml` | Kubernetes manifests: an image at `forgejo.monk3y.xyz`, and the token | no change (Q8) |
| `_well/spec-*.md`, 11 files | earlier specs | no change: each says what was true of its own change |
| `.github/workflows/`, `check.sh`, `Dockerfile`, `.dockerignore`, `.prettierignore`, the two runner configs | nothing | none |
| `.forgejo/` | not in the repo; removed by [[spec-remove-forgejo-pipeline]] | none |

Outside this repo, and not for this change to touch:

- the unit file of the node, in `dazoo`: `Secret=forgejo-api-token`. See [[#Afterwards, in dazoo]]
- the vault note `publicpersona.md`, which git ignores: it says `/code` reads Forgejo. The owner corrects it

### What GitHub gives in its place

Each fact is from GitHub's docs, or was seen on the live API on 2026-10-13; the line says which.

| What the page needs | Where GitHub has it | With no token |
| ---- | ---- | ---- |
| the count of each day of the last year | GraphQL only: `user.contributionsCollection.contributionCalendar`. The REST API has no call for it | not possible |
| the repos, with name, description, address, date of creation | GraphQL `user.repositories`, or REST `GET /users/{username}/repos` | REST: yes |
| the bytes of each language of a repo | GraphQL `repository.languages`, or REST `GET /repos/{owner}/{repo}/languages` | REST: yes, one call for each repo |
| the commits of a repo since a date | GraphQL `history(since:).totalCount` on the default branch, or REST `GET /repos/{owner}/{repo}/commits` with the count read from the `Link` header | REST: yes, one call for each repo |

- **GraphQL needs a token**
	- docs: "You can authenticate to the GraphQL API using a personal access token, GitHub App, or OAuth app" ([Forming calls with GraphQL](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql)). The page gives no way to call with no token
	- seen: `POST https://api.github.com/graphql` with no token answers 403
- **the token needs no right**
	- docs, same page: "All fine-grained personal access tokens include read access to public repositories"
	- docs: "Tokens always include read-only access to all public repositories on GitHub" ([Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens))
- **the limit of GraphQL**: 5,000 points for each hour for a user; a call costs at least 1 point; no more than 2,000 points in a minute ([Rate limits and query limits for the GraphQL API](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api))
	- seen: the one call of this spec costs 1 point (`rateLimit { cost }`), for the calendar and 7 repos
	- so one visit to `/code` is 1 point, and 5,000 visits fit in an hour
- **the limit of REST with no token**: "60 requests per hour", counted for the IP address the call comes from ([Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api))
	- with 7 repos, one visit is 15 calls: 4 visits in an hour, then nothing
- **a failure of a GraphQL call can have status 200**
	- docs, the limits page: over the primary limit, the status stays `200` and the answer holds an error message
	- seen: a query for a login that no user has answers 200, with `"data": {"user": null}` and a list `errors`
- **the calendar**
	- schema, `User.contributionsCollection`, argument `from`: "If omitted, defaults to a year ago" ([Reference, Users](https://docs.github.com/en/graphql/reference/users))
	- schema, `restrictedContributionsCount`: "Only non-zero when the user has chosen to share their private contribution counts"
	- seen: the calendar has 53 weeks, from Sunday 2025-10-12. Its total is 194, the same number as the public profile page shows. So work in private repos is not in it today (Q3)
- **the repos**
	- schema, `User.repositories`: the arguments `privacy`, `ownerAffiliations`, `isFork` and `isArchived` each filter the list
	- seen: with public, owned, no fork and no archived, GitHub gives 7 repos today (Q2)

## Done looks like

### The questions

Each one has an answer written into the promises: the default this spec builds. Another answer sends this spec back to Design before the Factory starts.

- **Q1, what `/code` shows** (C1, G1, G2)
	- as written: the same two things as today, from GitHub. The heatmap with its total, and one card for each repo: name, link, description, date of creation, languages, commits of the last 365 days
	- the other answer: the cards and no heatmap. Then no token is needed (Q4), and the page loses the one thing that shows steady work
	- recommended: as written
- **Q2, which repos get a card** (G3)
	- today: every repo of the account on Forgejo, private ones too, each with a link no visitor can open
	- as written: the repos on GitHub that are public, owned by the account, not a fork and not archived. Today that is 7: `publicpersona`, `que`, `homenetes`, `stateball`, `Landl_reports`, `Bibliometric_Predictions`, `Sabermetric_Networks`
	- the 3 archived ones stay off: `homelab`, `lotus-lake-docker-compose-dep`, `ody`
	- a private repo gets no card. Its name is then on no page, and the token needs no right to read it
	- to take one repo off the page: archive it on GitHub, or make it private. No change to the site. One of the 7 is named for an employer and has 3 commits in the year; the owner decides if it stays
	- the other answer: a list of names in the code. Then a new repo needs a change to the site
	- recommended: as written
- **Q3, work in private repos, in the heatmap** (G1)
	- today, on Forgejo: the heatmap counts every push, private repos too
	- as written: the site shows the calendar GitHub gives. Today GitHub gives the public count only: 194 in the year
	- GitHub adds private work to the calendar, as counts with no name, when the owner turns on "Include private contributions on my profile" ([Showing your private contributions and achievements on your profile](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/showing-your-private-contributions-and-achievements-on-your-profile))
	- it is a setting of the account, made by the owner on GitHub. No line of the site changes for it, before or after this change
	- recommended: turn it on. Most of the work is in private repos, and the page is there to show the work
- **Q4, a token, and who makes it** (G6)
	- as written: the site needs a token of GitHub, `GITHUB_API_TOKEN`. With no token `/code` says the activity is unavailable, as today with no Forgejo token
	- the owner makes it. No agent makes a token
		- kind: a fine-grained personal access token
		- resource owner: the account `matta-kelly`
		- repository access: "Public repositories"
		- permissions: none
		- so a leak of it gives read access to what is public already, and nothing else
		- expiration: the owner's choice. Recommended: one year. On the day it ends, `/code` says the activity is unavailable and the rest of the site runs; the log of the node says `GitHub /graphql: 401`
		- where it is kept: a Vaultwarden Secure Note named `github-publicpersona-token`, notes = the raw token
	- the other answer, no token: REST only. No heatmap (Q1), and 4 visits to `/code` in an hour before GitHub refuses. To lift that, the site would keep its own copy of the answers, which is a new part
	- not known until the token is there: the captured answers of this spec were asked with the login of the `gh` CLI, an OAuth token. The docs say every fine-grained token reads public repos; that the same query gives the same answer with one was not seen. The first visit to `/code` on the node shows it ([[#Afterwards, in dazoo]])
	- recommended: as written
- **Q5, the words on `/code`** (C1)
	- today, two paragraphs: the code is not on GitHub, it is on a Forgejo server on dazoo; the repos stay private
	- as written, one paragraph: `My code is on GitHub. This page reads it from there each time it loads: my contributions of the last 12 months, and my public repos with their languages and their commits of the same 12 months.` The word `GitHub` is a link to `https://github.com/matta-kelly`
	- the link to the dazoo write-up goes with the old words; `/projects` still leads there
	- the words are the owner's. Other words change `src/app/code/page.tsx` and no test, as long as the link stays
- **Q6, the page when GitHub gives nothing** (C1)
	- today: the heading and the sentence `Activity unavailable right now. Try again later.`, and nothing else
	- as written: the heading, the paragraph of Q5 with its link, then the same sentence
	- so a visitor who gets no activity still gets the way to the code
	- so the words and the link are on the page in the state the checks run in, and an end to end test holds them
	- the other answer: as today. Then no test can hold the words: with data, the page needs the live GitHub
	- recommended: as written
- **Q7, the write-up of dazoo** (`src/app/projects/dazoo/page.tsx`)
	- it names Forgejo in three places, as the git server of dazoo
	- as written: no change. The site runs the same with Forgejo off; the text is a write-up, and it is stale in more than this: it describes two Talos clusters and Flux, and dazoo runs on Podman now
	- recommended: a task of its own, `docs`, for the whole write-up
- **Q8, the folder `deploy/`**
	- five Kubernetes manifests for a cluster that no longer runs the site. Two name Forgejo
	- as written: no change. Nothing reads the folder: no pipeline and no script of this repo, and no file of `dazoo`. The write-up of dazoo names it in its text (Q7)
	- recommended: a `chore` of its own that removes the folder, as [[spec-remove-forgejo-pipeline]] says

Seen, and decided here:

- **one call, GraphQL**: the calendar exists in GraphQL only, and the same call gives the repos, the languages and the commits. So the client sends one call for a visit, in place of 2 and 2 more for each repo
- **no copy of the answer is kept**: the page is `force-dynamic`, so Next.js keeps none, as today. One visit is 1 point of 5,000 in an hour
	- past the limit, GitHub answers with an error, and the page says the activity is unavailable until the hour ends
	- so the `revalidate` and the `tags` of the old client, which did nothing, are not in the new one
- **the account is in the code**: `matta-kelly`, as `mkultra` is today. The site is one person's
- **a day with no contribution**: GitHub gives every day of the year, most with a count of 0. The client gives only the days with a contribution, as Forgejo did. The heatmap grid fills the others in ([[spec-unit-heatmap]])
- **the day of a contribution**: GitHub gives a date, not a moment. The client gives midnight UTC of that date, and the activity rules read the UTC date of a moment ([[spec-unit-activity-rules]]). So the date on the page is the date GitHub gave

Seen, and not decided here:

- **the last square**: GitHub ends its calendar on the day it takes as today for the account. The heatmap grid ends on today in UTC. For some hours of each day the grid has one more square, with a count of 0. No promise, and no change
- **a time limit**: the call to GitHub has none, as the calls to Forgejo and to Immich have none. GitHub ends a call of its own after 10 seconds (the limits page). A new promise; no task holds it
- **the colours of the languages**: `src/lib/repo-card.ts` has a colour for 13 names. Another name is grey: on GitHub today, `Just` and `Jupyter Notebook`. No change
- **more than 100 repos, or more than 100 languages in one repo**: the client asks for the first 100 of each, which is the most one call can ask for (the limits page). The account has 7 repos

### The parts

- **GitHub client**: new. Kind: adapter, so its tests are integration tests ([[testing]], "which kind")
	- path: `src/lib/github.ts`
	- public surface, one function: `export async function fetchActivity(): Promise<ActivitySource>`
	- what goes in: nothing. The token comes from the environment, `GITHUB_API_TOKEN`, and is read only in this file
	- what comes out: an `ActivitySource` of the activity rules (`src/lib/activity.ts`), as it is on main. When GitHub gives none, the promise it returns is rejected with an `Error`
	- it takes the place of the Forgejo client, `src/lib/forgejo.ts`, which had the same surface
- **`/code` page**: wiring. Path: `src/app/code/page.tsx`. An `async` Server Component, so end to end is the lowest kind that can show a promise of it ([[testing]], "Runner config")
- **activity rules, heatmap grid, repo card formatting**: logic. No change, and no new test: what the page does with an `ActivitySource` is held already

### Acceptance criteria: the promises of the client

Each one is true or false of `fetchActivity`. Each one is decided in the client, so each one is held by an integration test on a captured answer.

- **G1** the contributions are one entry for each day that GitHub gives with a count above 0: the moment is midnight UTC of that day, and the count is the count GitHub gave (Q1, Q3)
- **G2** a repo has the name, the description, the address, the date of creation, the bytes of each language and the number of commits that GitHub gave, and the repos are in the order GitHub gave (Q1)
- **G3** the call asks for the repos that are public, owned by the account, not a fork and not archived (Q2)
- **G4** the call asks for the commits since 365 days before the moment of the call
- **G5** when GitHub answers with a status that is a failure, the read fails with the text `GitHub /graphql: <status>`, and nothing else
	- so the token is not in the text
- **G6** when the site has no token, the read fails with the text `GITHUB_API_TOKEN is not set`, and makes no call (Q4)
- **G7** when GitHub answers with status 200 and a list of errors, the read fails with the text `GitHub /graphql: <the message of the first error>`
- **G8** the call goes to `https://api.github.com/graphql`, as a `POST`, with the token as `Authorization: bearer <token>`

### Acceptance criteria: the promise of the page

True or false of the built image, as a visitor with a browser sees it. Part: wiring. Kind: end to end.

- **C1** when the site has no GitHub token, `/code` shows, in the body of the site's page: the top heading `Code`; a link with the name `GitHub` to `https://github.com/matta-kelly`; and the sentence `Activity unavailable right now. Try again later.` (Q5, Q6)
	- "the body of the site's page" is the area between the nav and the footer, as in [[spec-photos-without-key]]
	- it takes the place of C1 of that spec, which named a Forgejo token and had no link

### Acceptance criteria: the code around the promises

Each one is checked on the branch, from the repo root.

- **R1** nothing the site runs or is built from names Forgejo
	- check: `git grep -i -l -e forgejo -e gitea -- . ':(exclude)_well' ':(exclude)deploy'` prints one line, `src/app/projects/dazoo/page.tsx` (Q7)
- **R2** the Forgejo client is gone
	- check: `git ls-files src/lib/forgejo.ts` prints nothing
- **R3** the client is the only place that talks to GitHub's API
	- check: `git grep -l 'api\.github\.com' -- src ':(exclude)src/lib/github-captured'` prints `src/lib/github.ts`, and no other line
- **R4** the token is read in one file
	- check: `git grep -l GITHUB_API_TOKEN -- src` prints `src/lib/github.test.ts` and `src/lib/github.ts`, and no other line
- **R5** the page with activity shows the heatmap and the cards as before
	- check: review of the diff of `src/app/code/page.tsx`; it is the file under [[#Approach]]. `pnpm typecheck` holds the shapes
	- no test holds the page with activity: it needs the live GitHub, so a smoke check, which is parked in the epic
- **R6** the page writes the cause to the log
	- check: `git grep -c -F 'console.error("github activity fetch failed", err);' -- src/app/code/page.tsx` prints `src/app/code/page.tsx:1`
- **R7** the logic does not change
	- check: `git diff --numstat origin/main...HEAD -- src/lib/activity.ts src/lib/heatmap-grid.ts src/lib/repo-card.ts src/components` prints nothing

### Acceptance criteria: the chain

- **S1** `pnpm test`, in the dev container, finds eight test files and passes
	- check: it shows `Test Files  8 passed (8)` and `Tests  134 passed (134)`, and returns with exit code 0
	- 134 is the 129 tests on main `c121c79` and the 5 of this spec
	- when main has more tests by then: the numbers are those of main, plus one file and 5 tests
- **S2** `./check.sh`, on the host, exits 0, and Playwright's part of its output says `4 passed`
	- the four of main; one of them is changed by this spec, and none is added
- **S3** the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks feat/code-from-github` shows `checks` as `pass`
- **S4** the Factory edits no test and no captured answer
	- check: `git diff <the last commit of Design> HEAD -- tests src/lib/github.test.ts src/lib/github-captured` prints nothing
- **S5** `README.md` and `.env.example` are as [[#Approach]] gives them
	- check: the format check of S2, and review
- **S6** no token is in a file of the branch
	- check: `git grep -n -E 'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}' $(git rev-list origin/main..HEAD)` prints nothing and exits 1
- **S7** the branch changes these paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	.env.example`
		- `M	README.md`
		- `A	_well/spec-code-from-github.md`
		- `M	src/app/code/page.tsx`
		- `D	src/lib/forgejo.ts`
		- `A	src/lib/github-captured/activity.json`
		- `A	src/lib/github-captured/no-such-user.json`
		- `A	src/lib/github-captured/wrong-token.json`
		- `A	src/lib/github.test.ts`
		- `A	src/lib/github.ts`
		- `M	tests/without-keys.spec.ts`
	- so `package.json` and `pnpm-lock.yaml` do not change: the branch installs nothing
	- git may print the two lines of `forgejo.ts` and `github.ts` as one rename; `--no-renames` gives the lines above

Checked in Code review, by breaking it once on purpose:

- **S8** in `src/lib/github.ts`, `day.contributionCount > 0` becomes `day.contributionCount >= 0`; then `./check.sh` exits with a code that is not 0, and the test `has one entry for each day with a contribution, at midnight UTC of that day, with the count GitHub gave` is shown as failed
	- the change is thrown away after

### Captured answers

**What is captured**

Each file under `src/lib/github-captured/` is one call to the live GitHub, on 2026-10-13, and its answer. Every call is a `POST` to `https://api.github.com/graphql` with the document of the client.

| File | The call | GitHub answered |
| ---- | -------- | --------------- |
| `activity.json` | the login `matta-kelly` | 200, the calendar and the repos |
| `no-such-user.json` | the login `matta-kelly-no-such-user`, which no user has | 200, with `"user": null` and one error, `Could not resolve to a User with the login of 'matta-kelly-no-such-user'.` |
| `wrong-token.json` | the login `matta-kelly`, with a token GitHub does not know | 401, `Bad credentials` |

- a file holds
	- `request`: the method, the address, the document as `query`, and the `variables`. No header, so no token
	- `response`: the status, the header `content-type`, and the body
- none was written by hand, and none was built from GitHub's schema

**What is cut**

- `activity.json`
	- the calendar: its last two weeks, of 53. Nine days, 4 to 12 October 2026; four have a contribution
	- the repos: three of the seven, `que`, `publicpersona` and `stateball`, in the order GitHub gave. Each is public, and the site names each one already
	- nothing else: the document asks only for what the client reads
- so no name of an employer, and no private repo, is in the repo
- the counts of the calendar are the public ones (Q3): the same numbers are on the public profile page

**How the capture is run**

- where the token comes from: the login of the `gh` CLI on the owner's machine. Any token that reads public data gives the same answers
- save the script below outside the repo, and run it from the repo root: `GITHUB_API_TOKEN=$(gh auth token) bash <the script>`
- then, in the dev container: `pnpm exec prettier --write src/lib/github-captured`
- needs `curl` and `jq` on the host
- a new capture is a task for Design, not for the Factory: the expected values in the test file are read from the captured files, and the answers of GitHub change each day

```bash
#!/usr/bin/env bash
# Captures the answers of the live GitHub that src/lib/github.test.ts replays.
# Run from the repo root:
#   GITHUB_API_TOKEN=$(gh auth token) bash capture-github.sh
# The token is read from the environment, and is in no file this writes.
set -euo pipefail

: "${GITHUB_API_TOKEN:?a token of GitHub, from the environment}"
URL=https://api.github.com/graphql
OUT=src/lib/github-captured
LOGIN=matta-kelly
# A login that no user of GitHub has.
NO_LOGIN=matta-kelly-no-such-user
# A token GitHub does not know.
WRONG_TOKEN=not-a-token
# The test file sets its clock to 2026-10-13T00:00:00.000Z; this is 365 days before.
SINCE=2025-10-13T00:00:00.000Z
# Three repos stay in the captured answer. Each one is public, and the site names it.
KEEP='["publicpersona", "que", "stateball"]'

# The document the client sends. The test compares the two with every run of white space as one space.
QUERY='query Activity($login: String!, $since: GitTimestamp!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      isArchived: false
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      nodes {
        name
        description
        url
        createdAt
        languages(first: 100) {
          edges {
            size
            node {
              name
            }
          }
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(since: $since) {
                totalCount
              }
            }
          }
        }
      }
    }
  }
}'

RAW=$(mktemp -d -p "${XDG_RUNTIME_DIR:?}")
trap 'rm -rf "$RAW"' EXIT
mkdir -p "$OUT"

# call <name> <login> <token> <jq filter for the body>
call() {
  local name=$1 login=$2 token=$3 filter=$4 status
  jq -n --arg query "$QUERY" --arg login "$login" --arg since "$SINCE" \
    '{ query: $query, variables: { login: $login, since: $since } }' >"$RAW/$name.request"
  status=$(curl -sS --max-time 30 -X POST \
    -H "Authorization: bearer $token" -H 'Content-Type: application/json' \
    -D "$RAW/$name.headers" -o "$RAW/$name.body" -w '%{http_code}' \
    --data-binary "@$RAW/$name.request" "$URL")
  jq -n --arg url "$URL" --argjson status "$status" --argjson keep "$KEEP" \
    --slurpfile request "$RAW/$name.request" \
    --rawfile headers "$RAW/$name.headers" --slurpfile body "$RAW/$name.body" '
    {
      request: { method: "POST", url: $url, query: $request[0].query, variables: $request[0].variables },
      response: {
        status: $status,
        headers: ($headers | gsub("\r"; "") | split("\n")
          | map(capture("^(?<name>[^:]+): (?<value>.*)$") | .name |= ascii_downcase
              | select(.name == "content-type") | {(.name): .value})
          | add),
        body: ($body[0] | '"$filter"')
      }
    }' >"$OUT/$name.json"
}

# The calendar is cut to its last two weeks, and the repos to the three of $KEEP, in the order GitHub gave.
call activity "$LOGIN" "$GITHUB_API_TOKEN" \
  '.data.user.contributionsCollection.contributionCalendar.weeks |= .[-2:]
   | .data.user.repositories.nodes |= map(select(.name | IN($keep[])))'
call no-such-user "$NO_LOGIN" "$GITHUB_API_TOKEN" .
call wrong-token "$LOGIN" "$WRONG_TOKEN" .

if grep -r -q -F -e "$GITHUB_API_TOKEN" "$OUT"; then
  echo "capture: the token is in a file under $OUT" >&2
  exit 1
fi
echo "capture: wrote $(ls "$OUT" | wc -l) files to $OUT; the token is in none"
```

**How the answers are replayed**

- no package. The platform gives all of it, and all of it is on main, as for the Immich client ([[spec-integration-immich]])
	- Vitest 5.0.3: `vi.stubGlobal` puts a function in the place of `fetch`; `vi.stubEnv` sets the token of a test; `vi.useFakeTimers` stops the clock
	- Node 22: `Response`, `Headers`, `node:util`
- the function `githubAnswers`, in the test file, takes the captured file of one test
	- a call of the client gets the captured answer only when it has the method, the address, the document and the variables of the captured call, the header `Content-Type: application/json`, and the token of the test as `Authorization: bearer`
	- two documents are the same when they differ only in white space, so the layout of the document in the client is free
	- any other call gets no answer, and the test fails for it
- the clock of every test is stopped at `2026-10-13T00:00:00.000Z`. The captured calls asked for the commits since `2025-10-13T00:00:00.000Z`, which is 365 days before. So a client that counts from another moment gets no answer (G4)
- `no-such-user.json` was asked for another login than the client asks for. The client has one login, so GitHub cannot be made to answer its call with an error on purpose. The test of G7 gives that answer to the call the client does make, and says so in a comment. The answer has the form of every failure of a GraphQL query: status 200, and a list `errors`
- when the captured answers go stale: GitHub changes and the files do not. A smoke check tells ([[ci-cd]], "Smoke checks"); it is parked in the epic

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

**The client**

`src/lib/github.ts`, a new file, whole:

```ts
import type { ActivitySource, ContributionEntry, RepoSource } from "./activity";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const LOGIN = "matta-kelly";
const YEAR_MS = 365 * 86400 * 1000;

// One call gives the calendar and the repos. Only public repos that the account owns,
// with no fork and no archived one: the answer is then the same for any token.
const QUERY = `
  query Activity($login: String!, $since: GitTimestamp!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        privacy: PUBLIC
        isFork: false
        isArchived: false
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          description
          url
          createdAt
          languages(first: 100) {
            edges {
              size
              node {
                name
              }
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(since: $since) {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface GithubDay {
  date: string;
  contributionCount: number;
}

interface GithubRepo {
  name: string;
  description: string | null;
  url: string;
  createdAt: string;
  languages: { edges: { size: number; node: { name: string } }[] };
  defaultBranchRef: { target: { history: { totalCount: number } } } | null;
}

interface GithubAnswer {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: { weeks: { contributionDays: GithubDay[] }[] };
      };
      repositories: { nodes: GithubRepo[] };
    };
  };
  errors?: { message: string }[];
}

function getToken(): string {
  const token = process.env.GITHUB_API_TOKEN;
  if (!token) {
    throw new Error("GITHUB_API_TOKEN is not set");
  }
  return token;
}

function contributions(days: GithubDay[]): ContributionEntry[] {
  return days
    .filter((day) => day.contributionCount > 0)
    .map((day) => ({
      timestamp: Date.parse(`${day.date}T00:00:00Z`) / 1000,
      count: day.contributionCount,
    }));
}

function repoSource(repo: GithubRepo): RepoSource {
  return {
    name: repo.name,
    description: repo.description ?? "",
    htmlUrl: repo.url,
    createdAt: repo.createdAt,
    languageBytes: Object.fromEntries(
      repo.languages.edges.map((edge) => [edge.node.name, edge.size]),
    ),
    commitsLast12mo: repo.defaultBranchRef?.target.history.totalCount ?? 0,
  };
}

export async function fetchActivity(): Promise<ActivitySource> {
  const since = new Date(Date.now() - YEAR_MS).toISOString();
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN, since } }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GitHub /graphql: ${res.status}`);
  }
  const answer = (await res.json()) as GithubAnswer;
  if (answer.errors?.length) {
    throw new Error(`GitHub /graphql: ${answer.errors[0].message}`);
  }
  const { contributionsCollection, repositories } = answer.data.user;
  return {
    contributions: contributions(
      contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays),
    ),
    repos: repositories.nodes.map(repoSource),
  };
}
```

- `src/lib/forgejo.ts` is removed: `git rm src/lib/forgejo.ts`
- what no test holds, and why it is there
	- `repo.description ?? ""`: GitHub's schema allows `null` for a description. Each of the 7 repos has one, so no real answer with a `null` exists to capture
	- `repo.defaultBranchRef?.` and `?? 0`: the schema allows `null` for a repo with no commit. None of the 7 is empty
	- `cache: "no-store"`: it says what `force-dynamic` already does, so the client makes the same call whatever page uses it
- this file, with the page below and the tests of Design, was built once by Design and thrown away: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (134 passed) and `./check.sh` (4 passed) all passed with it

**The page**

`src/app/code/page.tsx`, after the change, whole:

```tsx
import Heatmap from "@/components/Heatmap";
import RepoCard from "@/components/RepoCard";
import { activitySummary } from "@/lib/activity";
import { fetchActivity } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function CodePage() {
  let activity;
  try {
    activity = activitySummary(await fetchActivity());
  } catch (err) {
    console.error("github activity fetch failed", err);
  }

  return (
    <article>
      <header className="text-muted space-y-3 leading-relaxed">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">Code</h1>
        <p>
          My code is on{" "}
          <a
            href="https://github.com/matta-kelly"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            GitHub
          </a>
          . This page reads it from there each time it loads: my contributions of the last 12
          months, and my public repos with their languages and their commits of the same 12 months.
        </p>
      </header>

      {activity ? (
        <>
          <section className="mt-8">
            <Heatmap days={activity.heatmap} total={activity.totalContributionsLast12mo} />
          </section>

          <section className="mt-12">
            <h2 className="text-muted text-sm font-medium tracking-wide uppercase">Repos</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {activity.repos.map((r) => (
                <RepoCard key={r.name} repo={r} />
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-muted mt-8">Activity unavailable right now. Try again later.</p>
      )}
    </article>
  );
}
```

- what goes: the import of `Link`, the second paragraph, and the page of its own for a failure
- what stays as on main: `export const dynamic`, the two sections, and every class name

**The shared files: the lines this change owns**

Each place is given by the text of a line, as the file is on main `c121c79`. Every line not named here is not this change's.

- `check.sh`, `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`, `playwright.config.ts`, `.github/workflows/`, `Dockerfile`: no line
	- `pnpm test` already finds `src/lib/github.test.ts`
	- `check.sh` starts the image with no secret, so the site has no token there, which is the state C1 needs
- `.env.example`: the three lines from `# Required for /code.` to `FORGEJO_API_TOKEN=` become these four

```sh
# Required for /code. GitHub token that reads public data: a fine-grained personal access
# token with access to "Public repositories", and no permission.
# Vaultwarden item: github-publicpersona-token (notes = raw token).
GITHUB_API_TOKEN=
```

- `README.md`, three places
	- the line that starts `` - `/code` my repositories `` becomes: `` - `/code` my contributions and my public repositories, read live from GitHub's API ``
	- the table under `## Parts`: one new row, directly after the row that starts `| Immich client`: `GitHub client`, `adapter`, `integration`, `` `src/lib/github.ts` ``
	- the table under `## Layout`: one new row, directly after the row of `src/lib/immich-captured/`: `` `src/lib/github-captured/` ``, `answers of the live GitHub, captured; the integration tests replay them`
	- `pnpm format`, in the dev container, gives the padding of the two tables

**Commits and the pull request**

- the branch is `feat/code-from-github`, made from main `c121c79`
	- main comes in again only by a merge; never a rebase, never a force push
- the spec, the tests and the captured answers are on the branch before any code
- then, in this order
	- `feat(code): read the activity from GitHub`: `src/lib/github.ts`, `src/lib/forgejo.ts`, `src/app/code/page.tsx`
		- all 134 tests pass after this commit
	- `docs(readme): name GitHub as the source of /code`: `README.md`, `.env.example`
- the pull request is open, as a draft, from this branch
	- title: `feat(code): read the activity from GitHub`
	- body, one line: `Spec: _well/spec-code-from-github.md`

### Out of scope

- the unit file of the node, the secret of the node, and the token itself: [[#Afterwards, in dazoo]]
- the write-up of dazoo (Q7) and the folder `deploy/` (Q8)
- the setting of the account for private contributions (Q3): the owner's, on GitHub
- a copy of GitHub's answer kept by the site, a time limit on the call, a colour for more languages, a second page of repos: see "Seen, and not decided here"
- a test of `/code` with activity, and the smoke check that tells when the captured answers are stale: parked in the epic
- the earlier specs under `_well/` that name Forgejo
- any package, `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`
- the repo, the registry and the runner on the Forgejo server

### Going back

- revert the squash commit on main
	- `/code` calls Forgejo again. With Forgejo off, it says the activity is unavailable, which is what it says on the node from the day Forgejo is off
	- nothing outside `src/`, `tests/`, `_well/`, `README.md` and `.env.example` changes; the pipeline is the same

### Afterwards, in dazoo

A later change, in the repo `dazoo`, with its own spec. Until it is on the node, `/code` says the activity is unavailable, and the rest of the site runs. Either change can reach the node first.

1. the owner makes the token (Q4) and saves it in Vaultwarden as `github-publicpersona-token`
2. a new sealed secret of the node `monkeybusiness`: `secrets/sealed/github-publicpersona-token.sops`, and its row in `secrets/sealed/README.md`
3. in `publicpersona/publicpersona.container`
	- the line `Secret=forgejo-api-token,type=env,target=FORGEJO_API_TOKEN` becomes `Secret=github-publicpersona-token,type=env,target=GITHUB_API_TOKEN`
	- the two comment lines above it, which name the Forgejo API and the mesh route, say instead that the page reads GitHub's public API with a token that has no right
	- steps 2 and 3 go to the node together: a unit that names a secret the node does not have does not start
4. `secrets/sealed/forgejo-api-token.sops` and its row in the README are removed: no other unit of the node reads that secret
5. seen on the node after: `https://home.monk3y.xyz/code` shows the heatmap and the cards. When it says the activity is unavailable, the log of the unit names the cause: `GITHUB_API_TOKEN is not set`, `GitHub /graphql: 401`, or the message of GitHub
6. the line of [[spec-ghcr-switch]] in `dazoo`, "`publicpersona` no longer reads the Forgejo API at run time", is then done
7. the Forgejo token itself is revoked on the Forgejo server, or goes with the server

## Tests

Two files. Each test was seen to fail against main `c121c79`, and to pass against the build of Design that was thrown away.

**`src/lib/github.test.ts`**: beside the code; found by `vitest.config.mts`; run by `pnpm test`. Part: GitHub client. Kind: integration. 5 tests, all in the block `the activity of the account`.

| Test | Criterion |
| ---- | --------- |
| has one entry for each day with a contribution, at midnight UTC of that day, with the count GitHub gave | G1, G3, G4, G8 |
| has of each repo the name, description, address, date of creation, bytes of each language and commits since 365 days ago, in the order GitHub gave | G2, G3, G4, G8 |
| fails with the call and the status, and nothing else, when GitHub answers with a failure | G5 |
| fails with the message of GitHub when the answer has status 200 and holds errors | G7 |
| fails with the name of the missing value, and calls nothing, when the site has no token | G6 |

**`tests/without-keys.spec.ts`**: found by `playwright.config.ts`; run by `./check.sh` against the built image. Part: `/code` page, wiring. Kind: end to end. 1 test, changed: it takes the place of `shows that the activity is unavailable on /code when the site has no Forgejo token`, since its promise changed.

| Test | Criterion |
| ---- | --------- |
| shows where the code is, and that the activity is unavailable, on /code when the site has no GitHub token | C1 |

- how the expected results were made
	- the days, the counts, the names, the descriptions, the addresses, the dates, the bytes and the numbers of commits: read from `activity.json`, which holds what the live GitHub sent
	- the four moments: worked out by hand from the dates. 2026-10-10T00:00:00Z is 1791590400, and a day is 86400 seconds
	- the texts of the failures: from the promises, with the status and the message read from the captured files
	- the words and the link of the page: from Q5
	- none is taken from a run of the code
- every test of the client goes through `fetchActivity`, and checks what comes back
- G3, G4 and G8 have no test of their own: a call with another document, another moment or another address gets no captured answer, so the two tests named for them fail
- no test calls the live GitHub: the integration tests replay the captured files, and the end to end test runs in the state with no token, where the page stops before any call
- failing today, on main `c121c79`
	- the 5 of the client: `Cannot find module './github'`. `pnpm typecheck` fails for the same line, and `./check.sh` stops there
	- the test of the page, run alone against an image built from main: `getByRole('main').getByRole('link', { name: 'GitHub', exact: true })`, `element(s) not found`. The other three Playwright tests pass
- each of the 5 was also seen to fail alone, against the build of Design broken in one place
	- `> 0` to `>= 0`, and midnight to noon: the first test
	- the address of a repo to its name: the second
	- the status text added to the text of G5: the third
	- the check of `errors` taken out: the fourth
	- a token of `""` let through: the fifth
	- 365 days to 364; `isArchived: false` taken out; `PUBLIC` to `PRIVATE`: the first four, each for a call with no captured answer

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- G1 to G8, C1: a test, written first and kept
- R1 to R7: the checks given with each one; R5 by review, since the page with activity needs the live GitHub
- S1 to S4, S6 to S8, the chain: the checks accept it (S2, S3), and the real run proves it (S3 on the pull request, and step 5 of [[#Afterwards, in dazoo]] on the node)
- S5, `docs`: the format check, and review
