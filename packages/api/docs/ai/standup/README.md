# AI Standup Notes - Documentation

Documentation for the AI-powered standup notes generation feature.

---

## Documents

### [architecture.md](./architecture.md)

**Technical architecture and design decisions**

Covers:

- Tech stack (raw Anthropic SDK, Express SSE, Prisma)
- Database schema (`ai_usage`, `ai_purchases`)
- SSE streaming implementation
- Usage limits & monetization
- Prompt engineering
- Performance considerations
- Key design decisions

**Read this for:** Understanding the "why" behind technical choices.

---

### [implementation-plan.md](./implementation-plan.md)

**Step-by-step implementation guide**

Covers:

- Phase 1: SSE endpoint (mocked)
- Phase 2: AI provider integration
- Phase 3: Database + usage limits
- Phase 4: Full integration
- Phase 5: Testing & polish
- Phase 6: Deployment & monitoring

**Read this for:** Building the feature from scratch.

---

## Quick Start

**Prerequisites:**

- Read [architecture.md](./architecture.md) first
- Understand the tech stack and design decisions

**Implementation:**

1. Follow [implementation-plan.md](./implementation-plan.md) phases in order
2. Test each phase before moving to the next
3. Use provided testing commands to validate

**Testing SSE:**

```bash
curl -N -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

---

## Key Concepts

### SSE Streaming

Server-Sent Events for real-time AI response streaming. Events:

- `thinking` - Progress indicator
- `content` - Text chunks (streamed)
- `done` - Final metadata (journal_date, usage)
- `error` - Error event (if failure)

### Usage Limits

- **Free tier:** 20 requests/month (configurable via `AI_STANDUP_FREE_LIMIT`)
- **Premium:** Unlimited (90 days for $9)
- Tracked in `ai_usage` table
- Premium purchases in `ai_purchases` table

### Database Models

- `AiUsage` - Monthly usage tracking per user/feature
- `AiPurchase` - Premium purchases with expiration and limits

---

## Related Docs

- [../../CLAUDE.md](../../CLAUDE.md) - API development guide
- [../../architecture.md](../../architecture.md) - Overall API architecture
- [../../../../docs/AI-ARCHITECTURE-SUMMARY.md](../../../../docs/AI-ARCHITECTURE-SUMMARY.md) - Project-wide AI decisions
- [../../../../docs/ai-requirements/standup-requirements.md](../../../../docs/ai-requirements/standup-requirements.md) - Functional requirements

---

## Phase Status

Track implementation progress:

- [x] Phase 1: SSE endpoint (mocked) - **Tutorial complete** ✅
- [x] Phase 2: AI provider integration - **Tutorial complete** ✅
- [x] Phase 3: Database + usage limits - **Tutorial complete** ✅
- [x] Phase 4: Full integration - **Tutorial complete** ✅
- [x] Phase 5: Testing & polish - **Tutorial complete** ✅
- [ ] Phase 6: Deployment & monitoring

**All tutorials are complete!** You can now follow the tutorials in order to implement the AI standup feature.
