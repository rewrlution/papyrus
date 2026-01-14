# Papyrus API

A production-ready Express.js REST API for the Papyrus journaling application. Implements secure authentication, end-to-end encryption for journal entries, and follows clean architecture principles.

## Tech Stack

- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via Prisma ORM 6.19.1)
- **Validation**: Zod 4.2.1
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Encryption**: AES-256-GCM (Node native crypto)
- **Password Hashing**: bcrypt 6.0.0
- **Logging**: Winston 3.19.0
- **Email**: Resend 6.6.0 + Nodemailer 7.0.12 (dual provider)
- **API Docs**: OpenAPI 3.0 with Swagger UI
- **Testing**: Vitest + supertest
- **Build**: TypeScript compiler + tsx (dev mode)

## Project Structure

```
packages/api/
├── src/
│   ├── index.ts              # Entry point - starts server
│   ├── app.ts                # Express app factory
│   ├── setup.ts              # Environment setup
│   ├── controllers/          # HTTP handlers (thin layer)
│   │   ├── auth.controller.ts
│   │   └── journal.controller.ts
│   ├── services/             # Business logic layer
│   │   ├── auth.service.ts
│   │   └── journal.service.ts
│   ├── domain/               # Data access & transformation
│   │   ├── repositories/     # Prisma query isolation
│   │   │   ├── user.repository.ts
│   │   │   └── journal.repository.ts
│   │   └── mappers/          # DTO transformation
│   │       ├── user.mapper.ts
│   │       └── journal.mapper.ts
│   ├── routes/               # Route definitions
│   │   ├── auth.routes.ts    # /api/auth endpoints
│   │   ├── journal.routes.ts # /api/journals endpoints
│   │   └── health.routes.ts  # /health endpoint
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # JWT verification
│   │   ├── validate.ts       # Zod validation
│   │   ├── handlers.ts       # asyncHandler & error handling
│   │   └── logger.ts         # Request logging with UUID
│   ├── lib/                  # Utilities
│   │   ├── errors.ts         # Custom error classes
│   │   ├── logger.ts         # Winston setup
│   │   ├── jwt.ts            # JWT sign/verify
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── password.ts       # bcrypt utilities
│   │   └── encryption.ts     # AES-256-GCM encrypt/decrypt
│   ├── email/                # Email system
│   │   ├── services.ts       # Token generation & sending
│   │   ├── index.ts          # Provider factory
│   │   ├── resend-provider.ts
│   │   ├── nodemailer-provider.ts
│   │   ├── template.ts       # Handlebars templating
│   │   └── templates/        # HTML email templates
│   ├── env/
│   │   └── config.ts         # Zod environment validation
│   ├── swagger/              # OpenAPI documentation
│   │   ├── registry.ts       # Schema registry
│   │   ├── generator.ts      # OpenAPI doc generator
│   │   └── routes/           # Route definitions
│   └── generated/prisma/     # Auto-generated Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── tests/                    # Vitest tests
└── package.json
```

## Architecture Pattern: Layered Architecture (Clean Architecture)

The codebase follows strict layering with clear separation of concerns:

```
Routes → Controllers → Services → Repositories → Database
                ↓          ↓
          Middleware   Mappers
```

### Layer Responsibilities

1. **Routes Layer** (`src/routes/`): Define endpoints, apply middleware, wire controllers
2. **Controllers Layer** (`src/controllers/`): Extract HTTP data, call services, format responses (thin layer)
3. **Services Layer** (`src/services/`): Business logic, orchestration, error handling (no HTTP knowledge)
4. **Domain Layer** (`src/domain/`):
   - **Repositories**: All Prisma queries isolated here
   - **Mappers**: Transform entities to DTOs, hide sensitive fields
5. **Utilities** (`src/lib/`, `src/email/`): Reusable utilities (encryption, JWT, logging, etc.)

### Data Flow Example

```
POST /api/auth/signup
  → CORS middleware
  → Request logger
  → validate(signupSchema) middleware
  → AuthController.signup()
  → AuthService.signup()
  → userRepository.create()
  → emailService.sendVerificationEmail()
  → UserMapper.toUserData()
  → Response (201 Created)
```

## API Endpoints

### Authentication (`/api/auth/*`)

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login (returns JWT)
- `GET /api/auth/verify-email?token=...` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email

### Journals (`/api/journals/*`) - All require Bearer token

- `GET /api/journals` - List journals (paginated)
- `GET /api/journals/metadata` - Get all journal metadata
- `GET /api/journals/:date` - Get journal by date (YYYYMMDD)
- `POST /api/journals` - Create journal entry
- `PUT /api/journals/:date` - Update journal
- `DELETE /api/journals/:date` - Soft delete journal

### Health & Docs

- `GET /health` - Health check with DB connection test
- `GET /api-docs` - Swagger UI
- `GET /` - API info

## Security Architecture

### Authentication Flow

1. **Signup**: Email + password → bcrypt hash → Create user → Send verification email
2. **Email Verification**: Token (64 hex chars, 24h expiry) → Update verified flag
3. **Signin**: Verify password → Check email verified → Generate JWT (7 days) → Return token
4. **Protected Routes**: Require `Authorization: Bearer <token>` header

### Password Security

- Algorithm: bcrypt with 10 salt rounds
- Never exposed in responses (mappers remove passwordHash)

### Content Encryption

- Algorithm: AES-256-GCM
- All journal content encrypted at rest
- Stores: ciphertext, IV, authentication tag
- Key: 64-character hex string (ENCRYPTION_KEY env var)
- Decryption includes integrity verification

### JWT Configuration

- Algorithm: HS256
- Expiry: 7 days
- Payload: `{ userId, email }`
- Secret: JWT_SECRET (min 32 characters)

## Error Handling

### Custom Error Classes (extend ApiError)

- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)
- `InternalServerError` (500)

### Error Properties

- `statusCode`, `code`, `message`
- `isOperational` flag (true = expected error, false = programmer error)
- `details[]` array for field-level validation errors

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

## Database Schema (Prisma)

### User Model

- `id` (CUID primary key)
- `email` (unique, indexed)
- `passwordHash` (bcrypt)
- `verified` (boolean)
- `verificationToken` (unique, nullable)
- `verificationExpiry` (timestamp)
- `journals` (1:N relation)

### Journal Model

- `id` (CUID primary key)
- `date` (YYYYMMDD format)
- `hash` (SHA256 of plaintext)
- `ciphertext` (encrypted content)
- `iv` (initialization vector)
- `authTag` (GCM authentication tag)
- `createdAt`, `updatedAt`
- `deletedAt` (soft delete)
- `userId` (foreign key)
- Unique constraint: `[userId, date]` (one journal per day)
- Indexes: `userId+date`, `userId+updatedAt`, `deletedAt`

## Development Workflow

### Common Commands

```bash
# Development (watch mode)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start

# Database operations
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run migrations (dev)
pnpm prisma:studio      # Open Prisma Studio GUI
```

### Build Process

1. Run pending Prisma migrations (`prisma migrate deploy`)
2. Clean dist directory (`rimraf dist`)
3. Compile TypeScript (`tsc --build`)
4. Copy email templates to dist (`copyfiles`)

### Environment Setup

Create `.env` file in `packages/api/`:

```env
# Server
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:5173

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Security
JWT_SECRET=<min 32 characters>
ENCRYPTION_KEY=<64 hex characters>

# Email (Resend)
RESEND_API_KEY=<api key>
RESEND_FROM=noreply@example.com

# Email (SMTP fallback)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASSWORD=pass
SMTP_FROM=noreply@example.com
```

All environment variables are validated at startup with Zod schema.

## Key Conventions

### File Naming

- Routes: `<resource>.routes.ts`
- Controllers: `<resource>.controller.ts`
- Services: `<resource>.service.ts`
- Repositories: `<resource>.repository.ts`
- Mappers: `<resource>.mapper.ts`

### Code Organization

- **Repositories**: Centralize ALL Prisma queries here
- **Services**: Pure business logic, no HTTP concepts (req/res)
- **Controllers**: Thin layer - extract data, call service, send response
- **Mappers**: ALWAYS transform entities before responding (hide sensitive fields)
- **Error Classes**: Extend `ApiError` with appropriate status codes

### Data Handling

- **Encryption**: Journal content ALWAYS encrypted at rest
- **Soft Deletes**: Use `deletedAt` field for journals
- **Pagination**: Page (1-indexed), limit-based
- **Validation**: Zod schemas from `@rewrlution/papyrus-shared` package
- **Sensitive Fields**: Never expose in API responses (use mappers)

### Error Strategy

- **Validation errors**: Fast-fail with 422, include field details
- **Auth errors**: Generic 401 messages (don't reveal user existence)
- **Business errors**: Specific codes (409 Conflict, 404 Not Found, etc.)
- **Server errors**: Generic 500 in production, detailed in dev

### Middleware Order

1. CORS (allow cross-origin requests)
2. Request logger (attach UUID, log timing)
3. Body parser (JSON + URL-encoded)
4. Validation (Zod schemas via `validate()` middleware)
5. Authentication (JWT verification via `requireAuthentication()`)
6. Error handler (global catch-all)

## Testing

### Test Structure

- Location: `tests/` directory
- Framework: Vitest
- HTTP Testing: supertest
- Coverage: Environment validation, middleware, mappers

### Running Tests

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
```

## Email System

### Dual Provider Architecture

- **Primary**: Resend (modern transactional email API)
- **Fallback**: SMTP via Nodemailer (traditional)
- Provider selected based on env vars (RESEND_API_KEY vs SMTP_HOST)

### Email Features

- Handlebars templating
- Verification token generation (64 hex chars, 24h expiry)
- Email verification links with frontend URL
- Configurable from address

## API Documentation

### OpenAPI/Swagger

- Auto-generated from Zod schemas
- Available at `/api-docs`
- Registry-based approach: Routes register schemas in `src/swagger/routes/`
- Includes request/response schemas, status codes, auth requirements

## Logging

### Winston Logger

- **Level**: `debug` (dev), `info` (prod)
- **Format**: Timestamp + level + message + JSON metadata
- **Transport**: Console (extendable)
- **Context**: Per-request logger with `requestId` child

### Log Levels

- `info`: Normal operations
- `warn`: Operational errors (user mistakes)
- `error`: Programmer errors
- `debug`: Detailed debugging

## Important Patterns

### asyncHandler Wrapper

All async route handlers MUST be wrapped:

```typescript
router.post('/signup', asyncHandler(AuthController.signup));
```

This catches promise rejections and forwards to error handler.

### Repository Pattern

ALL database queries go through repositories:

```typescript
// Good
const user = await userRepository.findByEmail(email);

// Bad - DON'T query Prisma directly in services
const user = await prisma.user.findUnique({ where: { email } });
```

### Mapper Pattern

ALWAYS transform entities before responding:

```typescript
// Good
return UserMapper.toUserData(user);

// Bad - DON'T expose raw entities
return user; // Exposes passwordHash!
```

### Error Throwing

Use custom error classes:

```typescript
// Good
throw new ConflictError('Email already registered');

// Bad
throw new Error('Email already registered'); // No status code
```

## Production Considerations

### Build Requirements

- Run `pnpm build` before deploying
- Ensure all env vars are set (validated at startup)
- Run `prisma migrate deploy` for production migrations

### Security Checklist

- Never commit `.env` file
- Use strong JWT_SECRET (min 32 chars, random)
- Use random ENCRYPTION_KEY (64 hex chars)
- Configure CORS_ORIGIN (no wildcards in prod)
- Enable HTTPS in production
- Review Prisma migrations before deploying
- Ensure RLS is enabled on all tables (see [docs/database.md](./docs/database.md#row-level-security-rls))

### Row Level Security (RLS)

All tables have RLS enabled with no policies. This means:

- **PostgREST/Supabase client**: No access (blocked by RLS)
- **Service Role Key**: Full access (backend API uses this)
- **Prisma direct connection**: Full access

This ensures all data access goes through our API layer, which handles authentication and authorization. See [docs/database.md](./docs/database.md#row-level-security-rls) for details.

### Performance Tips

- Prisma client is singleton (reused across requests)
- Journal queries indexed by `userId+date`
- Pagination limits max results
- Soft deletes filtered by default

## Common Tasks

### Adding a New Endpoint

1. Define Zod schema in `@rewrlution/papyrus-shared`
2. Create repository methods if needed (src/domain/repositories/)
3. Create service method (src/services/)
4. Create controller method (src/controllers/)
5. Add route in appropriate routes file (src/routes/)
6. Register OpenAPI schema in src/swagger/routes/
7. Add tests

### Adding a New Model

1. Update `prisma/schema.prisma`
2. Run `pnpm prisma:migrate` to create migration
3. Create repository (src/domain/repositories/)
4. Create mapper (src/domain/mappers/)
5. Create service (src/services/)
6. Create controller (src/controllers/)
7. Create routes (src/routes/)

### Debugging

1. Check logs (Winston outputs to console)
2. Use `pnpm prisma:studio` to inspect database
3. Test API with `/api-docs` Swagger UI
4. Verify env vars with `src/env/config.ts`
