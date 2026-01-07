# Phase 3: Database + Usage Limits - Tutorial

## Goal

Add database persistence and enforce usage limits/guardrails for the AI standup feature. After this phase, you'll have:

- ✅ Database tables for tracking usage and purchases
- ✅ Repositories for database operations
- ✅ Configurable usage limits via environment variables
- ✅ Usage limiter utility that checks free tier and premium purchases
- ✅ Usage enforcement integrated into the standup endpoint

**Why this phase?** Before loading real user journals and wiring everything together, we need the foundational database layer and business logic for limiting AI usage. This ensures we won't accidentally rack up API costs during development.

---

## Phase Overview

```
┌─────────────────────────────────────────────────┐
│  Phase 3: Database + Usage Limits               │
├─────────────────────────────────────────────────┤
│  1. Prisma models (AiUsage, AiPurchase)         │
│  2. Database migration                          │
│  3. Repository layer (data access)              │
│  4. Environment variables for limits            │
│  5. Usage limiter utility (business logic)      │
│  6. Wire usage checks into controller           │
│  7. Test usage limit enforcement                │
└─────────────────────────────────────────────────┘
```

**What you're building:**

```
┌──────────────┐
│  Controller  │
└──────┬───────┘
       │ 1. Check usage limit
       ▼
┌──────────────┐
│ UsageLimiter │───┐ 2. Query purchases
└──────────────┘   │
       │           ▼
       │    ┌─────────────────┐
       │    │ AiPurchase Repo │
       │    └─────────────────┘
       │ 3. Query usage (if no purchase)
       ▼
┌─────────────────┐
│  AiUsage Repo   │
└─────────────────┘
       │ 4. Increment usage
       ▼
   [Database]
```

---

## Step 1: Create Prisma Models

### 1.1: Understand the Data Models

**AiUsage Table:**

- Tracks how many times a user has used a feature in a given month
- Composite unique key: `(userId, feature, month)`
- Automatically resets each month (new month = new row)

**AiPurchase Table:**

- Tracks premium purchases for unlimited access
- Supports time-based limits (`expiresAt`) and count-based limits (`generationsLimit`)
- Flexible: can have lifetime purchases (expiresAt = null) or limited purchases

**Why separate tables?**

- Keeps `User` model clean (no AI-specific fields)
- Easy to add new AI features (just add new feature strings)
- Purchase history preserved (not just boolean flags)

### 1.2: Add Models to Prisma Schema

**File:** `prisma/schema.prisma`

Find your existing `User` model and add these two new models below it:

```prisma
// Add these two models to your schema.prisma

model AiUsage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  feature   String   // 'standup' | 'promotion' | 'resume' | 'interview'
  month     String   // 'YYYY-MM' format (e.g., '2025-01')
  count     Int      @default(0)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relation to User
  user User @relation("UserAiUsage", fields: [userId], references: [id], onDelete: Cascade)

  // Composite unique constraint (one row per user/feature/month)
  @@unique([userId, feature, month])

  // Index for fast lookups
  @@index([userId, feature, month])

  @@map("ai_usage")
}

model AiPurchase {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  product   String   // 'standup-pro' | 'promotion-builder' | 'resume-generator' | 'interview-coach'

  // Purchase metadata
  purchasedAt DateTime @default(now()) @map("purchased_at")
  expiresAt   DateTime? @map("expires_at")  // null = lifetime access

  // Generation limits (for count-based limits)
  generationsLimit Int? @map("generations_limit")  // null = unlimited
  generationsUsed  Int @default(0) @map("generations_used")

  // Payment metadata (optional, for Stripe integration later)
  amount      Int?     // Amount in cents (e.g., 900 for $9.00)
  currency    String?  // 'usd', 'eur', etc.

  createdAt   DateTime @default(now()) @map("created_at")

  // Relation to User
  user User @relation("UserAiPurchases", fields: [userId], references: [id], onDelete: Cascade)

  // Indexes for fast queries
  @@index([userId, product])
  @@index([userId, product, expiresAt])

  @@map("ai_purchases")
}
```

**Now update your existing `User` model** to add the relations:

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // ... existing fields ...

  // Add these two relation fields
  aiUsage     AiUsage[]    @relation("UserAiUsage")
  aiPurchases AiPurchase[] @relation("UserAiPurchases")

  // ... rest of model ...
}
```

**Why these field choices?**

- `month` as string (`'YYYY-MM'`): Easy to query, human-readable, SQL-friendly
- `expiresAt` nullable: Supports both lifetime and time-limited purchases
- `generationsLimit` nullable: Supports both unlimited and count-limited purchases
- `onDelete: Cascade`: When user is deleted, usage/purchases are deleted too
- `@@unique([userId, feature, month])`: Ensures one usage row per user/feature/month
- `@@index([...])`: Fast queries for usage checks

### 1.3: Generate and Run Migration

```bash
cd packages/api

# Generate migration
pnpm prisma migrate dev --name ai_usage_and_purchases

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Apply migration to your database
# 3. Regenerate Prisma Client
```

**Expected output:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "papyrus" at "..."

Applying migration `20250107120000_ai_usage_and_purchases`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250107120000_ai_usage_and_purchases/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.9.1) to ./node_modules/@prisma/client
```

**Verify migration:**

```bash
# Open Prisma Studio to see new tables
pnpm prisma studio
```

You should see two new tables: `ai_usage` and `ai_purchases`.

---

## Step 2: Create Repository Layer

### 2.1: Understand Repository Pattern

**Why repositories?**

- Encapsulate database queries (controller doesn't talk to Prisma directly)
- Easy to test (mock repositories in tests)
- Consistent data access patterns across the API
- Follows existing codebase conventions (you likely already have `journalRepository`, `userRepository`, etc.)

**Repository responsibilities:**

- Execute Prisma queries
- Map Prisma models to domain types (if needed)
- Handle database errors
- NO business logic (that goes in services/utilities)

### 2.2: Create AiUsage Repository

**File:** `src/domain/repositories/ai-usage.repository.ts`

```typescript
import { prisma } from '../../lib/prisma.js';
import type { AiUsage } from '@prisma/client';

/**
 * Repository for AiUsage table operations
 *
 * Handles:
 * - Finding usage records by user/feature/month
 * - Upserting (insert or update) usage counts
 */
export const aiUsageRepository = {
  /**
   * Find usage record for a specific user/feature/month
   * Returns null if no record exists (user hasn't used feature this month)
   */
  async findUsage(
    userId: string,
    feature: string,
    month: string // 'YYYY-MM' format
  ): Promise<AiUsage | null> {
    return prisma.aiUsage.findUnique({
      where: {
        userId_feature_month: {
          userId,
          feature,
          month,
        },
      },
    });
  },

  /**
   * Create or update usage count
   * If record doesn't exist, creates with count = 1
   * If record exists, increments count by 1
   */
  async upsertUsage(
    userId: string,
    feature: string,
    month: string
  ): Promise<AiUsage> {
    return prisma.aiUsage.upsert({
      where: {
        userId_feature_month: {
          userId,
          feature,
          month,
        },
      },
      create: {
        userId,
        feature,
        month,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Get current usage count for a user/feature/month
   * Returns 0 if no record exists
   */
  async getUsageCount(
    userId: string,
    feature: string,
    month: string
  ): Promise<number> {
    const usage = await this.findUsage(userId, feature, month);
    return usage?.count ?? 0;
  },
};
```

**Why these methods?**

- `findUsage`: Used by usage limiter to check current usage
- `upsertUsage`: Atomic increment (no race conditions)
- `getUsageCount`: Convenience method, returns 0 instead of null

### 2.3: Create AiPurchase Repository

**File:** `src/domain/repositories/ai-purchase.repository.ts`

```typescript
import { prisma } from '../../lib/prisma.js';
import type { AiPurchase } from '@prisma/client';

/**
 * Repository for AiPurchase table operations
 *
 * Handles:
 * - Finding active purchases (not expired, within limits)
 * - Recording new purchases
 * - Incrementing generation usage
 */
export const aiPurchaseRepository = {
  /**
   * Find an active purchase for a user/product
   *
   * Active means:
   * - Not expired (expiresAt is null OR in the future)
   * - Within generation limit (generationsLimit is null OR generationsUsed < generationsLimit)
   */
  async findActivePurchase(
    userId: string,
    product: string
  ): Promise<AiPurchase | null> {
    const now = new Date();

    return prisma.aiPurchase.findFirst({
      where: {
        userId,
        product,
        // Not expired
        OR: [
          { expiresAt: null }, // Lifetime purchase
          { expiresAt: { gt: now } }, // Future expiration
        ],
        // Within generation limit
        OR: [
          { generationsLimit: null }, // Unlimited generations
          {
            generationsLimit: { not: null },
            generationsUsed: {
              lt: prisma.aiPurchase.fields.generationsLimit, // Used < limit
            },
          },
        ],
      },
      orderBy: {
        purchasedAt: 'desc', // Most recent purchase first
      },
    });
  },

  /**
   * Increment the generationsUsed counter for a purchase
   * Used after successfully generating AI content
   */
  async incrementGenerationsUsed(purchaseId: string): Promise<AiPurchase> {
    return prisma.aiPurchase.update({
      where: { id: purchaseId },
      data: {
        generationsUsed: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Create a new purchase record
   * (For future payment integration)
   */
  async createPurchase(data: {
    userId: string;
    product: string;
    expiresAt?: Date | null;
    generationsLimit?: number | null;
    amount?: number;
    currency?: string;
  }): Promise<AiPurchase> {
    return prisma.aiPurchase.create({
      data,
    });
  },
};
```

**Why these methods?**

- `findActivePurchase`: Complex query with time/count checks encapsulated
- `incrementGenerationsUsed`: Track usage for count-limited purchases
- `createPurchase`: Placeholder for future Stripe integration

### 2.4: Create Index Files

**File:** `src/domain/repositories/index.ts`

```typescript
export * from './ai-usage.repository.js';
export * from './ai-purchase.repository.js';
// ... export other repositories ...
```

---

## Step 3: Add Environment Variables for Limits

### 3.1: Update .env File

**File:** `packages/api/.env`

Add these lines:

```env
# AI Feature Usage Limits (Free Tier)
AI_STANDUP_FREE_LIMIT=20
AI_PROMOTION_FREE_LIMIT=1
AI_RESUME_FREE_LIMIT=1
AI_INTERVIEW_FREE_LIMIT=1
```

**Why configurable?**

- Easy to change limits without code changes
- Different limits per environment (dev vs prod)
- A/B testing different limits
- Emergency limit adjustments (if costs spike)

### 3.2: Update Zod Schema

**File:** `src/env/config.ts`

Find your existing env schema and add these fields:

```typescript
import { z } from 'zod';

export const envSchema = z.object({
  // ... existing fields (PORT, DATABASE_URL, etc.) ...

  // Anthropic API (from Phase 2)
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  AI_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(2048),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.7),

  // AI Feature Limits (NEW)
  AI_STANDUP_FREE_LIMIT: z.coerce.number().int().positive().default(20),
  AI_PROMOTION_FREE_LIMIT: z.coerce.number().int().positive().default(1),
  AI_RESUME_FREE_LIMIT: z.coerce.number().int().positive().default(1),
  AI_INTERVIEW_FREE_LIMIT: z.coerce.number().int().positive().default(1),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables at startup
export const env = envSchema.parse(process.env);
```

**Why Zod validation?**

- Type-safe access to env vars: `env.AI_STANDUP_FREE_LIMIT` (TypeScript knows it's a number)
- Startup validation: App crashes early if required vars missing
- Default values: Fallback if var not set
- Coercion: Converts string '20' to number 20

**Test validation:**

```bash
# Remove AI_STANDUP_FREE_LIMIT from .env temporarily
# Then start the server
pnpm dev

# Should use default value (20)
# No error because we set .default(20)
```

---

## Step 4: Create Usage Limiter Utility

### 4.1: Understand Usage Limiter Logic

**Flow:**

```
Check Usage Limit
       │
       ├─→ 1. Query active purchase for user/feature
       │   ├─→ Found purchase?
       │   │   ├─→ Time-based: Check expiresAt
       │   │   ├─→ Count-based: Check generationsUsed < generationsLimit
       │   │   └─→ If valid: ALLOW (premium tier)
       │   └─→ No purchase: Fall back to free tier
       │
       └─→ 2. Query usage for current month
           ├─→ Usage count < free tier limit?
           │   └─→ ALLOW (free tier)
           └─→ Usage count >= limit?
               └─→ DENY (limit exceeded)
```

**Why check purchases first?**

- Premium users get better experience (no usage tracking needed)
- Simpler logic (one query instead of two)

### 4.2: Create Usage Limiter

**File:** `src/lib/ai/usage-limiter.ts`

```typescript
import {
  aiUsageRepository,
  aiPurchaseRepository,
} from '../../domain/repositories/index.js';
import { env } from '../../env/config.js';

/**
 * Usage information returned by checkUsage()
 */
export interface UsageInfo {
  allowed: boolean;
  reason:
    | 'premium_unlimited'
    | 'premium_limited'
    | 'free_tier'
    | 'limit_exceeded';

  // For free tier
  used?: number;
  limit?: number;
  resets_at?: string; // ISO date string

  // For premium tier
  purchase_id?: string;
  expires_at?: string | null;
  generations_used?: number;
  generations_limit?: number | null;
}

/**
 * Check if a user is allowed to use an AI feature
 *
 * Logic:
 * 1. Check for active premium purchase (unlimited or count-based)
 * 2. If no purchase, check free tier usage against monthly limit
 *
 * @param userId - User ID
 * @param feature - Feature name ('standup', 'promotion', 'resume', 'interview')
 * @returns UsageInfo object with allow/deny + metadata
 */
export async function checkUsage(
  userId: string,
  feature: string
): Promise<UsageInfo> {
  // Step 1: Check for active premium purchase
  const productName = `${feature}-pro`; // 'standup-pro', 'promotion-pro', etc.

  const activePurchase = await aiPurchaseRepository.findActivePurchase(
    userId,
    productName
  );

  if (activePurchase) {
    // Premium user - check if unlimited or within count limit
    if (activePurchase.generationsLimit === null) {
      // Unlimited generations
      return {
        allowed: true,
        reason: 'premium_unlimited',
        purchase_id: activePurchase.id,
        expires_at: activePurchase.expiresAt?.toISOString() ?? null,
      };
    } else {
      // Count-limited generations
      const remaining =
        activePurchase.generationsLimit - activePurchase.generationsUsed;

      if (remaining > 0) {
        return {
          allowed: true,
          reason: 'premium_limited',
          purchase_id: activePurchase.id,
          generations_used: activePurchase.generationsUsed,
          generations_limit: activePurchase.generationsLimit,
          expires_at: activePurchase.expiresAt?.toISOString() ?? null,
        };
      } else {
        // Count limit exceeded
        return {
          allowed: false,
          reason: 'limit_exceeded',
          purchase_id: activePurchase.id,
          generations_used: activePurchase.generationsUsed,
          generations_limit: activePurchase.generationsLimit,
        };
      }
    }
  }

  // Step 2: No active purchase - check free tier
  const month = getCurrentMonth(); // 'YYYY-MM'
  const used = await aiUsageRepository.getUsageCount(userId, feature, month);
  const limit = getFreeLimit(feature);

  if (used < limit) {
    return {
      allowed: true,
      reason: 'free_tier',
      used,
      limit,
      resets_at: getNextMonthStart().toISOString(),
    };
  } else {
    return {
      allowed: false,
      reason: 'limit_exceeded',
      used,
      limit,
      resets_at: getNextMonthStart().toISOString(),
    };
  }
}

/**
 * Increment usage counter after successful AI generation
 *
 * @param userId - User ID
 * @param feature - Feature name
 * @param purchaseId - Optional purchase ID (if premium user)
 */
export async function incrementUsage(
  userId: string,
  feature: string,
  purchaseId?: string
): Promise<void> {
  if (purchaseId) {
    // Premium user - increment purchase usage
    await aiPurchaseRepository.incrementGenerationsUsed(purchaseId);
  } else {
    // Free tier user - increment monthly usage
    const month = getCurrentMonth();
    await aiUsageRepository.upsertUsage(userId, feature, month);
  }
}

/**
 * Get free tier limit for a feature from environment config
 */
function getFreeLimit(feature: string): number {
  const limits: Record<string, number> = {
    standup: env.AI_STANDUP_FREE_LIMIT,
    promotion: env.AI_PROMOTION_FREE_LIMIT,
    resume: env.AI_RESUME_FREE_LIMIT,
    interview: env.AI_INTERVIEW_FREE_LIMIT,
  };

  return limits[feature] ?? 0;
}

/**
 * Get current month in 'YYYY-MM' format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get start of next month (for resets_at timestamp)
 */
function getNextMonthStart(): Date {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // First day of next month
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
}
```

**Why this design?**

- **Single function**: `checkUsage()` handles all logic (purchase + free tier)
- **Rich metadata**: Returns all info needed for error messages
- **Atomic increment**: `incrementUsage()` uses upsert (no race conditions)
- **Testable**: Pure logic, easy to mock repositories

### 4.3: Create Index File

**File:** `src/lib/ai/index.ts`

```typescript
export * from './anthropic-provider.js';
export * from './prompts/standup.js';
export * from './usage-limiter.js';
```

---

## Step 5: Wire Usage Checks into Controller

### 5.1: Update Controller

**File:** `src/controllers/ai/standup.controller.ts`

```typescript
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AnthropicProvider } from '../../lib/ai/anthropic-provider.js';
import { buildStandupPrompt } from '../../lib/ai/prompts/standup.js';
import { checkUsage, incrementUsage } from '../../lib/ai/usage-limiter.js';

export const StandupController = {
  generate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id; // Set by requireAuthentication middleware

    // ========================================
    // NEW: Check usage limit BEFORE streaming
    // ========================================
    const usageInfo = await checkUsage(userId, 'standup');

    if (!usageInfo.allowed) {
      // Usage limit exceeded - return 429 error
      res.status(429).json({
        error: 'Usage limit exceeded',
        message:
          usageInfo.reason === 'limit_exceeded' && usageInfo.limit
            ? `You've used ${usageInfo.used}/${usageInfo.limit} free requests this month. Resets on ${usageInfo.resets_at}.`
            : 'You have reached your usage limit for this feature.',
        reason: usageInfo.reason,
        usage: usageInfo,
      });
      return;
    }

    // Usage allowed - proceed with streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const writeEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Hardcoded test journal (Phase 2 - we'll load from DB in Phase 4)
      const testJournal = {
        date: '2025-01-07',
        content: `Fixed authentication bug in login flow. Added unit tests for token validation.
Reviewed 3 PRs from the team. All look good, approved 2, requested changes on 1.
Deployed v2.3.0 to staging. Waiting for QA sign-off before production.
Tomorrow: Work on API rate limiting feature. Need to design the Redis caching layer.`,
      };

      writeEvent('thinking', { message: 'Analyzing journals...' });

      // Build prompt and stream AI response
      const prompt = buildStandupPrompt(testJournal);
      const aiProvider = new AnthropicProvider();

      for await (const chunk of aiProvider.stream(prompt)) {
        writeEvent('content', { text: chunk });
      }

      // ========================================
      // NEW: Increment usage counter after success
      // ========================================
      await incrementUsage(
        userId,
        'standup',
        usageInfo.purchase_id // Pass purchase ID if premium user
      );

      // Get updated usage for response
      const updatedUsage = await checkUsage(userId, 'standup');

      // Send final event with usage metadata
      writeEvent('done', {
        journal_date: testJournal.date,
        usage: {
          used: updatedUsage.used ?? 0,
          limit: updatedUsage.limit ?? null,
          resets_at: updatedUsage.resets_at ?? null,
          tier: updatedUsage.reason === 'free_tier' ? 'free' : 'premium',
        },
      });

      res.end();
    } catch (error) {
      console.error('[Standup] Error:', error);
      writeEvent('error', {
        message: 'AI service temporarily unavailable. Please try again later.',
      });
      res.end();
    }
  }),
};
```

**Key changes from Phase 2:**

1. **Check usage before streaming** - Return 429 error if limit exceeded
2. **Increment usage after success** - Only count successful generations
3. **Include usage in done event** - Client can show "X/20 requests used"
4. **Error handling** - Don't increment usage if generation fails

**Why check before AND increment after?**

- **Check before**: Don't waste AI API calls if user is over limit
- **Increment after**: Only count successful generations (not errors)

---

## Step 6: Test Usage Limit Enforcement

### 6.1: Test Free Tier (First Request)

```bash
# Start the server
pnpm dev

# Make a request (should succeed)
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output:**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday:\n- Fixed authentication bug..."}

event: done
data: {"journal_date":"2025-01-07","usage":{"used":1,"limit":20,"resets_at":"2025-02-01T00:00:00.000Z","tier":"free"}}
```

**Verify in database:**

```bash
pnpm prisma studio
```

Navigate to `ai_usage` table. You should see:

- `userId`: Your user ID
- `feature`: `'standup'`
- `month`: `'2025-01'`
- `count`: `1`

### 6.2: Test Free Tier (Hit Limit)

**Manually set usage count to limit:**

```bash
# Open Prisma Studio
pnpm prisma studio

# Find your usage row in ai_usage table
# Edit count to 20 (the limit)
# Save
```

**Make another request:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output (429 error):**

```json
{
  "error": "Usage limit exceeded",
  "message": "You've used 20/20 free requests this month. Resets on 2025-02-01T00:00:00.000Z.",
  "reason": "limit_exceeded",
  "usage": {
    "allowed": false,
    "reason": "limit_exceeded",
    "used": 20,
    "limit": 20,
    "resets_at": "2025-02-01T00:00:00.000Z"
  }
}
```

**Why 429 status code?**

- Standard HTTP status for rate limiting
- Clients can handle it specifically
- Different from 403 Forbidden (not a permissions issue)

### 6.3: Test Premium Tier (Unlimited)

**Create a premium purchase:**

```bash
# Open Prisma Studio
pnpm prisma studio

# Go to ai_purchases table
# Click "Add record"
# Fill in:
#   userId: <your user ID>
#   product: 'standup-pro'
#   purchasedAt: <current date>
#   expiresAt: null (for lifetime)
#   generationsLimit: null (for unlimited)
#   generationsUsed: 0
# Save
```

**Make a request:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output:**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday:\n- Fixed..."}

event: done
data: {"journal_date":"2025-01-07","usage":{"used":0,"limit":null,"resets_at":null,"tier":"premium"}}
```

**Verify:**

- Even though `ai_usage.count` is 20, request succeeds
- Premium purchase bypasses free tier limit
- `tier: 'premium'` in response

### 6.4: Test Premium Tier (Count-Limited)

**Update purchase to have count limit:**

```bash
# Open Prisma Studio
# Edit your purchase record:
#   generationsLimit: 5
#   generationsUsed: 4
# Save
```

**Make a request (should succeed):**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

Expected: Succeeds, `generationsUsed` increments to 5.

**Make another request (should fail):**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

Expected: 429 error (count limit reached).

### 6.5: Test Environment Variable Changes

**Change free tier limit:**

```env
# In .env, change:
AI_STANDUP_FREE_LIMIT=5
```

**Restart server:**

```bash
# Ctrl+C to stop
pnpm dev
```

**Reset usage count in database:**

```bash
# Prisma Studio: Set ai_usage.count = 0
```

**Make requests until limit hit:**

```bash
# Should fail on 6th request (5 is new limit)
```

---

## Step 7: Troubleshooting

### Issue: "Cannot find module 'ai-usage.repository'"

**Cause:** Repository files not exported or wrong file extension.

**Fix:**

```bash
# Check that index.ts exists and exports repositories
cat src/domain/repositories/index.ts

# Should include:
# export * from './ai-usage.repository.js';
# export * from './ai-purchase.repository.js';
```

**Note the `.js` extension** - TypeScript requires it for ESM imports even though files are `.ts`.

### Issue: "Table 'ai_usage' does not exist"

**Cause:** Migration not applied.

**Fix:**

```bash
cd packages/api

# Check migration status
pnpm prisma migrate status

# If migration is pending
pnpm prisma migrate deploy

# If migration is broken
pnpm prisma migrate reset  # WARNING: Deletes all data
pnpm prisma migrate dev --name ai_usage_and_purchases
```

### Issue: Usage count not incrementing

**Cause:** `incrementUsage()` not called or called before success.

**Fix:**

- Ensure `incrementUsage()` is called AFTER AI streaming completes
- Check for early returns or exceptions that skip increment
- Add logging:

```typescript
await incrementUsage(userId, 'standup', usageInfo.purchase_id);
console.log(`[Usage] Incremented usage for user ${userId}, feature: standup`);
```

### Issue: Premium purchase not recognized

**Cause:** Query logic error or wrong product name.

**Fix:**

- Verify product name matches: `'standup-pro'` (not `'standup'`)
- Check `expiresAt` is null or in future
- Check `generationsLimit` vs `generationsUsed`
- Add logging in `findActivePurchase()`:

```typescript
console.log('[Purchase] Query:', { userId, product, now });
console.log('[Purchase] Found:', activePurchase);
```

### Issue: 429 error immediately after server restart

**Cause:** Usage count persisted in database from previous tests.

**Fix:**

```bash
# Reset usage count in Prisma Studio
# OR delete the row entirely
# New month will start fresh automatically
```

### Issue: Zod validation error on startup

**Cause:** Environment variables not set or invalid.

**Fix:**

```bash
# Check .env file has all required vars
cat packages/api/.env | grep AI_

# Should see:
# AI_STANDUP_FREE_LIMIT=20
# AI_PROMOTION_FREE_LIMIT=1
# AI_RESUME_FREE_LIMIT=1
# AI_INTERVIEW_FREE_LIMIT=1

# Restart server
pnpm dev
```

---

## Success Criteria

Before moving to Phase 4, verify:

- [x] **Database tables created**
  - `ai_usage` and `ai_purchases` tables exist in database
  - Can insert/query rows via Prisma Studio

- [x] **Repositories work**
  - Can query usage: `aiUsageRepository.findUsage()`
  - Can upsert usage: `aiUsageRepository.upsertUsage()`
  - Can query purchases: `aiPurchaseRepository.findActivePurchase()`

- [x] **Environment variables configured**
  - All `AI_*_FREE_LIMIT` vars in `.env`
  - Zod validates on server startup
  - Can change limits without code changes

- [x] **Usage limiter works**
  - Free tier: Allows requests under limit
  - Free tier: Blocks requests over limit (429 error)
  - Premium tier: Bypasses free tier limit
  - Count-limited premium: Respects generation limits

- [x] **Controller enforces limits**
  - Checks usage before streaming
  - Increments usage after success
  - Returns usage metadata in `done` event
  - Returns 429 error when limit exceeded

- [x] **Testing verified**
  - Manually tested all scenarios
  - Database updates correctly
  - Error messages are helpful

---

## What's Next?

**Phase 4: Full Integration** will:

1. **Load real journals from database** (instead of hardcoded test data)
2. **Add request validation** (Zod schemas for date/range)
3. **Create service layer** (move business logic out of controller)
4. **Support three modes:**
   - Empty request → Load most recent journal
   - `{ date }` → Load specific date
   - `{ from, to }` → Load date range
5. **Add error handling:**
   - No journals found → 404 error
   - Invalid date format → 422 validation error
6. **Implement journal date logic** (use last available journal, not hardcoded)

**You now have:**

- ✅ Database persistence
- ✅ Usage limit enforcement
- ✅ Premium tier support
- ✅ Configurable limits

**Ready to wire it all together!** 🚀

---

## Quick Reference

**Check usage:**

```typescript
const usageInfo = await checkUsage(userId, 'standup');
if (!usageInfo.allowed) {
  // Return 429 error
}
```

**Increment usage:**

```typescript
await incrementUsage(userId, 'standup', purchaseId);
```

**Query current usage:**

```typescript
const count = await aiUsageRepository.getUsageCount(
  userId,
  'standup',
  '2025-01'
);
```

**Create test purchase:**

```bash
# Via Prisma Studio or:
await aiPurchaseRepository.createPurchase({
  userId: 'user_123',
  product: 'standup-pro',
  expiresAt: null, // Lifetime
  generationsLimit: null, // Unlimited
});
```

**Current month:**

```typescript
const month = getCurrentMonth(); // '2025-01'
```
