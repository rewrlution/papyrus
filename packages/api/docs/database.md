# Database Design and Naming Conventions

This document outlines the database design principles, naming conventions, and migration strategies for the Papyrus API.

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [Schema Mapping Strategy](#schema-mapping-strategy)
- [Migration Best Practices](#migration-best-practices)
- [Current Schema Design](#current-schema-design)

## Naming Conventions

### PostgreSQL Best Practices

Following industry-standard PostgreSQL conventions:

#### Table Names

- **Use snake_case**: `users`, `journals`, `ai_usage`
- **Use plural forms**: `users` (not `user`), `journals` (not `journal`)
- **Lowercase only**: PostgreSQL is case-insensitive but lowercases identifiers
- **Descriptive**: Clearly indicate what the table contains

#### Column Names

- **Use snake_case**: `created_at`, `password_hash`, `user_id`
- **Be descriptive**: `verification_token` (not `token`), `auth_tag` (not `tag`)
- **Consistent suffixes**:
  - `_at` for timestamps: `created_at`, `updated_at`, `deleted_at`
  - `_id` for foreign keys: `user_id`
  - `_hash` for hashed values: `password_hash`

#### Indexes

- **Descriptive names**: `users_email_idx`, `journals_user_id_date_idx`
- **Include table and column names**: Makes debugging easier
- **Use `_idx` suffix**: Clearly identifies as index

### Why These Conventions Matter

1. **Consistency**: Easier to predict table/column names
2. **Readability**: SQL queries are more readable with snake_case
3. **Tooling**: Most PostgreSQL tools expect these conventions
4. **Team collaboration**: Standard conventions reduce onboarding time
5. **Cross-database compatibility**: Many databases follow similar patterns

### Examples

**Good:**

```sql
SELECT u.email, j.created_at
FROM users u
JOIN journals j ON j.user_id = u.id
WHERE u.verified = true;
```

**Bad (mixed conventions):**

```sql
SELECT u.email, j.createdAt
FROM User u
JOIN Journal j ON j.userId = u.id
WHERE u.verified = true;
```

## Schema Mapping Strategy

### Prisma Field Mapping

Prisma uses `@map` and `@@map` attributes to bridge the gap between:

- **Application code**: TypeScript/JavaScript camelCase conventions
- **Database schema**: PostgreSQL snake_case conventions

#### `@map` - Field-Level Mapping

Maps a Prisma field name to a database column name:

```prisma
model User {
  createdAt DateTime @default(now()) @map("created_at")
  //   ↑                                        ↑
  //   TypeScript field name                    Database column name
}
```

**Usage in code:**

```typescript
// TypeScript - camelCase
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: 'hashed...', // camelCase in code
    createdAt: new Date(),
  },
});
```

**Actual SQL generated:**

```sql
-- PostgreSQL - snake_case
INSERT INTO users (email, password_hash, created_at)
VALUES ('user@example.com', 'hashed...', NOW());
```

#### `@@map` - Model-Level Mapping

Maps a Prisma model name to a database table name:

```prisma
model AiUsage {
  // fields...

  @@map("ai_usage")
  //      ↑
  //      Database table name
}
```

**Usage in code:**

```typescript
// TypeScript - PascalCase model
const usage = await prisma.aiUsage.findMany();
```

**Actual SQL generated:**

```sql
-- PostgreSQL - snake_case
SELECT * FROM ai_usage;
```

### Mapping All Fields in Papyrus

For consistency, we apply these mappings across all models:

| Prisma Field         | Database Column       | Mapping Required                 |
| -------------------- | --------------------- | -------------------------------- |
| `passwordHash`       | `password_hash`       | ✅ `@map("password_hash")`       |
| `createdAt`          | `created_at`          | ✅ `@map("created_at")`          |
| `updatedAt`          | `updated_at`          | ✅ `@map("updated_at")`          |
| `deletedAt`          | `deleted_at`          | ✅ `@map("deleted_at")`          |
| `userId`             | `user_id`             | ✅ `@map("user_id")`             |
| `authTag`            | `auth_tag`            | ✅ `@map("auth_tag")`            |
| `verificationToken`  | `verification_token`  | ✅ `@map("verification_token")`  |
| `verificationExpiry` | `verification_expiry` | ✅ `@map("verification_expiry")` |

| Prisma Model | Database Table | Mapping Required       |
| ------------ | -------------- | ---------------------- |
| `User`       | `users`        | ✅ `@@map("users")`    |
| `Journal`    | `journals`     | ✅ `@@map("journals")` |
| `AiUsage`    | `ai_usage`     | ✅ `@@map("ai_usage")` |

### Benefits of Mapping

1. **Best of both worlds**: Clean TypeScript code + standard SQL schema
2. **Type safety**: Prisma validates field names at compile time
3. **No code changes**: Mapping is transparent to application code
4. **Database standards**: Follows PostgreSQL conventions
5. **Tool compatibility**: Works well with database GUIs, ORMs, etc.

## Migration Best Practices

### Pre-Migration Checklist

Before running any migration:

- [ ] **Backup database**: Always have a recent backup
- [ ] **Test locally**: Run migration on local/staging environment first
- [ ] **Review SQL**: Check generated migration SQL for correctness
- [ ] **Check dependencies**: Ensure no running queries will conflict
- [ ] **Schedule downtime**: Plan for brief downtime during table renames
- [ ] **Rollback plan**: Know how to revert if something goes wrong

### Migration Workflow

```bash
# 1. Create migration (generates SQL)
npx prisma migrate dev --name add_snake_case_mapping

# 2. Review generated SQL
cat prisma/migrations/XXXXXX_add_snake_case_mapping/migration.sql

# 3. Test migration locally
npx prisma migrate dev

# 4. Run tests to verify
npm test

# 5. Deploy to production
npx prisma migrate deploy
```

### Safe Migration Patterns

#### Renaming Tables (Low Risk)

PostgreSQL's `ALTER TABLE RENAME` is atomic and safe:

```sql
ALTER TABLE "User" RENAME TO "users";
```

- ✅ Atomic operation (all or nothing)
- ✅ Data preserved
- ✅ Foreign keys updated automatically
- ⚠️ Brief lock on table (milliseconds)

#### Renaming Columns (Low Risk)

```sql
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
```

- ✅ Atomic operation
- ✅ Data preserved
- ✅ Indexes updated automatically
- ⚠️ Brief lock on table (milliseconds)

#### Recreating Indexes (Medium Risk)

```sql
DROP INDEX "User_email_idx";
CREATE INDEX "users_email_idx" ON "users"("email");
```

- ✅ Can run concurrently (if using `CREATE INDEX CONCURRENTLY`)
- ⚠️ Temporary performance impact during index creation
- ⚠️ Requires more disk space temporarily

### Rollback Strategy

If migration fails:

```bash
# Check migration status
npx prisma migrate status

# Rollback last migration (manual SQL required)
psql $DATABASE_URL -f rollback.sql
```

Create a rollback script (`rollback.sql`) with reverse operations:

```sql
-- Reverse of migration
ALTER TABLE "users" RENAME TO "User";
ALTER TABLE "users" RENAME COLUMN "created_at" TO "createdAt";
-- ... etc
```

### Migration Risks and Mitigation

| Risk                       | Severity | Mitigation                          |
| -------------------------- | -------- | ----------------------------------- |
| Table locked during rename | Low      | Rename happens in milliseconds      |
| Index rebuild takes time   | Medium   | Use `CONCURRENTLY` flag if possible |
| Application queries fail   | Low      | Prisma abstracts column names       |
| Migration fails mid-way    | Low      | PostgreSQL transactions are atomic  |
| Data loss                  | Very Low | Renames preserve all data           |

## Current Schema Design

### Database Relationships

```
users (1) ──< (N) journals
  │
  └──< (N) ai_usage
```

- One user has many journals (one per day)
- One user has many AI usage records (per feature/month)
- Cascading deletes: Deleting user deletes their journals and AI usage

### Indexes Strategy

#### User Table

```sql
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_verification_token_idx" ON "users"("verification_token");
```

**Rationale:**

- `email`: Used for login queries (frequent)
- `verification_token`: Used for email verification (less frequent)

#### Journal Table

```sql
CREATE INDEX "journals_user_id_date_idx" ON "journals"("user_id", "date");
CREATE INDEX "journals_user_id_updated_at_idx" ON "journals"("user_id", "updated_at");
CREATE INDEX "journals_deleted_at_idx" ON "journals"("deleted_at");
```

**Rationale:**

- `user_id + date`: Primary query pattern (list journals for user by date)
- `user_id + updated_at`: Sync queries (get journals updated after timestamp)
- `deleted_at`: Filter out soft-deleted records efficiently

#### AiUsage Table

```sql
CREATE INDEX "ai_usage_user_id_feature_month_idx" ON "ai_usage"("user_id", "feature", "month");
```

**Rationale:**

- Composite unique constraint requires this index
- Queries check usage for specific user/feature/month combination

### Constraints

#### Unique Constraints

- `users.email`: One account per email
- `users.verification_token`: Prevent token collision
- `journals(user_id, date)`: One journal per user per day
- `ai_usage(user_id, feature, month)`: One usage record per user/feature/month

#### Foreign Keys

- `journals.user_id → users.id` (CASCADE DELETE)
- `ai_usage.user_id → users.id` (CASCADE DELETE)

**Cascade Delete Rationale:**
When a user is deleted, all their data should be removed to comply with data privacy regulations (GDPR, etc.)

### Data Types

| Field           | Type              | Rationale                               |
| --------------- | ----------------- | --------------------------------------- |
| `id`            | `TEXT` (CUID)     | URL-safe, collision-resistant, sortable |
| `email`         | `TEXT`            | Standard email format                   |
| `password_hash` | `TEXT`            | bcrypt hash (~60 chars)                 |
| `date`          | `TEXT` (YYYYMMDD) | Simple, sortable, no timezone issues    |
| `ciphertext`    | `TEXT`            | Encrypted journal content               |
| `created_at`    | `TIMESTAMP(3)`    | Millisecond precision                   |
| `verified`      | `BOOLEAN`         | True/false flag                         |
| `count`         | `INT`             | AI usage counter                        |

## Migrating to Snake_Case (Current Task)

### Context

The database was initially created with camelCase naming (Prisma default). We're migrating to snake_case to follow PostgreSQL best practices.

### Migration Steps

See the [Migration Guide](#migration-guide-camelcase-to-snake_case) below for detailed instructions.

### Impact Assessment

- **API Code**: ✅ No changes required (Prisma Client abstracts this)
- **Database Schema**: ⚠️ All tables and columns renamed
- **Queries**: ✅ No changes (Prisma generates SQL)
- **Downtime**: ⚠️ Brief (< 1 second) during table renames
- **Data**: ✅ Fully preserved
- **Rollback**: ✅ Possible (reverse SQL operations)

---

## Migration Guide: CamelCase to Snake_Case

This guide walks through migrating the existing database from camelCase to snake_case naming.

### Phase 1: Update Prisma Schema

**Status**: ✅ Completed (see [schema.prisma](../prisma/schema.prisma))

All models and fields now have proper `@map` and `@@map` attributes.

### Phase 2: Generate Migration

```bash
# Navigate to API package
cd packages/api

# Generate migration SQL
npx prisma migrate dev --name add_snake_case_mapping

# Review the generated SQL
cat prisma/migrations/XXXXXX_add_snake_case_mapping/migration.sql
```

**What this does:**

- Prisma compares schema with current database
- Generates SQL to rename tables and columns
- Creates a new migration file

### Phase 3: Test Locally

```bash
# Ensure local database is running
# The migration was already applied by the previous command

# Regenerate Prisma Client
npx prisma generate

# Run tests
npm test

# Test API manually
npm run dev
# Try: create user, login, create journal, etc.
```

### Phase 4: Deploy to Production

```bash
# Build (includes: prisma migrate deploy)
npm run build

# Or manually run migration
npx prisma migrate deploy
```

**Deployment checklist:**

- [ ] Database backup created
- [ ] Migration tested locally
- [ ] Tests passing
- [ ] Downtime window scheduled (optional, migration is fast)
- [ ] Team notified
- [ ] Rollback SQL prepared

### Phase 5: Verify Production

```bash
# Check migration status
npx prisma migrate status

# Connect to production database
psql $DATABASE_URL

# Verify table names
\dt

# Verify column names
\d users
\d journals
\d ai_usage

# Test API
curl https://your-api.com/health
```

### Expected Migration SQL

The migration will generate SQL similar to:

```sql
-- Rename tables
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Journal" RENAME TO "journals";
ALTER TABLE "AiUsage" RENAME TO "ai_usage";

-- Rename User columns
ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "users" RENAME COLUMN "verificationToken" TO "verification_token";
ALTER TABLE "users" RENAME COLUMN "verificationExpiry" TO "verification_expiry";

-- Rename Journal columns
ALTER TABLE "journals" RENAME COLUMN "authTag" TO "auth_tag";
ALTER TABLE "journals" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "journals" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "journals" RENAME COLUMN "deletedAt" TO "deleted_at";
ALTER TABLE "journals" RENAME COLUMN "userId" TO "user_id";

-- Rename AiUsage columns
ALTER TABLE "ai_usage" RENAME COLUMN "userId" TO "user_id";

-- Indexes and constraints are automatically updated by PostgreSQL
```

### Rollback Plan

If migration fails or causes issues:

```sql
-- Reverse table renames
ALTER TABLE "users" RENAME TO "User";
ALTER TABLE "journals" RENAME TO "Journal";
ALTER TABLE "ai_usage" RENAME TO "AiUsage";

-- Reverse User column renames
ALTER TABLE "User" RENAME COLUMN "password_hash" TO "passwordHash";
ALTER TABLE "User" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "User" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "User" RENAME COLUMN "verification_token" TO "verificationToken";
ALTER TABLE "User" RENAME COLUMN "verification_expiry" TO "verificationExpiry";

-- Reverse Journal column renames
ALTER TABLE "Journal" RENAME COLUMN "auth_tag" TO "authTag";
ALTER TABLE "Journal" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Journal" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "Journal" RENAME COLUMN "deleted_at" TO "deletedAt";
ALTER TABLE "Journal" RENAME COLUMN "user_id" TO "userId";

-- Reverse AiUsage column renames
ALTER TABLE "AiUsage" RENAME COLUMN "user_id" TO "userId";
```

### Troubleshooting

#### Migration fails with "relation does not exist"

**Cause**: Table already renamed or doesn't exist
**Solution**: Check current schema with `\dt` in psql

#### Tests fail after migration

**Cause**: Prisma Client not regenerated
**Solution**: Run `npx prisma generate`

#### API returns 500 errors

**Cause**: Prisma Client out of sync
**Solution**: Rebuild and restart: `npm run build && npm start`

#### Foreign key constraint errors

**Cause**: Rare, but possible if migration interrupted
**Solution**: Check constraints with `\d table_name`, recreate if needed

---

## Row Level Security (RLS)

### Overview

All tables in the Papyrus database have Row Level Security (RLS) enabled. This is a PostgreSQL feature that restricts which rows can be accessed or modified based on security policies.

### Why RLS?

When using Supabase, tables in the `public` schema are automatically exposed via PostgREST (Supabase's auto-generated REST API). Without RLS:

- Anyone with the `anon` key could potentially read/write to tables
- This is a significant security risk for sensitive data

### Our Approach: Backend-Only Access

We use RLS with **no policies**, which means:

- **PostgREST API** (anon/authenticated keys): ❌ No access
- **Service Role Key** (backend API): ✅ Full access (bypasses RLS)
- **Direct database connection** (Prisma): ✅ Full access

This is intentional because:

1. All data access goes through our Express.js API
2. The API handles authentication, authorization, and validation
3. Direct client-to-database access is not needed or desired

### Tables with RLS Enabled

| Table                | Purpose                          | RLS Status |
| -------------------- | -------------------------------- | ---------- |
| `users`              | User accounts and authentication | ✅ Enabled |
| `journals`           | Encrypted journal entries        | ✅ Enabled |
| `ai_usage`           | AI feature usage tracking        | ✅ Enabled |
| `ai_trial_usage`     | Trial usage tracking             | ✅ Enabled |
| `ai_purchases`       | Premium purchase records         | ✅ Enabled |
| `_prisma_migrations` | Prisma migration tracking        | ✅ Enabled |

### Migrations

RLS was enabled via two migrations:

**`20260114000000_enable_rls_all_tables`** - Application tables:

```sql
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_trial_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_purchases" ENABLE ROW LEVEL SECURITY;
```

**`20260114000001_enable_rls_prisma_migrations`** - Prisma internal table:

```sql
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
```

### Verifying RLS Status

To check if RLS is enabled on a table:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

To view policies on a table:

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Adding Policies (If Needed in Future)

If you ever need to allow direct client access to certain tables:

```sql
-- Example: Allow users to read their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Example: Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert"
ON public.journals
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Security Best Practices

1. **Always use service_role key in backend**: Never expose this key to clients
2. **Keep RLS enabled**: Even if you add policies, RLS should remain enabled
3. **Test policies thoroughly**: Policies can have subtle bugs that expose data
4. **Audit regularly**: Review policies when adding new features

---

## Future Considerations

### Adding New Tables

When adding new tables, follow these conventions:

```prisma
model NewFeature {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])

  @@map("new_features")  // Plural, snake_case
}
```

### Performance Monitoring

Monitor these metrics post-migration:

- Query execution time (should be unchanged)
- Index usage (`pg_stat_user_indexes`)
- Table size (`pg_total_relation_size`)

### Documentation Updates

After migration:

- [ ] Update README with new table names
- [ ] Update API documentation
- [ ] Update ERD diagrams (if any)
- [ ] Document any schema changes in changelog

---

## References

- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Prisma Schema Mapping](https://www.prisma.io/docs/concepts/components/prisma-schema/names-in-underlying-database)
- [Database Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
