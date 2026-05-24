# CLI Release Workflow

How to cut a release of `@rewrlution/papyrus-cli`. For the full monorepo pipeline (all packages, triggers, secrets), see [`docs/development/cicd.md`](../../../docs/development/cicd.md).

Releases are triggered by **package-scoped tags** — `cli@<version>` — not by a global version tag.

## TL;DR — Release in 5 commands

```bash
cd packages/cli
pnpm test && pnpm build                    # 1. verify it works
npm version patch --no-git-tag-version     # 2. bump package.json only (no auto-tag)
git commit -am "chore(cli): release 0.0.11"  # 3. commit the bump
git tag cli@0.0.11                         # 4. package-scoped tag
git push --follow-tags                     # 5. push commit + tag → CI publishes
```

> **Why `--no-git-tag-version`?** Plain `npm version patch` would create a `v0.0.11` tag, which no longer matches the workflow trigger. We bump the version separately and create the `cli@<version>` tag by hand.

## Step-by-step

### 1. Test and build

```bash
cd packages/cli
pnpm test && pnpm build
```

### 2. Bump the version

```bash
# patch (0.0.10 → 0.0.11) — bug fixes
npm version patch --no-git-tag-version

# minor (0.0.11 → 0.1.0) — new features
npm version minor --no-git-tag-version

# major (0.1.0 → 1.0.0) — breaking changes
npm version major --no-git-tag-version
```

This updates `version` in `package.json` only — no commit, no tag.

> **If you touched `packages/shared/src/`**, bump shared's version too (in `packages/shared/package.json`) and tag it separately (`shared@<version>`). CLI consumers install shared from npm; a missed bump produces `SyntaxError: Named export 'X' not found` after publish.

### 3. Commit and tag

```bash
git commit -am "chore(cli): release 0.0.11"
git tag cli@0.0.11
```

The tag version **must** match the `package.json` version — npm publishes whatever `package.json` says, and the tag is only the trigger.

### 4. Push

```bash
git push --follow-tags
```

`--follow-tags` pushes the branch commits plus the annotated/lightweight tags pointing at them — safer than `--tags`, which pushes every local tag.

### What happens in CI

The tag fires `.github/workflows/publish.yml`:

1. **Test job** — builds and tests `core` + `shared` + `cli`
2. **Publish job** — publishes `core`, `shared`, `cli` to npm (pnpm skips any version already on the registry, so only `cli@0.0.11` actually goes out)

Watch progress in the repo's **Actions** tab.

## Semantic versioning guide

| Bump      | Example           | Use for                                                                   |
| --------- | ----------------- | ------------------------------------------------------------------------- |
| **patch** | `0.0.10 → 0.0.11` | bug fixes, docs, internal refactors, dependency bumps                     |
| **minor** | `0.0.11 → 0.1.0`  | new features / commands / options (backwards compatible), deprecations    |
| **major** | `0.1.0 → 1.0.0`   | breaking changes — removed/renamed commands, changed defaults or behavior |

## Pre-release checklist

- [ ] On `main`, branch is clean (`git status`)
- [ ] Latest changes pulled (`git pull`)
- [ ] Tests pass locally (`pnpm test`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] `package.json` version bumped and committed

## Troubleshooting

### "tag already exists"

You're reusing a version. Delete the local tag, bump to a new version, and re-tag:

```bash
git tag -d cli@0.0.11
# bump package.json to 0.0.12, commit, then:
git tag cli@0.0.12
```

### Published the wrong version

**Not published yet** — delete the tag locally and remotely, fix the version, re-tag:

```bash
git tag -d cli@0.0.11
git push origin --delete cli@0.0.11
```

**Already published** — npm versions are immutable. Don't try to replace it; bump to the next patch and release again.

### GitHub Actions failed

Common causes: `NPM_TOKEN` not configured, or tests/build failing in CI. Open the failed run in the Actions tab, read the logs, fix, then cut a new version (never re-push the same tag).

## Best practices

1. **Bump the version or nothing publishes** — pnpm skips versions already on npm.
2. **Tag version must match `package.json`** — the registry uses `package.json`, the tag is just the trigger.
3. **Release from `main`**, one version at a time.
4. **Use semver honestly** — users depend on the numbers.

## Related

- [`docs/development/cicd.md`](../../../docs/development/cicd.md) — full monorepo CI/CD pipeline
- [CLI `CLAUDE.md`](../CLAUDE.md) — development guide
