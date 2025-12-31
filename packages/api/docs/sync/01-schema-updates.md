# Schema Updates

## Overview

This document details all schema changes needed to support the date-based sync system.

## 1. Prisma Schema Changes

### Update `prisma/schema.prisma`

Replace the existing `Journal` model with:

```prisma
model Journal {
  id          String    @id @default(cuid())
  date        String    // YYYYMMDD format (public identifier)
  ciphertext  String    // encrypted content
  iv          String    // initialization vector
  authTag     String    // authentication tag
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime? // soft delete timestamp

  // Relations
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])      // one journal per day per user
  @@index([userId, date])       // for efficient lookups
  @@index([userId, updatedAt])  // for sync queries
  @@index([deletedAt])          // for filtering deleted records
}
```

### Key Changes

1. **Renamed field**: `title` → `date` (more semantic for YYYYMMDD format)
2. **Added unique constraint**: `@@unique([userId, date])` enforces one journal per day
3. **Added index**: `@@index([userId, date])` for fast date-based lookups
4. **Added index**: `@@index([userId, updatedAt])` for efficient sync queries
5. **Added index**: `@@index([deletedAt])` for filtering soft-deleted records
6. **Kept `id`**: Internal CUID for database integrity and logging

### Create Migration

```bash
# Generate and apply migration
npx prisma migrate dev --name use_date_as_identifier

# This will:
# 1. Rename title -> date
# 2. Add unique constraint on (userId, date)
# 3. Add new indexes
# 4. Regenerate Prisma Client
```

### Data Migration (if you have existing data)

If you have existing journals with `title` field:

```sql
-- The migration will automatically rename the column
-- But verify the data format is YYYYMMDD
UPDATE journals
SET date = REPLACE(REPLACE(date, '-', ''), ' ', '')
WHERE date LIKE '%-%' OR date LIKE '% %';
```

## 2. TypeScript Schema Updates

### Update `src/schemas/common.schema.ts`

Add date parameter validation:

```typescript
import { z } from 'zod';

export const DateParamSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format')
      .refine((date) => {
        // Validate it's a real date
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(4, 6));
        const day = parseInt(date.substring(6, 8));
        const parsed = new Date(year, month - 1, day);
        return !isNaN(parsed.getTime());
      }, 'Invalid date')
      .openapi({ example: '20251206' }),
  })
  .openapi('DateParam');

export type DateParam = z.infer<typeof DateParamSchema>;

// Keep existing PaginationParamSchema, SuccessResponseSchema, ErrorResponseSchema
```

### Update `src/schemas/journal.schema.ts`

Change from `title` to `date`:

```typescript
import z from 'zod';

export const CreateJournalSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format (e.g., 20251206)')
      .refine((date) => {
        // Validate that it's a real date
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(4, 6));
        const day = parseInt(date.substring(6, 8));
        const parsed = new Date(year, month - 1, day);
        return !isNaN(parsed.getTime());
      }, 'Invalid date')
      .openapi({ example: '20251206' }),

    content: z
      .string()
      .min(1, 'Content is required')
      .max(100_000, 'Content must be less than 100,000 characters')
      .openapi({ example: 'Today I learned about Rust! 🦀' }),
  })
  .openapi('CreateJournalRequest');

export const UpdateJournalSchema = z
  .object({
    content: z
      .string()
      .min(1, 'Content is required')
      .max(100_000, 'Content must be less than 100,000 characters')
      .openapi({ example: 'Updated content for my journal entry...' }),
  })
  .openapi('UpdateJournalRequest');

export const JournalResponseSchema = z
  .object({
    date: z.string(), // Changed from `title`
    content: z.string().min(1, 'Content is required'),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    // Note: `id` is NOT exposed to clients
  })
  .openapi('JournalResponse');

export const JournalListResponseSchema = z
  .object({
    journals: z.array(JournalResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi('JournalListResponse');

export type CreateJournalInput = z.infer<typeof CreateJournalSchema>;
export type UpdateJournalInput = z.infer<typeof UpdateJournalSchema>;
export type JournalResponse = z.infer<typeof JournalResponseSchema>;
export type JournalListResponse = z.infer<typeof JournalListResponseSchema>;
```

### Create `src/schemas/sync.schema.ts`

New file for sync-specific schemas:

```typescript
import z from 'zod';

import { JournalResponseSchema } from './journal.schema';

// Pull sync (GET /journals/sync)
export const SyncJournalQuerySchema = z
  .object({
    since: z
      .string()
      .datetime({ message: 'Invalid ISO 8601 datetime format' })
      .transform((val) => new Date(val))
      .openapi({
        example: '2025-12-01T00:00:00.000Z',
        description: 'ISO 8601 timestamp to sync from',
      }),
  })
  .openapi('SyncQuery');

export const SyncJournalResponseSchema = z
  .object({
    journals: z.array(JournalResponseSchema),
    serverTimestamp: z.date().openapi({
      description: 'Current server timestamp for next sync',
    }),
  })
  .openapi('SyncResponse');

// Push sync (POST /journals/batch)
export const BatchJournalItemSchema = z
  .object({
    date: z.string().regex(/^\d{8}$/, 'Date must be in YYYYMMDD format'),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(100_000, 'Content must be less than 100,000 characters')
      .nullable(), // null means delete this journal
    clientUpdatedAt: z.date(), // Client's last known server timestamp for conflict detection
  })
  .openapi('BatchJournalItem');

export const BatchJournalRequestSchema = z
  .object({
    journals: z.array(BatchJournalItemSchema).min(1).max(100), // Limit batch size to 100
  })
  .openapi('BatchJournalRequest');

export const BatchResultItemSchema = z
  .object({
    date: z.string(),
    status: z.enum(['created', 'updated', 'deleted', 'conflict']),
    serverUpdatedAt: z.date(),
  })
  .openapi('BatchResultItem');

export const BatchJournalResponseSchema = z
  .object({
    results: z.array(BatchResultItemSchema),
    conflicts: z.array(JournalResponseSchema).openapi({
      description:
        'Journals with conflicts (server version provided for client to merge)',
    }),
    serverTimestamp: z.date(),
  })
  .openapi('BatchJournalResponse');

export type SyncJournalQuery = z.infer<typeof SyncJournalQuerySchema>;
export type SyncJournalResponse = z.infer<typeof SyncJournalResponseSchema>;
export type BatchJournalItem = z.infer<typeof BatchJournalItemSchema>;
export type BatchJournalRequest = z.infer<typeof BatchJournalRequestSchema>;
export type BatchResultItem = z.infer<typeof BatchResultItemSchema>;
export type BatchJournalResponse = z.infer<typeof BatchJournalResponseSchema>;
```

### Update `src/schemas/index.ts`

Export new schemas:

```typescript
export * from './auth.schema';
export * from './common.schema';
export * from './journal.schema';
export * from './sync.schema'; // Add this line
```

## 3. Type Updates

No changes needed to `src/types/` - types are inferred from Zod schemas.

## 4. Verification

After making these changes:

```bash
# 1. Validate Prisma schema
npx prisma validate

# 2. Generate Prisma Client
npx prisma generate

# 3. Check TypeScript compilation
npm run build

# 4. Run tests (update tests to use `date` instead of `title`)
npm test
```

## Summary

Schema changes complete:

- ✅ Database schema updated with `date` field and indexes
- ✅ Unique constraint on `(userId, date)` enforces business rule
- ✅ TypeScript schemas reflect new date-based model
- ✅ Sync schemas defined for pull/push operations
- ✅ Conflict detection supported via `clientUpdatedAt` field
