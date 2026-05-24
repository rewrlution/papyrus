# CI/CD Pipeline

> How testing and publishing work in this monorepo.

---

## TL;DR — just want the commands?

**To release a package (e.g. core changed):**

```bash
# 1. bump version in package.json, then:
git commit -am "chore(core): release 0.0.2"
git tag core@0.0.2
git push --follow-tags
```

**To release multiple packages at once (e.g. core + shared both changed):**

```bash
git commit -am "chore: release core@0.0.2, shared@0.0.3"
git tag core@0.0.2
git tag shared@0.0.3
git push --follow-tags   # pushes all new tags in one go
```

**To check what's already been released:**

```bash
git tag -l "core@*"     # every core release
git tag -l "cli@*"      # every cli release
git tag -l "shared@*"   # every shared release
```

That's all you need day-to-day. Read on if you want to understand why.

---

## Two workflows, two purposes

| Workflow    | File                            | Fires on                                 | Purpose                     |
| ----------- | ------------------------------- | ---------------------------------------- | --------------------------- |
| **Test**    | `.github/workflows/test.yml`    | Every PR to `main`, every push to `main` | Catch bugs before they land |
| **Publish** | `.github/workflows/publish.yml` | Every `<package>@<version>` tag push     | Gate and ship to npm        |

They are separate because they solve different problems. The test workflow runs constantly during development. The publish workflow runs only at release. The publish workflow re-runs tests as a release gate — not as a replacement for per-PR testing.

---

## Test workflow

Fires on any PR or push to `main` that touches `packages/core`, `packages/cli`, or `packages/shared`.

Runs on a **Node 18 × 20 matrix** (compatibility check):

```
build core
build cli (pulls shared as a dependency)
test core + shared + cli
```

If any test fails, the PR cannot merge.

---

## Publish workflow

Fires on any tag matching `<package>@<version>` (e.g. `core@0.0.1`).

Runs two jobs in sequence — the publish job will not start unless the test job passes:

```
test job
  ├── build core
  ├── build cli (+ shared)
  └── test core + shared + cli

publish job
  ├── build core → dist/
  ├── build cli → dist/
  ├── publish @rewrlution/papyrus-core   → npm
  ├── publish @rewrlution/papyrus-shared → npm
  └── publish @rewrlution/papyrus-cli    → npm
```

**Order matters:** core must be published before shared and cli, because the plugin's marketplace install resolves core from npm.

**pnpm skips already-published versions.** If `core@0.0.1` is already on npm and you haven't bumped the version, the publish step is silently skipped — only packages with new versions go out.

---

## Publishing a new version

### 1. Bump the version

Edit `package.json` in whichever package changed. Only bump what actually changed — other packages are skipped automatically.

```bash
# example: core changed
packages/core/package.json → "version": "0.0.2"
```

### 2. Commit and push the code

```bash
git add packages/core/package.json
git commit -m "chore(core): release 0.0.2"
git push
```

### 3. Create and push the tag

```bash
git tag core@0.0.2
git push origin core@0.0.2
```

GitHub Actions fires on the tag, tests run, then the publish job ships whatever packages have new versions.

> **Shortcut — combine steps 2 and 3 into one push:**
> Instead of pushing twice, you can commit, tag, then use `--follow-tags` to push the commit and the tag together in a single command:
>
> ```bash
> git commit -am "chore(core): release 0.0.2"
> git tag core@0.0.2
> git push --follow-tags
> ```
>
> `--follow-tags` is safer than `--tags` (which would push _all_ local tags). It only pushes tags that point at commits you're already pushing.

---

## Tag naming convention

Tags use the format `<package>@<version>`:

```
core@0.0.1
core@0.0.2
cli@0.0.11
shared@0.0.3
```

**Why not a single repo-wide version tag?** Packages are independently versioned. One global version number is meaningless when core is at `0.0.1` and cli is at `0.0.11` — it doesn't map to any package. Package-scoped tags are unambiguous.

**The tag is only a trigger.** The version actually published to npm comes from each package's `package.json`, not the tag name. When you push `core@0.0.1`, the workflow fires and publishes every package with a new version — core goes out, cli and shared are skipped (pnpm sees they're already on npm).

---

## Required secrets

| Secret      | Used by          | Where to set                     |
| ----------- | ---------------- | -------------------------------- |
| `NPM_TOKEN` | publish workflow | GitHub repo → Settings → Secrets |

---

## What is not yet in CI

| Missing                    | Notes                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Plugin marketplace publish | Plugin ships via git-subdir; no publish step needed, but validation is not automated |
| api deploy                 | Deployed to Render; no GitHub Actions workflow yet                                   |
| web deploy                 | No GitHub Actions workflow yet                                                       |
| Typecheck step             | Tests run but `tsc --noEmit` is not a separate CI gate                               |
