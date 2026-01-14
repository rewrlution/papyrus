# AI Standup Notes - Architecture Design

> **⚠️ Note:** This document contains outdated information from the initial design phase. Date formats mentioned as YYYY-MM-DD should be YYYYMMDD (database and API format). The actual implementation uses YYYYMMDD for all date parameters. Refer to CLAUDE.md and the source code for current implementation details.

## Overview

The AI Standup Notes feature generates daily/weekly standup notes from journal entries using Claude AI. This is a **one-shot generation** feature (no multi-turn chat) with **SSE streaming** that serves as Phase 1 to validate the AI infrastructure before building more complex interactive features.

**Command:** `papyrus ai standup [options]`
**Pattern:** SSE streaming - Client receives real-time updates as AI generates content
**Priority:** Phase 1 (build first)

---

## Tech Stack

### Core Dependencies

| Component          | Technology                              | Reason                                             |
| ------------------ | --------------------------------------- | -------------------------------------------------- |
| **AI Provider**    | `@anthropic-ai/sdk`                     | Official SDK, full control, Node.js compatible     |
| **API Framework**  | Express.js                              | Already in use, no changes needed                  |
| **Database**       | PostgreSQL (Supabase) + Prisma          | Already in use, just add new models                |
| **Validation**     | Zod (from `@rewrlution/papyrus-shared`) | Already in use, consistent with existing endpoints |
| **Authentication** | JWT via existing middleware             | Reuse `requireAuthentication()`                    |
| **Error Handling** | Existing ApiError classes               | Reuse existing error pattern                       |

**New Dependencies:** Only 1 (`@anthropic-ai/sdk`)

### Why Not LangChain?

Decision: Use raw Anthropic SDK instead of LangChain

**Reasoning:**

1. **Simple use case** - One-shot prompt + journal → AI → response (no RAG, no agents, no complex chains)
2. **Performance** - Direct SDK is lightweight, LangChain adds 50MB+ overhead
3. **Control** - Full control over prompts and API calls
4. **Compatibility** - Native Node.js SDK works perfectly on Render
5. **Future-proof** - Easy to add provider abstraction layer later if needed

### Why No Vector Store?

Decision: Load all journals in context, no semantic search

**Reasoning:**

1. **Small data** - Typical use: 1-7 days of journals (~5K-50K tokens)
2. **Large context window** - Claude 3.5 has 200K token context (plenty of room)
3. **Backend limit** - 10K char limit per journal already enforced
4. **Want full context** - For standups, we want ALL recent work, not selective retrieval
5. **Simplicity** - No vector DB setup, embeddings, or retrieval complexity

**Math:**

```
Single journal: ~10K chars = ~13K tokens (max)
Date range (7 days): 7 × 13K = 91K tokens
Claude 3.5 context: 200K tokens ✅ Fits easily
```

---

## Architecture Pattern: Layered Architecture

Follows existing API pattern:

```
Routes → Controllers → Services → Repositories → Database
              ↓            ↓
         Middleware    Mappers/Utils
```

### Layer Responsibilities

**Routes** (`src/routes/ai/standup.routes.ts`)

- Define POST /api/ai/standup endpoint
- Apply middleware (auth, validation)
- Wire controller

**Controller** (`src/controllers/ai/standup.controller.ts`)

- Extract request data (date, from, to)
- Call service methods
- Format response
- Set status codes
- **Thin layer** - no business logic

**Service** (`src/services/ai/standup.service.ts`)

- Check usage limits (via usage limiter)
- Load journals (via journal repository)
- Build prompt (via prompt builder)
- Call AI provider
- Increment usage counter
- Return formatted response

**Repository** (new: `src/domain/repositories/ai-usage.repository.ts`)

- All Prisma queries for AI usage tracking
- Check usage limits
- Increment usage counters
- Query usage stats

**Utils** (new: `src/lib/ai/`)

- Anthropic provider wrapper
- Prompt template builder
- Usage limiter utility

---

## Data Flow

### Successful Request Flow (SSE Streaming)

```
1. CLIENT SENDS:
   POST /api/ai/standup
   Headers: { Authorization: Bearer <token>, Accept: text/event-stream }
   Body: { date?: "2025-01-06", from?: "2025-01-01", to?: "2025-01-07" }

2. EXPRESS MIDDLEWARE CHAIN:
   → CORS middleware
   → Request logger (with UUID)
   → JSON body parser
   → requireAuthentication() middleware (existing!)
   → validate(StandupRequestSchema) middleware

3. ROUTE MATCHES:
   POST /api/ai/standup

4. CONTROLLER (StandupController.generate):
   - Extract: { date, from, to } from req.validated
   - Extract: userId from req.user (set by auth middleware)
   - Set SSE headers:
     * Content-Type: text/event-stream
     * Cache-Control: no-cache
     * Connection: keep-alive
   - Call: StandupService.generateStream(userId, { date, from, to })

5. SERVICE (StandupService.generateStream):
   a) Check usage limit:
      - usageLimiter.check(userId, 'standup')
      - If exceeded → throw TooManyRequestsError (429)

   b) Load journals:
      - If date → Load single journal by date
      - If from/to → Load journals in range
      - If nothing → Load most recent journal
      - If no journals → throw NotFoundError (404)

   c) Yield 'thinking' event:
      yield { type: 'thinking', message: 'Analyzing journals...' }

   d) Build prompt:
      - buildStandupPrompt(journals)
      - Injects journal content into template

   e) Stream AI response:
      for await (const chunk of anthropicProvider.stream(prompt)) {
        yield { type: 'content', text: chunk }
      }

   f) Increment usage:
      - usageLimiter.increment(userId, 'standup')

   g) Get updated usage info:
      - usageLimiter.check(userId, 'standup')

   h) Yield 'done' event:
      yield {
        type: 'done',
        journal_date: '2025-01-06',
        usage: { used: 3, limit: 20, resets_at: '2025-02-01T00:00:00Z' }
      }

6. CONTROLLER:
   - Iterates over service generator
   - Writes each event to response stream:
     res.write(`event: ${event.type}\n`)
     res.write(`data: ${JSON.stringify(event)}\n\n`)
   - Ends response when generator completes

7. CLIENT RECEIVES (SSE Stream):
   Status: 200 OK
   Content-Type: text/event-stream

   event: thinking
   data: {"message":"Analyzing journals..."}

   event: content
   data: {"text":"Yesterday:"}

   event: content
   data: {"text":"\n- Fixed"}

   event: content
   data: {"text":" bug\n\n"}

   event: content
   data: {"text":"Today:\n- Review PRs"}

   event: done
   data: {"journal_date":"2025-01-06","usage":{"used":3,"limit":20,"resets_at":"2025-02-01T00:00:00Z"}}
```

### Error Flows

**Usage Limit Exceeded:**

```
Service: Check limit → Exceeded
Service: throw TooManyRequestsError
Error Handler: Catch error
Response: 429 Too Many Requests
Body: {
  success: false,
  message: "You've used 20/20 standup notes this month.",
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    upgrade_url: "/purchase/standup-pro"
  }
}
```

**No Journals Found:**

```
Service: Load journals → Empty array
Service: throw NotFoundError
Error Handler: Catch error
Response: 404 Not Found
Body: {
  success: false,
  message: "No journals found in your account. Sync your local journals first.",
  error: {
    code: "NO_JOURNALS_FOUND",
    suggestion: "papyrus sync"
  }
}
```

**AI Service Error:**

```
AI Provider: Anthropic API error
Service: Catch error → throw InternalServerError
Error Handler: Catch error
Response: 500 Internal Server Error
Body: {
  success: false,
  message: "AI service temporarily unavailable. Please try again.",
  error: { code: "AI_SERVICE_ERROR" }
}
```

---

## Database Schema (Prisma)

### New Model 1: AiUsage

```prisma
model AiUsage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  feature   String   // 'standup' | 'promotion' | 'resume' | 'interview'
  month     String   // 'YYYY-MM' format (e.g., '2025-01')
  count     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([userId, feature, month])
  @@index([userId, feature, month])
  @@map("ai_usage")
}
```

**Key Design Decisions:**

1. **Monthly tracking** - Track by month (YYYY-MM) for automatic resets
2. **Per-feature counters** - Separate limits for standup, promotion, resume, interview
3. **Composite unique key** - One row per user/feature/month combination
4. **Cascading delete** - Delete usage when user deleted
5. **Index** - Fast lookups by userId + feature + month

### Migration Strategy

```sql
-- Migration: 004_ai_usage_tracking.sql

CREATE TABLE "ai_usage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,

  CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ai_usage_user_id_feature_month_key"
  ON "ai_usage"("user_id", "feature", "month");

CREATE INDEX "ai_usage_user_id_feature_month_idx"
  ON "ai_usage"("user_id", "feature", "month");
```

### New Model 2: AiPurchase

```prisma
model AiPurchase {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  product   String   // 'standup-pro' | 'promotion-builder' | 'resume-refresh' | 'interview-prep'

  // Purchase details
  purchasedAt DateTime @default(now()) @map("purchased_at")
  expiresAt   DateTime? @map("expires_at")  // null = lifetime purchase

  // Usage tracking (for count-based limits)
  generationsLimit Int? @map("generations_limit")  // null = unlimited
  generationsUsed  Int @default(0) @map("generations_used")

  // Metadata
  amount      Int?     // Price paid (in cents)
  currency    String?  // 'USD'
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, product])
  @@index([userId, product, expiresAt])
  @@map("ai_purchases")
}
```

**Key Design Decisions:**

1. **Separate from User table** - Keeps User model clean, allows multiple purchases
2. **Flexible expiration** - Time-based (expiresAt) or count-based (generationsLimit)
3. **Product identification** - String enum for different AI features
4. **Unlimited support** - null generationsLimit = unlimited
5. **Purchase history** - Track amount, currency for analytics
6. **Cascading delete** - Delete purchases when user deleted

**Usage Tracking Options:**

- **Standup Pro:** `expiresAt` = 90 days from purchase, `generationsLimit` = null (unlimited)
- **Promotion Builder:** `expiresAt` = 90 days, `generationsLimit` = 3
- **Resume Refresh:** `expiresAt` = 30 days, `generationsLimit` = 10
- **Interview Prep:** `expiresAt` = 30 days, `generationsLimit` = 20

### Update User Model

Add relations to User model:

```prisma
model User {
  // ... existing fields
  aiUsage    AiUsage[]
  aiPurchase AiPurchase[]
}
```

---

## API Contract

### Endpoint: POST /api/ai/standup

**Authentication:** Required (Bearer token)

**Request Body:**

```typescript
{
  date?: string;      // Optional: Specific date (YYYY-MM-DD)
  from?: string;      // Optional: Start date for range
  to?: string;        // Optional: End date for range
}
// Empty body = use most recent journal
```

**Request Examples:**

```javascript
// Latest journal (default)
POST /api/ai/standup
Body: {}

// Specific date
POST /api/ai/standup
Body: { date: "2025-01-06" }

// Date range
POST /api/ai/standup
Body: { from: "2025-01-01", to: "2025-01-07" }
```

**Success Response (SSE Stream):**

```typescript
// Event 1: Thinking
event: thinking
data: { "message": "Analyzing journals..." }

// Events 2-N: Content chunks (streamed as AI generates)
event: content
data: { "text": "Yesterday:\n- " }

event: content
data: { "text": "Fixed bug" }

// Final event: Done with metadata
event: done
data: {
  "journal_date": "2025-01-06",
  "usage": {
    "used": 3,
    "limit": 20,
    "resets_at": "2025-02-01T00:00:00Z"
  }
}
```

**Event Types:**

- `thinking` - Progress indicator (e.g., "Analyzing journals...")
- `content` - Text chunks from AI (stream real-time)
- `done` - Final event with metadata (journal_date, usage)
- `error` - Error event (if something fails mid-stream)

**Error Responses:**

| Status | Code                | Condition                             |
| ------ | ------------------- | ------------------------------------- |
| 401    | UNAUTHORIZED        | Missing or invalid JWT token          |
| 404    | NO_JOURNALS_FOUND   | No journals in backend (suggest sync) |
| 404    | JOURNAL_NOT_FOUND   | Specific date has no journal          |
| 422    | VALIDATION_ERROR    | Invalid date format                   |
| 429    | RATE_LIMIT_EXCEEDED | Usage limit reached                   |
| 500    | AI_SERVICE_ERROR    | Anthropic API error                   |

---

## Prompt Engineering

### System Prompt Template

```typescript
const STANDUP_SYSTEM_PROMPT = `You are a helpful assistant that generates concise standup notes from journal entries.

Your task is to analyze journal entries and create standup notes following this format:

Yesterday:
- [3-5 bullet points of completed work, use past tense]

Today:
- [3-5 bullet points of planned work, inferred from context, use present/future tense]

Blockers:
- [Any mentioned blockers, challenges, or dependencies. If none, write "None"]

Guidelines:
- Be concise and actionable
- Focus on work-related items
- Use bullet points (start with -)
- Keep each bullet to 1-2 lines
- Extract key achievements and plans`;
```

### Single Journal Prompt

```typescript
function buildStandupPrompt(journal: { date: string; content: string }) {
  return `${STANDUP_SYSTEM_PROMPT}

Here is the journal entry from ${journal.date}:

${journal.content}

Generate standup notes based on this journal entry.`;
}
```

### Date Range Prompt

```typescript
function buildStandupPromptForRange(
  journals: Array<{ date: string; content: string }>
) {
  const journalText = journals
    .map((j) => `[${j.date}]\n${j.content}`)
    .join('\n\n---\n\n');

  const dateRange = `${journals[0].date} to ${journals[journals.length - 1].date}`;

  return `${STANDUP_SYSTEM_PROMPT}

Here are journal entries from ${dateRange}:

${journalText}

Generate standup notes that summarize the work across this period. Combine similar tasks and highlight the most important items.`;
}
```

**Prompt Design Decisions:**

1. **Explicit format** - Clear structure (Yesterday/Today/Blockers)
2. **Few guidelines** - Let Claude apply common sense
3. **Date context** - Include dates so Claude knows timeline
4. **Aggregation for ranges** - Ask to combine and prioritize
5. **Versioned** - Easy to create V2, V3 prompts later

---

## Usage Limits & Monetization

### Free Tier Limits (Configurable)

| Feature   | Free Limit             | Reset Period           | Config Env Var            |
| --------- | ---------------------- | ---------------------- | ------------------------- |
| Standup   | 20 requests/month      | Monthly (1st of month) | `AI_STANDUP_FREE_LIMIT`   |
| Promotion | 1 request (free trial) | One-time               | `AI_PROMOTION_FREE_LIMIT` |
| Resume    | 1 request (free trial) | One-time               | `AI_RESUME_FREE_LIMIT`    |
| Interview | 1 request (free trial) | One-time               | `AI_INTERVIEW_FREE_LIMIT` |

**Configuration:** Limits are configurable via environment variables (see Environment Variables section)

### Paid Tier (Future)

**Standup Pro:** $9 for 90 days

- Unlimited standup generations
- Stored in `ai_purchases` table (future migration)

### Usage Check Logic (with Premium Support)

```typescript
async function checkUsageLimit(
  userId: string,
  feature: string
): Promise<UsageInfo> {
  // Step 1: Check for active purchase
  const productName = `${feature}-pro`; // e.g., 'standup-pro'

  const activePurchase = await prisma.aiPurchase.findFirst({
    where: {
      userId,
      product: productName,
      OR: [
        { expiresAt: null }, // Lifetime purchase
        { expiresAt: { gt: new Date() } }, // Not expired
      ],
    },
  });

  if (activePurchase) {
    // User has active purchase
    if (activePurchase.generationsLimit === null) {
      // Unlimited
      return {
        allowed: true,
        used: activePurchase.generationsUsed,
        limit: null, // Unlimited
        reason: 'premium_unlimited',
      };
    }

    // Count-based limit
    if (activePurchase.generationsUsed < activePurchase.generationsLimit) {
      return {
        allowed: true,
        used: activePurchase.generationsUsed,
        limit: activePurchase.generationsLimit,
        reason: 'premium_limited',
      };
    }

    // Premium limit exceeded
    return {
      allowed: false,
      used: activePurchase.generationsUsed,
      limit: activePurchase.generationsLimit,
      reason: 'premium_exceeded',
    };
  }

  // Step 2: Fall back to free tier check
  const month = getCurrentMonth(); // 'YYYY-MM'

  const usage = await prisma.aiUsage.findUnique({
    where: { userId_feature_month: { userId, feature, month } },
  });

  const used = usage?.count ?? 0;
  const limit = getFreeLimit(feature); // From env config

  return {
    allowed: used < limit,
    used,
    limit,
    resets_at: getNextMonthStart(), // '2025-02-01T00:00:00Z'
    reason: 'free_tier',
  };
}

// Get free limit from environment config
function getFreeLimit(feature: string): number {
  const limits: Record<string, number> = {
    standup: env.AI_STANDUP_FREE_LIMIT, // 20
    promotion: env.AI_PROMOTION_FREE_LIMIT, // 1
    resume: env.AI_RESUME_FREE_LIMIT, // 1
    interview: env.AI_INTERVIEW_FREE_LIMIT, // 1
  };
  return limits[feature] ?? 0;
}
```

---

## File Structure

```
packages/api/src/
├── routes/
│   └── ai/
│       └── standup.routes.ts         # POST /api/ai/standup
│
├── controllers/
│   └── ai/
│       └── standup.controller.ts     # HTTP handler (thin layer)
│
├── services/
│   └── ai/
│       └── standup.service.ts        # Business logic
│
├── domain/
│   └── repositories/
│       ├── ai-usage.repository.ts     # All Prisma queries for ai_usage table
│       └── ai-purchase.repository.ts  # All Prisma queries for ai_purchases table
│
├── lib/
│   └── ai/
│       ├── anthropic-provider.ts     # Wrapper around @anthropic-ai/sdk
│       ├── usage-limiter.ts          # Usage checking & incrementing
│       └── prompts/
│           └── standup.ts            # Prompt templates
│
└── middleware/
    └── auth.ts                        # Existing - requireAuthentication()
```

**Index files for clean imports:**

- `src/routes/ai/index.ts` - Export standup routes
- `src/controllers/ai/index.ts` - Export standup controller
- `src/services/ai/index.ts` - Export standup service

---

## Environment Variables

Add to `.env`:

```env
# AI Provider
ANTHROPIC_API_KEY=sk-ant-...

# AI Configuration (optional - use defaults)
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.7

# AI Free Tier Limits (configurable)
AI_STANDUP_FREE_LIMIT=20
AI_PROMOTION_FREE_LIMIT=1
AI_RESUME_FREE_LIMIT=1
AI_INTERVIEW_FREE_LIMIT=1
```

**Validation:** Add to `src/env/config.ts` Zod schema:

```typescript
// AI Provider
ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
AI_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
AI_MAX_TOKENS: z.coerce.number().default(2048),
AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.7),

// AI Free Tier Limits
AI_STANDUP_FREE_LIMIT: z.coerce.number().default(20),
AI_PROMOTION_FREE_LIMIT: z.coerce.number().default(1),
AI_RESUME_FREE_LIMIT: z.coerce.number().default(1),
AI_INTERVIEW_FREE_LIMIT: z.coerce.number().default(1),
```

**Benefits of Configurable Limits:**

- Change limits without code deployment
- Different limits for dev/staging/prod environments
- Easy A/B testing of limit values
- Quick response to abuse or business needs

---

## Testing Strategy

### Unit Tests

**Prompt Builder:**

```typescript
describe('buildStandupPrompt', () => {
  it('builds prompt for single journal', () => {
    const prompt = buildStandupPrompt({ date: '2025-01-06', content: '...' });
    expect(prompt).toContain('2025-01-06');
  });

  it('builds prompt for date range', () => {
    const prompt = buildStandupPromptForRange([...]);
    expect(prompt).toContain('2025-01-01 to 2025-01-07');
  });
});
```

**Usage Limiter:**

```typescript
describe('UsageLimiter', () => {
  it('allows usage under limit', async () => {
    const info = await limiter.check(userId, 'standup');
    expect(info.allowed).toBe(true);
  });

  it('blocks usage over limit', async () => {
    // Setup: user has used 20/20
    const info = await limiter.check(userId, 'standup');
    expect(info.allowed).toBe(false);
  });
});
```

### Integration Tests

**Endpoint Testing (with mocked AI):**

```typescript
describe('POST /api/ai/standup', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/ai/standup').send({});
    expect(res.status).toBe(401);
  });

  it('returns standup notes for latest journal', async () => {
    const res = await request(app)
      .post('/api/ai/standup')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('content');
    expect(res.body).toHaveProperty('journal_date');
    expect(res.body).toHaveProperty('usage');
  });

  it('enforces usage limits', async () => {
    // Setup: user has 20/20 usage
    const res = await request(app)
      .post('/api/ai/standup')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(429);
  });
});
```

### Manual Testing

Use Swagger UI (`/api-docs`) or Postman to:

1. Test with different date formats
2. Test with no journals (should suggest sync)
3. Test usage limit enforcement
4. Test AI response quality

---

## Key Design Decisions

### 1. Why SSE Streaming for Standup?

**Decision:** Use SSE streaming instead of simple request/response

**Reasoning:**

- **Better perceived latency** - User sees "Analyzing journals..." immediately (0.5s) vs waiting 3-5s with loading spinner
- **Real-time feedback** - Text streams in as AI generates, feels more interactive
- **Validates infrastructure early** - Test SSE before more complex features (promotion, resume)
- **Consistent pattern** - All AI features use SSE (simpler to maintain)
- **Progress indicators** - Can show "thinking" events for better UX
- **Minimal complexity** - Express + Anthropic SDK both support streaming natively

**Trade-off:** Slightly more complex than simple JSON response, but worth it for UX improvement

### 2. Why Track by Month?

**Decision:** Store month as 'YYYY-MM' string

**Reasoning:**

- Automatic resets (query by current month)
- Simple to display reset date (next month's 1st)
- No cron jobs needed to reset counters
- Easy to query usage history

### 3. Why Not Store Generated Content?

**Decision:** Don't save standup notes to database

**Reasoning:**

- Notes are ephemeral (used once, then discarded)
- Users can regenerate if needed
- Saves storage costs
- No privacy concerns (not storing AI output)

**Exception:** May add optional save feature later

### 4. Why Provider Abstraction Layer?

**Decision:** Wrap Anthropic SDK in `AnthropicProvider` class

**Reasoning:**

- Easy to switch providers later (OpenAI, etc.)
- Centralize API configuration
- Easier to mock for testing
- Consistent error handling

### 5. Journal Loading Strategy

**Decision:** Load journals from database, not local CLI storage

**Reasoning:**

- Single source of truth (backend database)
- Forces users to sync before using AI
- Consistent data across devices
- Easier to implement (no CLI → API upload)

### 6. Premium Service Tracking

**Decision:** Separate `ai_purchases` table, not User table fields

**Reasoning:**

- **Keeps User model clean** - No AI-specific fields polluting core User schema
- **Multiple purchases** - Users can have multiple active purchases (standup + resume)
- **Purchase history** - Track what was bought, when, and for how much
- **Flexible limits** - Time-based (expiresAt) or count-based (generationsLimit)
- **Easy to query** - "Show all users with active standup-pro"
- **Future-proof** - Can add more purchase types without schema changes

**Alternative considered:** Adding `standupProExpiresAt` to User table

- Rejected: Would need new field for each product, clutters User model

---

## Performance Considerations

### Expected Latency

| Operation       | Time         | Notes                     |
| --------------- | ------------ | ------------------------- |
| Auth check      | <50ms        | JWT verification          |
| Usage check     | <100ms       | Single DB query           |
| Journal load    | <200ms       | Indexed query             |
| AI generation   | 3-5s         | Depends on journal length |
| Usage increment | <100ms       | Single DB write           |
| **Total**       | **3.5-5.5s** | P95 estimate              |

### Optimization Opportunities (Future)

1. **Cache journal content** - If same journals requested frequently
2. **Parallel DB queries** - Check usage + load journals simultaneously
3. **Response caching** - Cache standup for same journals (1 hour TTL)
4. **Database pooling** - Supabase connection pooling (already enabled?)

### Rate Limiting

**AI Provider Limits:**

- Anthropic: 50 requests/minute (default)
- Should be sufficient for beta users
- Monitor usage in production

**Database Limits:**

- Supabase: Check concurrent connection limits
- Consider connection pooling if needed

---

## Rollout Strategy

### Phase 1: MVP (Standup Only)

1. Add `ai_usage` and `ai_purchases` table migrations
2. Implement core infrastructure (provider, limiter, prompts, SSE streaming)
3. Build standup endpoint with SSE
4. Test with beta users
5. Monitor AI costs, response quality, and streaming performance

### Phase 2: Career Docs (After Standup Validated)

1. Add `ai_sessions`, `ai_messages`, `user_profiles` tables
2. Reuse SSE streaming infrastructure (already validated)
3. Build promotion/resume/interview endpoints
4. Add payment integration for purchases

### Monitoring & Metrics

**Track:**

- Usage per user/feature/month
- AI generation latency (p50, p95, p99)
- AI generation errors
- Cost per request (Anthropic API costs)
- Free → paid conversion rate

**Alerts:**

- AI error rate >5%
- Average latency >10s
- Daily AI costs >$X threshold

---

## Open Questions (To Resolve During Implementation)

1. **Supabase connection pooling** - Is it enabled? What's the limit?
2. **Render request timeout** - What's the max timeout? (AI takes 5-10s)
3. **Error messages** - Should we expose Anthropic errors to users or mask them?
4. **Retry logic** - Should we retry AI requests on transient failures?
5. **Logging** - What AI metadata to log? (tokens used, model, latency)
6. **Cost tracking** - Track Anthropic API costs per request?
7. **Content moderation** - Any need to filter journal content before sending to AI?

---

## Success Criteria

**Technical:**

- ✅ P95 latency <6 seconds
- ✅ Error rate <1%
- ✅ No data leaks (journals encrypted, not logged)
- ✅ Usage limits enforced correctly

**Product:**

- ✅ Users generate standups without friction
- ✅ Output quality is useful (manual review)
- ✅ Free tier sufficient for daily use (20/month = ~1 per workday)
- ✅ Clear upgrade path when limit reached
- ✅ SSE streaming provides good UX (immediate feedback)

**Business:**

- ✅ AI costs <$0.10 per standup generation
- ✅ Monitor free → paid conversion
- ✅ No abuse of free tier (rate limiting works)
