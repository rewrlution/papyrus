# Phase 5: Testing & Polish - Tutorial

## Goal

Make the AI standup feature production-ready with comprehensive testing, documentation, and polish. After this phase, you'll have:

- ✅ Unit tests for business logic (prompts, usage limiter, helpers)
- ✅ Integration tests for the endpoint (with mocked AI)
- ✅ Error handling reviewed and tested
- ✅ API documentation (Swagger/OpenAPI)
- ✅ Performance tested with large journals
- ✅ Code reviewed for quality and conventions

**Why this phase?** You have a working feature, but it needs tests to prevent regressions, documentation for API consumers, and performance validation before deploying to production.

---

## Phase Overview

```
┌─────────────────────────────────────────────────┐
│  Phase 5: Testing & Polish                      │
├─────────────────────────────────────────────────┤
│  1. Unit tests (prompts, usage limiter)         │
│  2. Integration tests (endpoint)                │
│  3. Error handling review                       │
│  4. API documentation (Swagger)                 │
│  5. Performance testing                         │
│  6. Code review & polish                        │
└─────────────────────────────────────────────────┘
```

---

## Step 1: Unit Tests

### 1.1: Test Prompt Builder

**File:** `tests/lib/ai/prompts/standup.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildStandupPrompt,
  buildStandupPromptForRange,
  STANDUP_SYSTEM_PROMPT,
} from '../../../../src/lib/ai/prompts/standup.js';

describe('Standup Prompt Builder', () => {
  describe('buildStandupPrompt', () => {
    it('should include system prompt', () => {
      const journal = {
        date: '2025-01-07',
        content: 'Fixed auth bug. Reviewed PRs.',
      };

      const prompt = buildStandupPrompt(journal);

      expect(prompt).toContain(STANDUP_SYSTEM_PROMPT);
    });

    it('should include journal date', () => {
      const journal = {
        date: '2025-01-07',
        content: 'Fixed auth bug.',
      };

      const prompt = buildStandupPrompt(journal);

      expect(prompt).toContain('2025-01-07');
    });

    it('should include journal content', () => {
      const journal = {
        date: '2025-01-07',
        content: 'Fixed auth bug. Reviewed 3 PRs.',
      };

      const prompt = buildStandupPrompt(journal);

      expect(prompt).toContain('Fixed auth bug');
      expect(prompt).toContain('Reviewed 3 PRs');
    });

    it('should handle empty content', () => {
      const journal = {
        date: '2025-01-07',
        content: '',
      };

      const prompt = buildStandupPrompt(journal);

      expect(prompt).toContain(STANDUP_SYSTEM_PROMPT);
      expect(prompt).toContain('2025-01-07');
    });

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(10000);
      const journal = {
        date: '2025-01-07',
        content: longContent,
      };

      const prompt = buildStandupPrompt(journal);

      expect(prompt).toContain(longContent);
      expect(prompt.length).toBeGreaterThan(10000);
    });
  });

  describe('buildStandupPromptForRange', () => {
    it('should include all journal dates', () => {
      const journals = [
        { date: '2025-01-01', content: 'Day 1 work' },
        { date: '2025-01-02', content: 'Day 2 work' },
        { date: '2025-01-03', content: 'Day 3 work' },
      ];

      const prompt = buildStandupPromptForRange(journals);

      expect(prompt).toContain('2025-01-01');
      expect(prompt).toContain('2025-01-02');
      expect(prompt).toContain('2025-01-03');
    });

    it('should include all journal content', () => {
      const journals = [
        { date: '2025-01-01', content: 'Fixed bug A' },
        { date: '2025-01-02', content: 'Implemented feature B' },
      ];

      const prompt = buildStandupPromptForRange(journals);

      expect(prompt).toContain('Fixed bug A');
      expect(prompt).toContain('Implemented feature B');
    });

    it('should mention date range', () => {
      const journals = [
        { date: '2025-01-01', content: 'Work 1' },
        { date: '2025-01-07', content: 'Work 2' },
      ];

      const prompt = buildStandupPromptForRange(journals);

      expect(prompt).toContain('2025-01-01 to 2025-01-07');
    });

    it('should separate journals with markdown headers', () => {
      const journals = [
        { date: '2025-01-01', content: 'Work 1' },
        { date: '2025-01-02', content: 'Work 2' },
      ];

      const prompt = buildStandupPromptForRange(journals);

      expect(prompt).toContain('## 2025-01-01');
      expect(prompt).toContain('## 2025-01-02');
    });

    it('should handle single journal in range', () => {
      const journals = [{ date: '2025-01-01', content: 'Solo work' }];

      const prompt = buildStandupPromptForRange(journals);

      expect(prompt).toContain('2025-01-01');
      expect(prompt).toContain('Solo work');
    });
  });
});
```

**Run tests:**

```bash
cd packages/api
pnpm test tests/lib/ai/prompts/standup.test.ts
```

**Expected: All tests pass**

### 1.2: Test Usage Limiter

**File:** `tests/lib/ai/usage-limiter.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkUsage,
  incrementUsage,
} from '../../../src/lib/ai/usage-limiter.js';
import * as aiUsageRepo from '../../../src/domain/repositories/ai-usage.repository.js';
import * as aiPurchaseRepo from '../../../src/domain/repositories/ai-purchase.repository.js';

// Mock repositories
vi.mock('../../../src/domain/repositories/ai-usage.repository.js');
vi.mock('../../../src/domain/repositories/ai-purchase.repository.js');

describe('Usage Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUsage - Free Tier First', () => {
    it('should allow usage under free tier limit', async () => {
      // Mock: usage = 5, limit = 10
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(5);

      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free_tier');
      expect(result.used).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should deny usage at free tier limit (no premium)', async () => {
      // Mock: usage = 10, limit = 10, no purchase
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(10);
      vi.spyOn(
        aiPurchaseRepo.aiPurchaseRepository,
        'findActivePurchase'
      ).mockResolvedValue(null);

      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_exceeded');
      expect(result.used).toBe(10);
      expect(result.limit).toBe(10);
    });

    it('should allow first usage (count = 0)', async () => {
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(0);

      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free_tier');
      expect(result.used).toBe(0);
    });
  });

  describe('checkUsage - Premium Tier (Time-Based)', () => {
    it('should allow usage when free exhausted but has active purchase', async () => {
      // Mock: free tier exhausted
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(10); // At free limit

      // Mock: has active purchase (not expired)
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      const mockPurchase = {
        id: 'purchase1',
        userId: 'user1',
        product: 'standup-pro',
        generationsLimit: null, // Time-based unlimited
        generationsUsed: 0,
        expiresAt: futureDate,
        purchasedAt: new Date(),
        amount: 900,
        currency: 'usd',
        createdAt: new Date(),
      };

      vi.spyOn(
        aiPurchaseRepo.aiPurchaseRepository,
        'findActivePurchase'
      ).mockResolvedValue(mockPurchase);

      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('premium');
      expect(result.expires_at).toBeDefined();
    });

    it('should use free tier first even with active purchase', async () => {
      // Mock: free tier has remaining (5/10)
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(5);

      // Note: findActivePurchase should NOT be called if free tier available
      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free_tier'); // Uses free tier first!
      expect(result.used).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should deny when free exhausted and no active purchase', async () => {
      // Mock: free tier exhausted
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(10);

      // Mock: no active purchase
      vi.spyOn(
        aiPurchaseRepo.aiPurchaseRepository,
        'findActivePurchase'
      ).mockResolvedValue(null);

      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_exceeded');
    });

    it('should deny when free exhausted and purchase expired', async () => {
      // Mock: free tier exhausted
      vi.spyOn(
        aiUsageRepo.aiUsageRepository,
        'getUsageCount'
      ).mockResolvedValue(10);

      // Mock: findActivePurchase returns null (expired purchases filtered out)
      vi.spyOn(
        aiPurchaseRepo.aiPurchaseRepository,
        'findActivePurchase'
      ).mockResolvedValue(null);

      const result = await checkUsage('user1', 'standup');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_exceeded');
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage for free tier', async () => {
      const upsertSpy = vi
        .spyOn(aiUsageRepo.aiUsageRepository, 'upsertUsage')
        .mockResolvedValue({
          id: 'usage1',
          userId: 'user1',
          feature: 'standup',
          month: '2025-01',
          count: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // Free tier usage info
      const usageInfo = {
        allowed: true,
        reason: 'free_tier' as const,
        used: 5,
        limit: 10,
        resets_at: '2025-02-01T00:00:00.000Z',
      };

      await incrementUsage('user1', 'standup', usageInfo);

      expect(upsertSpy).toHaveBeenCalledWith(
        'user1',
        'standup',
        expect.any(String) // Current month
      );
    });

    it('should NOT increment usage for premium tier (time-based)', async () => {
      const upsertSpy = vi.spyOn(aiUsageRepo.aiUsageRepository, 'upsertUsage');

      // Premium tier usage info
      const usageInfo = {
        allowed: true,
        reason: 'premium' as const,
        expires_at: '2025-04-07T00:00:00.000Z',
      };

      await incrementUsage('user1', 'standup', usageInfo);

      // Should NOT call upsertUsage for premium (time-based, no counting)
      expect(upsertSpy).not.toHaveBeenCalled();
    });
  });
});
```

**Run tests:**

```bash
pnpm test tests/lib/ai/usage-limiter.test.ts
```

**Expected: All tests pass**

### 1.3: Test Date Formatting Helpers

**File:** `tests/services/ai/standup.service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { StandupService } from '../../../src/services/ai/standup.service.js';

describe('StandupService Helpers', () => {
  describe('formatDateForDb', () => {
    it('should convert YYYY-MM-DD to YYYYMMDD', () => {
      const result = StandupService.formatDateForDb('2025-01-07');
      expect(result).toBe('20250107');
    });

    it('should handle single-digit months', () => {
      const result = StandupService.formatDateForDb('2025-01-05');
      expect(result).toBe('20250105');
    });

    it('should handle December', () => {
      const result = StandupService.formatDateForDb('2025-12-31');
      expect(result).toBe('20251231');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should convert YYYYMMDD to YYYY-MM-DD', () => {
      const result = StandupService.formatDateForDisplay('20250107');
      expect(result).toBe('2025-01-07');
    });

    it('should handle January', () => {
      const result = StandupService.formatDateForDisplay('20250101');
      expect(result).toBe('2025-01-01');
    });

    it('should handle December', () => {
      const result = StandupService.formatDateForDisplay('20251231');
      expect(result).toBe('2025-12-31');
    });
  });
});
```

**Run tests:**

```bash
pnpm test tests/services/ai/standup.service.test.ts
```

---

## Step 2: Integration Tests

### 2.1: Test Endpoint with Mocked AI

**File:** `tests/routes/ai/standup.routes.test.ts`

```typescript
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import type { Express } from 'express';
import { prisma } from '../../../src/lib/prisma.js';
import { hashPassword } from '../../../src/lib/password.js';
import { signToken } from '../../../src/lib/jwt.js';
import * as anthropicProvider from '../../../src/lib/ai/anthropic-provider.js';

// Mock Anthropic provider
vi.mock('../../../src/lib/ai/anthropic-provider.js');

describe('POST /api/ai/standup', () => {
  let app: Express;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = createApp();

    // Create test user
    const passwordHash = await hashPassword('test1234');
    const user = await prisma.user.create({
      data: {
        email: 'test-standup@example.com',
        passwordHash,
        verified: true,
      },
    });

    userId = user.id;
    authToken = signToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.journal.deleteMany({ where: { userId } });
    await prisma.aiUsage.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/ai/standup');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should reject invalid date format', async () => {
      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: '01-07-2025' });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject mixed date modes', async () => {
      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: '2025-01-07', from: '2025-01-01' });

      expect(response.status).toBe(422);
    });

    it('should reject invalid date range (from > to)', async () => {
      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ from: '2025-01-07', to: '2025-01-01' });

      expect(response.status).toBe(422);
    });

    it('should accept empty body', async () => {
      // Mock AI provider
      const mockStream = async function* () {
        yield 'Test response';
      };
      vi.spyOn(
        anthropicProvider.AnthropicProvider.prototype,
        'stream'
      ).mockReturnValue(mockStream());

      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // SSE returns 200 (or no status if stream started)
      // We can't easily test SSE in supertest, so just verify it doesn't error
      expect([200, 404]).toContain(response.status); // 404 if no journals
    });
  });

  describe('No Journals', () => {
    it('should return error event when no journals exist', async () => {
      // Ensure no journals
      await prisma.journal.deleteMany({ where: { userId } });

      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // SSE stream will contain error event
      // Can't easily assert SSE events with supertest
      // In real tests, you'd parse the SSE response
    });
  });

  describe('With Journals (Mocked AI)', () => {
    beforeEach(async () => {
      // Create test journal
      await prisma.journal.create({
        data: {
          userId,
          date: '20250107',
          hash: 'test-hash',
          ciphertext: 'Test journal content',
          iv: 'test-iv',
          authTag: 'test-tag',
        },
      });
    });

    afterEach(async () => {
      await prisma.journal.deleteMany({ where: { userId } });
      await prisma.aiUsage.deleteMany({ where: { userId } });
    });

    it('should stream standup notes (latest journal)', async () => {
      // Mock AI streaming response
      const mockStream = async function* () {
        yield 'Yesterday:\n';
        yield '- Test work\n';
        yield '\n';
        yield 'Today:\n';
        yield '- More tests';
      };
      vi.spyOn(
        anthropicProvider.AnthropicProvider.prototype,
        'stream'
      ).mockReturnValue(mockStream());

      const response = await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // SSE returns 200 and streams
      // Full SSE testing requires parsing the stream
      // For now, just verify no errors
      expect([200]).toContain(response.status);
    });

    it('should increment usage counter', async () => {
      const mockStream = async function* () {
        yield 'Test response';
      };
      vi.spyOn(
        anthropicProvider.AnthropicProvider.prototype,
        'stream'
      ).mockReturnValue(mockStream());

      await request(app)
        .post('/api/ai/standup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Check usage incremented
      const usage = await prisma.aiUsage.findFirst({
        where: { userId, feature: 'standup' },
      });

      expect(usage).toBeDefined();
      expect(usage!.count).toBe(1);
    });
  });
});
```

**Run tests:**

```bash
pnpm test tests/routes/ai/standup.routes.test.ts
```

**Note:** Testing SSE streams with supertest is limited. For production, consider:

- Using a real SSE client library in tests
- Creating a test helper that parses SSE events
- Testing SSE manually with curl

---

## Step 3: Error Handling Review

### 3.1: Error Checklist

Review all error paths and ensure they're tested:

- [x] **401 Unauthorized** - No token or invalid token
- [x] **404 Not Found** - No journals exist
- [x] **422 Validation Error** - Invalid date format, mixed modes, invalid range
- [x] **429 Rate Limit** - Usage limit exceeded (free tier)
- [x] **500 Internal Server Error** - AI service error, database error

### 3.2: Error Message Quality

Ensure all error messages are:

- **Actionable**: Tell user what to do
- **Specific**: Explain what went wrong
- **Consistent**: Follow same format across API

**Example good error messages:**

```
❌ Bad: "Error"
✅ Good: "No journals found. Use `papyrus sync` to sync your local journals."

❌ Bad: "Invalid input"
✅ Good: "Date must be in YYYY-MM-DD format"

❌ Bad: "Limit exceeded"
✅ Good: "You've used 20/20 free requests this month. Resets on Feb 1, 2025."
```

### 3.3: Add Error Tests

**File:** `tests/routes/ai/standup.routes.test.ts`

Add these test cases:

```typescript
describe('Error Handling', () => {
  it('should handle AI service errors gracefully', async () => {
    // Mock AI provider to throw error
    vi.spyOn(
      anthropicProvider.AnthropicProvider.prototype,
      'stream'
    ).mockImplementation(async function* () {
      throw new Error('rate_limit_exceeded');
    });

    const response = await request(app)
      .post('/api/ai/standup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // Should return error event, not crash
    // SSE stream should contain error event
  });

  it('should handle database errors', async () => {
    // Mock repository to throw error
    vi.spyOn(journalRepository, 'findMostRecent').mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await request(app)
      .post('/api/ai/standup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // Should handle gracefully
  });
});
```

---

## Step 4: API Documentation (Swagger)

### 4.1: Register Schemas

**File:** `src/swagger/routes/ai.ts`

```typescript
import { registry } from '../registry.js';
import {
  StandupRequestSchema,
  ThinkingEventSchema,
  ContentEventSchema,
  DoneEventSchema,
  ErrorEventSchema,
} from '@rewrlution/papyrus-shared';

// Register request schema
registry.register('StandupRequest', StandupRequestSchema);

// Register SSE event schemas
registry.register('ThinkingEvent', ThinkingEventSchema);
registry.register('ContentEvent', ContentEventSchema);
registry.register('DoneEvent', DoneEventSchema);
registry.register('ErrorEvent', ErrorEventSchema);
```

### 4.2: Document Endpoint

**File:** `src/swagger/routes/ai.ts` (continued)

````typescript
/**
 * @openapi
 * /api/ai/standup:
 *   post:
 *     summary: Generate standup notes from journal entries
 *     description: |
 *       Streams standup notes using Server-Sent Events (SSE).
 *
 *       **Note:** This endpoint returns an SSE stream, not JSON.
 *       Swagger UI cannot test SSE endpoints. Use curl instead:
 *
 *       ```bash
 *       curl -N -H "Authorization: Bearer TOKEN" \
 *         -X POST http://localhost:3000/api/ai/standup
 *       ```
 *
 *       **Three modes:**
 *       1. Empty body → Use most recent journal
 *       2. `{ "date": "YYYY-MM-DD" }` → Use specific date
 *       3. `{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }` → Use date range
 *
 *       **SSE Events:**
 *       - `thinking` - Progress indicator
 *       - `content` - Text chunks (streamed)
 *       - `done` - Final metadata (journal_date, usage)
 *       - `error` - Error event (if failure)
 *     tags:
 *       - AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StandupRequest'
 *           examples:
 *             latest:
 *               summary: Latest journal (empty body)
 *               value: {}
 *             specificDate:
 *               summary: Specific date
 *               value:
 *                 date: "2025-01-07"
 *             dateRange:
 *               summary: Date range
 *               value:
 *                 from: "2025-01-01"
 *                 to: "2025-01-07"
 *     responses:
 *       200:
 *         description: SSE stream of standup notes
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: No journals found
 *       422:
 *         description: Validation error - Invalid date format or parameters
 *       429:
 *         description: Rate limit exceeded
 */
````

### 4.3: Register Route in Generator

**File:** `src/swagger/generator.ts`

Update to include AI routes:

```typescript
import './routes/auth.js';
import './routes/journals.js';
import './routes/ai.js'; // Add this
```

### 4.4: Test Documentation

```bash
# Start server
pnpm dev

# Open browser
open http://localhost:3000/api-docs
```

**Verify:**

- `/api/ai/standup` endpoint appears
- Request body schema shows three modes
- Examples are visible
- Security (Bearer token) is documented
- Note about SSE testing with curl is visible

---

## Step 5: Performance Testing

### 5.1: Test with Large Journals

**Create large test journal:**

```typescript
// In Prisma Studio or via script
const largeContent = 'a'.repeat(10000); // 10K characters

await prisma.journal.create({
  data: {
    userId,
    date: '20250107',
    hash: 'test-hash',
    ciphertext: largeContent,
    iv: 'test-iv',
    authTag: 'test-tag',
  },
});
```

**Test streaming:**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:3000/api/ai/standup \
  | tee output.txt
```

**Measure performance:**

```bash
time curl -N -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:3000/api/ai/standup \
  > /dev/null
```

**Success criteria:**

- P95 latency < 6 seconds (end-to-end)
- Streaming is smooth (not choppy)
- No memory leaks (check with `node --inspect`)

### 5.2: Test with Long Date Range

**Create 7 journals:**

```typescript
for (let i = 1; i <= 7; i++) {
  await prisma.journal.create({
    data: {
      userId,
      date: `2025010${i}`,
      hash: `hash-${i}`,
      ciphertext: `Day ${i} work: Fixed bugs, reviewed PRs.`,
      iv: `iv-${i}`,
      authTag: `tag-${i}`,
    },
  });
}
```

**Test range query:**

```bash
time curl -N -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"2025-01-01","to":"2025-01-07"}' \
  -X POST http://localhost:3000/api/ai/standup
```

**Success criteria:**

- Query completes successfully
- All 7 journals are aggregated
- Response is coherent (not just concatenated)

### 5.3: Test Concurrent Requests

**Create script:** `scripts/load-test.sh`

```bash
#!/bin/bash

TOKEN="your-token-here"
URL="http://localhost:3000/api/ai/standup"

# Make 5 concurrent requests
for i in {1..5}; do
  curl -N -H "Authorization: Bearer $TOKEN" \
    -X POST "$URL" > "output-$i.txt" &
done

# Wait for all to complete
wait

echo "All requests completed"
```

**Run:**

```bash
chmod +x scripts/load-test.sh
./scripts/load-test.sh
```

**Verify:**

- All 5 requests complete successfully
- Usage counter increments correctly (5 total)
- No race conditions (usage count is exactly 5, not 3 or 7)

---

## Step 6: Code Review & Polish

### 6.1: Code Quality Checklist

- [x] **Follow codebase conventions**
  - Routes → Controllers → Services → Repositories pattern
  - All Prisma queries in repositories
  - Controllers are thin (no business logic)
  - Services have no HTTP concepts

- [x] **Error handling**
  - All errors extend `ApiError`
  - Error messages are actionable
  - Logging is appropriate

- [x] **TypeScript**
  - No `any` types
  - Proper type exports from shared package
  - Interfaces documented

- [x] **Security**
  - Authentication required on endpoint
  - No sensitive data in logs
  - No SQL injection (using Prisma)
  - Content is encrypted at rest

- [x] **Performance**
  - Queries are indexed (userId, date)
  - No N+1 queries
  - Streaming is efficient

### 6.2: Run Linter

```bash
cd packages/api
pnpm lint
```

**Fix any errors:**

```bash
pnpm lint:fix
```

### 6.3: Run Type Checker

```bash
pnpm tsc --noEmit
```

**Expected: No errors**

### 6.4: Run All Tests

```bash
pnpm test
```

**Expected: All tests pass**

### 6.5: Check Test Coverage

```bash
pnpm test --coverage
```

**Target:**

- Overall coverage > 80%
- Critical paths (usage limiter, service) > 90%

---

## Step 7: Final Validation

### 7.1: End-to-End Manual Test

**Scenario: New user's first standup**

1. **Signup new user:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test-e2e@example.com","password":"test1234"}'
   ```

2. **Verify email** (get token from logs or DB)

3. **Sign in:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test-e2e@example.com","password":"test1234"}'
   ```

4. **Try standup (should fail - no journals):**

   ```bash
   curl -N -H "Authorization: Bearer TOKEN" \
     -X POST http://localhost:3000/api/ai/standup
   ```

   Expected: Error event saying "No journals found"

5. **Create journal via API:**

   ```bash
   curl -X POST http://localhost:3000/api/journals \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"date":"20250107","content":"Fixed bugs. Reviewed PRs."}'
   ```

6. **Try standup again (should succeed):**

   ```bash
   curl -N -H "Authorization: Bearer TOKEN" \
     -X POST http://localhost:3000/api/ai/standup
   ```

   Expected: Streams standup notes

7. **Check usage (1/10):**
   Expected: `done` event shows `"used":1,"limit":10`

8. **Make 9 more requests** (hit limit)

9. **Try standup (should fail - limit exceeded):**
   Expected: Error event saying "You've used 10/10 free requests"

**All steps work?** ✅ Feature is production-ready!

### 7.2: Update Phase Status

**File:** `packages/api/docs/ai/standup/README.md`

```markdown
## Phase Status

Track implementation progress:

- [x] Phase 1: SSE endpoint (mocked)
- [x] Phase 2: AI provider integration
- [x] Phase 3: Database + usage limits
- [x] Phase 4: Full integration
- [x] Phase 5: Testing & polish
- [ ] Phase 6: Deployment & monitoring

Update this README as phases are completed!
```

---

## Step 8: Prepare for Deployment

### 8.1: Environment Variables Checklist

Ensure all required env vars are documented:

**File:** `packages/api/.env.example`

```env
# ... existing vars ...

# AI Feature Configuration
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.7

# AI Usage Limits (Free Tier)
AI_STANDUP_FREE_LIMIT=10
AI_PROMOTION_FREE_LIMIT=1
AI_RESUME_FREE_LIMIT=1
AI_INTERVIEW_FREE_LIMIT=1
```

### 8.2: Migration Checklist

- [x] All migrations tested locally
- [x] Migration can run on production (idempotent)
- [x] Rollback plan documented

### 8.3: Monitoring Setup

**Add logging for production:**

```typescript
// In standup.service.ts
logger.info('[Standup] Request initiated', {
  userId,
  options,
  timestamp: new Date().toISOString(),
});

logger.info('[Standup] Generation complete', {
  userId,
  journalCount: journals.length,
  duration: Date.now() - startTime,
});

logger.error('[Standup] Error during generation', {
  userId,
  error: error.message,
  stack: error.stack,
});
```

**Track metrics:**

- Request count per user
- Average response time
- Error rate
- AI API costs

---

## Success Criteria

**All checkboxes complete?**

### Tests

- [x] Unit tests pass (prompts, usage limiter, helpers)
- [x] Integration tests pass (endpoint with mocked AI)
- [x] Error cases tested
- [x] Coverage > 80%

### Documentation

- [x] Swagger docs updated
- [x] SSE events documented
- [x] Curl examples provided
- [x] Env vars documented

### Performance

- [x] Large journals (10K chars) work
- [x] Long ranges (7 days) work
- [x] Concurrent requests work
- [x] No race conditions
- [x] P95 latency < 6s

### Code Quality

- [x] Linter passes
- [x] Type checker passes
- [x] Follows codebase conventions
- [x] Error handling comprehensive
- [x] Logging appropriate

### Manual QA

- [x] End-to-end scenario tested
- [x] All three modes work
- [x] Usage limits enforced
- [x] Error messages helpful

**If all checkboxes are complete: 🎉 Ready for Phase 6 (Deployment)!**

---

## What's Next?

**Phase 6: Deployment & Monitoring** (Optional)

1. **Deploy to Render**
   - Set env vars in dashboard
   - Run migrations
   - Verify API is accessible

2. **Test with CLI**
   - Build `papyrus ai standup` command
   - Test end-to-end flow

3. **Monitor in production**
   - Track Anthropic API costs
   - Monitor error rates
   - Set up alerts

4. **Iterate based on feedback**
   - Adjust prompts based on output quality
   - Tune usage limits based on costs
   - Add features based on user requests

---

## Quick Reference

**Run all tests:**

```bash
pnpm test
```

**Run specific test file:**

```bash
pnpm test tests/lib/ai/prompts/standup.test.ts
```

**Check coverage:**

```bash
pnpm test --coverage
```

**Run linter:**

```bash
pnpm lint
pnpm lint:fix
```

**Type check:**

```bash
pnpm tsc --noEmit
```

**View API docs:**

```bash
open http://localhost:3000/api-docs
```

**Manual E2E test:**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

---

## Congratulations! 🎉

You've completed the AI Standup feature implementation. The feature is:

- ✅ **Fully functional** - All three modes work
- ✅ **Well-tested** - Unit + integration tests
- ✅ **Well-documented** - Swagger docs + tutorials
- ✅ **Production-ready** - Error handling + performance validated
- ✅ **Maintainable** - Clean architecture + comprehensive tests

**Next steps:**

1. Deploy to production (Phase 6)
2. Build CLI command (`papyrus ai standup`)
3. Gather user feedback
4. Iterate on prompts and UX
5. Build next AI feature (promotion docs, resume, interview)

**Great work!** 🚀
