# `@rewrlution/papyrus-cli` — Dev Guide

CLI for writing, browsing, and syncing journal entries. Published to npm; users install with `npm i -g @rewrlution/papyrus-cli` and run as `papyrus` or `paper`.

Per the [strategy pivot](../../docs/product/01-STRATEGY-PIVOT-2026.md), the CLI is **no longer the primary entry point** — the Claude Code plugin is. The CLI exists for terminal-first users who want offline writing, a TUI browser, and cloud sync. AI features (standup generation, etc.) have moved to plugin skills; do not add new AI features here.

## Stack

- **Commander.js** — command framework (git-like subcommands)
- **Ink + React** — interactive terminal UI
- **Axios** — HTTP to the API
- **gray-matter** — markdown + YAML frontmatter for journal files
- **env-paths** — XDG-compliant cross-platform path resolution

## Dev workflow

```bash
# Watch mode (no build, instant reload)
pnpm dev --filter=@rewrlution/papyrus-cli

# Build + test
pnpm build --filter=@rewrlution/papyrus-cli
pnpm test  --filter=@rewrlution/papyrus-cli

# Try as if globally installed
cd packages/cli && pnpm build && pnpm link --global
papyrus add
papyrus app
pnpm unlink --global
```

For ad-hoc invocations during dev: `tsx src/cli.tsx <command>`.

## Layout

```
src/
├── cli.tsx                 # entry: Commander setup + command registration
├── commands/
│   ├── types.ts            # shared option types (DateOption, etc.)
│   ├── auth/               # login, logout, register
│   └── journal/            # add, amend, show, app (TUI), sync, standup
├── components/             # Ink/React components (forms, browser, viewer)
├── lib/
│   ├── api/                # axios client + interceptors
│   ├── auth/               # require-auth middleware (ensureAuthenticated)
│   ├── storage/            # XDG-based BaseStorage + Journal/Token/Config/SyncMeta stores
│   └── sync/               # hash-based three-way sync engine
└── utils/                  # date, editor, messages, text, token, alternate-screen
```

## Commands

| Group   | Command                           | Purpose                                      |
| ------- | --------------------------------- | -------------------------------------------- |
| Journal | `papyrus add [-d <date>]`         | Create entry (opens `$EDITOR`)               |
|         | `papyrus amend [-d <date>]`       | Edit existing entry                          |
|         | `papyrus show [-d <date>]`        | Pager view                                   |
|         | `papyrus app`                     | TUI browser (alternate screen, vim keys)     |
|         | `papyrus sync`                    | Hash-based three-way sync with API           |
|         | `papyrus standup [--date/--from]` | AI standup (redundant post-pivot; see below) |
| Auth    | `papyrus login`                   | JWT login (Ink form)                         |
|         | `papyrus logout`                  | Clear token                                  |
|         | `papyrus register`                | Multi-step signup form                       |

`-d` / `--date` accepts `today`, `yesterday`, or `YYYYMMDD` — parsed by `utils/date.ts`.

> `papyrus standup` predates the pivot. The supported standup flow is now `/papyrus:standup` in Claude Code. Don't extend the CLI version; it stays for backward compat until removal.

## Conventions

### Messaging — `msg` vs Ink

Two strategies, picked by command shape:

- **`utils/messages.ts`** (`msg.success`, `msg.error`, `msg.info`, …) — for transactional commands. Instant output, consistent icons, `msg.error()` exits with code 1.
- **Ink components** — for stateful / multi-step / streaming flows (login form, sync progress, journal browser, standup stream).

Same icon vocabulary across both (`✅` `❌` `ℹ️` `⚠️` `💡` `📊` `✨`). Always single `\n` padding, no `marginTop`/`marginBottom`.

### Auth

Authenticated commands call `ensureAuthenticated()` from `lib/auth/require-auth.ts`. This validates token existence + expiration; on failure it prints a consistent error via `msg.error()` and exits. Don't roll your own auth check.

### Storage

All persistent state goes through `lib/storage/` — never raw `fs`. Storage classes follow XDG via `env-paths`:

| Linux                     | macOS                                    | Windows                        |
| ------------------------- | ---------------------------------------- | ------------------------------ |
| `~/.local/share/papyrus/` | `~/Library/Application Support/papyrus/` | `%LOCALAPPDATA%\papyrus\Data\` |
| `~/.config/papyrus/`      | `~/Library/Preferences/papyrus/`         | `%APPDATA%\papyrus\Config\`    |

Journal format (markdown + YAML frontmatter) is the stable interface across CLI / plugin / future agents. The format is documented in [`docs/ARCHITECTURE-JOURNAL-STORAGE.md`](./docs/ARCHITECTURE-JOURNAL-STORAGE.md). When the CLI and plugin disagree on file shape, the plugin (via `@rewrlution/papyrus-core`) is canonical.

### Sync

Hash-based three-way comparison (local hash, remote hash, last-synced hash). Detects upload, download, conflict per file. See [`docs/sync.md`](./docs/sync.md) for the algorithm.

### API client

`lib/api/api-client.ts` is an Axios instance with:

- Request interceptor that injects the JWT
- 90s timeout to cover Render free-tier cold starts (`docs/cold-start-handling.md`)
- Response interceptor for 401 handling

Use shared Zod types from `@rewrlution/papyrus-shared` — don't redeclare request/response shapes.

## Releasing

Bump `package.json` version, push a tag, CI publishes to npm. See [`docs/RELEASE-WORKFLOW.md`](./docs/RELEASE-WORKFLOW.md).

**If you touched `packages/shared/src/`**, bump shared's version too before tagging — CLI consumers install shared from npm and a missed bump produces `SyntaxError: Named export 'X' not found` after publish. Root [`CLAUDE.md`](../../CLAUDE.md) covers this in detail.

## Reference docs

Kept short and factual; deleted the old tutorial walkthroughs that duplicated this file.

- [`docs/ARCHITECTURE-JOURNAL-STORAGE.md`](./docs/ARCHITECTURE-JOURNAL-STORAGE.md) — why markdown + YAML frontmatter
- [`docs/sync.md`](./docs/sync.md) — three-way sync algorithm
- [`docs/cold-start-handling.md`](./docs/cold-start-handling.md) — `ColdStartAwareSpinner` pattern for Render cold starts
- [`docs/token-expiration-handling.md`](./docs/token-expiration-handling.md) — JWT expiry strategies
- [`docs/path_resolution.md`](./docs/path_resolution.md) — how `papyrus` vs `paper` bin names resolve via `PATH`
- [`docs/RELEASE-WORKFLOW.md`](./docs/RELEASE-WORKFLOW.md) — tag + npm publish flow
