# Deploying Papyrus CLI to npm - Complete Guide

This guide walks you through deploying the Papyrus CLI package to npm from a monorepo, including GitHub Actions setup, npm configuration, and troubleshooting.

## What We're Building

A complete CI/CD pipeline that:

- Tests code on every PR and push
- Publishes to npm when you push a version tag
- Handles monorepo dependencies correctly
- Works with scoped packages (`@rewrlution/papyrus-cli`)
- Ensures quality before publishing

## Prerequisites

Before you begin, you need:

**Required:**

- npm account (create at https://www.npmjs.com/signup)
- Access to publish packages under the `@rewrlution` scope
- GitHub repository with admin access
- Git installed locally

**Assumed knowledge:**

- Basic Git (tags, branches)
- Basic GitHub Actions concepts
- Basic npm package management

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Git Tag Push                        │
│                    (v1.0.0)                         │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│            GitHub Actions Workflow                   │
│                                                      │
│  1. Test Job                                        │
│     - Setup pnpm + Node                             │
│     - Install dependencies (all packages)           │
│     - Build shared package first                    │
│     - Build CLI package                             │
│     - Run tests                                     │
│                                                      │
│  2. Publish Job (if tests pass)                     │
│     - Setup pnpm + Node with npm registry          │
│     - Install dependencies                          │
│     - Build packages                                │
│     - Publish CLI to npm (--access public)          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│               npm Registry                           │
│         @rewrlution/papyrus-cli@1.0.0               │
└─────────────────────────────────────────────────────┘
```

## Part 1: npm Account Setup

### Step 1: Create npm Account (if needed)

1. Go to https://www.npmjs.com/signup
2. Fill out the form and verify your email
3. Enable 2FA (highly recommended):
   - Go to https://www.npmjs.com/settings/your-username/twofa
   - Choose "Authorization and Publishing" or "Authorization Only"
   - Scan QR code with authenticator app

### Step 2: Create Access Token

npm tokens authenticate GitHub Actions to publish packages on your behalf.

1. **Navigate to Tokens Page**
   - Go to https://www.npmjs.com/settings/your-username/tokens
   - Click "Generate New Token" → "Classic Token"

2. **Configure Token**
   - **Type**: Choose "Automation" (for CI/CD)
   - **Expiration**: Set expiration date (or no expiration for long-term)
   - **Allowed IP ranges**: Leave empty (GitHub Actions IPs vary)
   - **Allowed packages**:
     - Option A: Leave empty (allow all packages)
     - Option B: Specify `@rewrlution/papyrus-cli` (more secure)

3. **Copy Token**
   - Token looks like: `npm_XXXXXXXXXXXXXXXXXXXX`
   - **IMPORTANT**: Copy and save it now - you can't see it again!
   - Store securely (password manager, secure note)

**Security Note**: Treat this token like a password. Anyone with this token can publish packages to your account.

### Step 3: Verify Scope Permissions

For scoped packages like `@rewrlution/papyrus-cli`, you need:

1. **Check if scope exists**:

   ```bash
   # Visit https://www.npmjs.com/org/rewrlution
   # If it doesn't exist, you need to create it first
   ```

2. **Create scope (if needed)**:
   - On npm website, click your profile → "Add Organization"
   - Name it `rewrlution` (without the @)
   - Choose "Free" plan (unless you need private packages)

3. **Grant yourself publish access**:
   - If you own the scope, you already have access
   - If it's an organization, go to:
     - https://www.npmjs.com/settings/rewrlution/members
     - Add yourself with "Developer" or "Owner" role

**Why this matters**: Scoped packages (`@scope/package`) require you to have permission on that scope. Without it, publishing will fail with "403 Forbidden".

## Part 2: Package Configuration

### Step 1: Update package.json

Your package.json needs specific fields for npm publishing:

```json
{
  "name": "@rewrlution/papyrus-cli",
  "version": "0.0.1",
  "description": "AI-powered developer journaling CLI",
  "keywords": ["journal", "cli", "developer", "productivity"],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/papyrus.git",
    "directory": "packages/cli"
  },
  "homepage": "https://github.com/your-username/papyrus#readme",
  "bugs": {
    "url": "https://github.com/your-username/papyrus/issues"
  },
  "engines": {
    "node": ">=18"
  },
  "bin": {
    "pp": "./dist/cli.js",
    "paper": "./dist/cli.js",
    "papyrus": "./dist/cli.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "publishConfig": {
    "access": "public"
  }
}
```

**Key fields explained:**

- **`name`**: Full package name with scope
- **`version`**: Semantic version (MAJOR.MINOR.PATCH)
- **`description`**: Shows up on npm search
- **`keywords`**: Helps users find your package
- **`repository.directory`**: Points to package in monorepo
- **`files`**: What gets published (keep it minimal!)
- **`publishConfig.access`**: Required for scoped packages to be public

### Step 2: Add Publishing Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run test",
    "prepack": "echo 'Packing @rewrlution/papyrus-cli...'",
    "postpack": "echo 'Pack complete!'"
  }
}
```

**What these do:**

- `prepublishOnly`: Runs before `npm publish` (builds and tests)
- `prepack`: Runs before creating tarball (optional logging)
- `postpack`: Runs after creating tarball (optional logging)

**Why this matters**: Ensures you never publish unbuild code or broken tests.

### Step 3: Create/Update .npmignore

Create `packages/cli/.npmignore` to exclude files from npm:

```
# Source files
src/
tests/
*.test.ts
*.spec.ts

# Development files
.github/
.vscode/
docs/
CLAUDE.md

# Config files
tsconfig.json
vitest.config.ts
eslint.config.js

# Build artifacts
*.tsbuildinfo
node_modules/

# Environment
.env
.env.*
```

**Why this matters**: Reduces package size and prevents publishing sensitive files.

## Part 3: GitHub Actions Setup

### Step 1: Create Workflow Directory

In your monorepo root, create:

```bash
mkdir -p .github/workflows
```

**Note**: Workflows go in the root, not in `packages/cli/.github`. This is because GitHub Actions runs at the repository level, not package level.

### Step 2: Create Test Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test CLI

on:
  pull_request:
    branches: [main]
    paths:
      - 'packages/cli/**'
      - 'packages/shared/**'
      - '.github/workflows/test.yml'
  push:
    branches: [main]
    paths:
      - 'packages/cli/**'
      - 'packages/shared/**'

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build --filter=@rewrlution/papyrus-cli...

      - name: Run tests
        run: pnpm test --filter=@rewrlution/papyrus-cli
```

**Key points:**

- **`paths`**: Only runs when CLI or shared package changes (efficient!)
- **`strategy.matrix`**: Tests on Node 18 and 20 (ensures compatibility)
- **`pnpm install --frozen-lockfile`**: Ensures reproducible installs
- **`--filter=...`**: Turborepo syntax to build CLI and its dependencies
- **`pnpm/action-setup@v4`**: Official pnpm action

**Why this workflow:**

- Catches bugs before they reach production
- Tests on multiple Node versions
- Fast (only runs when relevant files change)
- Uses pnpm (not npm) for monorepo support

### Step 3: Create Publish Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish CLI to npm

on:
  push:
    tags:
      - 'cli-v*' # Triggers on cli-v1.0.0, cli-v1.0.1, etc.

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build --filter=@rewrlution/papyrus-cli...

      - name: Run tests
        run: pnpm test --filter=@rewrlution/papyrus-cli

  publish:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js with npm registry
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build --filter=@rewrlution/papyrus-cli...

      - name: Publish to npm
        run: |
          cd packages/cli
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Key differences from test workflow:**

- **Tag trigger**: Only runs when you push `cli-v*` tags
- **`needs: test`**: Won't publish if tests fail
- **`registry-url`**: Tells setup-node to configure npm registry
- **`--access public`**: Required for scoped packages to be public
- **`cd packages/cli`**: Navigate to CLI package before publishing
- **`NODE_AUTH_TOKEN`**: Uses npm token from GitHub secrets

**Why tag-based deployment:**

- Manual control (publish when you're ready)
- Clear history (tags are immutable)
- Standard practice (semantic versioning)
- Easy rollback (git tag -d cli-v1.0.0)

### Step 4: Add npm Token to GitHub Secrets

1. **Navigate to Repository Settings**
   - Go to your GitHub repo
   - Click "Settings" tab
   - Click "Secrets and variables" → "Actions"

2. **Create Secret**
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token from Part 1
   - Click "Add secret"

3. **Verify Secret**
   - You should see `NPM_TOKEN` in the list
   - You can't view the value (security feature)
   - You can update or delete it later if needed

**Security Note**: Never commit tokens to Git. Always use GitHub Secrets.

## Part 4: Version Management

### Understanding Semantic Versioning

npm uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0): Breaking changes (incompatible API changes)
- **MINOR** (0.1.0): New features (backward-compatible)
- **PATCH** (0.0.1): Bug fixes (backward-compatible)

**Examples:**

- `0.0.1` → `0.0.2`: Bug fix
- `0.0.2` → `0.1.0`: New feature (command added)
- `0.1.0` → `1.0.0`: Stable release or breaking change

### Versioning Workflow

**Step 1: Update package.json version**

```bash
cd packages/cli

# Manually edit package.json
# Change "version": "0.0.1" to "version": "0.0.2"

# Or use npm version command
npm version patch  # 0.0.1 → 0.0.2
npm version minor  # 0.0.2 → 0.1.0
npm version major  # 0.1.0 → 1.0.0
```

**Step 2: Commit the version change**

```bash
git add packages/cli/package.json
git commit -m "chore(cli): bump version to 0.0.2"
```

**Step 3: Create and push tag**

```bash
# Create tag (note the cli- prefix!)
git tag cli-v0.0.2 -m "Release CLI v0.0.2"

# Push commits and tag
git push origin main
git push origin cli-v0.0.2
```

**Step 4: Watch GitHub Actions**

1. Go to your GitHub repo → "Actions" tab
2. You should see "Publish CLI to npm" workflow running
3. Wait for it to complete (usually 2-5 minutes)
4. Check for green checkmark (success) or red X (failed)

**Step 5: Verify on npm**

```bash
# View on npm website
# https://www.npmjs.com/package/@rewrlution/papyrus-cli

# Or check from command line
npm view @rewrlution/papyrus-cli

# Install and test
npm install -g @rewrlution/papyrus-cli
papyrus --version  # Should show 0.0.2
```

## Part 5: Monorepo-Specific Considerations

### Build Order Matters

The CLI depends on the shared package. You must build in order:

```bash
# Wrong - will fail
pnpm build --filter=@rewrlution/papyrus-cli

# Right - builds shared first
pnpm build --filter=@rewrlution/papyrus-cli...
```

The `...` suffix tells Turborepo to build dependencies first.

### Workspace Dependencies

In `package.json`, you have:

```json
{
  "dependencies": {
    "@rewrlution/papyrus-shared": "workspace:*"
  }
}
```

**Before publishing**, pnpm automatically converts this to:

```json
{
  "dependencies": {
    "@rewrlution/papyrus-shared": "0.0.1"
  }
}
```

This ensures users installing from npm get the correct version.

**Why this matters**: If you forget to publish shared package, CLI installation will fail.

### Publishing Order

If shared package is also published to npm:

1. Publish shared package first: `npm publish` in `packages/shared`
2. Then publish CLI: `npm publish` in `packages/cli`

If shared is not published (internal only):

1. Bundle shared code into CLI (use bundler like tsup or esbuild)
2. Or mark shared as devDependency and copy files during build

**Current setup**: Shared is `workspace:*`, so you'll need to publish shared package to npm or bundle it.

## Part 6: Testing Before Publishing

### Test Locally

Before pushing tags, test the package locally:

```bash
# From monorepo root
pnpm build

# Navigate to CLI
cd packages/cli

# Create tarball (simulates npm publish)
npm pack

# This creates: rewrlution-papyrus-cli-0.0.2.tgz

# Test installation from tarball
cd /tmp
npm install -g /path/to/papyrus/packages/cli/rewrlution-papyrus-cli-0.0.2.tgz

# Test commands
papyrus --version
papyrus --help
papyrus add --date today

# Uninstall
npm uninstall -g @rewrlution/papyrus-cli
```

### Test in Fresh Environment

Use Docker to test in clean environment:

```bash
# Create test Dockerfile
cat > Dockerfile.test <<EOF
FROM node:20-alpine
RUN npm install -g @rewrlution/papyrus-cli
CMD ["papyrus", "--version"]
EOF

# Build and run
docker build -f Dockerfile.test -t papyrus-test .
docker run papyrus-test
```

## Part 7: Troubleshooting

### Issue: "403 Forbidden" during publish

**Cause**: No permission to publish under `@rewrlution` scope.

**Solutions:**

1. **Check token permissions**:

   ```bash
   npm whoami --registry https://registry.npmjs.org
   ```

   Should show your username.

2. **Check scope access**:
   - Go to https://www.npmjs.com/org/rewrlution
   - Verify you're a member with "Developer" or "Owner" role

3. **Regenerate token**:
   - Create new token on npm website
   - Update GitHub secret `NPM_TOKEN`
   - Try again

4. **Check if scope exists**:
   - If `@rewrlution` doesn't exist on npm, create organization first
   - Or change package name to unscoped: `papyrus-cli`

### Issue: "Cannot find module '@rewrlution/papyrus-shared'"

**Cause**: Shared package not built or not published to npm.

**Solutions:**

1. **Build shared first**:

   ```bash
   pnpm build --filter=@rewrlution/papyrus-shared
   pnpm build --filter=@rewrlution/papyrus-cli
   ```

2. **Publish shared to npm** (if it's a public package):

   ```bash
   cd packages/shared
   npm publish --access public
   ```

3. **Bundle shared into CLI** (if shared is internal only):
   - Use bundler (tsup, esbuild, webpack)
   - Copy shared code into CLI during build
   - Remove shared from dependencies

### Issue: Workflow runs but doesn't publish

**Cause**: Tag name doesn't match pattern in workflow.

**Solutions:**

1. **Check tag pattern**:

   ```yaml
   on:
     push:
       tags:
         - 'cli-v*' # Only matches cli-v1.0.0, cli-v1.0.1, etc.
   ```

2. **Verify tag name**:

   ```bash
   git tag  # List all tags
   ```

   Tag should be `cli-v0.0.2`, not `v0.0.2` or `0.0.2`

3. **Create correct tag**:
   ```bash
   git tag -d wrong-tag-name  # Delete wrong tag
   git push origin :wrong-tag-name  # Delete from remote
   git tag cli-v0.0.2  # Create correct tag
   git push origin cli-v0.0.2
   ```

### Issue: Build fails in GitHub Actions

**Cause**: Missing dependencies or wrong Node version.

**Solutions:**

1. **Check Node version**:

   ```yaml
   node-version: '20' # Should match engines.node in package.json
   ```

2. **Check pnpm version**:

   ```yaml
   pnpm/action-setup@v4
     with:
       version: 10  # Should match packageManager in root package.json
   ```

3. **Check lockfile**:

   ```bash
   # Regenerate lockfile if needed
   rm pnpm-lock.yaml
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "chore: regenerate lockfile"
   ```

4. **Run locally first**:
   ```bash
   # Simulate CI environment
   rm -rf node_modules packages/*/node_modules
   pnpm install --frozen-lockfile
   pnpm build
   pnpm test
   ```

### Issue: Workflow passes but package is broken

**Cause**: Testing in CI doesn't match real-world usage.

**Solutions:**

1. **Add installation test** to workflow:

   ```yaml
   - name: Test installation
     run: |
       npm pack
       npm install -g ./rewrlution-papyrus-cli-*.tgz
       papyrus --version
   ```

2. **Add E2E tests**:
   - Test actual CLI commands
   - Test in fresh environment (Docker)
   - Test on different OSes (Windows, macOS, Linux)

### Issue: Users report "command not found"

**Cause**: Binary not executable or wrong path.

**Solutions:**

1. **Check bin field** in package.json:

   ```json
   "bin": {
     "papyrus": "./dist/cli.js"  // Path must be correct
   }
   ```

2. **Check shebang** in `dist/cli.js`:

   ```javascript
   #!/usr/bin/env node
   // ^ This line is required!
   ```

3. **Check file permissions**:

   ```bash
   chmod +x dist/cli.js
   git add dist/cli.js --chmod=+x
   ```

4. **Test installation**:
   ```bash
   npm install -g @rewrlution/papyrus-cli
   which papyrus  # Should show path like /usr/local/bin/papyrus
   ```

## Part 8: Best Practices

### 1. Version Control

**Always commit before tagging:**

```bash
# Bad
git tag cli-v0.0.2  # Tag might include uncommitted changes
git push

# Good
git status  # Check for uncommitted changes
git add .
git commit -m "chore: prepare release 0.0.2"
git push
git tag cli-v0.0.2
git push origin cli-v0.0.2
```

### 2. Changelog

Maintain a `CHANGELOG.md` in `packages/cli/`:

```markdown
# Changelog

## [0.0.2] - 2026-01-04

### Added

- Interactive journal browser with vim-style navigation
- Virtual scrolling for large journal collections

### Fixed

- Error handling in show command

### Changed

- Improved error messages
```

Update before every release. This helps users know what changed.

### 3. Pre-Release Testing

Create a checklist before each release:

- [ ] All tests pass locally
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Tested with `npm pack` locally
- [ ] Tested in clean environment (Docker)
- [ ] Breaking changes documented (if any)

### 4. Release Notes

When pushing tags, add release notes on GitHub:

1. Go to GitHub repo → "Releases"
2. Click "Create a new release"
3. Choose your tag (cli-v0.0.2)
4. Add release notes (copy from CHANGELOG)
5. Publish release

This gives users a nice UI to see what's new.

### 5. Deprecation

If you need to deprecate a version:

```bash
npm deprecate @rewrlution/papyrus-cli@0.0.1 "Deprecated. Use 0.0.2 or later."
```

Users will see a warning when installing old versions.

### 6. Security

- **Never commit secrets**: Use GitHub Secrets
- **Rotate tokens**: Update npm tokens every 6-12 months
- **Audit dependencies**: Run `pnpm audit` regularly
- **Enable 2FA**: On npm account
- **Review publish logs**: Check what got published

## Part 9: Advanced Topics

### Alpha/Beta Releases

Publish pre-release versions for testing:

```bash
# Update version
npm version prerelease --preid=alpha  # 0.0.2-alpha.0

# Publish with tag
npm publish --access public --tag alpha

# Users install with
npm install @rewrlution/papyrus-cli@alpha
```

**Why this matters**: Test breaking changes without affecting stable users.

### Multiple npm Tags

Use tags to manage release channels:

```bash
# Stable release
npm publish --access public --tag latest  # Default

# Beta release
npm publish --access public --tag beta

# Old stable (LTS)
npm publish --access public --tag lts
```

Users install specific tags:

```bash
npm install @rewrlution/papyrus-cli@beta
npm install @rewrlution/papyrus-cli@lts
```

### Automated Version Bumping

Use tools to automate versioning:

**Option 1: Conventional Commits + standard-version**

```bash
# Install
pnpm add -D standard-version

# Add script
{
  "scripts": {
    "release": "standard-version"
  }
}

# Use
pnpm release  # Automatically bumps version, updates CHANGELOG
```

**Option 2: Changesets**

```bash
# Install
pnpm add -D @changesets/cli

# Initialize
pnpm changeset init

# Add changeset
pnpm changeset  # Interactive prompts

# Bump versions
pnpm changeset version

# Publish
pnpm changeset publish
```

### Monorepo Publishing

To publish multiple packages from monorepo:

```yaml
# .github/workflows/publish-all.yml
name: Publish All Packages

on:
  push:
    tags:
      - 'v*' # Tag without prefix

jobs:
  publish-shared:
    runs-on: ubuntu-latest
    steps:
      # ... build and publish shared

  publish-cli:
    needs: publish-shared # Wait for shared
    runs-on: ubuntu-latest
    steps:
      # ... build and publish CLI
```

## Summary

**What we covered:**

1. **npm Setup** - Account, tokens, scope permissions
2. **Package Config** - package.json fields, publishing scripts
3. **GitHub Actions** - Test and publish workflows
4. **Version Management** - Semantic versioning, tags, workflow
5. **Monorepo** - Build order, workspace dependencies
6. **Testing** - Local testing, fresh environment testing
7. **Troubleshooting** - Common issues and solutions
8. **Best Practices** - Versioning, changelog, security

**Quick Reference:**

```bash
# Publish workflow
1. Update version: vim packages/cli/package.json
2. Commit: git commit -m "chore(cli): bump version to X.Y.Z"
3. Tag: git tag cli-vX.Y.Z
4. Push: git push && git push origin cli-vX.Y.Z
5. Watch: GitHub Actions → Monitor workflow
6. Verify: npm view @rewrlution/papyrus-cli
```

**Next steps:**

- Set up automated releases (Changesets or standard-version)
- Add E2E tests to CI
- Create release templates
- Set up Dependabot for dependency updates

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
