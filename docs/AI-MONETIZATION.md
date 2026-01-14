# AI Features Monetization Model

> Pricing and usage limits for Papyrus AI features

## Overview

Papyrus AI features use a **time-based unlimited access** model with **free tier first** logic. This approach:

- Reduces user anxiety (no counting generations)
- Simplifies implementation (just check expiration)
- Aligns with actual usage patterns (career events are time-bound)
- Controls costs via rate limiting (invisible to normal users)

---

## Pricing Table

| Product                    | Free Tier | Price | Duration | Access    |
| -------------------------- | --------- | ----- | -------- | --------- |
| **Standup Pro**            | 10/month  | $9    | 90 days  | Unlimited |
| **Promotion Builder**      | 1/account | $19   | 30 days  | Unlimited |
| **Resume & Interview Pro** | None      | $29   | 30 days  | Unlimited |

**Note:** Resume & Interview Pro is a combined product covering both resume generation and interview preparation features. There is no free trial - users must purchase to access these features.

---

## Free Tier Details

### Standup (Monthly Reset)

- **Limit:** 10 requests per month
- **Reset:** First day of each month (UTC)
- **Rationale:** Daily habit feature - users need frequent access to build the habit

### Promotion Builder (Lifetime Trial)

- **Limit:** 1 per account (lifetime)
- **Reset:** Never
- **Rationale:** Try once, see the value, then purchase for promotion cycle

**Why lifetime trial (not monthly)?**

- Promotion is a high-value, low-frequency feature (1-2x per year)
- Monthly reset would undermine paid offering (12 free/year > what most need)
- One-time trial creates clear conversion funnel: try → impressed → purchase

### Resume & Interview Pro (No Free Trial)

- **Limit:** 0 (no free access)
- **Rationale:** Premium combined feature for serious job seekers
- **Why no trial?** Resume and interview prep are intensive, time-bound activities. Users in active job search mode are willing to pay for quality tools.

---

## Usage Flow

```
User requests AI feature
       │
       ├─ For Standup & Promotion (has free tier):
       │      │
       │      ├─ 1. Check FREE TIER first
       │      │      ├─ Standup: count < 10 this month?
       │      │      └─ Promotion: ever used before? (total count = 0?)
       │      │
       │      │      If free tier available → Use it, increment count
       │      │
       │      └─ 2. If free exhausted → Check PURCHASE
       │             └─ Has active purchase? (expiresAt > now)
       │             └─ If yes → Allow (time-based, no counting)
       │
       ├─ For Resume & Interview (NO free tier):
       │      │
       │      └─ 1. Check PURCHASE directly
       │             └─ Has active purchase? (expiresAt > now)
       │             └─ If no → 402 "Purchase Resume & Interview Pro"
       │
       ├─ 3. Check RATE LIMIT (invisible to user)
       │      └─ Under daily/hourly limit? → Allow
       │      └─ Over limit? → 429 "Please try again later"
       │
       └─ 4. If no access → 402 Payment Required
              └─ "Purchase [Product] for $X to unlock"
```

**Why free tier first (for features that have it)?**

- Users always get their full free allowance
- Premium feels like "extra" on top of free
- Impossible to be "worse off" after purchasing
- Simpler mental model: "I get X free, plus I bought extra"

**Why no free tier for Resume & Interview?**

- Combined premium feature for serious job seekers
- Active job searchers are willing to pay for quality tools
- Simplifies the product lineup

---

## Rate Limiting (Cost Control)

Rate limits are for **abuse prevention**, not monetization. Normal users will never hit these.

| Feature   | Rate Limit | Rationale                                |
| --------- | ---------- | ---------------------------------------- |
| Standup   | 20/day     | Who needs more than 20 standups per day? |
| Promotion | 10/day     | Reasonable iteration limit               |
| Resume    | 20/day     | Allow trying different bullet points     |
| Interview | 30/day     | Allow practicing different stories       |

**Note:** Resume and Interview share the same product (Resume & Interview Pro) but have separate rate limits per feature.

**Implementation:**

- Return 429 with message: "Please try again later"
- Don't reveal specific limits (prevents gaming)
- Log for abuse detection

---

## Database Schema

### AiUsage Table (Monthly Free Tier Tracking)

Tracks usage for features with monthly-resetting free tiers (e.g., Standup).

```prisma
model AiUsage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  feature   String   // 'standup'
  month     String   // 'YYYY-MM' format (e.g., '2025-01')
  count     Int      @default(0)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation("UserAiUsage", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, feature, month])
  @@index([userId, feature, month])
  @@map("ai_usage")
}
```

### AiTrialUsage Table (Lifetime Trial Tracking)

Tracks one-time free trials for features with lifetime limits (e.g., Promotion Builder).

```prisma
model AiTrialUsage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  feature   String   // 'promotion'
  usedAt    DateTime @default(now()) @map("used_at")

  user User @relation("UserAiTrialUsage", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, feature])
  @@map("ai_trial_usage")
}
```

**Why two tables?**

- **Semantic clarity:** Each table has a clear, single purpose
- **Simpler queries:** No special case handling for "lifetime" values
- **Better matches business logic:** Monthly tracking vs one-time check are fundamentally different operations

### AiPurchase Table (Premium Access)

```prisma
model AiPurchase {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  product     String    // 'standup-pro' | 'promotion-pro' | 'resume-interview-pro'
  purchasedAt DateTime  @default(now())
  expiresAt   DateTime  // When access expires

  // Payment metadata
  amount      Int?      // Amount in cents
  currency    String?   // 'usd', etc.
}
```

**Note:**

- `resume-interview-pro` is a single product that grants access to both resume and interview features
- All purchases are time-based (no generation counting) - just check `expiresAt > now`

### User Model Relations

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // ... existing fields ...

  // AI feature relations
  aiUsage      AiUsage[]      @relation("UserAiUsage")
  aiTrialUsage AiTrialUsage[] @relation("UserAiTrialUsage")
  aiPurchases  AiPurchase[]   @relation("UserAiPurchases")

  // ... rest of model ...
}
```

---

## Product Names

| User-Facing Name       | Database Product       | Feature Name(s)       |
| ---------------------- | ---------------------- | --------------------- |
| Standup Pro            | `standup-pro`          | `standup`             |
| Promotion Builder      | `promotion-pro`        | `promotion`           |
| Resume & Interview Pro | `resume-interview-pro` | `resume`, `interview` |

**Note:** Resume & Interview Pro is a single purchase that unlocks both the resume and interview features.

---

## Environment Variables

```env
# Free Tier Limits
AI_STANDUP_FREE_LIMIT=10      # Per month
AI_PROMOTION_FREE_LIMIT=1     # Per account (lifetime)
# Note: Resume & Interview have no free tier

# Rate Limits (requests per day)
AI_STANDUP_RATE_LIMIT=20
AI_PROMOTION_RATE_LIMIT=10
AI_RESUME_RATE_LIMIT=20
AI_INTERVIEW_RATE_LIMIT=30
```

---

## Feature Configuration

```typescript
/**
 * Free tier configuration using discriminated unions
 * Maps directly to database tables:
 * - 'monthly': Uses AiUsage table (count per month)
 * - 'trial': Uses AiTrialUsage table (one-time check)
 * - 'none': No free tier (skip to purchase check)
 */
type FreeTierConfig =
  | { type: "monthly"; limit: number }
  | { type: "trial" } // Always one-time
  | { type: "none" };

type FeatureConfig = {
  name: string;
  productName: string;
  freeTier: FreeTierConfig;
  rateLimit: number; // per day
  price: number; // in cents
  duration: number; // in days
};

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  standup: {
    name: "standup",
    productName: "standup-pro",
    freeTier: { type: "monthly", limit: 10 },
    rateLimit: 20,
    price: 900, // $9
    duration: 90,
  },
  promotion: {
    name: "promotion",
    productName: "promotion-pro",
    freeTier: { type: "trial" }, // One-time trial
    rateLimit: 10,
    price: 1900, // $19
    duration: 30,
  },
  resume: {
    name: "resume",
    productName: "resume-interview-pro", // Shared product
    freeTier: { type: "none" }, // No free tier
    rateLimit: 20,
    price: 2900, // $29
    duration: 30,
  },
  interview: {
    name: "interview",
    productName: "resume-interview-pro", // Shared product
    freeTier: { type: "none" }, // No free tier
    rateLimit: 30,
    price: 2900, // $29
    duration: 30,
  },
};
```

**Design benefits:**

- **Discriminated unions:** Type-safe configuration with compile-time checks
- **Clear mapping:** `freeTier.type` directly maps to AiUsage table (monthly) or AiTrialUsage table (trial)
- **No semantic confusion:** No "resetPeriod: 'lifetime'" weirdness
- **Exhaustiveness checking:** TypeScript ensures all free tier types are handled

**Note:** Both `resume` and `interview` features share the same `productName` (`resume-interview-pro`). A single purchase unlocks both features.

---

## User Messaging

### Free Tier Exhausted

**Standup:**

```
You've used 10/10 free standup requests this month.
Resets on February 1, 2025.

Upgrade to Standup Pro ($9) for unlimited access for 90 days.
```

**Promotion Builder:**

```
You've used your free trial of Promotion Builder.

Purchase Promotion Builder ($19) for unlimited access for 30 days.
```

### No Free Tier (Resume & Interview)

```
Resume & Interview Pro is a premium feature.

Purchase Resume & Interview Pro ($29) for unlimited access for 30 days.
Includes both resume generation and interview preparation.
```

### Premium Active

```
Standup Pro active until April 15, 2025.
Unlimited requests remaining.
```

```
Resume & Interview Pro active until February 15, 2025.
Unlimited resume and interview requests remaining.
```

### Rate Limited

```
You're making requests too quickly. Please try again in a few minutes.
```

---

## Business Rationale

### Why Time-Based Unlimited?

| Aspect            | Count-Based (❌ Not used)    | Time-Based Unlimited (✅ Our choice) |
| ----------------- | --------------------------- | ------------------------ |
| User anxiety      | High ("Should I use this?") | Low ("I have access")    |
| Iteration freedom | Limited                     | Unlimited                |
| Implementation    | Track generation counts     | Just check `expiresAt`   |
| User perception   | "Running out"               | "I have access until..." |
| Cost control      | Via count limits            | Via rate limits          |

### Why Free Tier First?

| Scenario                 | Premium First                | Free First                   |
| ------------------------ | ---------------------------- | ---------------------------- |
| User buys, has free left | Uses premium, free preserved | Uses free, premium preserved |
| User perception          | "Am I wasting my purchase?"  | "I get free + extra"         |
| Compliance risk          | User could be "worse off"    | Always additive value        |

### Pricing Rationale

- **Not based on cost:** Tokens are cheap (~$0.20/typical request)
- **Based on value:** Getting promoted, landing jobs = high value
- **Aligns with use case:** Career events are time-bound anyway

---

## Implementation Checklist

- [ ] Create database migrations for `AiUsage` and `AiTrialUsage` tables
- [ ] Update `config.ts` with free tier environment variables
- [ ] Implement `aiUsageRepository` for monthly tracking
- [ ] Implement `aiTrialUsageRepository` for lifetime trial tracking
- [ ] Implement `aiPurchaseRepository` for premium access
- [ ] Implement `checkUsage()` with free tier first logic
- [ ] Implement `incrementUsage()` to handle both monthly and trial features
- [ ] Implement rate limiting middleware
- [ ] Add upgrade prompts in error messages
- [ ] Test free tier first flow

---

## Related Documents

- [AI Features Brainstorm](./AI-FEATURES-BRAINSTORM.md) - Feature descriptions and use cases
- [AI Architecture Design](./AI-ARCHITECTURE-DESIGN.md) - Technical architecture
- [Standup Tutorial](../packages/api/docs/ai/standup/) - Implementation tutorials
