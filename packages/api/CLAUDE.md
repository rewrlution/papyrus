# `@rewrlution/papyrus-api` — Dev Guide

Express REST API for the Papyrus journaling system. Handles auth, encrypted journal CRUD, and sync. Deployed to Render; never published to npm.

> Per the [strategy pivot](../../docs/product/01-STRATEGY-PIVOT-2026.md), this service is now **auth + sync only**. AI features (the `/api/ai/standup` endpoint, freemium usage tracking, payments) moved to Claude Code plugin skills with BYOK. AI source code may still be present in `src/controllers/ai/`, `src/services/ai/`, `src/routes/ai/`, and `src/lib/ai/`, awaiting cleanup — do not extend it. The forward path is in [`docs/product/03-SYNC-AND-PORTABILITY.md`](../../docs/product/03-SYNC-AND-PORTABILITY.md) (sync → MCP server).

## Stack

Express 5, TypeScript, Prisma + PostgreSQL, Zod (validation + OpenAPI generation), JWT (jsonwebtoken), bcrypt, AES-256-GCM (Node `crypto`), Winston, Vitest + supertest. Email via Resend (primary) + Nodemailer/SMTP (fallback).

## Layout

```
src/
├── index.ts                  # entry — starts server
├── app.ts                    # Express app factory
├── controllers/              # thin HTTP layer (auth, journal; ai/ legacy)
├── services/                 # business logic, no HTTP knowledge
├── domain/
│   ├── repositories/         # all Prisma queries live here
│   └── mappers/              # entity → DTO (hides sensitive fields)
├── routes/                   # endpoint definitions + middleware wiring
├── middleware/               # auth (JWT), validate (Zod), handlers, logger
├── lib/                      # errors, logger, jwt, prisma, password, encryption
├── email/                    # Resend + Nodemailer providers, Handlebars templates
├── env/config.ts             # Zod-validated env (fails fast at boot)
├── swagger/                  # OpenAPI generator from Zod schemas
└── generated/prisma/         # auto-generated Prisma client
prisma/                       # schema.prisma + migrations
tests/                        # Vitest + supertest
```

## Architecture: layered

```
Routes → Controllers → Services → Repositories → Database
                ↓          ↓
          Middleware   Mappers
```

- **Routes** define endpoints + wire middleware. No logic.
- **Controllers** extract HTTP data, call a service, format response. Thin.
- **Services** own business logic. No `req`/`res`. Throw `ApiError` subclasses.
- **Repositories** own _all_ Prisma queries. Services never touch `prisma.*` directly.
- **Mappers** transform entities → DTOs. Always run before responding — never expose raw entities (passwordHash, tokens, etc.).

## Endpoints

| Path                                 | Auth   | Purpose                                                 |
| ------------------------------------ | ------ | ------------------------------------------------------- |
| `POST /api/auth/signup`              | —      | Email + password registration, sends verification email |
| `POST /api/auth/signin`              | —      | Returns JWT (7-day expiry)                              |
| `GET  /api/auth/verify-email?token=` | —      | Marks user verified                                     |
| `POST /api/auth/resend-verification` | —      | Resends verification email                              |
| `GET  /api/journals`                 | Bearer | List (paginated)                                        |
| `GET  /api/journals/metadata`        | Bearer | All journal metadata                                    |
| `GET  /api/journals/:date`           | Bearer | Read one (YYYYMMDD)                                     |
| `POST /api/journals`                 | Bearer | Create                                                  |
| `PUT  /api/journals/:date`           | Bearer | Update                                                  |
| `DELETE /api/journals/:date`         | Bearer | Soft delete                                             |
| `/api/ai/*`                          | Bearer | ⚠️ Legacy — do not extend                               |
| `GET /health`                        | —      | DB connection check                                     |
| `GET /api-docs`                      | —      | Swagger UI                                              |

## Conventions

### Patterns to follow

- **`asyncHandler` wraps every async route** — without it, rejected promises don't reach the error middleware.
- **Repositories only touch Prisma** — `prisma.*` outside `src/domain/repositories/` is a code smell.
- **Mappers run before responding** — `return user;` is a bug; `return UserMapper.toUserData(user);` is correct.
- **Throw `ApiError` subclasses, never raw `Error`** — `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ValidationError`, `InternalServerError`. They carry status code, error code, and `details[]` for field errors.
- **Validation schemas live in `@rewrlution/papyrus-shared`** — don't redeclare request shapes here.

### File naming

`<resource>.routes.ts`, `<resource>.controller.ts`, `<resource>.service.ts`, `<resource>.repository.ts`, `<resource>.mapper.ts`.

### Middleware order

CORS → request logger → body parser → validation → auth → handler → error handler.

### Security

- Journal content always encrypted at rest (AES-256-GCM; key in `ENCRYPTION_KEY`, 64 hex chars).
- Passwords bcrypt-hashed (10 rounds), never in responses.
- JWT HS256, 7-day expiry, payload `{ userId, email }`, secret in `JWT_SECRET` (min 32 chars).
- All tables have RLS enabled with no policies — DB access goes exclusively through our API. See [`docs/database.md`](./docs/database.md) for the full RLS story.

## Dev workflow

```bash
pnpm dev --filter=@rewrlution/papyrus-api     # tsx watch
pnpm test --filter=@rewrlution/papyrus-api    # vitest
pnpm build --filter=@rewrlution/papyrus-api   # pure compile (no DB needed)
pnpm --filter=@rewrlution/papyrus-api db:migrate    # apply pending migrations to DATABASE_URL
```

`build` is intentionally DB-free. Migrations are a separate `db:migrate` script so local builds / pre-commit hooks don't need a live database. The Render deploy pipeline calls them as explicit consecutive steps — see [`docs/deployment.md`](./docs/deployment.md).

When you change `prisma/schema.prisma`:

1. Run `pnpm --filter=@rewrlution/papyrus-api prisma:migrate` (creates the migration SQL and applies it to your dev DB)
2. Commit `prisma/migrations/<timestamp>_*/` and the updated `schema.prisma` together
3. Render runs `db:migrate` on deploy and applies the new migration to prod

`.env` must define `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, and either `RESEND_API_KEY` or the `SMTP_*` family. Env is Zod-validated at startup; the server refuses to boot on missing/malformed values.

## Reference docs

- [`docs/database.md`](./docs/database.md) — schema design, naming, RLS
- [`docs/deployment.md`](./docs/deployment.md) — Render setup, full Build / Start command breakdown
- [`docs/encryption_strategy.md`](./docs/encryption_strategy.md) — AES-256-GCM choice and key-rotation tradeoffs
- [`docs/email.md`](./docs/email.md) — Resend / SMTP dual provider details
- [`docs/logging.md`](./docs/logging.md) — Winston conventions
- [`docs/custom-domain.md`](./docs/custom-domain.md) — Porkbun + Render DNS
- [`docs/sync/`](./docs/sync) — full design + implementation plan for the sync system (relevant to the MCP-server monetization path)
