# Plugin Distribution

> How `@rewrlution/papyrus-core` gets to npm, how the plugin consumes it, and how the whole thing lands in the Claude Code marketplace.
> Written April 2026.

---

## The three moving parts

```
papyrus/packages/core/     →  npm (@rewrlution/papyrus-core)
                                        ↓
papyrus-plugin/            →  Claude Code marketplace
  package.json depends on @rewrlution/papyrus-core
  skills call node_modules/@rewrlution/papyrus-core/dist/*.js
```

1. **`packages/core`** — TypeScript library. Built to `dist/`, published to npm. Ships with pre-built JS so consumers never need a build step.
2. **`papyrus-plugin`** — The public plugin repo. No TypeScript, no build tooling. Just SKILL.md files and a `package.json` that depends on core.
3. **Claude Code marketplace** — Where users discover and install the plugin. Points to `papyrus-plugin` on GitHub.

---

## 1. How `@rewrlution/papyrus-core` gets to npm

### What core ships

`packages/core/package.json` has `"files": ["dist"]`. This means when published, npm includes only the compiled JS — not the TypeScript source, not test files, not devDependencies.

When anyone runs `npm install @rewrlution/papyrus-core`, they get:

```
node_modules/@rewrlution/papyrus-core/
├── dist/
│   ├── index.js       ← library entry point
│   ├── journal.js     ← CLI entry: node dist/journal.js list
│   ├── profile.js     ← CLI entry: node dist/profile.js read
│   ├── paths.js
│   └── *.d.ts         ← type declarations
└── package.json
```

Each module doubles as a CLI script — skills call them with `node dist/journal.js <command>`.

### CI/CD for publishing core

Core is published from the `papyrus` monorepo on every release tag (`v*`). The workflow:

1. Run tests for `packages/core`
2. Build core: `pnpm build --filter=@rewrlution/papyrus-core` → produces `dist/`
3. Publish to npm: `pnpm publish --filter=@rewrlution/papyrus-core --access public --no-git-checks`

**`dist/` is never committed to git.** It lives only in the npm artifact. CI builds it fresh on every release.

Add this to `.github/workflows/publish.yml` (extend the existing workflow):

```yaml
- name: Build core
  run: pnpm build --filter=@rewrlution/papyrus-core

- name: Publish core to npm
  run: pnpm publish --filter=@rewrlution/papyrus-core --access public --no-git-checks
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Order matters:** core must be published before the plugin is pushed to the marketplace, because when users install the plugin, `npm install` resolves core from npm.

### Bumping core versions

Before cutting a release tag:

```bash
cd packages/core
npm version patch   # or minor / major
```

If `packages/shared` exports changed, bump that too. The `packages/plugin` SKILL.md files do not need version bumps — they call core by path, not by version.

---

## 2. How `papyrus-plugin` consumes core

### What papyrus-plugin looks like

`papyrus-plugin` is a thin wrapper — SKILL.md files and a `package.json`. No TypeScript, no build tools.

```
papyrus-plugin/
├── .claude-plugin/
│   ├── plugin.json        ← plugin manifest
│   └── marketplace.json   ← marketplace manifest
├── skills/
│   ├── papyrus-setup/SKILL.md
│   ├── papyrus-journal/SKILL.md
│   └── papyrus-standup/SKILL.md
└── package.json
```

`package.json`:

```json
{
  "name": "papyrus-plugin",
  "version": "0.1.0",
  "dependencies": {
    "@rewrlution/papyrus-core": "^0.1.0"
  }
}
```

No `devDependencies`. No `postinstall`. No `tsup`. No `src/`.

### Install flow

When Claude Code installs the plugin from the marketplace:

1. Clones `papyrus-plugin` from GitHub
2. Runs `npm install`
3. npm resolves `@rewrlution/papyrus-core` from the registry
4. Downloads the npm artifact — which includes `dist/` pre-built
5. `node_modules/@rewrlution/papyrus-core/dist/` is now available

### How skills call core

Every skill uses `${CLAUDE_PLUGIN_ROOT}` — the absolute path to the installed plugin directory. From there, core is always at `node_modules/@rewrlution/papyrus-core/dist/`.

```bash
# List journal entries
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js list

# Read today's entry
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js read 20260421

# Write an entry
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js write 20260421 '<content>'

# Check profile
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js exists

# Print version
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/version.js
```

---

## 3. How to publish to the Claude Code marketplace

### One-time setup

The marketplace is registered once per user. Users run this inside a Claude Code session:

```
/plugin marketplace add rewrlution/papyrus-plugin
```

Claude Code fetches `.claude-plugin/marketplace.json` from the GitHub repo and registers it.

Then to install the plugin:

```
/plugin install papyrus@rewrlution-papyrus-plugin
```

This is a one-time step. The plugin persists across all sessions, saved to `~/.claude/plugins/installed_plugins.json`.

### Marketplace manifest

`.claude-plugin/marketplace.json` tells Claude Code what plugins the repo contains:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "papyrus-plugin",
  "description": "AI-powered career coaching from your developer journals",
  "owner": {
    "name": "rewrlution"
  },
  "plugins": [
    {
      "name": "papyrus",
      "description": "AI-powered career coaching from your developer journals",
      "category": "productivity",
      "source": {
        "source": "url",
        "url": "https://github.com/rewrlution/papyrus-plugin.git"
      },
      "homepage": "https://github.com/rewrlution/papyrus-plugin"
    }
  ]
}
```

### Plugin manifest

`.claude-plugin/plugin.json` identifies the plugin itself and is used by Claude Code to register skills:

```json
{
  "name": "papyrus",
  "description": "AI-powered career coaching from your developer journals",
  "version": "0.1.0"
}
```

Skills are auto-discovered from `skills/<name>/SKILL.md`. They are registered as `/papyrus:papyrus-setup`, `/papyrus:papyrus-journal`, `/papyrus:papyrus-standup`.

### Future: Official Anthropic marketplace

When ready, submit to the official marketplace via the Anthropic submission form. After one-time approval, users can install with just `/plugin install papyrus` from the built-in marketplace — no `marketplace add` step needed.

---

## Current state vs target state

|                                   | Current                             | Target                                                  |
| --------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| `@rewrlution/papyrus-core` on npm | ✗ Not published                     | ✓ Published with dist/                                  |
| `papyrus-plugin` dependencies     | Has own src/lib/, tsup, postinstall | Only depends on core from npm                           |
| Skills path                       | `dist/lib/version.js` (own build)   | `node_modules/@rewrlution/papyrus-core/dist/version.js` |
| Plugin install                    | Broken (core not on npm)            | Works end-to-end                                        |

### What needs to happen before plugin works end-to-end

1. Publish `@rewrlution/papyrus-core` to npm (set up npm account + NPM_TOKEN, cut a release tag)
2. Strip `papyrus-plugin` back to just skills + package.json depending on core
3. Update skill paths from `dist/lib/` → `node_modules/@rewrlution/papyrus-core/dist/`
4. These skill paths already exist correctly in `packages/plugin` in the monorepo — `papyrus-plugin` should mirror that

---

## Local development

During development, use the local path — no install needed:

```bash
claude --plugin-dir /path/to/papyrus/packages/plugin
```

Turborepo links `@rewrlution/papyrus-core` via workspace, so `node_modules/@rewrlution/papyrus-core/dist/` is built locally by `pnpm build`.
