---
type: spec
description: "Remove the pipeline file under .forgejo, the ignore lines that name that folder, the README text about the other server, and the forgejo git remote, so that publicpersona has one pipeline and one git server. Reference for what the change must remove, which Forgejo references stay and why, and how it is checked."
status: review
---
## Need

- the repo holds two pipelines
	- `.github/workflows/`: checks a pull request, and builds and publishes the image to ghcr.io
	- `.forgejo/workflows/build.yaml`: builds the same image on another server, Forgejo, and pushes it to that server's registry
- nothing uses the second one
	- the node, `monkeybusiness`, runs `ghcr.io/matta-kelly/publicpersona:latest`, and the owner has seen it healthy on that image
	- the file runs only on a push to the `forgejo` remote, and that remote's `main` is 20 commits behind GitHub's
- the second one breaks the rules in [[ci-cd]]
	- "one for the checks, one for the ship": it is a third pipeline file
	- "no stored password for the registry": it logs in with a stored `REGISTRY_TOKEN`
	- its actions are pinned to a tag, and its jobs have no time limit
- three other places still describe it
	- `.dockerignore` and `.prettierignore` each hold a line for the folder `.forgejo`
	- `README.md`, "Ship it": says the node pulls `latest` from `forgejo.monk3y.xyz` and does not take a merge on GitHub. This is false
	- `README.md`, "Layout": a row for `.forgejo/workflows/build.yaml`
- the checkout has a `forgejo` remote
	- per [[conventions]], a remote is removed once the project no longer needs that server
	- `spec-ship.md` put the removal of this remote in the same change as the removal of the pipeline file

## Done looks like

### Acceptance criteria

Each one is checked on the branch, from the repo root, against `origin/main`, unless it says otherwise.

Gone:

- no file is tracked under `.forgejo`
	- check: `git ls-files .forgejo` prints nothing
- a fresh checkout of the branch has no `.forgejo` folder
	- check: `test ! -e .forgejo` exits 0
- `.dockerignore` and `.prettierignore` do not name `.forgejo`
	- check: `git grep -n 'forgejo' -- .dockerignore .prettierignore` prints nothing and exits 1
- `README.md` does not name Forgejo, the other server, or the node switch
	- check: `git grep -n -i 'forgejo\|other server\|node switch' -- README.md` prints nothing and exits 1
- outside the paths that [[#Forgejo references that stay]] lists, no tracked file names Forgejo
	- check: `git grep -i -l 'forgejo' -- . ':(exclude)src' ':(exclude)deploy' ':(exclude)_well' ':(exclude)tests' ':(exclude).env.example'` prints nothing and exits 1
- the checkout has one remote, `origin`
	- check: `git remote` prints one line, `origin`
	- a worktree shares its remotes with the main checkout, so the check gives the same answer in both

In its place:

- `README.md`, "Ship it", says where the node gets the image
	- check: ``git grep -c -F 'The node, `monkeybusiness`, runs `latest` from ghcr.io and takes each new image by itself: a merge is the deploy.' -- README.md`` prints `README.md:1`

Nothing else:

- `.dockerignore` loses one line and gains none
	- check: `git diff --numstat origin/main...HEAD -- .dockerignore` prints `0	1	.dockerignore`
- `.prettierignore` loses one line and gains none
	- check: `git diff --numstat origin/main...HEAD -- .prettierignore` prints `0	1	.prettierignore`
- the change to `README.md` is 11 lines added and 12 removed
	- check: `git diff --numstat origin/main...HEAD -- README.md` prints `11	12	README.md`
	- 1 and 1: the sentence in "Ship it"
	- 10 and 11: the table in "Layout". The removed row was the widest in both columns, so the formatter pads every other line again
- the branch changes five paths and no other
	- check: `git diff --name-status origin/main...HEAD` prints exactly these lines
		- `M	.dockerignore`
		- `D	.forgejo/workflows/build.yaml`
		- `M	.prettierignore`
		- `M	README.md`
		- `M	_well/spec-remove-forgejo-pipeline.md`

Still works:

- the `checks` run on the last commit of this spec's pull request passes
	- check: `gh pr checks <number>` shows `checks` as `pass`
- after the merge, the `ship` run for main's new commit passes
	- check: `gh run list --workflow ship.yml --branch main --limit 1 --json headSha,conclusion` shows main's commit with `success`

### Approach

In this order.

- the remote, first, since it is not part of a commit
	- `timeout 30 git fetch forgejo`
	- `git merge-base --is-ancestor forgejo/main origin/main` exits 0: GitHub has every commit that the other server has
	- then `git remote remove forgejo`
	- the fetch fails, or the second command exits non-zero: stop. The work goes back to Design, and the remote stays
- `git rm -r .forgejo`
	- this removes `build.yaml`; git keeps no empty folder, so `.forgejo/workflows/` and `.forgejo/` go with it
- `.dockerignore`: remove the line that reads `.forgejo`
- `.prettierignore`: remove the line that reads `.forgejo/`
- `README.md`, section "Ship it": replace one line
	- the line that starts: `The node still pulls`
	- with: ``The node, `monkeybusiness`, runs `latest` from ghcr.io and takes each new image by itself: a merge is the deploy.``
	- the empty lines before and after it stay
- `README.md`, section "Layout": remove one row, then format
	- the row that starts: `` | `.forgejo/workflows/build.yaml` ``
	- then `pnpm format`, in the dev container. It pads the table again and changes no other file
	- the table is then these ten lines

```
| Path                           | Holds                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `src/app/`                     | pages and routes (Next.js App Router)                                         |
| `src/components/`              | shared interface pieces                                                       |
| `src/lib/`                     | clients for the two outside services                                          |
| `public/`                      | images and other static files                                                 |
| `Dockerfile`                   | the image: a multi-stage build ending in Next's standalone server             |
| `check.sh`                     | the one command that runs the whole check set                                 |
| `.github/workflows/checks.yml` | the pipeline for a pull request: runs `check.sh`                              |
| `.github/workflows/ship.yml`   | the pipeline for a merge to `main`: builds the image and pushes it to ghcr.io |
```

- one commit holds the four file changes: `chore(ci): remove the Forgejo pipeline`
- the pull request title: `chore: remove the Forgejo pipeline`
- no file is added, and no other file is edited but this spec

### Forgejo references that stay

Each one stays as it is. This change edits none of them but this spec.

- `src/lib/forgejo.ts`, `src/app/code/page.tsx`, `src/components/Heatmap.tsx`, `src/components/RepoCard.tsx`, and `FORGEJO_API_TOKEN` in `.env.example`
	- the `/code` page reads the Forgejo API. That is what the site does, not how it is built
	- they go when `/code` reads GitHub, which is a `feat` with its own spec
- `src/app/projects/dazoo/page.tsx`
	- the text of a write-up about another project. It is content of the site
- `deploy/deployment.yaml` and `deploy/externalsecret.yaml`
	- Kubernetes manifests for a cluster that no longer runs the site
	- the whole folder is stale, not only these lines. Its removal is a separate change
- the specs in `_well/`: `spec-checks.md`, `spec-format.md`, `spec-remove-shell-tests.md`, `spec-ship.md`, and this one
	- each one defines a change. The four others define changes that are agreed
- `publicpersona.md`, in the repo folder
	- not tracked: `.gitignore` keeps it out. It is a note of the vault, and no pull request holds it
	- it says that the pipeline and the image run from Forgejo. The owner corrects it

### Out of scope

- the other server
	- the repo `mkultra/publicpersona` on Forgejo, its copy of the pipeline file, its `REGISTRY_TOKEN` secret, and its runner
	- the images in the registry at `forgejo.monk3y.xyz`
- the node: its unit file is in `dazoo`, and it already names ghcr.io
- the `/code` page and the Forgejo client
- the `deploy/` folder
- the lines for `AGENTS.md` and `lessons.md` in `.dockerignore`
- every other part of `README.md`
- `check.sh`, `Dockerfile` and the two files under `.github/workflows/`
- any test runner, runner config, test file or test command

### Going back

- the files: revert the squash commit on main
	- the pipeline file, the two ignore lines and the README text come back
	- nothing that runs changes: the node pulls from ghcr.io, and `ship.yml` builds that image
- the remote: `git remote add forgejo ssh://git@forgejo.monk3y.xyz:2222/mkultra/publicpersona.git`

## Tests

- none: the change is a `chore`, and is verified by its type ([[conventions]], "what verifies a change, by its type")
	- the checks accept it: the `checks` run on the pull request
		- its format check reads `README.md`, and uses `.prettierignore`
		- its image build uses `.dockerignore`
	- the real run proves it: the `ship` run on main, after the merge
		- on failure the merge is reverted, per [[shit_sdlc#Loop|Ship]]
		- the image that the run builds holds the same files as the one before it: `.dockerignore` kept `.forgejo` and `README.md` out of the build, and `.prettierignore` is not in Next's standalone output
		- so the node gets no new behaviour, and its own health check and its return to the last good image hold as before
	- a smoke check watches it after: none applies
		- the repo has no smoke check yet, and this change touches no call to an outside thing
- the other acceptance criteria are read from git, by the commands given with each one
