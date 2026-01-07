# AI Standup Notes - Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for the AI Standup Notes feature. The approach is **incremental and testable** - each phase validates a specific layer before moving to the next.

**Architecture Doc:** See [architecture.md](./architecture.md) for full technical design.

---

## Implementation Phases

### Phase 1: SSE Endpoint (Mocked Response)

**Goal:** Validate that Server-Sent Events streaming works on Express/Render before adding complexity.

**Why First:** SSE is critical infrastructure - test it independently before AI/DB integration.

**📖 Tutorial:** [tutorial-phase1-sse-endpoint.md](./tutorial-phase1-sse-endpoint.md)

#### Tasks

- [ ] **1.1: Create route structure**
  - Create `src/routes/ai/standup.routes.ts`
  - Create `src/controllers/ai/standup.controller.ts`
  - Create index files for clean imports

- [ ] **1.2: Wire up authentication**
  - Apply existing `requireAuthentication()` middleware
  - Test that auth works (401 without token)

- [ ] **1.3: Implement mocked streaming controller**
  - Set SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)
  - Send `thinking` event with delay
  - Send multiple `content` events with delays (simulate streaming)
  - Send `done` event with mocked metadata
  - Call `res.end()` to close stream

- [ ] **1.4: Mount route**
  - Add route to `src/app.ts` or `src/index.ts`
  - Verify endpoint appears in logs on startup

#### Testing

**Test with curl:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output:**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday:\n- Fixed auth bug"}

event: content
data: {"text":"\n- Reviewed 3 PRs"}

event: done
data: {"journal_date":"2025-01-07","usage":{"used":3,"limit":20}}
```

**Validation Checklist:**

- [ ] Events arrive **one by one** (not all at once)
- [ ] Delays work correctly (visible gaps between events)
- [ ] Connection stays open until final event
- [ ] 401 error without auth token
- [ ] Works locally on Express

**Optional:** Deploy to Render and test production environment.

#### Files Created

```
src/
├── routes/ai/
│   ├── index.ts
│   └── standup.routes.ts
└── controllers/ai/
    ├── index.ts
    └── standup.controller.ts
```

---

### Phase 2: AI Provider Integration

**Goal:** Replace mocked content with real AI streaming using Anthropic SDK.

**Why Now:** Test AI independently before adding DB complexity.

**📖 Tutorial:** [tutorial-phase2-ai-integration.md](./tutorial-phase2-ai-integration.md)

#### Tasks

- [ ] **2.1: Install Anthropic SDK**

  ```bash
  cd packages/api
  pnpm add @anthropic-ai/sdk
  ```

- [ ] **2.2: Add environment variable**
  - Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env`
  - Add validation to `src/env/config.ts` Zod schema
  - Add default AI config vars (`AI_MODEL`, `AI_MAX_TOKENS`, `AI_TEMPERATURE`)

- [ ] **2.3: Create AI provider wrapper**
  - Create `src/lib/ai/anthropic-provider.ts`
  - Implement `stream(prompt, options)` method
  - Returns `AsyncGenerator<string>` that yields text chunks
  - Handle Anthropic SDK errors gracefully

- [ ] **2.4: Create prompt builder**
  - Create `src/lib/ai/prompts/standup.ts`
  - Define `STANDUP_SYSTEM_PROMPT` constant
  - Implement `buildStandupPrompt(journal)` for single journal
  - Implement `buildStandupPromptForRange(journals)` for multiple journals
  - Add unit tests for prompt building

- [ ] **2.5: Update controller to use real AI**
  - Create hardcoded test journals (don't load from DB yet)
  - Build prompt from test journals
  - Stream AI response instead of mocked text
  - Keep SSE event structure (`thinking` → `content` chunks → `done`)

#### Testing

**Test with same curl command as Phase 1**

**Expected behavior:**

- AI generates real standup notes (Yesterday/Today/Blockers format)
- Streaming still works smoothly (chunks arrive incrementally)
- Content is coherent and follows prompt instructions

**Validation Checklist:**

- [ ] AI responds with proper standup format
- [ ] Streaming works (not all at once)
- [ ] Text quality is good (manually review output)
- [ ] No crashes or timeout errors
- [ ] Anthropic API errors are caught and logged

#### Files Created

```
src/
├── lib/ai/
│   ├── anthropic-provider.ts
│   └── prompts/
│       └── standup.ts
└── env/
    └── config.ts (updated with AI env vars)
```

#### Unit Tests

```
tests/
└── lib/ai/
    └── prompts/
        └── standup.test.ts
```

---

### Phase 3: Database + Usage Limits

**Goal:** Add persistence layer and enforce usage limits/guardrails.

**Why Now:** Database foundation needed before full integration.

**📖 Tutorial:** [tutorial-phase3-database-limits.md](./tutorial-phase3-database-limits.md)

#### Tasks

- [ ] **3.1: Create Prisma models**
  - Update `prisma/schema.prisma`
  - Add `AiUsage` model (userId, feature, month, count)
  - Add `AiPurchase` model (userId, product, expiresAt, generationsLimit, etc.)
  - Add relations to existing `User` model

- [ ] **3.2: Create and run migration**

  ```bash
  pnpm prisma:migrate
  # Name: ai_usage_and_purchases
  ```

  - Verify tables created in Supabase
  - Test with Prisma Studio (`pnpm prisma:studio`)

- [ ] **3.3: Create repositories**
  - Create `src/domain/repositories/ai-usage.repository.ts`
  - Implement: `findUsage(userId, feature, month)`, `upsertUsage(userId, feature, month, count)`
  - Create `src/domain/repositories/ai-purchase.repository.ts`
  - Implement: `findActivePurchase(userId, product)`

- [ ] **3.4: Add environment variables for limits**
  - Add `AI_STANDUP_FREE_LIMIT=20` to `.env`
  - Add `AI_PROMOTION_FREE_LIMIT=1`, etc.
  - Update `src/env/config.ts` Zod schema

- [ ] **3.5: Create usage limiter**
  - Create `src/lib/ai/usage-limiter.ts`
  - Implement `check(userId, feature)` - Returns `{ allowed, used, limit, reason }`
  - Check for active purchases first (premium tier)
  - Fall back to free tier check
  - Implement `increment(userId, feature)` - Increment usage counter

- [ ] **3.6: Add usage check to controller**
  - Check usage limit before streaming
  - Return 429 error if limit exceeded
  - Increment usage counter after successful generation
  - Include usage info in final `done` event

#### Testing

**Manual DB testing:**

1. Insert usage row via Prisma Studio: `{ userId, feature: 'standup', month: '2025-01', count: 20 }`
2. Try to generate standup with that user
3. Should get 429 error

**Test premium tier:**

1. Insert purchase row: `{ userId, product: 'standup-pro', expiresAt: null, generationsLimit: null }`
2. Try to generate standup
3. Should work even with high usage count

**Validation Checklist:**

- [ ] Free tier limit enforced (20/month)
- [ ] 429 error when limit exceeded
- [ ] Usage counter increments correctly
- [ ] Premium purchases bypass free tier limits
- [ ] Monthly usage resets automatically (new month = new count)

#### Files Created

```
prisma/
└── migrations/
    └── XXX_ai_usage_and_purchases.sql

src/
├── domain/repositories/
│   ├── ai-usage.repository.ts
│   └── ai-purchase.repository.ts
└── lib/ai/
    └── usage-limiter.ts
```

---

### Phase 4: Full Integration

**Goal:** Wire all layers together - load real journals, add validation, create service layer.

**Why Now:** All pieces validated independently, ready to combine.

**📖 Tutorial:** [tutorial-phase4-full-integration.md](./tutorial-phase4-full-integration.md)

#### Tasks

- [ ] **4.1: Create shared schemas**
  - Create `packages/shared/src/schemas/ai/standup.ts`
  - Define `StandupRequestSchema` (date?, from?, to?)
  - Define `StandupResponseSchema` (for documentation)
  - Export types

- [ ] **4.2: Add request validation**
  - Apply `validate(StandupRequestSchema)` middleware to route
  - Test with invalid date formats (should get 422 error)

- [ ] **4.3: Create service layer**
  - Create `src/services/ai/standup.service.ts`
  - Implement `generateStream(userId, options)` as async generator
  - Orchestrate: check usage → load journals → yield thinking → stream AI → increment usage → yield done
  - Handle all business logic (no HTTP concepts)

- [ ] **4.4: Load journals from database**
  - Use existing `journalRepository` methods
  - Support three modes:
    1. Empty body → Load most recent journal
    2. `{ date }` → Load specific date
    3. `{ from, to }` → Load date range
  - Decrypt journal content (already handled by repository)

- [ ] **4.5: Update controller to use service**
  - Controller becomes thin layer
  - Extract params, call service, stream events to response
  - Handle errors and convert to appropriate HTTP status codes

- [ ] **4.6: Add error handling**
  - No journals found → 404 with helpful message (suggest `papyrus sync`)
  - AI service error → 500 with generic message
  - Usage limit → 429 with upgrade path
  - Invalid date → 422 validation error

#### Testing

**End-to-end testing:**

1. **Latest journal (default)**

   ```bash
   curl -N -H "Authorization: Bearer TOKEN" \
     -X POST http://localhost:3000/api/ai/standup
   ```

   Expected: Uses most recent journal

2. **Specific date**

   ```bash
   curl -N -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"date":"2025-01-06"}' \
     -X POST http://localhost:3000/api/ai/standup
   ```

   Expected: Uses journal from 2025-01-06

3. **Date range**

   ```bash
   curl -N -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"from":"2025-01-01","to":"2025-01-07"}' \
     -X POST http://localhost:3000/api/ai/standup
   ```

   Expected: Aggregates journals from range

4. **No journals**
   - Test with user who has no journals
   - Expected: 404 with message to sync

5. **Invalid date format**
   ```bash
   curl -N -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"date":"01-06-2025"}' \
     -X POST http://localhost:3000/api/ai/standup
   ```
   Expected: 422 validation error

**Validation Checklist:**

- [ ] All three date modes work correctly
- [ ] AI generates quality standup notes from real journals
- [ ] Error messages are helpful and actionable
- [ ] Usage counter increments after successful generation
- [ ] Streaming feels smooth and responsive
- [ ] No crashes or unhandled errors

#### Files Created

```
packages/shared/src/schemas/ai/
├── standup.ts
└── index.ts

packages/api/src/services/ai/
├── standup.service.ts
└── index.ts
```

---

### Phase 5: Testing & Polish

**Goal:** Production-ready with comprehensive tests and error handling.

**📖 Tutorial:** [tutorial-phase5-testing-polish.md](./tutorial-phase5-testing-polish.md)

#### Tasks

- [ ] **5.1: Unit tests**
  - Prompt builder tests (`buildStandupPrompt`, `buildStandupPromptForRange`)
  - Usage limiter tests (check, increment, premium tier)
  - Helper function tests

- [ ] **5.2: Integration tests**
  - Mock Anthropic SDK
  - Test endpoint with different request bodies
  - Test auth (401 without token)
  - Test usage limits (429 when exceeded)
  - Test error cases (no journals, invalid dates)

- [ ] **5.3: Error handling review**
  - All error paths tested
  - Error messages are user-friendly
  - Errors logged appropriately (use existing Winston logger)
  - No sensitive data in error responses

- [ ] **5.4: Documentation**
  - Update Swagger/OpenAPI docs
  - Add note that endpoint returns SSE (Swagger UI can't test it)
  - Add example curl commands in description
  - Document all event types (`thinking`, `content`, `done`, `error`)

- [ ] **5.5: Code review**
  - Follow existing code conventions
  - Use repositories for all DB queries
  - Use mappers for data transformation (if needed)
  - Error classes extend `ApiError`
  - Proper TypeScript types throughout

- [ ] **5.6: Performance testing**
  - Test with large journals (~10K chars)
  - Test with date range (7 days)
  - Verify streaming is smooth (not choppy)
  - Check memory usage (no leaks)

#### Testing

**Run all tests:**

```bash
pnpm test
```

**Manual QA:**

- Test all happy paths
- Test all error cases
- Test with different journal sizes
- Test concurrency (multiple users at once)

**Validation Checklist:**

- [ ] All tests pass
- [ ] Code coverage >80%
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Performance is acceptable (P95 <6s)
- [ ] Error handling is comprehensive

#### Files Created

```
tests/
├── services/ai/
│   └── standup.service.test.ts
├── lib/ai/
│   ├── usage-limiter.test.ts
│   └── prompts/
│       └── standup.test.ts
└── routes/ai/
    └── standup.routes.test.ts
```

---

## Phase 6: Deployment & Monitoring (Optional)

**Goal:** Deploy to production and monitor.

#### Tasks

- [ ] **6.1: Deploy to Render**
  - Set environment variables in Render dashboard
  - Deploy latest code
  - Verify API is accessible
  - Test SSE endpoint in production

- [ ] **6.2: Test with CLI**
  - Build CLI command `papyrus ai standup`
  - Test end-to-end flow (CLI → API → AI → stream back to CLI)
  - Verify real-time streaming in terminal

- [ ] **6.3: Monitor costs**
  - Track Anthropic API usage
  - Monitor cost per request
  - Set up alerts if daily costs exceed threshold

- [ ] **6.4: Monitor errors**
  - Set up error tracking (if using service like Sentry)
  - Monitor error rates
  - Alert on high error rates (>5%)

- [ ] **6.5: Monitor performance**
  - Track P50, P95, P99 latency
  - Monitor streaming performance
  - Check for slow requests

---

## Quick Reference Checklist

### Must-Have for MVP

- [ ] SSE endpoint with auth
- [ ] Anthropic AI integration with streaming
- [ ] Database tables (`ai_usage`, `ai_purchases`)
- [ ] Usage limit enforcement (20/month free tier)
- [ ] Load journals from database (latest, specific date, range)
- [ ] Error handling (no journals, limit exceeded, AI errors)
- [ ] Basic tests (unit + integration)

### Nice-to-Have for Later

- [ ] Premium tier purchase flow
- [ ] Response caching (if same journals requested)
- [ ] Retry logic for AI failures
- [ ] Cost tracking per request
- [ ] Detailed analytics dashboard
- [ ] CLI streaming indicators (spinner, progress bar)

---

## Success Criteria

**Technical:**

- ✅ P95 latency <6 seconds end-to-end
- ✅ Error rate <1%
- ✅ SSE streaming works on Render
- ✅ Usage limits enforced correctly
- ✅ No data leaks (journals encrypted, not logged)

**Product:**

- ✅ Users can generate standups without friction
- ✅ Free tier sufficient for daily use (20/month)
- ✅ Output quality is useful (manually reviewed)
- ✅ Clear error messages when things go wrong
- ✅ Streaming UX is responsive and feels fast

**Business:**

- ✅ AI costs <$0.10 per request
- ✅ No abuse of free tier (limits work)
- ✅ Foundation ready for Phase 2 (career docs)

---

## Estimated Timeline

**Assuming 1 developer working solo:**

- Phase 1 (SSE mocked): **2-4 hours**
- Phase 2 (AI integration): **4-6 hours**
- Phase 3 (DB + usage limits): **6-8 hours**
- Phase 4 (Full integration): **4-6 hours**
- Phase 5 (Testing & polish): **6-8 hours**
- **Total: 22-32 hours (~3-4 days)**

**Note:** Timeline excludes:

- Premium purchase flow (payment integration)
- CLI implementation
- Advanced monitoring setup

---

## Dependencies

**External:**

- Anthropic API account + API key
- Supabase database (already have)
- Render deployment (already have)

**Internal:**

- Existing auth middleware (`requireAuthentication()`)
- Existing journal repository (to load journals)
- Existing User model
- Existing error handling infrastructure

---

## Risk Mitigation

**Risk 1: SSE doesn't work on Render**

- Mitigation: Test early (Phase 1)
- Fallback: Can switch to polling or WebSockets if needed

**Risk 2: Anthropic API rate limits**

- Mitigation: Start with low free tier (20/month)
- Monitor usage and costs closely
- Can add request queuing if needed

**Risk 3: Streaming performance issues**

- Mitigation: Test with large journals in Phase 2
- Can add caching or optimize prompts if needed

**Risk 4: Usage limit bypass**

- Mitigation: Enforce at multiple layers (controller + service)
- Add logging to detect anomalies
- Monitor usage patterns

---

## Next Steps After Phase 5

1. **CLI Implementation** - Build `papyrus ai standup` command
2. **User Testing** - Get feedback from beta users
3. **Iterate on Prompts** - Improve output quality based on feedback
4. **Phase 2 Planning** - Start designing career docs features (promotion/resume/interview)
5. **Payment Integration** - Add Stripe for premium purchases

---

## Questions?

Refer to:

- [architecture.md](./architecture.md) - Full technical design
- [../../README.md](../../README.md) - API overview
- [../../CLAUDE.md](../../CLAUDE.md) - Development guide
