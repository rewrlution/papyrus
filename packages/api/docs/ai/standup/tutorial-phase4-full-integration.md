# Phase 4: Full Integration - Tutorial

## Goal

Wire all layers together to create a production-ready standup notes endpoint. After this phase, you'll have:

- ✅ Load real journals from database (not hardcoded test data)
- ✅ Request validation with Zod schemas
- ✅ Service layer for business logic orchestration
- ✅ Support four modes: latest journal, specific date, from-to-today, explicit date range
- ✅ Comprehensive error handling with helpful messages
- ✅ Clean separation of concerns (Routes → Controllers → Services → Repositories)

**Why this phase?** All individual pieces are validated (SSE, AI, DB, usage limits). Now we orchestrate them into a cohesive feature that follows the codebase's clean architecture pattern.

---

## Phase Overview

```
┌─────────────────────────────────────────────────┐
│  Phase 4: Full Integration                      │
├─────────────────────────────────────────────────┤
│  1. Create request/response schemas (Zod)       │
│  2. Create service layer (business logic)       │
│  3. Load journals from database                 │
│  4. Update controller to use service            │
│  5. Add comprehensive error handling            │
│  6. Test all four modes                         │
└─────────────────────────────────────────────────┘
```

**Architecture:**

```
POST /api/ai/standup (with optional body)
       │
       ├─→ validate(StandupRequestSchema)
       │
       ▼
StandupController.generate()
       │
       ├─→ Extract userId, params
       │
       ▼
StandupService.generateStream(userId, options)
       │
       ├─→ 1. Check usage limit
       ├─→ 2. Load journals from database
       ├─→ 3. Yield 'thinking' event
       ├─→ 4. Build prompt
       ├─→ 5. Stream AI response (yield 'content' events)
       ├─→ 6. Increment usage counter
       ├─→ 7. Yield 'done' event
       │
       ▼
Controller streams events to client
```

---

## Step 1: Create Shared Schemas

### 1.1: Understand the Request Modes

**Four ways to call the endpoint:**

1. **Empty body** → Use most recent journal

   ```bash
   POST /api/ai/standup
   # Body: {} or no body
   ```

2. **Specific date** → Use journal from that date

   ```bash
   POST /api/ai/standup
   # Body: { "date": "2025-01-07" }
   ```

3. **From date** → Aggregate journals from date to today
   ```bash
   POST /api/ai/standup
   # Body: { "from": "2025-01-01" }
   # Will use 2025-01-01 to today
   ```

4. **Date range** → Aggregate journals from explicit range
   ```bash
   POST /api/ai/standup
   # Body: { "from": "2025-01-01", "to": "2025-01-07" }
   ```

**Why these modes?**

- Empty body: Most common use case (daily standup)
- Specific date: Look back at past work
- From date: Weekly summary without calculating end date
- Date range: Explicit time period summaries

### 1.2: Create Zod Schemas

**File:** `packages/shared/src/schemas/ai/standup.ts`

```typescript
import { z } from 'zod';

/**
 * Date string in YYYY-MM-DD format
 */
const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: 'Invalid date' }
  );

/**
 * Request schema for POST /api/ai/standup
 *
 * Four modes:
 * 1. Empty body {} -> Use most recent journal
 * 2. { date: "YYYY-MM-DD" } -> Use specific date
 * 3. { from: "YYYY-MM-DD" } -> Use date range from 'from' to today
 * 4. { from: "YYYY-MM-DD", to: "YYYY-MM-DD" } -> Use explicit date range
 */
export const StandupRequestSchema = z
  .object({
    date: DateStringSchema.optional(),
    from: DateStringSchema.optional(),
    to: DateStringSchema.optional(),
  })
  .refine(
    (data) => {
      // Cannot mix 'date' with 'from'/'to'
      if (data.date && (data.from || data.to)) {
        return false;
      }
      // Cannot provide 'to' without 'from'
      if (data.to && !data.from) {
        return false;
      }
      // If both 'from' and 'to' are provided, 'from' must be <= 'to'
      if (data.from && data.to && data.from > data.to) {
        return false;
      }
      return true;
    },
    {
      message:
        'Either provide "date", or "from" (with optional "to"), or neither. If both "from" and "to" are provided, ensure "from" <= "to".',
    }
  );

export type StandupRequest = z.infer<typeof StandupRequestSchema>;

/**
 * Usage info returned in 'done' event
 */
export const UsageInfoSchema = z.object({
  used: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().nullable().optional(),
  resets_at: z.string().datetime().nullable().optional(),
  tier: z.enum(['free', 'premium']),
});

export type UsageInfo = z.infer<typeof UsageInfoSchema>;

/**
 * SSE event schemas (for documentation)
 */
export const ThinkingEventSchema = z.object({
  message: z.string(),
});

export const ContentEventSchema = z.object({
  text: z.string(),
});

export const DoneEventSchema = z.object({
  journal_date: z.string(), // YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD
  usage: UsageInfoSchema,
});

export const ErrorEventSchema = z.object({
  message: z.string(),
});
```

**Why these refinements?**

- Prevent invalid combinations (can't have both `date` and `from`/`to`)
- Ensure range is valid (`from` <= `to` when both provided)
- Allow `from` alone (defaults `to` to today in business logic)
- Disallow `to` without `from` (doesn't make sense)

### 1.3: Export Schemas

**File:** `packages/shared/src/schemas/ai/index.ts`

```typescript
export * from './standup.js';
```

**File:** `packages/shared/src/schemas/index.ts`

```typescript
// Existing exports
export * from './auth.js';
export * from './journal.js';

// Add AI exports
export * from './ai/index.js';
```

### 1.4: Rebuild Shared Package

```bash
cd packages/shared
pnpm build
```

**Verify:**

```bash
# In packages/api, this should work:
# import { StandupRequestSchema } from '@rewrlution/papyrus-shared';
```

### 1.5: Basic Schema Unit Tests

**Why test the schema?**

- Ensure validation logic is correct
- Document expected behavior
- Catch regressions when modifying validation rules

**Note:** These are conceptual tests for the tutorial. In Phase 5, you'll implement these in actual test files.

```typescript
import { describe, it, expect } from 'vitest';
import { StandupRequestSchema } from './standup';

describe('StandupRequestSchema', () => {
  describe('Valid inputs', () => {
    it('should accept empty object', () => {
      const result = StandupRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept date only', () => {
      const result = StandupRequestSchema.safeParse({ date: '2025-01-07' });
      expect(result.success).toBe(true);
    });

    it('should accept from only', () => {
      const result = StandupRequestSchema.safeParse({ from: '2025-01-01' });
      expect(result.success).toBe(true);
    });

    it('should accept from and to', () => {
      const result = StandupRequestSchema.safeParse({
        from: '2025-01-01',
        to: '2025-01-07',
      });
      expect(result.success).toBe(true);
    });

    it('should accept from and to with same date', () => {
      const result = StandupRequestSchema.safeParse({
        from: '2025-01-07',
        to: '2025-01-07',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid inputs', () => {
    it('should reject invalid date format', () => {
      const result = StandupRequestSchema.safeParse({ date: '01-07-2025' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date', () => {
      const result = StandupRequestSchema.safeParse({ date: '2025-13-45' });
      expect(result.success).toBe(false);
    });

    it('should reject date mixed with from', () => {
      const result = StandupRequestSchema.safeParse({
        date: '2025-01-07',
        from: '2025-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('should reject date mixed with to', () => {
      const result = StandupRequestSchema.safeParse({
        date: '2025-01-07',
        to: '2025-01-10',
      });
      expect(result.success).toBe(false);
    });

    it('should reject date mixed with from and to', () => {
      const result = StandupRequestSchema.safeParse({
        date: '2025-01-07',
        from: '2025-01-01',
        to: '2025-01-10',
      });
      expect(result.success).toBe(false);
    });

    it('should reject to without from', () => {
      const result = StandupRequestSchema.safeParse({ to: '2025-01-07' });
      expect(result.success).toBe(false);
    });

    it('should reject from > to', () => {
      const result = StandupRequestSchema.safeParse({
        from: '2025-01-07',
        to: '2025-01-01',
      });
      expect(result.success).toBe(false);
    });
  });
});
```

**What these tests verify:**

- ✅ Empty body is valid (most recent journal)
- ✅ Date alone is valid (specific date)
- ✅ From alone is valid (from date to today)
- ✅ From + to is valid (explicit range)
- ✅ Invalid date formats are rejected
- ✅ Invalid date values are rejected
- ✅ Mixing date with from/to is rejected
- ✅ To without from is rejected
- ✅ From > to is rejected

**Key insight:** Schema only validates structure and constraints. It does NOT apply the default `to` date—that's handled in the service layer (Step 2).

---

## Step 2: Create Service Layer

### 2.1: Understand Service Responsibilities

**What services do:**

- Orchestrate business logic (call repositories, utilities, external APIs)
- NO HTTP concepts (no `req`, `res`, no status codes)
- Return data or throw errors (controller handles HTTP responses)
- Pure business logic (testable without HTTP)

**Why async generators for streaming?**

- Service yields events (`thinking`, `content`, `done`)
- Controller consumes generator and writes to SSE stream
- Clean separation: service doesn't know about HTTP, controller doesn't know about AI

### 2.2: Create Standup Service

**File:** `src/services/ai/standup.service.ts`

```typescript
import type { Journal } from '@prisma/client';
import { journalRepository } from '../../domain/repositories/journal.repository.js';
import {
  checkUsage,
  incrementUsage,
  type UsageInfo,
} from '../../lib/ai/usage-limiter.js';
import { AnthropicProvider } from '../../lib/ai/anthropic-provider.js';
import {
  buildStandupPrompt,
  buildStandupPromptForRange,
} from '../../lib/ai/prompts/standup.js';
import { NotFoundError } from '../../lib/errors.js';
import { getFeatureConfig } from '../../lib/ai/feature-config.js';

/**
 * Options for generating standup notes
 */
export interface GenerateStandupOptions {
  date?: string; // YYYY-MM-DD
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

/**
 * SSE events yielded by generateStream
 */
export type StandupEvent =
  | { type: 'thinking'; message: string }
  | { type: 'content'; text: string }
  | {
      type: 'done';
      journal_date: string;
      usage: {
        tier: 'free' | 'premium';
        used?: number | null;
        limit?: number | null;
        resets_at?: string | null;
        expires_at?: string | null;
      };
    }
  | { type: 'error'; message: string };

/**
 * Standup service - generates standup notes from journal entries
 */
export const StandupService = {
  /**
   * Generate standup notes with streaming
   *
   * Yields SSE events: thinking → content (multiple) → done
   *
   * @param userId - User ID
   * @param options - Generation options (date, from, to)
   * @yields StandupEvent
   * @throws NotFoundError if no journals found
   * @throws UnauthorizedError if usage limit exceeded (caught by usage limiter)
   */
  async *generateStream(
    userId: string,
    options: GenerateStandupOptions = {}
  ): AsyncGenerator<StandupEvent> {
    // Step 1: Check usage limit (free tier first, then premium)
    const usageInfo = await checkUsage(userId, 'standup');

    if (!usageInfo.allowed) {
      // Limit exceeded - yield error event and return
      const config = getFeatureConfig('standup');
      const message = usageInfo.resets_at
        ? `You've used ${usageInfo.used}/${usageInfo.limit} free requests this month. Resets on ${new Date(usageInfo.resets_at).toLocaleDateString()}.`
        : `You've used your free trial. Purchase ${config.productName} to continue.`;

      yield { type: 'error', message };
      return;
    }

    // Step 2: Load journals from database
    const { journals, dateRange } = await this.loadJournals(userId, options);

    if (journals.length === 0) {
      throw new NotFoundError(
        'No journals found. Use `papyrus sync` to sync your local journals to the server.'
      );
    }

    // Step 3: Yield thinking event
    yield { type: 'thinking', message: 'Analyzing journals...' };

    // Step 4: Build prompt
    const prompt =
      journals.length === 1
        ? buildStandupPrompt({
            date: journals[0].date,
            content: journals[0].ciphertext, // Will be decrypted by repository
          })
        : buildStandupPromptForRange(
            journals.map((j) => ({
              date: j.date,
              content: j.ciphertext,
            }))
          );

    // Step 5: Stream AI response
    const aiProvider = new AnthropicProvider();

    try {
      for await (const chunk of aiProvider.stream(prompt)) {
        yield { type: 'content', text: chunk };
      }
    } catch (error) {
      console.error('[Standup] AI streaming error:', error);
      yield {
        type: 'error',
        message: 'AI service temporarily unavailable. Please try again later.',
      };
      return;
    }

    // Step 6: Increment usage counter (only on success, only for free tier)
    await incrementUsage(userId, 'standup', usageInfo);

    // Step 7: Get updated usage and yield done event
    const updatedUsage = await checkUsage(userId, 'standup');

    yield {
      type: 'done',
      journal_date: dateRange,
      usage: {
        tier: updatedUsage.reason === 'premium' ? 'premium' : 'free',
        used: updatedUsage.used ?? null,
        limit: updatedUsage.limit ?? null,
        resets_at: updatedUsage.resets_at ?? null,
        expires_at: updatedUsage.expires_at ?? null,
      },
    };
  },

  /**
   * Load journals based on options
   *
   * Four modes:
   * 1. No options -> Load most recent journal
   * 2. { date } -> Load specific date
   * 3. { from } -> Load date range from 'from' to today
   * 4. { from, to } -> Load explicit date range
   *
   * @private
   */
  async loadJournals(
    userId: string,
    options: GenerateStandupOptions
  ): Promise<{ journals: Journal[]; dateRange: string }> {
    let journals: Journal[];
    let dateRange: string;

    if (options.date) {
      // Mode 2: Specific date
      const journal = await journalRepository.findByUserAndDate(
        userId,
        this.formatDateForDb(options.date)
      );
      journals = journal ? [journal] : [];
      dateRange = options.date;
    } else if (options.from) {
      // Mode 3 & 4: Date range (with default 'to' if not provided)
      const toDate = options.to || this.getCurrentDate();

      journals = await journalRepository.findByDateRange(
        userId,
        this.formatDateForDb(options.from),
        this.formatDateForDb(toDate)
      );
      dateRange = `${options.from} to ${toDate}`;
    } else {
      // Mode 1: Most recent journal
      const journal = await journalRepository.findMostRecent(userId);
      journals = journal ? [journal] : [];
      dateRange = journal?.date
        ? this.formatDateForDisplay(journal.date)
        : 'unknown';
    }

    return { journals, dateRange };
  },

  /**
   * Convert YYYY-MM-DD to YYYYMMDD for database queries
   * @private
   */
  formatDateForDb(date: string): string {
    return date.replace(/-/g, '');
  },

  /**
   * Convert YYYYMMDD to YYYY-MM-DD for display
   * @private
   */
  formatDateForDisplay(date: string): string {
    // date is in YYYYMMDD format
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  },

  /**
   * Get current date in YYYY-MM-DD format
   * @private
   */
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  },
};
```

**Key design decisions:**

- **Async generator**: Yields events for SSE streaming
- **Pure business logic**: No HTTP concepts (req/res)
- **Error handling**: Throws NotFoundError (controller converts to 404)
- **Usage check**: Returns early if limit exceeded (yields error event)
- **Date formatting**: Database uses YYYYMMDD, API uses YYYY-MM-DD

### 2.3: Update Prompt Builder for Range

**File:** `src/lib/ai/prompts/standup.ts`

Add the range function:

```typescript
// Existing code...
export const STANDUP_SYSTEM_PROMPT = `...`;

export function buildStandupPrompt(journal: {
  date: string;
  content: string;
}): string {
  // ... existing code ...
}

/**
 * Build prompt for multiple journals (date range)
 *
 * @param journals - Array of journals from date range
 * @returns Formatted prompt for AI
 */
export function buildStandupPromptForRange(
  journals: Array<{ date: string; content: string }>
): string {
  const journalEntries = journals
    .map((j) => {
      return `## ${j.date}\n\n${j.content}`;
    })
    .join('\n\n---\n\n');

  return `${STANDUP_SYSTEM_PROMPT}

Here are journal entries from ${journals[0].date} to ${journals[journals.length - 1].date}:

${journalEntries}

Generate standup notes that summarize the work across this time period.

Focus on:
- Completed work (from all entries)
- Planned work (from most recent entry or inferred)
- Any blockers mentioned (from any entry)`;
}
```

**Why separate functions?**

- Single journal: Simpler prompt
- Range: Needs to aggregate multiple entries, different instructions

### 2.4: Create Service Index File

**File:** `src/services/ai/index.ts`

```typescript
export * from './standup.service.js';
```

**File:** `src/services/index.ts`

```typescript
// Existing exports
export * from './auth.service.js';
export * from './journal.service.js';

// Add AI exports
export * from './ai/index.js';
```

---

## Step 3: Update Controller to Use Service

### 3.1: Update Controller

**File:** `src/controllers/ai/standup.controller.ts`

```typescript
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { StandupService } from '../../services/ai/standup.service.js';
import type { StandupRequest } from '@rewrlution/papyrus-shared';

export const StandupController = {
  /**
   * POST /api/ai/standup
   *
   * Generate standup notes from journal entries
   * Returns Server-Sent Events stream
   */
  generate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id; // Set by requireAuthentication middleware
    const options: StandupRequest = req.body ?? {}; // Validated by middleware

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    /**
     * Helper to write SSE events
     */
    const writeEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Stream events from service
      for await (const event of StandupService.generateStream(
        userId,
        options
      )) {
        switch (event.type) {
          case 'thinking':
            writeEvent('thinking', { message: event.message });
            break;

          case 'content':
            writeEvent('content', { text: event.text });
            break;

          case 'done':
            writeEvent('done', {
              journal_date: event.journal_date,
              usage: event.usage,
            });
            break;

          case 'error':
            writeEvent('error', { message: event.message });
            break;
        }
      }

      // Close stream
      res.end();
    } catch (error) {
      console.error('[Standup] Controller error:', error);

      // Send error event and close stream
      writeEvent('error', {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
      res.end();
    }
  }),
};
```

**Key changes from Phase 3:**

1. **No direct usage checks**: Service handles it
2. **No direct AI calls**: Service handles it
3. **Controller is thin**: Just extracts params, calls service, writes events
4. **Error handling**: Service throws NotFoundError, controller catches and sends as SSE error event

**Why this design?**

- Controller doesn't know about usage limits, AI, or database
- Service is testable without HTTP mocking
- Easy to add new AI features (follow same pattern)

### 3.2: Add Validation Middleware to Route

**File:** `src/routes/ai/standup.routes.ts`

```typescript
import { Router } from 'express';
import { StandupController } from '../../controllers/ai/standup.controller.js';
import { requireAuthentication } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { StandupRequestSchema } from '@rewrlution/papyrus-shared';

const router = Router();

// POST /api/ai/standup - Generate standup notes
router.post(
  '/',
  requireAuthentication,
  validate(StandupRequestSchema), // NEW: Validate request body
  StandupController.generate
);

export { router as standupRoutes };
```

**Middleware order:**

1. `requireAuthentication` - Verify JWT, attach user to req
2. `validate(StandupRequestSchema)` - Validate body with Zod
3. `StandupController.generate` - Handle request

---

## Step 4: Test All Four Modes

### 4.1: Test Mode 1 - Latest Journal (Empty Body)

```bash
# Start server
pnpm dev

# Make request with no body
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected behavior:**

- Loads most recent journal from database
- Streams standup notes
- `done` event includes actual journal date

**Example output:**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday:\n- Implemented user authentication..."}

event: done
data: {"journal_date":"2025-01-07","usage":{"tier":"free","used":1,"limit":10,"resets_at":"2025-02-01T00:00:00.000Z","expires_at":null}}
```

### 4.2: Test Mode 2 - Specific Date

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-06"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected behavior:**

- Loads journal from 2025-01-06
- `done` event shows `"journal_date":"2025-01-06"`

**If date doesn't exist:**

```
event: error
data: {"message":"No journals found. Use `papyrus sync` to sync your local journals to the server."}
```

### 4.3: Test Mode 3 - From Date (Defaults to Today)

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"2025-01-01"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected behavior:**

- Loads all journals from 2025-01-01 to today
- AI aggregates work from all entries
- `done` event shows `"journal_date":"2025-01-01 to 2026-01-14"` (assuming today is 2026-01-14)

**Why this is useful:**

- Weekly summaries: Just provide Monday's date
- Monthly summaries: Just provide first day of month
- No need to calculate end date manually

**Example output:**

```
event: content
data: {"text":"This week:\n- Implemented authentication system (Mon-Tue)\n- Built dashboard UI (Wed-Thu)\n- Fixed bugs and deployed (Fri)\n\nToday:\n- Plan next sprint features\n\nBlockers:\n- None"}
```

### 4.4: Test Mode 4 - Explicit Date Range

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"2025-01-01","to":"2025-01-07"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected behavior:**

- Loads all journals in range
- AI aggregates work from all entries
- `done` event shows `"journal_date":"2025-01-01 to 2025-01-07"`

**Output should summarize entire week:**

```
event: content
data: {"text":"Yesterday:\n- Implemented authentication (Mon-Tue)\n- Built dashboard UI (Wed-Thu)\n- Fixed bugs and deployed (Fri-Sun)\n\nToday:\n- Plan next sprint features\n\nBlockers:\n- Waiting on API rate limit approval"}
```

### 4.5: Test Invalid Requests

**Invalid date format:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"01-06-2025"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected: 422 Validation Error**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "date",
        "message": "Date must be in YYYY-MM-DD format"
      }
    ]
  }
}
```

**Mixed date modes:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-06","from":"2025-01-01"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected: 422 Validation Error**

```json
{
  "error": "Either provide \"date\", or \"from\" (with optional \"to\"), or neither. If both \"from\" and \"to\" are provided, ensure \"from\" <= \"to\"."
}
```

**Range with from > to:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"2025-01-07","to":"2025-01-01"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected: 422 Validation Error**

**To without from:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"2025-01-07"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected: 422 Validation Error**

```json
{
  "error": "Either provide \"date\", or \"from\" (with optional \"to\"), or neither. If both \"from\" and \"to\" are provided, ensure \"from\" <= \"to\"."
}
```

### 4.6: Test No Journals

**Create a new user with no synced journals:**

```bash
# Signup a new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'

# Get token (skip verification for testing)
# Or signin after verifying email

# Try to generate standup
curl -N -H "Authorization: Bearer NEW_USER_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output:**

```
event: error
data: {"message":"No journals found. Use `papyrus sync` to sync your local journals to the server."}
```

**Why this message?**

- Explains the problem (no journals)
- Tells user how to fix it (sync command)
- Specific to the Papyrus workflow

---

## Step 5: Add Error Handling Enhancements

### 5.1: Update Service with Better Error Messages

**File:** `src/services/ai/standup.service.ts`

Update the error handling in `generateStream`:

```typescript
// In generateStream method, update Step 5 error handling:

// Step 5: Stream AI response
const aiProvider = new AnthropicProvider();

try {
  for await (const chunk of aiProvider.stream(prompt)) {
    yield { type: 'content', text: chunk };
  }
} catch (error) {
  console.error('[Standup] AI streaming error:', error);

  // Check if it's an Anthropic API error
  if (error instanceof Error) {
    if (error.message.includes('rate_limit')) {
      yield {
        type: 'error',
        message:
          'AI service is experiencing high demand. Please try again in a few minutes.',
      };
    } else if (error.message.includes('invalid_api_key')) {
      yield {
        type: 'error',
        message:
          'AI service configuration error. Please contact support.',
      };
    } else {
      yield {
        type: 'error',
        message:
          'AI service temporarily unavailable. Please try again later.',
      };
    }
  } else {
    yield {
      type: 'error',
      message: 'An unexpected error occurred.',
    };
  }

  return; // Don't increment usage on error
}
```

**Why specific error messages?**

- Rate limit errors: User can retry later
- Config errors: User should contact support
- Generic errors: Temporary issue, try again

### 5.2: Add Logging for Debugging

**File:** `src/services/ai/standup.service.ts`

Add logging throughout:

```typescript
import { logger } from '../../lib/logger.js';

// In generateStream:
async *generateStream(
  userId: string,
  options: GenerateStandupOptions = {},
): AsyncGenerator<StandupEvent> {
  logger.info('[Standup] Generate request', { userId, options });

  // After loading journals:
  logger.info('[Standup] Loaded journals', {
    userId,
    count: journals.length,
    dateRange,
  });

  // After successful generation:
  logger.info('[Standup] Generation complete', { userId, dateRange });
}
```

**Why logging?**

- Debug production issues
- Track usage patterns
- Monitor performance

---

## Step 6: Final Testing Checklist

### 6.1: Happy Paths

- [x] **Latest journal (empty body)**
  - Loads most recent journal
  - Streams standup notes
  - Usage counter increments
  - Correct `journal_date` in response

- [x] **Specific date**
  - Loads journal from specified date
  - Correct `journal_date` in response

- [x] **From date (defaults to today)**
  - Loads all journals from specified date to today
  - AI aggregates work from multiple entries
  - Correct `journal_date` range in response (e.g., "2025-01-01 to 2026-01-14")

- [x] **Explicit date range**
  - Loads all journals in range
  - AI aggregates work from multiple entries
  - Correct `journal_date` range in response

### 6.2: Error Cases

- [x] **No journals**
  - Returns helpful error message
  - Suggests using `papyrus sync`

- [x] **Invalid date format**
  - Returns 422 validation error
  - Clear error message

- [x] **Mixed date modes**
  - Returns 422 validation error
  - Explains valid combinations

- [x] **Usage limit exceeded**
  - Returns error event (not HTTP error, since SSE stream)
  - Shows current usage and reset date

- [x] **AI service error**
  - Returns error event
  - Doesn't increment usage counter

### 6.3: Edge Cases

- [x] **Very long journal content**
  - Test with 10K character journal
  - Should stream smoothly

- [x] **Many journals in range**
  - Test with 7+ day range
  - Should aggregate all entries

- [x] **Concurrent requests**
  - Make 2-3 requests simultaneously
  - Both should complete successfully
  - Usage counter should increment correctly (no race conditions)

---

## Step 7: Troubleshooting

### Issue: "No journals found" but journals exist

**Cause:** Date format mismatch between DB and request.

**Debug:**

```typescript
// Add logging in loadJournals:
console.log('[Debug] Looking for date:', this.formatDateForDb(options.date));

// Check what's in database:
const allJournals = await journalRepository.findAll(userId);
console.log(
  '[Debug] All journal dates:',
  allJournals.map((j) => j.date)
);
```

**Fix:** Ensure date conversion is correct (YYYY-MM-DD → YYYYMMDD).

### Issue: Range returns empty array

**Cause:** Range query not including boundaries or date format wrong.

**Debug:**

```typescript
// Check range query in journal repository
console.log('[Debug] Range query:', { from, to });

// Verify Prisma query:
const journals = await prisma.journal.findMany({
  where: {
    userId,
    date: {
      gte: from, // Should be YYYYMMDD format
      lte: to, // Should be YYYYMMDD format
    },
    deletedAt: null,
  },
});
console.log('[Debug] Found journals:', journals.length);
```

**Fix:** Ensure `findByDateRange` in repository uses `gte` and `lte` (inclusive).

### Issue: Content not streaming (all arrives at once)

**Cause:** Response buffering or missing headers.

**Fix:**

```typescript
// Ensure SSE headers are set BEFORE any writes
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

// Ensure you're using curl -N (no buffering)
curl -N ...
```

### Issue: Usage counter increments even on errors

**Cause:** `incrementUsage` called before streaming completes.

**Fix:** Ensure `incrementUsage` is called AFTER AI streaming succeeds (in the service, after the `for await` loop).

### Issue: Validation passes but service fails

**Cause:** Edge case not covered by schema validation.

**Example:** Date exists but is in the future.

**Fix:** Add business validation in service:

```typescript
// After loading journals:
if (options.date && journals.length === 0) {
  const requestedDate = new Date(options.date);
  const today = new Date();

  if (requestedDate > today) {
    throw new BadRequestError(
      `Cannot generate standup for future date: ${options.date}`
    );
  }
}
```

---

## Success Criteria

Before moving to Phase 5, verify:

- [x] **All four modes work**
  - Empty body → Latest journal
  - `{ date }` → Specific date
  - `{ from }` → Date range from `from` to today
  - `{ from, to }` → Explicit date range

- [x] **Request validation works**
  - Invalid formats rejected (422)
  - Mixed modes rejected (422)
  - Valid requests accepted

- [x] **Error handling is comprehensive**
  - No journals → Helpful message
  - AI errors → Graceful degradation
  - Usage limit → Clear error event
  - Validation errors → Field-level details

- [x] **Service layer is clean**
  - No HTTP concepts in service
  - Pure business logic
  - Testable without mocking HTTP

- [x] **Real journals load correctly**
  - Date format conversion works
  - Range queries work
  - Most recent query works

- [x] **Streaming works smoothly**
  - Events arrive incrementally
  - No buffering issues
  - Connection closes cleanly

---

## What's Next?

**Phase 5: Testing & Polish** will:

1. **Add unit tests** (prompt builder, usage limiter, helpers)
2. **Add integration tests** (endpoint with mocked AI)
3. **Review error handling** (all paths covered)
4. **Add API documentation** (Swagger/OpenAPI)
5. **Performance testing** (large journals, long ranges)
6. **Code review** (follow codebase conventions)

**You now have:**

- ✅ Complete AI standup feature
- ✅ Clean architecture (Routes → Controllers → Services → Repositories)
- ✅ Real database integration
- ✅ Comprehensive error handling
- ✅ Four flexible modes (latest, date, from-to-today, explicit range)

**Almost production-ready!** Next: Tests & polish 🚀

---

## Quick Reference

**Make request (latest journal):**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Make request (specific date):**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-07"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Make request (from date to today):**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"2025-01-01"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Make request (explicit date range):**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"2025-01-01","to":"2025-01-07"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Check usage in database:**

```bash
pnpm prisma studio
# Navigate to ai_usage table
```
