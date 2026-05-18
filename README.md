```
██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

> AI-powered journaling for developers. Plugin-first; CLI optional.

Papyrus turns the journal you already write into the inputs for promotion docs, resume bullets, standup notes, and interview stories. The journaling habit is the product; everything else is access infrastructure on top of plain markdown files in `~/.local/share/papyrus/journals/`.

## Get started

The primary entry point is a Claude Code plugin:

```
/plugin marketplace add rewrlution/papyrus
/plugin install papyrus@rewrlution
/papyrus:setup
```

After setup, run `/papyrus:journal` at the end of your workday and `/papyrus:standup` before standup. The career skills (resume / promotion / interview) get better as your journal history grows.

> **Status (May 2026):** Only `/papyrus:hello` works end-to-end via the marketplace today. `setup`, `journal`, and `standup` depend on `@rewrlution/papyrus-core`, which isn't published to npm yet. Until then, use `claude --plugin-dir packages/plugin` for local development. Tracking in [`docs/architecture/plugin-distribution.md`](./docs/architecture/plugin-distribution.md).

Prefer the terminal? The CLI is optional but supported:

```
npm install -g @rewrlution/papyrus-cli
papyrus add        # write today's entry
papyrus app        # TUI browser
```

CLI and plugin write to the same files — mix freely.

## This repo

Public monorepo. The plugin ships from `packages/plugin/` via the Claude Code marketplace; the CLI and core library publish to npm.

| Package                                | What it is                                 | Distribution                         |
| -------------------------------------- | ------------------------------------------ | ------------------------------------ |
| [`packages/plugin`](./packages/plugin) | Claude Code skills (`/papyrus:*`)          | Claude Code marketplace (git-subdir) |
| [`packages/core`](./packages/core)     | Filesystem library underpinning the plugin | npm — `@rewrlution/papyrus-core`     |
| [`packages/cli`](./packages/cli)       | TUI journal browser, sync, offline writing | npm — `@rewrlution/papyrus-cli`      |
| [`packages/shared`](./packages/shared) | Zod schemas + types (CLI ↔ API contract)   | npm — `@rewrlution/papyrus-shared`   |
| [`packages/api`](./packages/api)       | Sync backend (Express + Postgres)          | Deployed only                        |
| [`packages/web`](./packages/web)       | Marketing site                             | Deployed only                        |

## Docs

- **Strategy & product direction** — [`docs/product/`](./docs/product) (start here for context on why the codebase looks the way it does)
- **Architecture decisions** — [`docs/architecture/`](./docs/architecture)
- **Worklog** — [`docs/WORKLOG.md`](./docs/WORKLOG.md)
- **Per-package guides** — each package has a `CLAUDE.md` covering its conventions

If you're working in this repo with Claude Code, [`CLAUDE.md`](./CLAUDE.md) is the orchestrator that ties everything together.

## License

MIT for public packages (`core`, `plugin`, `cli`, `shared`). `api` and `web` are deployed-only and proprietary.
