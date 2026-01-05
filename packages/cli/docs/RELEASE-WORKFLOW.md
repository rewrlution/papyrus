# Quick Release Workflow

This document explains the simplified release process for the Papyrus CLI.

## TL;DR - Release in 4 Commands

```bash
cd packages/cli
pnpm test && pnpm build          # 1. Test and build
npm version patch                 # 2. Bump version (patch/minor/major)
git push --follow-tags            # 3. Push with tags
# 4. GitHub Actions publishes automatically
```

What happens:

1. ✅ Tests and build ensure quality
2. ✅ `npm version` bumps version in package.json
3. ✅ `npm version` creates git commit and tag (v0.0.2)
4. ✅ `git push --follow-tags` pushes commit and tag
5. ✅ GitHub Actions publishes to npm automatically

## Step-by-Step Release Process

### Step 1: Test and Build

```bash
cd packages/cli
pnpm test && pnpm build
```

This ensures your code works before releasing.

### Step 2: Bump Version

Choose the appropriate version bump:

```bash
# Patch release (0.0.1 -> 0.0.2) - bug fixes
npm version patch

# Minor release (0.0.2 -> 0.1.0) - new features
npm version minor

# Major release (0.1.0 -> 1.0.0) - breaking changes
npm version major
```

This automatically:

- Updates `version` in `package.json`
- Creates git commit: `"0.0.2"` or custom with `-m` flag
- Creates git tag: `v0.0.2`

### Step 3: Push to GitHub

```bash
git push --follow-tags
```

This pushes both the commit AND the tag, triggering the publish workflow.

### When Tag Reaches GitHub

GitHub Actions workflow (`.github/workflows/publish.yml`) triggers on `v*` tags:

1. **Test Job**: Runs tests to ensure quality
2. **Publish Job**: Publishes to npm with `--access public`

You can watch progress at: `https://github.com/YOUR_USERNAME/papyrus/actions`

## Semantic Versioning Guide

Choose the right release type based on changes:

### Patch Release (`pnpm release`)

**Format**: `0.0.1` → `0.0.2`

**Use for:**

- Bug fixes
- Documentation updates
- Internal refactoring (no API changes)
- Dependency updates

**Example:**

```bash
# Fixed date parsing bug
pnpm release
# Creates v0.0.2
```

### Minor Release (`pnpm release:minor`)

**Format**: `0.0.2` → `0.1.0`

**Use for:**

- New features (backwards compatible)
- New commands added
- New options to existing commands
- Deprecations (but not removals)

**Example:**

```bash
# Added new 'search' command
pnpm release:minor
# Creates v0.1.0
```

### Major Release (`pnpm release:major`)

**Format**: `0.1.0` → `1.0.0`

**Use for:**

- Breaking changes
- Removed commands or options
- Changed command behavior
- Renamed commands
- Changed default behavior

**Example:**

```bash
# Changed sync algorithm (breaking change)
pnpm release:major
# Creates v1.0.0
```

## Pre-Release Checklist

Before releasing:

- [ ] All changes committed to git
- [ ] On correct branch (usually `main`)
- [ ] No uncommitted changes (`git status` is clean)
- [ ] Pulled latest changes (`git pull`)
- [ ] Tests pass locally
- [ ] Build succeeds locally

## Complete Release Example

```bash
# Start from clean state
cd packages/cli
git status  # Should be clean

# Run tests and build
pnpm test && pnpm build

# Bump version (choose one based on changes)
npm version patch    # For bug fixes
npm version minor    # For new features
npm version major    # For breaking changes

# Push to GitHub (triggers publish)
git push --follow-tags

# Watch the deployment
# Visit: https://github.com/YOUR_USERNAME/papyrus/actions
```

## Troubleshooting

### "nothing to commit, working tree clean"

This is normal if you ran the release script multiple times. The version was already bumped.

**Fix:** Check `git log` to see if version was already bumped, then just push:

```bash
git push --follow-tags
```

### "tag already exists"

You tried to release the same version twice.

**Fix:** Delete local tag and try again:

```bash
git tag -d v0.0.2
pnpm release
```

### Tests fail

**Fix:** Fix the failing tests before releasing:

```bash
pnpm test
# Fix issues
git add .
git commit -m "fix: resolve test failures"
pnpm release
```

### Build fails

**Fix:** Fix build errors before releasing:

```bash
pnpm build
# Fix issues
git add .
git commit -m "fix: resolve build errors"
pnpm release
```

### GitHub Actions fails

**Causes:**

- NPM_TOKEN not configured
- Tests fail in CI (different environment)
- Build fails in CI

**Fix:** Check GitHub Actions logs:

1. Go to `https://github.com/YOUR_USERNAME/papyrus/actions`
2. Click on the failed workflow run
3. Read error messages
4. Fix issue and create new release

### Published wrong version

**If not published yet:** Delete the tag and retry:

```bash
# Delete local tag
git tag -d v0.0.2

# Delete remote tag
git push origin :refs/tags/v0.0.2

# Fix version in package.json and try again
```

**If already published:** You can't unpublish after 72 hours. Publish a new patch version instead:

```bash
pnpm release  # Publishes next version
```

## Configuration Details

### npm version Options

The `npm version` command:

- Updates `version` field in `package.json`
- Creates a git commit with message format: `chore(cli): release v%s`
- Creates a git tag matching the version: `v0.0.2`
- Runs `prepublishOnly` script (tests + build) before version bump

### git push --follow-tags

The `--follow-tags` flag:

- Pushes current branch commits
- Also pushes annotated tags pointing to pushed commits
- Safer than `--tags` (doesn't push ALL local tags)

### GitHub Actions Trigger

`.github/workflows/publish.yml` triggers on:

```yaml
on:
  push:
    tags:
      - 'v*' # Matches v0.0.1, v1.0.0, v2.3.4, etc.
```

## Best Practices

1. **Always run tests first** - The release scripts do this automatically
2. **Use semantic versioning correctly** - Users rely on version numbers
3. **Keep CHANGELOG.md updated** - Document what changed
4. **Test locally before releasing** - CI failures waste time
5. **Release from main branch** - Avoid confusion
6. **One release at a time** - Don't batch multiple versions

## Related Documentation

- [Full Deployment Guide](./10-DEPLOYMENT-GUIDE.md) - Detailed CI/CD setup
- [README](../README.md) - User-facing documentation
- [CLAUDE.md](../CLAUDE.md) - Development guide

## Questions?

- GitHub Issues: https://github.com/YOUR_USERNAME/papyrus/issues
- Check workflow status: https://github.com/YOUR_USERNAME/papyrus/actions
