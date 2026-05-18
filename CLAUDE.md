# Papyrus Monorepo - Claude Development Guide

```
██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

> An AI-powered journaling system for developers. Plugin-first; CLI optional.

---

## Read first: strategic context

This repo went through a major direction change in **April 2026**. Before doing anything substantive, read:

- [`docs/product/01-STRATEGY-PIVOT-2026.md`](./docs/product/01-STRATEGY-PIVOT-2026.md) — why we moved off the SaaS-with-AI-API model and onto plugin + BYOK
- [`docs/product/02-DISTRIBUTION-AND-ONBOARDING.md`](./docs/product/02-DISTRIBUTION-AND-ONBOARDING.md) — how users discover, install, and onboard
- [`docs/product/03-SYNC-AND-PORTABILITY.md`](./docs/product/03-SYNC-AND-PORTABILITY.md) — the future MCP-server monetization story
- [`docs/architecture/monorepo-structure.md`](./docs/architecture/monorepo-structure.md) — monorepo design, open/closed source boundaries
- [`docs/architecture/plugin-distribution.md`](./docs/architecture/plugin-distribution.md) — how `@rewrlution/papyrus-core` and the plugin reach users

Anything in this file that contradicts those docs, the docs win — they are the source of truth for product strategy.

### TL;DR of the pivot

| Before                                         | After                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| CLI is the entry point                         | **Claude Code plugin** is the entry point; CLI is optional power tool  |
| API hosts AI features (standup, SSE, freemium) | **Skills** run in Claude Code with the user's own Anthropic key (BYOK) |
| Monetize AI usage                              | Free skills; future paid tier is **MCP-backed sync + cloud backup**    |
| Goal: revenue                                  | Goal: become the de-facto journaling tool for developers using Claude  |

**The stable contract across all surfaces:** `~/.local/share/papyrus/journals/YYYYMMDD.md`. Plugin skills, CLI, and any future MCP server / agent all read & write the same files.

---

## Monorepo structure

```
papyrus/                            ← public monorepo (pnpm workspaces + Turborepo)
├── packages/
│   ├── core/      @rewrlution/papyrus-core    → npm (public, MIT)
│   ├── plugin/    @rewrlution/papyrus-plugin  → Claude Code marketplace (git-subdir)
│   ├── cli/       @rewrlution/papyrus-cli     → npm (public, MIT)
│   ├── shared/    @rewrlution/papyrus-shared  → npm (public, MIT)
│   ├── api/       @rewrlution/papyrus-api     → deployed only (proprietary)
│   └── web/       @rewrlution/papyrus-web     → deployed only (proprietary)
├── docs/
│   ├── product/                    ← strategy & positioning (read first)
│   ├── architecture/               ← monorepo & plugin distribution decisions
│   ├── development/                ← contributor environment (IDE setup, etc.)
│   └── WORKLOG.md                  ← append-only major decisions
├── .github/workflows/              ← CI/CD (currently CLI-only; needs expansion)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md                       ← this file
```

Open/closed source is enforced by **what gets published**, not by which repo code lives in. `core` and `plugin` ship to the public world via npm and the Claude Code marketplace. `api` and `web` are deployed only.

### Package roles at a glance

| Package  | Role                                                                                                                                                                    | Status                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `core`   | Filesystem library underlying the plugin: `paths`, `journal`, `profile`. Each module doubles as a CLI script for skills.                                                | Built, **not yet published to npm**. Required before plugin can install end-to-end. |
| `plugin` | Thin Claude Code plugin: `.claude-plugin/plugin.json` + `skills/{hello,setup,journal,standup}/SKILL.md`.                                                                | Available on Claude Code marketplace via git-subdir.                                |
| `cli`    | TUI journal browser, offline writing, sync. AI features now live in plugin skills; the legacy `papyrus standup` command still ships but is redundant — don't extend it. | Published as `@rewrlution/papyrus-cli@0.0.10`.                                      |
| `shared` | Zod schemas + types for the CLI ↔ API contract.                                                                                                                         | Published as `@rewrlution/papyrus-shared@0.0.2`.                                    |
| `api`    | Auth + journal CRUD + sync (Express + Prisma + Postgres). Pivot scope: drop AI endpoints, freemium, usage tracking.                                                     | Built; AI infra still present in code, awaiting cleanup to match new scope.         |
| `web`    | Marketing site (Next.js, Tailwind, dark mode).                                                                                                                          | Hero/features template exists; not the product surface.                             |

Per-package details live in each package's `CLAUDE.md`:

- [`packages/core/CLAUDE.md`](./packages/core/CLAUDE.md) — filesystem library, dual-purpose CLI scripts
- [`packages/plugin/CLAUDE.md`](./packages/plugin/CLAUDE.md) — skill authoring conventions
- [`packages/cli/CLAUDE.md`](./packages/cli/CLAUDE.md) — commands, Ink components, messaging utility
- [`packages/api/CLAUDE.md`](./packages/api/CLAUDE.md) — layered architecture, sync endpoints
- [`packages/shared/CLAUDE.md`](./packages/shared/CLAUDE.md) — Zod schemas + types
- [`packages/web/CLAUDE.md`](./packages/web/CLAUDE.md) — Next.js marketing site

---

## Dependency graph

```
                 ┌──────────┐
                 │  plugin  │  (skills + manifest, no build)
                 └────┬─────┘
                      ▼
                 ┌──────────┐
                 │   core   │  (filesystem lib, CLI scripts in dist/)
                 └──────────┘

┌──────────┐                            ┌──────────┐
│   cli    │ ──────────┐    ┌────────── │   api    │
└──────────┘           ▼    ▼           └──────────┘
                   ┌──────────┐
                   │  shared  │  (Zod schemas, types)
                   └──────────┘

┌──────────┐
│   web    │  (independent — no internal deps)
└──────────┘
```

Two ecosystems coexist:

- **Plugin world** (`plugin` → `core`) — the new center of gravity. Grows over time.
- **CLI/API world** (`cli`, `api` → `shared`) — original stack. Still ships and runs.

Migration is incremental. When CLI or API need filesystem journal logic, the plan is to pull from `core` rather than reinvent it.

---

## Distribution model (important — different per package)

| Package  | Channel                                                                   | Notes                                                                             |
| -------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `core`   | npm public package, ships pre-built `dist/`                               | `dist/` is **not committed** to git; CI builds it on every release tag            |
| `plugin` | Claude Code marketplace (installs from `packages/plugin/` via git-subdir) | Marketplace points to this repo; Claude Code clones the subdirectory on install   |
| `cli`    | npm public package                                                        | Installable via `npm i -g @rewrlution/papyrus-cli` → `papyrus` / `paper` binaries |
| `shared` | npm public package                                                        | Bumped before CLI when exports change                                             |
| `api`    | Deployed to Render (Express + Prisma + Postgres)                          | Proprietary, not published                                                        |
| `web`    | Deployed (Next.js — `out/` indicates static export)                       | Proprietary, not published                                                        |

---

## Getting started

### Prerequisites

- Node.js v20+
- pnpm v10+
- Git

### Setup

```bash
git clone <repo-url>
cd papyrus
pnpm install
pnpm build          # builds shared + core first (Turborepo dep order), then cli, api, etc.
```

### Development workflows

```bash
# Watch everything in parallel (rarely what you want)
pnpm dev

# Work on the plugin locally (most common new-direction workflow)
pnpm build --filter=@rewrlution/papyrus-core
claude --plugin-dir packages/plugin

# Work on the CLI
pnpm dev --filter=@rewrlution/papyrus-cli

# Work on the API
pnpm dev --filter=@rewrlution/papyrus-api

# Work on the web marketing site
pnpm dev --filter=@rewrlution/papyrus-web
```

### Tests

```bash
pnpm test                                              # all packages
pnpm test --filter=@rewrlution/papyrus-core            # plugin foundation
pnpm test --filter=@rewrlution/papyrus-cli             # cli
pnpm test --filter=@rewrlution/papyrus-shared          # shared schemas
pnpm test --filter=@rewrlution/papyrus-api             # api
```

---

## Monorepo tools

### pnpm workspaces (`pnpm-workspace.yaml`)

```yaml
packages:
  - "packages/*"
```

- Shared `node_modules` at root
- Workspace protocol for local deps: `"@rewrlution/papyrus-core": "workspace:*"`
- Add a dep to one package: `pnpm add axios --filter=@rewrlution/papyrus-cli`

### Turborepo (`turbo.json`)

- `build` depends on `^build` → builds in correct dependency order
- `test` depends on `build` → no testing against stale dist
- Caches by content hash → skips unchanged builds
- `dev` is `cache: false, persistent: true` → for watch mode

### TypeScript project references

Each package extends `tsconfig.base.json` and declares `references` for cross-package navigation and incremental builds.

---

## CI/CD

### Current state

- `.github/workflows/test.yml` — CLI tests on PR/push, **only triggers on changes to `packages/cli` or `packages/shared`**. Doesn't see `core`, `plugin`, `api`, or `web`.
- `.github/workflows/publish.yml` — on `v*` tag: publishes `papyrus-shared` and `papyrus-cli` to npm. Does **not** publish `core` yet.

### Target state (planned, not yet built)

The plan in [`docs/architecture/monorepo-structure.md`](./docs/architecture/monorepo-structure.md) and [`docs/architecture/plugin-distribution.md`](./docs/architecture/plugin-distribution.md) calls for a release pipeline that, in order:

1. Tests + typechecks all packages
2. Builds + publishes `@rewrlution/papyrus-core` to npm — **this must happen first** because the plugin's `npm install` resolves core from the registry
3. Builds + publishes `@rewrlution/papyrus-shared` to npm
4. Builds + publishes `@rewrlution/papyrus-cli` to npm

The plugin itself ships from `packages/plugin/` in this repo via the marketplace's `git-subdir` source — no separate publish step needed.

API and web each need their own deploy workflows triggered on path-based pushes.

If you change anything in `packages/core` or `packages/plugin`, expect the existing CI to **not catch regressions** — fix CI as part of the change.

---

## Common workflows

### Adding a new skill to the plugin

1. Create `packages/plugin/skills/<skill-name>/SKILL.md` (frontmatter + instructions)
2. If the skill needs new filesystem operations, add them to `packages/core/src/` (and a CLI entry point so skills can call `node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/<module>.js`)
3. Test locally: `claude --plugin-dir packages/plugin`
4. When releasing: bump `packages/core` if its API changed, then cut release tag

### Changing shared types (CLI ↔ API)

1. Edit `packages/shared/src/schemas/...` and `pnpm build --filter=@rewrlution/papyrus-shared`
2. Update consumers (`packages/cli`, `packages/api`) in the same commit
3. Bump `packages/shared/package.json` version before tagging a release — otherwise CLI consumers see "Named export not found" errors after install

### Adding a CLI command

See [`packages/cli/CLAUDE.md`](./packages/cli/CLAUDE.md). Note: don't add new AI features to the CLI — those belong in plugin skills (per the pivot).

### Adding an API endpoint

See [`packages/api/CLAUDE.md`](./packages/api/CLAUDE.md). Note: per the pivot, AI endpoints are out of scope for the API. New API work should focus on auth + sync.

---

## Scripts reference

### Root (`package.json`)

| Script   | Command                                    |
| -------- | ------------------------------------------ |
| `build`  | `turbo run build`                          |
| `dev`    | `turbo run dev --parallel`                 |
| `test`   | `turbo run test`                           |
| `lint`   | `eslint . --ext .ts,.tsx`                  |
| `format` | `prettier --write "**/*.{ts,tsx,json,md}"` |

### Per-package

See each package's `package.json` and CLAUDE.md.

---

## Common issues

### "Cannot find module '@rewrlution/papyrus-shared'" (or `-core`)

The dependency hasn't been built. From the monorepo root:

```bash
pnpm build --filter=@rewrlution/papyrus-shared
# or
pnpm build --filter=@rewrlution/papyrus-core
```

### Plugin install from marketplace doesn't fully work yet

The `hello` skill installs and runs fine via:

```
/plugin marketplace add rewrlution/papyrus
/plugin install papyrus@rewrlution
```

The other skills (`setup`, `journal`, `standup`) depend on `@rewrlution/papyrus-core` which isn't published to npm yet. Until then, use `claude --plugin-dir packages/plugin` for local development. See [`docs/architecture/plugin-distribution.md`](./docs/architecture/plugin-distribution.md).

### Build fails with stale type errors

```bash
rm -rf packages/*/dist packages/*/tsconfig.tsbuildinfo
pnpm build
```

### "Named export not found" after installing CLI from npm

Bump `packages/shared/package.json` version before releasing the CLI when shared's exports changed. The CLI's `package.json` pins to a specific shared version; without a bump, consumers get the old shared from npm.

---

## Best practices

1. **Read the strategy docs before scoping new work.** A new "AI feature in the API" or a "new CLI subcommand" may run counter to the pivot. Confirm direction first.
2. **The journal file format is the universal interface.** Don't invent a separate data format for any new surface.
3. **Build dependencies first.** Turborepo handles this if you use the right filters.
4. **Use the workspace protocol** (`"@rewrlution/papyrus-core": "workspace:*"`) for local references; consumers outside the workspace get a real version range at publish time.
5. **Keep `core` lean.** It's the foundation of the plugin world — anything that lands there ships to npm and becomes a stability commitment.
6. **Don't add CLI-specific UI to `shared` or `core`.** Both packages are consumed by non-CLI surfaces.
7. **Bump versions deliberately.** `core`, `shared`, and `cli` are independently published. A bump in one doesn't auto-bump dependents.

---

## Quick reference

```bash
# Setup
pnpm install
pnpm build

# Plugin dev (new world)
claude --plugin-dir packages/plugin

# CLI dev (old world)
pnpm dev --filter=@rewrlution/papyrus-cli

# API dev
pnpm dev --filter=@rewrlution/papyrus-api

# Web dev
pnpm dev --filter=@rewrlution/papyrus-web

# Test all
pnpm test

# Add a dep to one package
pnpm add <pkg> --filter=@rewrlution/papyrus-<name>

# Nuke and rebuild
rm -rf node_modules packages/*/node_modules packages/*/dist
pnpm install
pnpm build
```

For package-specific workflows, see the per-package `CLAUDE.md` files.
