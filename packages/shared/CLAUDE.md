# `@rewrlution/papyrus-shared` — Dev Guide

Zod schemas + inferred TypeScript types for the CLI ↔ API contract. Also a few small utilities (content hashing). Published to npm; consumed by `papyrus-cli` and `papyrus-api`.

## What lives here

```
src/
├── schemas/
│   ├── auth/         # signup, signin inputs + responses
│   ├── journal/      # journal CRUD inputs + responses
│   ├── common/       # date string, user, journal, params, generic response
│   └── zod.ts        # re-export of z so consumers don't pin Zod separately
└── utils/
    └── hash.ts       # generateContentHash (SHA-256) for sync
```

## Conventions

**Source of truth is the schema, not the type.** Always:

```ts
export const FooSchema = z.object({ ... });
export type Foo = z.infer<typeof FooSchema>;
```

Never declare a separate TS type that mirrors a schema — it drifts.

**Schemas decorate with `.openapi()`** so the API can generate Swagger docs from them via `@asteasolutions/zod-to-openapi`. Keep the openapi description short and consumer-facing.

**Validation errors are user-facing.** Use `.refine()` with messages a CLI user or API caller can read, not internal jargon.

## Versioning — bump it deliberately

This package is published to npm. The CLI's `package.json` pins it. **If you change `src/`, bump `package.json` before cutting a release tag.** Otherwise the publish workflow skips it (the version already exists on npm) and CLI users get:

```
SyntaxError: Named export 'NewSchema' not found
```

This is the single most likely way to break a CLI release. Root [`CLAUDE.md`](../../CLAUDE.md) reinforces this.

## Dev workflow

```bash
pnpm dev   --filter=@rewrlution/papyrus-shared      # tsc --watch
pnpm build --filter=@rewrlution/papyrus-shared
pnpm test  --filter=@rewrlution/papyrus-shared
```

## Subpath exports

Consumers can import from `./` or from `./schemas` / `./utils`. Keep these aligned with `package.json` `exports`. Don't add new subpaths without updating both `package.json` and the consumers.

## Reference

- [`docs/api-response-design.md`](./docs/api-response-design.md) — why we landed on the 4-schema response shape after several iterations
