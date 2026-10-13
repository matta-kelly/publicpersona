---
type: spec
description: "Take every read of Forgejo and every word about Forgejo out of the site, and point to GitHub for code: the /code page and all that it used go, the nav gets a GitHub icon that links to the profile, and the address /code leads to the profile. Reference for what the site reads and says today, every place that names Forgejo, the owner's questions with a default and one other answer each, the exact words and files after the change, the tests, and what changes in dazoo afterwards."
status: done
---
## Need

- Forgejo, the self-hosted git server, is being turned off
- the site calls Forgejo's API each time a visitor opens `/code`
	- from that day `/code` shows the heading `Code` and `Activity unavailable right now. Try again later.`, for every visitor, with no end
	- `/`, `/projects`, `/photos` and `/api/health` do not call Forgejo
- the text of `/code` is false already: `None of this is on GitHub. My code lives on my own Forgejo instance`. All code hosting is on GitHub
- each link on a repo card points at the Forgejo server, which only the mesh reaches
- the write-up of dazoo names Forgejo as the home of its repo
- the owner's decision: the site reads no git server. No client, no token, no heatmap from an API. It points to the GitHub profile, `https://github.com/matta-kelly`
	- an earlier design, [[spec-code-from-github]] (draft pull request 22), put a GitHub client and a token in the place of the Forgejo ones. It is not the plan. This spec takes its place

### What the site shows today

Read from the code at main `256e9a3`.

| Place | What a visitor sees | Where it comes from |
| ---- | ---- | ---- |
| nav, every page | `Matthew Kelly`, then `Home`, `Projects`, `Code`, `Photos`, then the theme button (an icon) | `src/components/Nav.tsx` |
| footer, every page | `© Matthew Kelly`, then two text links: `email`, `linkedin` | `src/components/Footer.tsx` |
| `/` | the picture and three paragraphs. No word about where the code is | `src/app/page.tsx` |
| `/projects` | three cards | `src/app/projects/page.tsx` |
| `/projects/stateball`, `/projects/sabermetric-networks` | each has a link to its own repo on GitHub, under the heading | their `page.tsx` |
| `/projects/dazoo` | names Forgejo in three places, and `self-hosted git` and `git` as things the cloud nodes run | `src/app/projects/dazoo/page.tsx` |
| `/code` | two paragraphs about Forgejo, a heatmap of one year, one card for each repo | `src/app/code/page.tsx`, `src/lib/forgejo.ts` |
| `/photos` | the album. No word about code | `src/app/photos/page.tsx` |

How the site draws an icon today:

- inline SVG in the component file, no package: `src/components/ThemeToggle.tsx` (sun, moon), `src/app/photos/Gallery.tsx` (arrows, close)
- 24 by 24 view box, shown at 16 by 16, `fill="none"`, `stroke="currentColor"`, stroke width 2, round caps and joins
- the moon is path for path the `moon` icon of Feather, an open icon set (MIT licence). Feather has a `github` icon in the same form
- the theme button is the one icon in the nav: `text-muted`, `hover:text-foreground`, `rounded-md p-2.5`, a faint background on hover

### Every place that names or reads Forgejo

Found with three searches over the tracked files at main `256e9a3`, and by reading each file of `src/app/`, `src/components/`, `src/lib/` (not the captured Immich answers), `tests/`, `deploy/` and the root.

- the name: `forgejo`, `gitea`, `codeberg`
- the host and the account: `monk3y`, `git.`, `mkultra`
- the words for it: `self-host`, `own instance`, `git host`, `git server`, `token`, `private`, `not on`, `activity`, `contribution`, `heatmap`, `repo-card`, `/code`

| Place | What it holds | In this change |
| ---- | ---- | ---- |
| `src/lib/forgejo.ts` | the client: the address, the account, the token, the four calls | removed |
| `src/app/code/page.tsx` | the page: the import, the log text, the two paragraphs | removed |
| `src/lib/activity.ts`, `src/lib/heatmap-grid.ts`, `src/lib/repo-card.ts` | the rules for what the client gives. The comment `What a git host gives` | removed: only `/code` used them |
| `src/components/Heatmap.tsx`, `src/components/RepoCard.tsx` | the two pieces of `/code` | removed: only `/code` used them |
| `src/lib/activity.test.ts`, `src/lib/heatmap-grid.test.ts`, `src/lib/repo-card.test.ts` | 15 unit tests of those rules | removed, by Design: their promises are withdrawn |
| `src/components/Nav.tsx` | the link `Code` to `/code` | changed |
| `src/lib/nav.test.ts` | a comment that lists `Code at /code` | changed, by Design |
| `tests/without-keys.spec.ts` | one test of `/code` with no Forgejo token, and one comment | changed, by Design |
| `src/app/projects/dazoo/page.tsx` | `Forgejo` in three places, `self-hosted git`, `mesh, git, front door` | changed (Q4) |
| `.env.example` | `FORGEJO_API_TOKEN` and the two lines above it | changed |
| `README.md` | no line names Forgejo. One line says `/code` is `read live from the git host's API`; three rows and two sentences are about the parts that go | changed |
| `deploy/deployment.yaml`, `deploy/externalsecret.yaml` | Kubernetes manifests: an image at the Forgejo registry, and the token | removed, with the folder (Q5) |
| `_well/spec-*.md`, 11 files | earlier specs | no change: each says what was true of its own change |
| `check.sh`, `Dockerfile`, `.dockerignore`, `.github/workflows/`, the two runner configs, `package.json` | nothing | none |

Outside this repo, and not for this change to touch:

- the unit file of the node and its sealed secret, in `dazoo`: [[#Afterwards, in dazoo]]
- the vault note `publicpersona.md`, which git ignores: it says `/code` reads Forgejo and that `FORGEJO_API_TOKEN` is a secret of the site. The owner corrects it

## Done looks like

### The questions

Each one is the owner's taste. Each has a default, which the promises below are written for, and one other answer. Another answer sends this spec back to Design before the Factory starts.

- **Q1, `/code`: keep a short page, or remove it** (N1, N2)
	- default: remove the page and the `Code` link of the nav
		- with no activity to show, the page has one job: to send the visitor to GitHub. A nav link to a page of one sentence is a click with nothing on it
		- the nav can send the visitor there in one click, from every page (Q3)
	- the other answer: keep `/code` as a page of one paragraph, and keep the `Code` link
		- its words: the heading `Code`, then `My code is on GitHub.`, where `GitHub` is a link to the profile with the icon of Q3 before it
		- then no redirect (Q2), and the nav does not change
- **Q2, the address `/code`** (N2)
	- default: it leads to the profile on GitHub, with a redirect that is not permanent (status 307)
		- a link to `/code` from outside the site still gets the visitor to the code
		- not permanent, since a browser keeps a permanent redirect for good, and a revert of this change could not take it back
	- the other answer: no redirect. `/code` then shows the site's `404` page, with the nav
- **Q3, where the GitHub link goes, and the icon** (N1)
	- default: an icon in the nav, directly before the theme button, on every page
		- it takes the place that the `Code` link had: the nav is where a visitor looked for the code
		- an icon alone fits there and nowhere else: the theme button beside it is an icon alone, and the footer and the page texts are words
		- the icon is the `github` icon of Feather, drawn the way the site draws the moon. No package
		- its name for a screen reader, and for the test: `GitHub`
		- it opens in a new tab, as every outside link of the site does
	- the other answer: a text link `github` in the footer, after `linkedin`, in the form of the two links there. No icon. Then the nav only loses `Code`
- **Q4, the words of the dazoo write-up** (R1)
	- default: `GitHub` in the place of `Forgejo`, three times, and git taken out of the list of what the cloud nodes run. The exact lines are under [[#Approach]]
		- the `dazoo` repo is on GitHub, and with Forgejo off the nodes run no git server
	- the other answer: name no host. The box `dazoo repo` loses its second line, the step `Forgejo` becomes `dazoo repo`, and the caption says `Push to the repo`
	- not a question here: the write-up is stale in more than this. It describes two Talos clusters and Flux, and dazoo runs on Podman now. That is a task of its own, for the whole write-up
- **Q5, the folder `deploy/`** (R1)
	- default: removed, all six files
		- two of them hold the last Forgejo lines of the repo: the image at the Forgejo registry, and the token as a secret of a cluster
		- nothing reads the folder: no pipeline and no script of this repo, and no file of `dazoo`. The cluster it was for no longer runs the site
		- [[spec-remove-forgejo-pipeline]] and [[spec-ship]] both name its removal as a change still to make
	- the other answer: it stays. Then R1 leaves two files that name Forgejo, and a `chore` of its own removes the folder later

### The parts

- **nav**: wiring. Path: `src/components/Nav.tsx`. A component of the layout, so every page has it
	- changed: it loses one link of the site and gains one outside link
	- its one piece of logic, the nav active rule (`src/lib/nav.ts`), does not change
- **redirect of `/code`**: wiring, new. Path: `next.config.ts`
	- what goes in: a request for `/code`
	- what comes out: status 307 and the header `location: https://github.com/matta-kelly`
	- Next.js decides how a redirect is answered; this repo decides only the two addresses. So end to end, against the built image, is the lowest kind that can show it
- **activity rules, heatmap grid, repo card formatting**: logic. Removed, with their unit tests
- **Forgejo client**: removed. It had no row in `README.md` and no test

### Acceptance criteria: the promises

Each one is true or false of the built image. Part: wiring. Kind: end to end.

- **N1** the nav of the site has a link with the name `GitHub`, and its address is `https://github.com/matta-kelly` (Q1, Q3)
- **N2** a request for `/code` is answered with status 307 and the header `location: https://github.com/matta-kelly` (Q1, Q2)

### Acceptance criteria: the code around the promises

Each one is checked on the branch, from the repo root.

- **R1** no tracked file outside `_well/` names Forgejo
	- check: `git grep -i -l -e forgejo -e gitea -- . ':(exclude)_well'` prints nothing, and exits 1
- **R2** the site reads no git server, and has no token for one
	- check: `git grep -n -i -e 'api\.github\.com' -e '_API_TOKEN' -- . ':(exclude)_well'` prints nothing, and exits 1
	- check: `git grep -l 'fetch(' -- src` prints `src/lib/immich.ts`, and no other line
- **R3** nothing of `/code` is left
	- check: `git ls-files src/app/code src/lib/forgejo.ts src/lib/activity.ts src/lib/heatmap-grid.ts src/lib/repo-card.ts src/components/Heatmap.tsx src/components/RepoCard.tsx deploy` prints nothing
	- check: `git grep -n -e '"/code"' -- src` prints nothing; `git grep -n -e '/code' -- next.config.ts` prints the two lines of [[#Approach]]
- **R4** no package is added or removed
	- check: `git diff --numstat origin/main...HEAD -- package.json pnpm-lock.yaml` prints nothing
- **R5** the icon is drawn in the nav's own file, the way the theme button's icons are
	- check: review of the diff of `src/components/Nav.tsx`; it is the file under [[#Approach]]
- **R6** the pages `/`, `/projects`, `/projects/stateball`, `/projects/sabermetric-networks` and `/photos`, and the footer, do not change
	- check: `git diff --name-only origin/main...HEAD -- src/app src/components` prints these five lines, and no other
		- `src/app/code/page.tsx`
		- `src/app/projects/dazoo/page.tsx`
		- `src/components/Heatmap.tsx`
		- `src/components/Nav.tsx`
		- `src/components/RepoCard.tsx`

### Acceptance criteria: the chain

- **S1** `pnpm test`, in the dev container, finds four test files and passes
	- check: it shows `Test Files  4 passed (4)` and `Tests  22 passed (22)`, and returns with exit code 0
	- 22 is the 37 of main `256e9a3` less the 15 of the three files that go
- **S2** `./check.sh`, on the host, exits 0, and Playwright's part of its output says `5 passed`
	- the five: the first journey, the contract test, `/photos` without a key, and the two of this spec
- **S3** the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks feat/code-points-to-github` shows `checks` as `pass`
- **S4** the Factory edits no test
	- check: `git diff <the last commit of Design> HEAD -- tests 'src/**/*.test.ts'` prints nothing
- **S5** `README.md` and `.env.example` are as [[#Approach]] gives them
	- check: the format check of S2, and review
- **S6** the branch changes these paths and no other
	- check: `git diff --name-status --no-renames origin/main...HEAD` prints exactly these lines
		- `M	.env.example`
		- `M	README.md`
		- `A	_well/spec-code-points-to-github.md`
		- `D	deploy/deployment.yaml`
		- `D	deploy/externalsecret.yaml`
		- `D	deploy/ingress.yaml`
		- `D	deploy/kustomization.yaml`
		- `D	deploy/namespace.yaml`
		- `D	deploy/service.yaml`
		- `M	next.config.ts`
		- `D	src/app/code/page.tsx`
		- `M	src/app/projects/dazoo/page.tsx`
		- `D	src/components/Heatmap.tsx`
		- `M	src/components/Nav.tsx`
		- `D	src/components/RepoCard.tsx`
		- `D	src/lib/activity.test.ts`
		- `D	src/lib/activity.ts`
		- `D	src/lib/forgejo.ts`
		- `D	src/lib/heatmap-grid.test.ts`
		- `D	src/lib/heatmap-grid.ts`
		- `M	src/lib/nav.test.ts`
		- `D	src/lib/repo-card.test.ts`
		- `D	src/lib/repo-card.ts`
		- `A	tests/code-on-github.spec.ts`
		- `M	tests/without-keys.spec.ts`

Checked in Code review, by breaking it once on purpose:

- **S7** in `src/components/Nav.tsx`, the address of the icon's link becomes `https://github.com/`; then `./check.sh` exits with a code that is not 0, and the test `offers a link named GitHub to my profile in the nav` is shown as failed
- **S8** in `next.config.ts`, `permanent: false` becomes `permanent: true`; then `./check.sh` exits with a code that is not 0, and the test `sends a visitor of /code to my GitHub profile` is shown as failed
	- each change is thrown away after

### What the site shows after the change

| Place | What a visitor sees |
| ---- | ---- |
| nav, every page | `Matthew Kelly`, then `Home`, `Projects`, `Photos`, then the GitHub icon, then the theme button |
| the GitHub icon | a link to `https://github.com/matta-kelly`, in a new tab. Its name is `GitHub`. No text beside it |
| `/code` | no page. The browser goes to `https://github.com/matta-kelly` |
| `/projects/dazoo` | `GitHub` under `dazoo repo` in the first figure; the step `GitHub` in the flow; the caption `I don't touch prod. Push to GitHub, Flux pulls, the cluster converges.`; the cloud nodes `run the mesh coordinator, the secrets vault, and the front door (DNS, TLS, tunnels)`; the first item under `Always-on layer` is `mesh, front door` |
| footer, `/`, `/projects`, the two other write-ups, `/photos` | as today |

### Approach

Nothing here is a choice for the Factory. A question goes back to Design.

Each file below passed `prettier --check` with the repo's config and its Tailwind plugin, on a copy outside the repo. No file below was built or run.

**The nav**

`src/components/Nav.tsx`, after the change, whole:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { isActiveLink } from "@/lib/nav";
import { twMerge } from "tailwind-merge";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/photos", label: "Photos" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/5 dark:border-white/10">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 text-sm">
        <Link href="/" className="font-medium">
          Matthew Kelly
        </Link>
        <ul className="text-muted order-3 flex w-full gap-4 sm:order-none sm:ml-auto sm:w-auto sm:gap-6">
          {links.map((l) => {
            const active = isActiveLink(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={twMerge(
                    "hover:text-foreground",
                    active && "text-foreground underline underline-offset-4",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center">
          <a
            href="https://github.com/matta-kelly"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-muted hover:text-foreground block rounded-md p-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <GitHubIcon />
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}
```

- what changes against main: the entry `{ href: "/code", label: "Code" }` goes; the `<ThemeToggle />` line becomes the `div` with the link and the button; the function `GitHubIcon` is new
- the path is that of `icons/github.svg` in the Feather repo (`feathericons/feather`, MIT licence), read on 2026-10-13
- the link has the classes of the theme button, and `block`, so the two are the same size and react the same way to the pointer
- the `div` keeps the two icons together: the `gap-x-6` of the `nav` then stands between the links and the pair, not between the two icons

**The redirect**

`next.config.ts`, after the change, whole:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Links to /code exist outside the site. The code is on GitHub, so the address leads there.
  // Not permanent: a browser keeps a permanent redirect for good, and a later change to this
  // line would not reach it.
  redirects: async () => [
    { source: "/code", destination: "https://github.com/matta-kelly", permanent: false },
  ],
};

export default nextConfig;
```

- Next.js, [`redirects`](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects): `permanent: false` gives status 307; the destination can be an address outside the site; a redirect is checked before the pages

**What is removed**

```sh
git rm -r src/app/code deploy
git rm src/lib/forgejo.ts src/lib/activity.ts src/lib/heatmap-grid.ts src/lib/repo-card.ts
git rm src/components/Heatmap.tsx src/components/RepoCard.tsx
```

- nothing that stays imports one of these: `activity.ts` is imported by the two components, the two other rule files, the client and the page, and each of those goes
- `clsx` and `tailwind-merge` stay in `package.json` (R4)

**The dazoo write-up**

`src/app/projects/dazoo/page.tsx`. Each place is given by its text on main `256e9a3`.

- in the section `The always-on layer`, the three lines from `the mesh coordinator, self-hosted git,` to `unglamorous: Fedora CoreOS, containers as systemd units, no orchestrator.` become

```tsx
          the mesh coordinator, the secrets vault, and the front door (DNS, TLS, tunnels).
          Everything else in the system depends on them, so they get to be simple and unglamorous:
          Fedora CoreOS, containers as systemd units, no orchestrator.
```

- `<DiagramBox label="dazoo repo" sublabel="Forgejo" emphasis />` becomes `<DiagramBox label="dazoo repo" sublabel="GitHub" emphasis />`
- `items={["mesh, git, front door", "secrets, observability", "offsite backup"]}` becomes `items={["mesh, front door", "secrets, observability", "offsite backup"]}`
- `const steps = ["git push", "Forgejo", "Flux", "Talos cluster", "running pod"];` becomes `const steps = ["git push", "GitHub", "Flux", "Talos cluster", "running pod"];`
- `I don&apos;t touch prod. Push to Forgejo, Flux pulls, the cluster converges.` becomes `I don&apos;t touch prod. Push to GitHub, Flux pulls, the cluster converges.`
- no other line of the file changes. `the same git system everything else lives in`, in the section `Monkey works`, names no server and stays

**The shared files: the lines this change owns**

- `.env.example`: the file, whole

```sh
# Required for /photos. Anonymous share-link key from an Immich album share.
# Vaultwarden item: immich-publicpersona-share (notes = raw key).
IMMICH_SHARE_KEY=
```

- `README.md`, four places
	- the line `` - `/code` my repositories, read live from the git host's API `` goes
	- the table under `## Parts`, whole

```md
| Part              | Kind    | Test        | Path                 |
| ----------------- | ------- | ----------- | -------------------- |
| photo rules       | logic   | unit        | `src/lib/photos.ts`  |
| Immich client     | adapter | integration | `src/lib/immich.ts`  |
| nav active rule   | logic   | unit        | `src/lib/nav.ts`     |
| gallery behaviour | logic   | unit        | `src/lib/gallery.ts` |
```

- `README.md`, the two other places
	- the line that starts `` `.env.local` holds two values `` becomes: `` `.env.local` holds one value, described in `.env.example`. Without it the site still runs; `/photos` has nothing to show. ``
	- in the table under `## Layout`, the row of `src/lib/` becomes

```md
| `src/lib/`                     | logic, and the client for the one outside service, Immich                     |
```

- `check.sh`, `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`, `playwright.config.ts`, `.github/workflows/`, `Dockerfile`, `.dockerignore`: no line
	- `check.sh` starts the image with no secret, as before; the site then needs one fewer
	- `playwright.config.ts` already finds `tests/code-on-github.spec.ts`

**Commits and the pull request**

- the branch is `feat/code-points-to-github`, made from main `256e9a3`
	- main comes in again only by a merge; never a rebase, never a force push
- the spec and the tests are on the branch before any code
- then, in this order
	- `feat(nav): point to GitHub in place of the code page`: `src/components/Nav.tsx`, `next.config.ts`, and the seven files of `src/` under "What is removed"
		- all 22 unit tests and all 5 Playwright tests pass after this commit
	- `fix(projects): name GitHub as the home of the dazoo repo`: `src/app/projects/dazoo/page.tsx`
	- `chore: remove the deploy folder`: `deploy/`
	- `docs(readme): take /code and the Forgejo token out`: `README.md`, `.env.example`
- the pull request is open, as a draft, from this branch
	- title: `feat(nav): point to GitHub in place of the code page`
	- body, one line: `Spec: _well/spec-code-points-to-github.md`

### Out of scope

- a heatmap, repo cards, a call to GitHub's API, a token, a new page
- the unit file of the node and its sealed secret: [[#Afterwards, in dazoo]]
- the rest of the dazoo write-up, which is stale (Q4)
- the home page, the footer, the two other write-ups, `/photos`
- the earlier specs under `_well/` that name Forgejo, and [[spec-code-from-github]] with its branch and its pull request: the owner closes that pull request
- the vault note `publicpersona.md`
- any package, `check.sh`, the runner configs, the pipeline, the dev container, the `Dockerfile`
- the repo, the registry and the runner on the Forgejo server

### After the change: what still names Forgejo

`grep -ri forgejo` over the tracked files outside `_well/` prints nothing (R1).

Inside `_well/`, 11 earlier specs and this one name it. Each earlier spec says what was true of its own change, and no change edits another spec.

### Going back

- revert the squash commit on main
	- `/code` is a page again and calls Forgejo. With Forgejo off, it says the activity is unavailable
	- a browser that followed the redirect did not keep it (Q2), so it gets the page again

### Afterwards, in dazoo

A later change, in the repo `dazoo`, with its own spec. Read from `dazoo` at `origin/main`. Either change can reach the node first: the new image reads no token, so a token that is still given does nothing; the old image with no token says on `/code` that the activity is unavailable.

1. in `nodes/mutable/monkeybusiness/publicpersona/publicpersona.container`: the line `Secret=forgejo-api-token,type=env,target=FORGEJO_API_TOKEN` goes, with the two comment lines above it (`# Projects section: Forgejo API ...`)
2. `nodes/mutable/monkeybusiness/secrets/sealed/forgejo-api-token.sops` goes, with its row in `secrets/sealed/README.md`
	- no other unit of the node reads that secret
	- step 1 reaches the node before step 2, or with it: a unit that names a secret the node does not have does not start
3. the line of `_well/spec-ghcr-switch.md` in `dazoo`, "`publicpersona` no longer reads the Forgejo API at run time", is then done
4. the owner: the Vaultwarden item `forgejo-api-token` goes, and the token is revoked on the Forgejo server, or goes with the server
5. seen on the node after: `https://home.monk3y.xyz/` has the GitHub icon in the nav, and `https://home.monk3y.xyz/code` leads to the profile

## Tests

Both in `tests/code-on-github.spec.ts`, a new file; found by `playwright.config.ts`; run by `./check.sh` against the image it has just built.

| Test | Criterion | Part | Kind |
| ---- | --------- | ---- | ---- |
| offers a link named GitHub to my profile in the nav | N1 | nav, wiring | end to end |
| sends a visitor of /code to my GitHub profile | N2 | redirect of `/code`, wiring | end to end |

- how the expected results were made
	- the name, the address and the status: from N1 and N2. None is taken from a run of the code
- neither test reaches GitHub
	- the first reads the address of the link and does not follow it
	- the second asks with `maxRedirects: 0`, so it reads the answer of the site and stops
- the first test opens `/`. The nav is one component of the layout, so one page shows it
- failing today, on main `256e9a3`
	- seen in the `checks` run on the commit of Design, `6d19f14` (run 38448712169 of pull request 25)
	- the format check, the lint, the typecheck and the image build pass; `Test Files  4 passed (4)`, `Tests  22 passed (22)`
	- Playwright: `3 passed`, `2 failed`, and the two are the tests of this spec
		- the first: `expect(locator).toHaveAttribute(expected) failed`, `element(s) not found`. The nav has no link with the name `GitHub`
		- the second: `Expected: 307`, `Received: 200`. `/code` is a page
	- so the `checks` run is red until the Factory's first commit, and for no other cause
- not seen to pass: Design did not build the change. S2 and S3 show it

Tests that Design takes away or changes on the branch, since their promises are withdrawn or their words are no longer true:

| File | What | Why |
| ---- | ---- | ---- |
| `tests/without-keys.spec.ts` | the test `shows that the activity is unavailable on /code when the site has no Forgejo token` goes; the comment at the top names only Immich | C1 of [[spec-photos-without-key]] is withdrawn: `/code` is no page |
| `src/lib/activity.test.ts` | removed, 5 tests | the activity rules go ([[spec-unit-activity-rules]]) |
| `src/lib/heatmap-grid.test.ts` | removed, 3 tests | the heatmap grid goes ([[spec-unit-heatmap]]) |
| `src/lib/repo-card.test.ts` | removed, 7 tests | the repo card formatting goes ([[spec-unit-interface-rules]]) |
| `src/lib/nav.test.ts` | the comment that lists the links of the site loses `Code at /code` | no test of the file changes |

How each criterion is verified, by the type of what it changes ([[conventions]], "what verifies a change, by its type"):

- N1, N2: a test, written first and kept
- R1 to R6: the checks given with each one
- S1 to S4, S6 to S8, the chain: the checks accept it (S2, S3), and the real run proves it (S3 on the pull request, and step 5 of [[#Afterwards, in dazoo]] on the node)
- S5, `docs`: the format check, and review
