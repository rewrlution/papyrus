# Phase 3: Database + Usage Limits - Tutorial

## Goal

Add database persistence and enforce usage limits for the AI standup feature. After this phase, you'll have:

- ✅ Database tables for tracking usage and purchases
- ✅ Repositories for database operations
- ✅ Configurable usage limits via environment variables
- ✅ Usage limiter utility with **free tier first** logic
- ✅ Time-based unlimited premium access (no counting anxiety)
- ✅ Usage enforcement integrated into the standup endpoint

**Why this phase?** Before loading real user journals and wiring everything together, we need the foundational database layer and business logic for limiting AI usage. This ensures we won't accidentally rack up API costs during development.

---

## Monetization Model Overview

> **Full details:** See [AI-MONETIZATION.md](/docs/AI-MONETIZATION.md)

### Pricing Table

| Product                    | Free Tier | Price | Duration | Access    |
| -------------------------- | --------- | ----- | -------- | --------- |
| **Standup Pro**            | 10/month  | $9    | 90 days  | Unlimited |
| **Promotion Builder**      | 1/account | $19   | 30 days  | Unlimited |
| **Resume & Interview Pro** | None      | $29   | 30 days  | Unlimited |

**Note:** Resume & Interview Pro is a single purchase that unlocks both resume generation and interview preparation features. There is no free tier for these features.

### Key Design Decisions

1. **Time-based unlimited access** - Users don't count generations, just check expiration
2. **Free tier first** - Users always get their free allocation before premium kicks in (for features that have a free tier)
3. **Monthly vs Lifetime** - Standup resets monthly; Promotion is one-time trial per account; Resume & Interview has no free tier
4. **Rate limiting for cost control** - Invisible to normal users, prevents abuse

---

## Phase Overview

```
┌─────────────────────────────────────────────────┐
│  Phase 3: Database + Usage Limits               │
├─────────────────────────────────────────────────┤
│  1. Prisma models (AiUsage, AiTrialUsage,       │
│     AiPurchase)                                 │
│  2. Database migration                          │
│  3. Repository layer (data access)              │
│  4. Environment variables for limits            │
│  5. Feature config with discriminated unions    │
│  6. Usage limiter utility (free first logic)    │
│  7. Wire usage checks into controller           │
│  8. Test usage limit enforcement                │
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
│ UsageLimiter │
└──────┬───────┘
       │
       ├─→ 2. Check FREE TIER first
       │      ├─ Monthly (Standup): Check AiUsage table
       │      │  └─ count < limit this month?
       │      ├─ Trial (Promotion): Check AiTrialUsage table
       │      │  └─ Row exists? (hasUsedTrial)
       │      └─ None (Resume/Interview): Skip to purchase
       │
       ├─→ 3. If free exhausted, check PURCHASE (AiPurchase)
       │      └─ Has active purchase? (expiresAt > now)
       │
       └─→ 4. Increment usage (only on success)
              ├─ Monthly: Increment AiUsage.count
              ├─ Trial: Create AiTrialUsage record
              └─ Premium: No increment (time-based)
```

---

## Step 1: Create Prisma Models

### 1.1: Understand the Data Models

**AiUsage Table (Monthly Free Tier):**

- Tracks usage for features with monthly-resetting free tiers (e.g., Standup)
- Composite key: `(userId, feature, month)` where `month` is always 'YYYY-MM' format
- Resets automatically each month (new month = new row)

**AiTrialUsage Table (Lifetime Trial):**

- Tracks one-time free trials (e.g., Promotion Builder)
- Composite key: `(userId, feature)` - if row exists, trial has been used
- Simple boolean check: row exists = trial used, no row = trial available

**AiPurchase Table (Premium Access):**

- Tracks premium purchases for unlimited access
- Time-based: `expiresAt` determines if purchase is active
- No counting needed - if `expiresAt > now`, user has access

**Why separate tables for usage tracking?**

- **Semantic clarity:** `month` field is always a month (not "lifetime")
- **Simpler queries:** No special case handling needed
- **Clear intent:** Each table's purpose is obvious at a glance
- **Better architecture:** Tables match the actual business logic

**Why separate from User table?**

- Keeps `User` model clean (no AI-specific fields)
- Easy to add new AI features (just add new feature strings)
- Purchase history preserved (not just boolean flags)
- Free tier and premium tracked independently

### 1.2: Add Models to Prisma Schema

**File:** `prisma/schema.prisma`

Find your existing `User` model and add these three new models below it:

```prisma
// Add these three models to your schema.prisma

// Monthly usage tracking (Standup)
model AiUsage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  feature   String   // 'standup'
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

// Lifetime trial tracking (Promotion Builder)
model AiTrialUsage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  feature   String   // 'promotion'
  usedAt    DateTime @default(now()) @map("used_at")

  // Relation to User
  user User @relation("UserAiTrialUsage", fields: [userId], references: [id], onDelete: Cascade)

  // Composite unique constraint (one row per user/feature)
  @@unique([userId, feature])

  @@map("ai_trial_usage")
}

// Premium purchases
model AiPurchase {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  product   String   // 'standup-pro' | 'promotion-pro' | 'resume-interview-pro'

  // Purchase metadata
  purchasedAt DateTime @default(now()) @map("purchased_at")
  expiresAt   DateTime @map("expires_at")  // When access expires

  // Legacy fields (kept for flexibility, set to null for time-based model)
  generationsLimit Int? @map("generations_limit")  // null = time-based unlimited
  generationsUsed  Int  @default(0) @map("generations_used")  // Not used for time-based

  // Payment metadata (for Stripe integration later)
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

  // Add these three relation fields
  aiUsage      AiUsage[]      @relation("UserAiUsage")
  aiTrialUsage AiTrialUsage[] @relation("UserAiTrialUsage")
  aiPurchases  AiPurchase[]   @relation("UserAiPurchases")

  // ... rest of model ...
}
```

**Why these field choices?**

- **AiUsage.month:** Always 'YYYY-MM' format - no special cases
- **AiTrialUsage.usedAt:** Timestamp when trial was used (useful for analytics)
- **AiPurchase.expiresAt:** Required field - all purchases are time-based
- **generationsLimit:** Nullable, set to `null` for time-based unlimited model
- **onDelete: Cascade:** When user is deleted, all related records are deleted too

### 1.3: Generate and Run Migration

```bash
cd packages/api

# Generate migration
pnpm prisma migrate dev --name ai_usage_trial_and_purchases

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Apply migration to your database
# 3. Regenerate Prisma Client
```

**Verify migration:**

```bash
# Open Prisma Studio to see new tables
pnpm prisma studio
```

You should see three new tables: `ai_usage`, `ai_trial_usage`, and `ai_purchases`.

---

## Step 2: Create Repository Layer

### 2.1: Understand Repository Pattern

**Why repositories?**

- Encapsulate database queries (controller doesn't talk to Prisma directly)
- Easy to test (mock repositories in tests)
- Consistent data access patterns across the API
- Follows existing codebase conventions

**Repository responsibilities:**

- Execute Prisma queries
- Map Prisma models to domain types (if needed)
- Handle database errors
- NO business logic (that goes in services/utilities)

### 2.2: Create AiUsage Repository (Monthly Tracking)

**File:** `src/domain/repositories/ai-usage.repository.ts`

```typescript
import type { AiUsage } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiUsage table operations (monthly tracking)
 *
 * Handles features with monthly-resetting free tiers (e.g., Standup)
 */
export const aiUsageRepository = {
  /**
   * Find usage record for a specific user/feature/month
   * Returns null if no record exists
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

- `findUsage`: Check current month usage
- `upsertUsage`: Atomic increment (no race conditions)
- `getUsageCount`: Convenience method, returns 0 instead of null

### 2.3: Create AiTrialUsage Repository (Lifetime Trial Tracking)

**File:** `src/domain/repositories/ai-trial-usage.repository.ts`

```typescript
import type { AiTrialUsage } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiTrialUsage table operations (lifetime trial tracking)
 *
 * Handles features with one-time free trials (e.g., Promotion Builder)
 */
export const aiTrialUsageRepository = {
  /**
   * Check if a user has used their free trial for a feature
   * Returns true if trial has been used, false if still available
   */
  async hasUsedTrial(userId: string, feature: string): Promise<boolean> {
    const record = await prisma.aiTrialUsage.findUnique({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
    return !!record;
  },

  /**
   * Mark a trial as used
   * Creates a record indicating the user has used their free trial
   */
  async markTrialUsed(userId: string, feature: string): Promise<AiTrialUsage> {
    return prisma.aiTrialUsage.create({
      data: {
        userId,
        feature,
      },
    });
  },

  /**
   * Get trial usage record (if exists)
   * Returns null if trial hasn't been used yet
   */
  async findTrialUsage(
    userId: string,
    feature: string
  ): Promise<AiTrialUsage | null> {
    return prisma.aiTrialUsage.findUnique({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
  },
};
```

**Why this approach?**

- **Simple boolean check:** Row exists = trial used, no row = trial available
- **No counters needed:** Just existence check via unique constraint
- **Clear intent:** `hasUsedTrial()` and `markTrialUsed()` are self-documenting
- **Immutable:** Once created, record never changes (audit trail)

### 2.4: Create AiPurchase Repository

**File:** `src/domain/repositories/ai-purchase.repository.ts`

```typescript
import type { AiPurchase } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiPurchase table operations
 *
 * Handles:
 * - Finding active purchases (not expired)
 * - Recording new purchases
 */
export const aiPurchaseRepository = {
  /**
   * Find an active purchase for a user/product
   *
   * Active means: expiresAt > now
   *
   * Time-based model: We only check expiration, not generation counts
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
        expiresAt: { gt: now }, // Not expired
      },
      orderBy: {
        expiresAt: 'desc', // Latest expiration first
      },
    });
  },

  /**
   * Create a new purchase record
   *
   * @param data - Purchase data
   * @param data.userId - User ID
   * @param data.product - Product name (e.g., 'standup-pro')
   * @param data.expiresAt - When the purchase expires
   * @param data.amount - Optional amount in cents
   * @param data.currency - Optional currency code
   */
  async createPurchase(data: {
    userId: string;
    product: string;
    expiresAt: Date;
    amount?: number;
    currency?: string;
  }): Promise<AiPurchase> {
    return prisma.aiPurchase.create({
      data: {
        userId: data.userId,
        product: data.product,
        expiresAt: data.expiresAt,
        amount: data.amount,
        currency: data.currency,
        generationsLimit: null, // Time-based model
        generationsUsed: 0,
      },
    });
  },

  /**
   * Get all purchases for a user (for account page)
   */
  async findAllByUser(userId: string): Promise<AiPurchase[]> {
    return prisma.aiPurchase.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
    });
  },
};
```

**Why this is simpler than before:**

- No `generationsUsed` tracking needed
- Just check `expiresAt > now`
- No complex AND/OR conditions

### 2.5: Update Repository Index

**File:** `src/domain/repositories/index.ts`

```typescript
export * from './ai-usage.repository.js';
export * from './ai-trial-usage.repository.js';
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
AI_STANDUP_FREE_LIMIT=10
AI_PROMOTION_FREE_LIMIT=1
# Note: Resume & Interview Pro has no free tier
```

**Why configurable?**

- Easy to change limits without code changes
- Different limits per environment (dev vs prod)
- A/B testing different limits
- Emergency limit adjustments (if costs spike)

**Note:** Resume and Interview features share a single product (`resume-interview-pro`) with no free tier, so no environment variables are needed for their free limits.

### 3.2: Update Zod Schema

**File:** `src/env/config.ts`

Find your existing env schema and add these fields:

```typescript
import { z } from 'zod';

export const envSchema = z.object({
  // ... existing fields (PORT, DATABASE_URL, etc.) ...

  // Anthropic API (from Phase 2)
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  AI_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(2048),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.7),

  // AI Feature Limits (NEW)
  // Only features with free tiers need limits
  AI_STANDUP_FREE_LIMIT: z.coerce.number().int().positive().default(10),
  AI_PROMOTION_FREE_LIMIT: z.coerce.number().int().positive().default(1),
  // Note: Resume & Interview Pro has no free tier, so no limit env vars needed
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables at startup
export const env = envSchema.parse(process.env);
```

---

## Step 4: Create Usage Limiter Utility

### 4.1: Understand Usage Limiter Logic

**Flow: Free Tier First**

```
Check Usage Limit
       │
       ├─→ 1. Check FREE TIER first
       │   ├─→ Monthly (Standup): Check AiUsage table
       │   │   └─→ count < limit this month? → ALLOW
       │   ├─→ Trial (Promotion): Check AiTrialUsage table
       │   │   └─→ Row exists? If no → ALLOW
       │   └─→ None (Resume/Interview): Skip to purchase
       │
       └─→ 2. Free exhausted? Check PURCHASE
           ├─→ Active purchase? (expiresAt > now)
           │   └─→ If yes: ALLOW (premium tier)
           └─→ No purchase?
               └─→ DENY (limit exceeded)
```

**Why free tier first?**

- Users always get their full free allowance
- Premium feels like "extra" on top
- Impossible to be "worse off" after purchasing
- Simpler mental model for users

### 4.2: Define Feature Configuration

**File:** `src/lib/ai/feature-config.ts`

```typescript
import { env } from '../../env/config.js';

/**
 * Free tier configuration using discriminated unions
 * Maps directly to database tables:
 * - 'monthly': Uses AiUsage table (count per month)
 * - 'trial': Uses AiTrialUsage table (one-time check)
 * - 'none': No free tier (skip to purchase check)
 */
export type FreeTierConfig =
  | { type: 'monthly'; limit: number }
  | { type: 'trial' } // Always one-time, no limit needed
  | { type: 'none' };

/**
 * Configuration for each AI feature
 */
export type FeatureConfig = {
  name: string;
  productName: string;
  freeTier: FreeTierConfig;
  rateLimit: number;
  price: number; // in cents
  duration: number; // in days
};

/**
 * Feature configuration map
 *
 * - standup: Monthly free tier (daily habit feature)
 * - promotion: One-time trial (one-time trial per account)
 * - resume & interview: No free tier, shared product
 */
export const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  standup: {
    name: 'standup',
    productName: 'standup-pro',
    freeTier: { type: 'monthly', limit: env.AI_STANDUP_FREE_LIMIT },
    rateLimit: 20,
    price: 900, // $9
    duration: 90,
  },
  promotion: {
    name: 'promotion',
    productName: 'promotion-pro',
    freeTier: { type: 'trial' }, // One-time trial
    rateLimit: 10,
    price: 1900, // $19
    duration: 30,
  },
  resume: {
    name: 'resume',
    productName: 'resume-interview-pro', // Shared product
    freeTier: { type: 'none' }, // No free tier
    rateLimit: 20,
    price: 2900, // $29
    duration: 30,
  },
  interview: {
    name: 'interview',
    productName: 'resume-interview-pro', // Shared product
    freeTier: { type: 'none' }, // No free tier
    rateLimit: 30,
    price: 2900, // $29
    duration: 30,
  },
};

/**
 * Get feature configuration by name
 * Throws if feature not found
 */
export function getFeatureConfig(feature: string): FeatureConfig {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    throw new Error(`Unknown feature: ${feature}`);
  }
  return config;
}
```

**Why discriminated unions?**

- **Type safety:** TypeScript enforces correct usage at compile time
- **Clear mapping:** `type` directly maps to which table/logic to use
- **Self-documenting:** Code is more readable without comments
- **Exhaustive checking:** TypeScript ensures all cases are handled

### 4.3: Create Usage Limiter

**File:** `src/lib/ai/usage-limiter.ts`

```typescript
import {
  aiUsageRepository,
  aiTrialUsageRepository,
  aiPurchaseRepository,
} from '../../domain/repositories/index.js';
import { getFeatureConfig } from './feature-config.js';

/**
 * Usage information returned by checkUsage()
 */
export interface UsageInfo {
  allowed: boolean;
  reason: 'free_tier' | 'premium' | 'limit_exceeded';

  // For free tier
  used?: number;
  limit?: number;
  resets_at?: string | null; // ISO date string (null for lifetime)

  // For premium tier
  expires_at?: string; // ISO date string
}

/**
 * Check if a user is allowed to use an AI feature
 *
 * Logic: FREE TIER FIRST
 * 1. Check free tier availability
 * 2. If free exhausted, check for active premium purchase
 *
 * @param userId - User ID
 * @param feature - Feature name ('standup', 'promotion', 'resume', 'interview')
 * @returns UsageInfo object with allow/deny + metadata
 */
export async function checkUsage(
  userId: string,
  feature: string
): Promise<UsageInfo> {
  const config = getFeatureConfig(feature);

  // Step 1: Check FREE TIER first
  const freeUsage = await checkFreeTier(userId, feature, config);

  if (freeUsage.allowed) {
    return freeUsage;
  }

  // Step 2: Free tier exhausted - check for premium purchase
  const activePurchase = await aiPurchaseRepository.findActivePurchase(
    userId,
    config.productName
  );

  if (activePurchase) {
    return {
      allowed: true,
      reason: 'premium',
      expires_at: activePurchase.expiresAt.toISOString(),
    };
  }

  // Step 3: No free tier, no premium - denied
  return freeUsage; // Contains limit_exceeded info
}

/**
 * Check free tier availability using discriminated unions
 */
async function checkFreeTier(
  userId: string,
  feature: string,
  config: ReturnType<typeof getFeatureConfig>
): Promise<UsageInfo> {
  const { freeTier } = config;

  // No free tier - skip to purchase check
  if (freeTier.type === 'none') {
    return {
      allowed: false,
      reason: 'limit_exceeded',
      used: 0,
      limit: 0,
      resets_at: null,
    };
  }

  // Monthly tracking (Standup) - uses AiUsage table
  if (freeTier.type === 'monthly') {
    const month = getCurrentMonth();
    const used = await aiUsageRepository.getUsageCount(userId, feature, month);
    const allowed = used < freeTier.limit;

    return {
      allowed,
      reason: allowed ? 'free_tier' : 'limit_exceeded',
      used,
      limit: freeTier.limit,
      resets_at: getNextMonthStart().toISOString(),
    };
  }

  // Lifetime trial (Promotion) - uses AiTrialUsage table
  if (freeTier.type === 'trial') {
    const hasUsed = await aiTrialUsageRepository.hasUsedTrial(userId, feature);
    const used = hasUsed ? 1 : 0;
    const allowed = !hasUsed;

    return {
      allowed,
      reason: allowed ? 'free_tier' : 'limit_exceeded',
      used,
      limit: 1, // Trials are always one-time
      resets_at: null, // Never resets
    };
  }

  // TypeScript exhaustiveness check ensures we handle all cases
  const _exhaustive: never = freeTier;
  throw new Error(`Unhandled free tier type: ${JSON.stringify(_exhaustive)}`);
}

/**
 * Increment usage counter after successful AI generation
 *
 * @param userId - User ID
 * @param feature - Feature name
 * @param usageInfo - Usage info from checkUsage (to determine if free or premium)
 */
export async function incrementUsage(
  userId: string,
  feature: string,
  usageInfo: UsageInfo
): Promise<void> {
  // Only increment for free tier usage
  // Premium is time-based, no counting needed
  if (usageInfo.reason === 'free_tier') {
    const config = getFeatureConfig(feature);
    const { freeTier } = config;

    if (freeTier.type === 'monthly') {
      // Monthly tracking: Increment count in AiUsage table
      const month = getCurrentMonth();
      await aiUsageRepository.upsertUsage(userId, feature, month);
    } else if (freeTier.type === 'trial') {
      // Lifetime trial: Mark trial as used in AiTrialUsage table
      await aiTrialUsageRepository.markTrialUsed(userId, feature);
    }
    // freeTier.type === 'none' won't reach here (caught in checkUsage)
  }
  // Premium users: No increment needed (time-based access)
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

**Key improvements with new design:**

- **Two-table approach:** AiUsage for monthly, AiTrialUsage for trials
- **Discriminated unions:** Type-safe free tier configuration
- **Clear mapping:** `freeTier.type` directly maps to which table/logic to use
- **Exhaustiveness checking:** TypeScript ensures all cases are handled
- **No semantic confusion:** No more "resetPeriod: 'lifetime'" or "month: 'lifetime'"
- **Simple boolean check:** `hasUsedTrial()` is more readable than aggregating counts

### 4.4: Create Index File

**File:** `src/lib/ai/index.ts`

```typescript
export * from './anthropic-provider.js';
export * from './prompts/standup.js';
export * from './usage-limiter.js';
export * from './feature-config.js';
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
import { getFeatureConfig } from '../../lib/ai/feature-config.js';

export const StandupController = {
  generate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id; // Set by requireAuthentication middleware

    // ========================================
    // Check usage limit BEFORE streaming
    // ========================================
    const usageInfo = await checkUsage(userId, 'standup');

    if (!usageInfo.allowed) {
      // Usage limit exceeded - return 429 error
      const config = getFeatureConfig('standup');

      res.status(429).json({
        error: 'Usage limit exceeded',
        message: usageInfo.resets_at
          ? `You've used ${usageInfo.used}/${usageInfo.limit} free requests this month. Resets on ${new Date(usageInfo.resets_at).toLocaleDateString()}.`
          : `You've used your free trial. Purchase ${config.productName} to continue.`,
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
      // Increment usage counter after success
      // ========================================
      await incrementUsage(userId, 'standup', usageInfo);

      // Get updated usage for response
      const updatedUsage = await checkUsage(userId, 'standup');

      // Send final event with usage metadata
      writeEvent('done', {
        journal_date: testJournal.date,
        usage: {
          tier: updatedUsage.reason === 'premium' ? 'premium' : 'free',
          used: updatedUsage.used ?? null,
          limit: updatedUsage.limit ?? null,
          resets_at: updatedUsage.resets_at ?? null,
          expires_at: updatedUsage.expires_at ?? null,
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

**Key changes:**

1. **Check usage before streaming** - Return 429 if limit exceeded
2. **Increment after success only** - Pass `usageInfo` to know if free or premium
3. **Updated usage response** - Shows tier, used, limit, and reset/expiry info
4. **Better error messages** - Different messages for monthly (with reset date) vs trial (no reset)

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
data: {"journal_date":"2025-01-07","usage":{"tier":"free","used":1,"limit":10,"resets_at":"2025-02-01T00:00:00.000Z","expires_at":null}}
```

**Verify in database:**

```bash
pnpm prisma studio
```

Navigate to `ai_usage` table. You should see:

- `userId`: Your user ID
- `feature`: `'standup'`
- `month`: `'2025-01'` (current month)
- `count`: `1`

### 6.2: Test Free Tier (Hit Limit)

**Manually set usage count to limit:**

```bash
# Open Prisma Studio
pnpm prisma studio

# Find your usage row in ai_usage table
# Edit count to 10 (the limit)
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
  "message": "You've used 10/10 free requests this month. Resets on 2/1/2025.",
  "reason": "limit_exceeded",
  "usage": {
    "allowed": false,
    "reason": "limit_exceeded",
    "used": 10,
    "limit": 10,
    "resets_at": "2025-02-01T00:00:00.000Z"
  }
}
```

### 6.3: Test Premium Tier (Time-Based)

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
#   expiresAt: <90 days from now>
#   generationsLimit: null (leave empty)
#   generationsUsed: 0
# Save
```

**Make a request (with free tier exhausted):**

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
data: {"journal_date":"2025-01-07","usage":{"tier":"premium","used":null,"limit":null,"resets_at":null,"expires_at":"2025-04-07T00:00:00.000Z"}}
```

**Key observations:**

- Request succeeds even though free tier is exhausted
- `tier: 'premium'` in response
- `expires_at` shows when premium access ends
- `used` and `limit` are null (no counting for premium)

### 6.4: Test Free Tier First (With Premium)

**Reset free tier usage:**

```bash
# In Prisma Studio, set ai_usage.count = 0
```

**Make a request (should use free tier first):**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected:** Uses FREE tier first (not premium), because free tier is available.

```
event: done
data: {"journal_date":"2025-01-07","usage":{"tier":"free","used":1,"limit":10,"resets_at":"2025-02-01T00:00:00.000Z","expires_at":null}}
```

This confirms **free tier first** logic is working correctly.

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

### Issue: "Table 'ai_usage' does not exist"

**Cause:** Migration not applied.

**Fix:**

```bash
cd packages/api

# Check migration status
pnpm prisma migrate status

# Apply pending migrations
pnpm prisma migrate deploy
```

### Issue: Usage count not incrementing

**Cause:** Premium user - no increment needed for time-based model.

**Check:** If `usageInfo.reason === 'premium'`, we don't increment usage.

### Issue: Premium purchase not recognized

**Cause:** `expiresAt` is in the past.

**Fix:** Ensure `expiresAt` is a future date.

```bash
# In Prisma Studio, verify expiresAt > now
```

---

## Success Criteria

Before moving to Phase 4, verify:

- [x] **Database tables created**
  - `ai_usage`, `ai_trial_usage`, and `ai_purchases` tables exist
  - Can insert/query rows via Prisma Studio

- [x] **Feature config with discriminated unions**
  - `FreeTierConfig` type defined with `monthly`, `trial`, `none`
  - Each feature correctly configured
  - TypeScript exhaustiveness checking works

- [x] **Free tier first logic works**
  - Free tier is checked before premium
  - Monthly tracking uses `AiUsage` table
  - Trial tracking uses `AiTrialUsage` table
  - Premium kicks in only when free is exhausted

- [x] **Time-based premium works**
  - Active purchase allows unlimited access
  - No generation counting for premium
  - Expired purchases are ignored

- [x] **Environment variables configured**
  - `AI_STANDUP_FREE_LIMIT=10` in `.env`
  - `AI_PROMOTION_FREE_LIMIT=1` in `.env`
  - Zod validates on server startup

- [x] **Controller enforces limits**
  - Checks usage before streaming
  - Increments usage after success (correct table)
  - Returns 429 when limit exceeded

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

**You now have:**

- ✅ Database persistence (3 tables: AiUsage, AiTrialUsage, AiPurchase)
- ✅ Type-safe feature configuration with discriminated unions
- ✅ Free tier first usage logic (checks AiUsage/AiTrialUsage → AiPurchase)
- ✅ Time-based premium access (no counting)
- ✅ Configurable limits via environment variables

**Ready to wire it all together!**

---

## Quick Reference

**Check usage:**

```typescript
const usageInfo = await checkUsage(userId, 'standup');
if (!usageInfo.allowed) {
  // Return 429 error
}
```

**Increment usage (after success):**

```typescript
await incrementUsage(userId, 'standup', usageInfo);
```

**Query current usage:**

```typescript
// For monthly features (standup)
const month = getCurrentMonth(); // '2025-01'
const count = await aiUsageRepository.getUsageCount(userId, 'standup', month);

// For lifetime trial features (promotion)
const hasUsed = await aiTrialUsageRepository.hasUsedTrial(userId, 'promotion');
```

**Create test purchase:**

```typescript
// Standup Pro (90 days)
await aiPurchaseRepository.createPurchase({
  userId: 'user_123',
  product: 'standup-pro',
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
});

// Resume & Interview Pro (30 days) - unlocks both features
await aiPurchaseRepository.createPurchase({
  userId: 'user_123',
  product: 'resume-interview-pro',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```
