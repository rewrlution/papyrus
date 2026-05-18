# `@rewrlution/papyrus-core` — Dev Guide

The filesystem foundation of the plugin world. Owns path resolution, journal read/write, and profile read/write. Plugin skills and the CLI both depend on this — no journal/profile/path logic should live anywhere else.

> If anything below contradicts [`docs/architecture/monorepo-structure.md`](../../docs/architecture/monorepo-structure.md) or [`docs/architecture/plugin-distribution.md`](../../docs/architecture/plugin-distribution.md), those docs win.

## What's in here

```
src/
├── paths.ts     # PATHS constant + OS-specific resolution via env-paths
├── journal.ts   # read/write/list journal entries (markdown + YAML frontmatter)
├── profile.ts   # read/write/exists for the career profile
└── index.ts     # re-exports
```

Every module is **dual-purpose**: importable as a library, and runnable as a CLI script. The CLI shape is what plugin skills consume.

## Dual-purpose modules

Each module ends with this idiom so `node dist/<module>.js` works:

```ts
if (process.argv[1] === new URL(import.meta.url).pathname) {
  // CLI behavior — parse argv, write JSON to stdout
}
```

**Convention:** CLI commands write JSON to stdout. Skills parse the JSON. Don't print human-readable text — it's for AI consumption.

**Convention:** Errors exit with non-zero status and write `{"error": "<message>"}` to stdout (not stderr). Skills can inspect the JSON either way.

## How the plugin consumes this

In production (plugin installed from marketplace), the plugin's `node_modules/@rewrlution/papyrus-core/dist/` resolves to the **published npm artifact**. Skills call:

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js list
```

In dev (`claude --plugin-dir packages/plugin`), pnpm workspaces link this package, so `dist/` is your local build. Run `pnpm build --filter=@rewrlution/papyrus-core` after changing source.

## Adding a new module

1. Add `src/<module>.ts` with a public API plus a CLI dispatch at the bottom.
2. Add an `exports` entry in `package.json` so consumers can `import { x } from '@rewrlution/papyrus-core/<module>'`.
3. Add tests in `tests/<module>.test.ts`.
4. Update the plugin skills that need it — they'll call `node dist/<module>.js`.

## Versioning

This package is published to npm, and the plugin's `package.json` pins it. **Bump the version before cutting a release tag** when you change the public API or the CLI argv contract. The plugin's marketplace install resolves core from npm — not from this workspace — so a forgotten bump means users get the old version.

`dist/` is **not committed**. CI builds it on release. See [`docs/architecture/plugin-distribution.md`](../../docs/architecture/plugin-distribution.md) for the full publish flow.

## Stability commitment

This is the public surface of the plugin ecosystem. Treat it like one:

- Don't change the JSON shape of CLI output without bumping the major version
- Don't move the `PATHS` constants without a migration story
- Keep dependencies minimal (currently `env-paths` + `gray-matter`)
