# AI Architecture - Decision Summary

> High-level architecture decisions for Papyrus AI features

## ✅ Decisions Made

### 1. Infrastructure Approach

**Decision:** Managed API only (no BYOM)

**Rationale:**

- Free tier is generous (10 standups/month + free trials)
- Simpler to build and maintain
- Natural monetization enforcement
- Better UX (no API key setup)
- We already have auth infrastructure

---

### 2. AI Provider

**Decision:** Anthropic (Claude) as primary, but build provider-agnostic infrastructure

**Rationale:**

- Better for long-form career content
- Larger context window (200K tokens)
- Provider abstraction allows switching later
- Can optimize costs by using different providers per feature

**Architecture:**

- Abstract `AIProvider` interface
- Concrete implementations: `AnthropicProvider`, `OpenAIProvider`
- Factory pattern for provider creation
- Optional provider-specific prompts

---

### 3. UX Pattern: One-Shot vs Interactive Chat

**Decision:** Different patterns for different features

| Feature           | Pattern          | Rationale                       |
| ----------------- | ---------------- | ------------------------------- |
| Standup Notes     | One-shot         | Low stakes, recent facts        |
| Weekly Summary    | One-shot         | Simple aggregation              |
| Promotion Docs    | Interactive Chat | High stakes, needs verification |
| Resume Bullets    | Interactive Chat | High stakes, needs metrics      |
| Interview Stories | Interactive Chat | High stakes, needs context      |

**Rationale:**

- One-shot: Fast for daily tasks
- Chat: Higher quality for career documents, allows fact checking

---

### 4. Streaming Technology

**Decision:** Server-Sent Events (SSE)

**Rationale:**

- Simpler than WebSocket
- One-way streaming is sufficient
- Works on Cloudflare Workers (Hono native support)
- Works in Node.js CLI (eventsource package)
- Future-proof for Rust CLI (eventsource-stream crate)

**Architecture:**

- User sends messages via POST with JSON
- Server streams responses via SSE
- Event types: `thinking`, `question`, `content`, `draft`, `done`, `error`

---

### 5. Event Schema

**Decision:** Structured event types for all AI responses

```typescript
type AIEvent =
  | { type: 'thinking'; message: string }
  | { type: 'question'; question: string; options?: string[] }
  | { type: 'content'; text: string }
  | { type: 'draft'; section: string; content: string }
  | { type: 'done'; session_id: string }
  | { type: 'error'; error: string };
```

**Benefits:**

- Clear separation of AI actions
- Easy to render different event types in CLI
- Extensible for future event types

---

### 6. Feature Priority

**Decision:** Build in this order

1. **Standup Notes** (one-shot, daily habit)
2. **Promotion Docs** (chat-based, mid-frequency)
3. **Resume Bullets** (chat-based, occasional)
4. **Interview Stories** (chat-based, occasional)

**Rationale:**

- Standup validates infrastructure quickly
- Promotion doc is higher frequency than resume/interview
- Chat infrastructure reused across features

---

### 7. Monetization Model

**Decision:** Request-based limits + one-time purchases (not tokens, not subscription)

**Free Tier:**

- 10 standup notes/month
- 1 free trial of each career feature

**One-Time Purchases:**

- Standup Pro: $9 (unlimited, 90 days)
- Promotion Builder: $29 (3 docs, 90 days)
- Resume Refresh: $19 (10 generations, 30 days)
- Interview Prep: $19 (20 stories, 30 days)

**Rationale:**

- Users understand requests, not tokens
- Career events are infrequent (subscription feels weird)
- Priced on outcome value, not token cost

---

## 🤔 Open Questions (High-Level)

### 1. Command Structure ✅ DECIDED

**Decision:** All AI features under `ai` namespace

**Commands:**

- `papyrus ai standup` - Generate standup notes
- `papyrus ai promote` - Generate promotion document
- `papyrus ai resume` - Generate resume bullets
- `papyrus ai interview` - Generate interview stories

**Rationale:** Clear grouping, consistent pattern, expandable

---

### 2. Database Schema

**Question:** What tables do we need for AI features?

**Likely needs:**

- `ai_sessions` - Chat sessions for interactive features
- `ai_messages` - Conversation history
- `ai_usage` - Track request counts per user/feature/month
- `purchases` - Track one-time purchases with expiry
- `generated_documents` - Store final outputs?

**Need to decide:** Exact schema, what to store vs regenerate

---

### 3. Payment Integration

**Question:** How do users purchase features?

**Options:**

- A) Stripe integration (real payments)
- B) Mock/admin-granted purchases (for MVP)
- C) Credits system (buy credits, spend on features)

**Need to decide:** Payment flow for MVP

---

### 4. Session Persistence

**Question:** Can users pause and resume chat sessions?

**Scenarios:**

- User starts promotion doc, needs to find metrics, wants to continue tomorrow
- User's laptop dies mid-session

**Need to decide:** Session expiry, resume capability

---

### 5. Output Storage

**Question:** Where do generated documents go?

**Options:**

- A) Display in terminal only (user copies manually)
- B) Save to local file automatically (`~/Documents/papyrus-promotion-2025.md`)
- C) Save to Papyrus cloud (accessible via `papyrus docs list`)
- D) All of the above (user chooses)

**Need to decide:** Default output behavior

---

### 6. Rate Limiting & Abuse Prevention

**Question:** How do we prevent abuse beyond request limits?

**Concerns:**

- User makes 100 requests in 1 minute (burns through limit)
- User sends massive journals (100K tokens)
- Malicious actor tries to drain our AI budget

**Need to decide:** Rate limiting strategy, max request size

---

### 7. Error Handling

**Question:** How do we handle AI/network failures gracefully?

**Scenarios:**

- AI provider is down (OpenAI/Anthropic outage)
- User's network drops mid-stream
- AI generates inappropriate content
- User hits rate limit mid-session

**Need to decide:** Retry logic, fallback behavior, user messaging

---

### 8. Prompt Management

**Question:** How do we store and update prompts?

**Options:**

- A) Text files in API codebase (`src/ai/prompts/`)
- B) Database (easier to update without deploy)
- C) External service (e.g., Langfuse, PromptLayer)

**Need to decide:** Where prompts live, how to version them

---

### 9. Multi-Turn Chat State

**Question:** How much conversation history do we send to AI?

**Considerations:**

- Full history = better context, more tokens, higher cost
- Last N messages = cheaper, might lose context
- Summarize old messages = complex but cost-effective

**Need to decide:** Context window strategy

---

### 10. Testing Strategy

**Question:** How do we test AI features?

**Challenges:**

- AI outputs are non-deterministic
- Don't want to burn real API credits in tests
- Need to validate UX flow, not just API calls

**Options:**

- A) Mock AI provider responses
- B) Use cheaper models (Haiku, GPT-4o-mini) in tests
- C) Snapshot testing (save expected outputs)
- D) Human evaluation (manual testing)

**Need to decide:** Test strategy for AI features

---

## 📋 Next Steps in Discussion

What would you like to discuss next?

1. **Command structure** - How users invoke features?
2. **Database schema** - Design tables for sessions, purchases, usage?
3. **Payment integration** - Real Stripe or mock for now?
4. **Output handling** - Where do generated docs go?
5. **Something else** - What am I missing?

Or are we done with high-level architecture and ready to move to implementation planning?
