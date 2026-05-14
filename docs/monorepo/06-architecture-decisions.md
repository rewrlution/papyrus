# Architecture Decisions

> Key decisions about the monorepo structure, open/closed source boundaries, and distribution strategy.
> Written April 2026. Add to this as major decisions are made.

---

## Public monorepo strategy

Claude Code installs plugins by cloning a Git repository — there is no compiled artifact distribution, just the repo itself. For users to install the plugin, it must be **publicly accessible**.

The monorepo is **public**. `packages/plugin/` is distributed directly to Claude Code marketplace using the `git-subdir` source type in `marketplace.json`. This points users directly to `packages/plugin/` in this repo, eliminating the need for a separate mirror repo.

**Installation flow:**

- Users run `/plugin marketplace add rewrlution/papyrus`
- Claude Code fetches `.claude-plugin/marketplace.json` at the repo root
- The manifest points to `packages/plugin` using `git-subdir`
- Claude Code clones the subdirectory and installs the plugin
- Users run `/plugin install papyrus@rewrlution-papyrus`

All plugin development happens in `papyrus/packages/plugin/` in this monorepo. Users interact directly with this repo — no mirror needed.

---

## Monorepo structure

Everything lives in one public monorepo. Open/closed boundaries are enforced by what gets **published**, not by directory structure.

```
papyrus/                          ← public monorepo (pnpm workspaces + Turborepo)
├── packages/
│   ├── core/                     ← published to npm (@rewrlution/papyrus-core)
│   ├── plugin/                   ← installed from marketplace.json (git-subdir)
│   ├── cli/                      ← published to npm (@rewrlution/papyrus-cli)
│   ├── shared/                   ← published to npm (@rewrlution/papyrus-shared)
│   ├── api/                      ← deployed, never published (closed source)
│   └── web/                      ← deployed, never published (closed source)
```

**Why one repo:** Atomic commits across packages, shared tooling (ESLint, Prettier, TypeScript), easier to track dependencies, no cross-repo PR coordination.

**Public for plugin distribution:** The plugin must be publicly accessible for Claude Code to install it. Making the entire monorepo public is simpler than maintaining a separate mirror. The downside (api/web source visible) is outweighed by simplicity. Users who need closed-source APIs/web can be served via deployment, not source distribution.

---

## Open / closed source boundary

| Package  | Published                        | License     | Why                                                                           |
| -------- | -------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `core`   | npm (public)                     | MIT         | Foundation of the plugin ecosystem — must be open for trust and extensibility |
| `plugin` | Claude Code marketplace (public) | MIT         | Primary distribution channel — must be open and installable                   |
| `cli`    | npm (public)                     | MIT         | Open source builds trust for a tool that reads private journals               |
| `shared` | npm (public)                     | MIT         | Shared types for CLI/API contract — needed by open packages                   |
| `api`    | Deployed only                    | Proprietary | Sync backend — the monetized layer, no reason to open                         |
| `web`    | Deployed only                    | Proprietary | Marketing + account management                                                |

---

## Two worlds, one repo

The monorepo is currently in a migration phase. There are two distinct ecosystems:

**World 1 — original stack:** `cli`, `api`, `shared`, `web`
These packages have their own evolution. `shared` contains types driven by the CLI/API contract (Zod schemas, auth types). These are not changed during the plugin migration.

**World 2 — plugin ecosystem:** `plugin`, `core`
`core` is the foundation of the plugin world. It contains the filesystem logic (path resolution, journal read/write, profile read/write) that skills depend on. As the plugin grows, `core` grows. Over time, if the CLI or API want to consume journal logic, they pull from `core` rather than reinventing it. The plugin ecosystem is the long-term center of gravity.

The two worlds coexist without interfering. Migration is incremental.

---

## Distribution story

### `@rewrlution/papyrus-core` (npm)

- Published to npm as a public package
- `dist/` is included in the npm artifact via `"files": ["dist"]` in package.json
- `dist/` is **not committed to git** — CI builds and publishes it
- Each module has a CLI entry point: `node dist/profile.js read` works as a script
- Plugin skills call core scripts via: `node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js`

### `packages/plugin` (Claude Code marketplace)

- Distributed via Claude Code plugin marketplace
- `package.json` depends on `@rewrlution/papyrus-core` (from npm in production, `workspace:*` in dev)
- When Claude Code installs the plugin, `npm install` pulls core from npm (pre-built, dist/ included)
- No postinstall build step needed — core's dist/ comes with the npm package
- Skills call `node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/<module>.js`

### CI/CD pipeline (planned)

On release tag (`v*`):

1. Test all packages
2. Typecheck all packages
3. Build `packages/core` → `dist/`
4. Publish `@rewrlution/papyrus-core` to npm ← must happen before plugin packaging
5. Build `packages/cli` → `dist/`
6. Publish `@rewrlution/papyrus-cli` to npm
7. Publish `packages/plugin` to Claude Code marketplace

Order matters: core must be on npm before the plugin is published, because when users install the plugin, `npm install` resolves core from npm.

### Development workflow

```bash
pnpm install          # links workspace packages
pnpm build            # builds core first (Turborepo dependency order), then others
claude --plugin-dir packages/plugin   # test skills locally
```

---

## Package manager decision

- **pnpm** for the monorepo — workspaces, Turborepo integration, disk efficiency across packages
- **npm-compatible** for distribution — plugin's `package.json` uses standard npm scripts so Claude Code can run `npm install` without pnpm being installed on the user's machine
