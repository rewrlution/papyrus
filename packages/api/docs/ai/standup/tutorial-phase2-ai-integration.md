# Tutorial: Phase 2 - AI Provider Integration

Replace mocked content with real AI streaming using Anthropic's Claude.

---

## What We're Building

**Goal:** Replace the mocked standup notes with real AI-generated content that streams in real-time.

**Why now:**

- SSE infrastructure validated in Phase 1
- Test AI independently before adding database complexity
- Verify prompt quality and streaming performance

**Expected outcome:** The `/api/ai/standup` endpoint streams real AI-generated standup notes (Yesterday/Today/Blockers format) from hardcoded test journals.

---

## Architecture

```
Client Request
    ↓
Controller (from Phase 1)
    ↓
Hardcoded Test Journals
    ↓
Prompt Builder
    ↓ (Build prompt from journals)
Anthropic Provider
    ↓ (Stream AI response)
Transform to SSE events
    ↓
Client receives AI-generated content
```

**New components:**

- **AnthropicProvider** - Wrapper around official SDK, yields text chunks
- **Prompt Builder** - Constructs prompts from journal entries
- **Environment Config** - API key and AI settings

**Why this architecture:**

- **Provider abstraction** - Easy to swap AI providers later
- **Prompt module** - Centralize and version prompts
- **Hardcoded journals** - Test AI without database dependencies

---

## Prerequisites

**Required:**

- Phase 1 completed (SSE endpoint working)
- Anthropic API account ([console.anthropic.com](https://console.anthropic.com))
- Anthropic API key (starts with `sk-ant-...`)

**Assumed knowledge:**

- Async generators (`async function*` and `yield`)
- Environment variables
- Template literals

---

## Understanding Anthropic SDK Streaming

**Anthropic SDK** supports streaming responses (text arrives in chunks as AI generates).

**Streaming vs Non-Streaming:**

```typescript
// Non-streaming (wait for full response)
const response = await client.messages.create({ ... });
console.log(response.content[0].text); // All at once

// Streaming (process chunks as they arrive)
const stream = await client.messages.create({ stream: true, ... });
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    console.log(chunk.delta.text); // Progressive chunks
  }
}
```

**Why streaming:**

- Real-time feedback (UX improvement)
- Matches SSE pattern from Phase 1
- User sees progress immediately (not after 5 seconds)

---

## Implementation

### Step 1: Install Anthropic SDK

**Goal:** Add official Anthropic SDK as dependency.

```bash
# From packages/api directory
pnpm add @anthropic-ai/sdk
```

**Verify installation:**

```bash
# Should see in package.json
cat package.json | grep anthropic
# Output: "@anthropic-ai/sdk": "^0.x.x"
```

---

### Step 2: Add Environment Variables

**Goal:** Configure API key and AI settings securely.

#### Update .env file

```bash
# packages/api/.env
# Add these lines:

# AI Provider
ANTHROPIC_API_KEY=sk-ant-...  # Replace with your actual key

# AI Configuration (optional - defaults provided)
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.7
```

**Why these settings:**

- `ANTHROPIC_API_KEY` - Required for API authentication
- `AI_MODEL` - Claude 3.5 Sonnet (good balance of quality/speed/cost)
- `AI_MAX_TOKENS` - Max length of response (~2048 tokens = ~1500 words, plenty for standups)
- `AI_TEMPERATURE` - 0.7 = balanced creativity (0 = deterministic, 1 = creative)

**Security note:** Never commit `.env` file! Should already be in `.gitignore`.

#### Update Environment Config Schema

```typescript
// src/env/config.ts
import { z } from 'zod';

const envSchema = z.object({
  // ... existing fields (NODE_ENV, PORT, DATABASE_URL, etc.)

  // AI Provider
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  AI_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  AI_MAX_TOKENS: z.coerce.number().default(2048),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.7),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
```

**Why Zod validation:**

- Fails fast if API key missing (catches error at startup)
- Type-safe access to env vars throughout app
- Documents required configuration
- Matches existing pattern in the project

**Test configuration:**

```bash
pnpm dev
# Should start without errors
# If ANTHROPIC_API_KEY missing, will see clear error message
```

---

### Step 3: Create Anthropic Provider

**Goal:** Wrap Anthropic SDK in a clean interface that yields text chunks.

```typescript
// src/lib/ai/anthropic-provider.ts
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../env/config.js';

/**
 * Anthropic Provider
 * Wrapper around official Anthropic SDK for streaming AI responses
 */
export class AnthropicProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Stream AI response as text chunks
   * @param prompt - User prompt/instruction
   * @returns AsyncGenerator yielding text chunks
   */
  async *stream(prompt: string): AsyncGenerator<string> {
    try {
      const stream = await this.client.messages.create({
        model: env.AI_MODEL,
        max_tokens: env.AI_MAX_TOKENS,
        temperature: env.AI_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true, // Enable streaming
      });

      // Process stream events
      for await (const event of stream) {
        // Only yield text content deltas
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }

        // Log other event types for debugging (optional)
        if (event.type === 'message_start') {
          console.log('[AI] Stream started');
        }
        if (event.type === 'message_stop') {
          console.log('[AI] Stream completed');
        }
      }
    } catch (error) {
      console.error('[AI] Streaming error:', error);

      // Re-throw with helpful message
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }
}
```

**Why this design:**

1. **Async Generator (`async function*`):**
   - Yields text chunks one at a time
   - Perfect for SSE streaming (controller can forward chunks immediately)
   - Lazy evaluation (doesn't load everything in memory)

2. **Constructor initialization:**
   - Creates client once (reused for all requests)
   - Gets API key from validated environment config

3. **Stream filtering:**
   - Anthropic SDK emits many event types
   - We only care about `content_block_delta` (actual text)
   - Filters out metadata events

4. **Error handling:**
   - Catches Anthropic-specific errors
   - Logs for debugging
   - Re-throws with context

5. **Configuration from env:**
   - All AI settings configurable without code changes
   - Matches environment config pattern

**Design decision:** Simple wrapper, not over-abstracted. If we add OpenAI later, we'll create `OpenAIProvider` with same interface.

---

### Step 4: Create Prompt Templates

**Goal:** Define prompt templates that transform journals into standup notes.

```typescript
// src/lib/ai/prompts/standup.ts

/**
 * System prompt for standup generation
 * Instructs Claude on format and style
 */
export const STANDUP_SYSTEM_PROMPT = `You are a helpful assistant that generates concise standup notes from journal entries.

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

/**
 * Build prompt for single journal entry
 */
export function buildStandupPrompt(journal: {
  date: string;
  content: string;
}): string {
  return `${STANDUP_SYSTEM_PROMPT}

Here is the journal entry from ${journal.date}:

${journal.content}

Generate standup notes based on this journal entry.`;
}

/**
 * Build prompt for multiple journal entries (date range)
 */
export function buildStandupPromptForRange(
  journals: Array<{ date: string; content: string }>
): string {
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

**Why this approach:**

1. **System prompt as constant:**
   - Easy to version (can add `STANDUP_SYSTEM_PROMPT_V2` later)
   - Centralizes prompt engineering
   - Testable (can unit test prompt output)

2. **Clear format specification:**
   - Explicit structure (Yesterday/Today/Blockers)
   - Guidelines for tone and style
   - Prevents hallucinations (focuses on journal content)

3. **Two prompt builders:**
   - Single journal: Simple case
   - Date range: Aggregates multiple journals
   - Both use same system prompt (consistent output)

4. **Date context:**
   - Includes date so Claude knows timeline
   - Helps with past/future tense accuracy

**Prompt engineering tips:**

- Be explicit about format (Claude follows structure well)
- Provide examples if quality is poor (not needed for this simple case)
- Keep it concise (long system prompts waste tokens)

---

### Step 5: Update Controller to Use AI

**Goal:** Replace mocked content with real AI streaming.

```typescript
// src/controllers/ai/standup.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { asyncHandler } from '../../middleware/handlers.js';
import { AnthropicProvider } from '../../lib/ai/anthropic-provider.js';
import { buildStandupPrompt } from '../../lib/ai/prompts/standup.js';

/**
 * Standup Controller
 * Handles AI standup generation requests
 */
export const StandupController = {
  /**
   * POST /api/ai/standup
   * Generate standup notes using AI
   */
  generate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log(`[Standup] Generating for user: ${req.user.userId}`);

    // Helper to write SSE events
    const writeEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // PHASE 2: Use hardcoded test journal (will load from DB in Phase 4)
      const testJournal = {
        date: '2025-01-07',
        content: `Today was productive. Fixed the authentication bug that was causing 30% error rate during peak hours. Took about 90 minutes to diagnose using metrics and logs. Found it was a connection pool leak in the database client. Deployed hotfix and monitored for recurrence.

Also reviewed 3 PRs from the team - two frontend changes and one backend API update. Provided feedback on error handling and code structure.

Had a great pairing session with Alice on the database migration. We're moving from MySQL to PostgreSQL and discussed the schema changes needed. Planning to complete migration next week.

Tomorrow: Need to deploy the hotfix to production first thing. Then team planning meeting at 2pm to discuss Q1 roadmap. Want to start work on the new feature X if I have time.

Blocker: Still waiting on design team to approve mockups for feature X. Been waiting 3 days now, might affect timeline.`,
      };

      // Send thinking event
      writeEvent('thinking', { message: 'Analyzing journals...' });

      // Build prompt from journal
      const prompt = buildStandupPrompt(testJournal);

      // Initialize AI provider
      const aiProvider = new AnthropicProvider();

      // Stream AI response
      for await (const chunk of aiProvider.stream(prompt)) {
        writeEvent('content', { text: chunk });
      }

      // Send done event with metadata
      writeEvent('done', {
        journal_date: testJournal.date,
        usage: {
          used: 3,
          limit: 20,
          resets_at: '2025-02-01T00:00:00Z',
        },
      });

      // Close the stream
      res.end();
    } catch (error) {
      // If error occurs mid-stream, send error event
      console.error('[Standup] Error:', error);
      writeEvent('error', {
        message: 'AI service temporarily unavailable. Please try again.',
      });
      res.end();
    }
  }),
};
```

**Changes from Phase 1:**

1. **Hardcoded test journal:**
   - Realistic content (mirrors actual journal entry)
   - Tests prompt quality
   - Will be replaced with DB query in Phase 4

2. **Build prompt:**
   - Uses `buildStandupPrompt()` helper
   - Injects journal content into template

3. **AI streaming:**
   - Creates `AnthropicProvider` instance
   - Streams response: `for await (const chunk of aiProvider.stream(prompt))`
   - Each chunk forwarded as SSE `content` event

4. **Same SSE structure:**
   - Still sends `thinking` → `content` chunks → `done`
   - Client code doesn't need to change

**Why hardcoded journal:**

- Tests AI without database complexity
- Allows prompt iteration (try different prompts, see output)
- Validates streaming performance with real AI

**Design decision:** Keep same SSE event structure as Phase 1. From client's perspective, nothing changed except content is now AI-generated.

---

### Step 6: Create Module Index Files

**Goal:** Clean exports for easy imports.

```typescript
// src/lib/ai/index.ts
export { AnthropicProvider } from './anthropic-provider.js';
export * from './prompts/standup.js';
```

---

## Testing

### Test 1: Verify Environment Config

**Before running server:**

```bash
# Check API key is set
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-...

# Or check .env file
cat .env | grep ANTHROPIC_API_KEY
```

**Start server:**

```bash
pnpm dev
```

**Expected output:**

```
[INFO] Environment validated successfully
[INFO] Server listening on port 3000
```

**If error:** `ANTHROPIC_API_KEY is required`

- Check `.env` file exists in `packages/api/`
- Verify API key has no quotes or extra spaces
- Restart terminal to reload environment

---

### Test 2: Stream AI-Generated Standup

**Run the same curl command from Phase 1:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output (streaming in real-time):**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday"}

event: content
data: {"text":":\n- Fixed"}

event: content
data: {"text":" authentication bug causing"}

event: content
data: {"text":" 30% error"}

event: content
data: {"text":" rate during peak hours"}

... (more chunks) ...

event: content
data: {"text":"Blockers:\n- Waiting on design approval for feature X (3 days)"}

event: done
data: {"journal_date":"2025-01-07","usage":{"used":3,"limit":20,"resets_at":"2025-02-01T00:00:00Z"}}
```

**Key observations:**

- Text streams progressively (word by word or phrase by phrase)
- Total time: ~3-5 seconds (depends on response length)
- Format matches prompt (Yesterday/Today/Blockers)
- Content is coherent and work-focused

---

### Test 3: Verify Output Quality

**Manually review the generated standup:**

✅ **Good standup notes should:**

- Extract key accomplishments (bug fix, PRs reviewed, pairing session)
- Infer "Today" tasks from journal context
- Identify blockers explicitly mentioned
- Use past tense for "Yesterday"
- Use present/future tense for "Today"
- Be concise (3-5 bullets per section)

❌ **Watch out for:**

- Hallucinations (inventing facts not in journal)
- Wrong tense (past tense in "Today" section)
- Too verbose (walls of text instead of bullets)
- Missing sections (no Blockers when blocker exists)

**If quality is poor:**

- Iterate on system prompt (add examples, clarify guidelines)
- Try different AI temperature (lower = more focused)
- Check if journal content is clear enough

---

### Test 4: Error Handling

**Test with invalid API key:**

```bash
# Temporarily break API key in .env
ANTHROPIC_API_KEY=invalid-key

# Restart server
pnpm dev

# Make request
curl -N -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output:**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: error
data: {"message":"AI service temporarily unavailable. Please try again."}
```

**Server logs should show:**

```
[AI] Streaming error: Anthropic API error: Authentication error
[Standup] Error: Anthropic API error: Authentication error
```

**Fix and retest:**

```bash
# Restore correct API key in .env
ANTHROPIC_API_KEY=sk-ant-...

# Restart
pnpm dev
```

---

## Validation Checklist

After implementing Phase 2, verify:

- [ ] **Environment config works**
  - Server starts without errors
  - API key validated at startup

- [ ] **AI streaming works**
  - Text arrives in chunks (not all at once)
  - Total response time 3-5 seconds
  - No timeout errors

- [ ] **Output quality is good**
  - Follows Yesterday/Today/Blockers format
  - Extracts correct information from journal
  - Uses appropriate tenses
  - Concise bullets (not verbose)

- [ ] **Error handling works**
  - Invalid API key sends error event
  - Error logged to console
  - Connection closes gracefully

- [ ] **Streaming performance acceptable**
  - No noticeable lag between chunks
  - Smooth progressive rendering

---

## Project Structure After Phase 2

```
packages/api/src/
├── routes/
│   └── ai/
│       └── standup.routes.ts
│
├── controllers/
│   └── ai/
│       └── standup.controller.ts (modified - uses AI)
│
├── lib/
│   └── ai/
│       ├── index.ts                   ← NEW
│       ├── anthropic-provider.ts      ← NEW
│       └── prompts/
│           └── standup.ts             ← NEW
│
├── env/
│   └── config.ts (modified - added AI env vars)
│
└── .env (modified - added ANTHROPIC_API_KEY)
```

**Files changed:**

- `src/controllers/ai/standup.controller.ts` - Now uses AI instead of mocks
- `src/env/config.ts` - Added AI configuration schema
- `.env` - Added Anthropic API key

**Files created:**

- `src/lib/ai/index.ts`
- `src/lib/ai/anthropic-provider.ts`
- `src/lib/ai/prompts/standup.ts`

---

## Common Issues

### Issue 1: API Key Not Found Error

**Symptoms:** `ANTHROPIC_API_KEY is required` error on startup.

**Causes:**

1. `.env` file not in correct location (`packages/api/.env`)
2. API key has quotes around it (`ANTHROPIC_API_KEY="sk-ant-..."`)
3. Environment not reloaded after editing `.env`

**Solutions:**

- Verify `.env` location: `ls packages/api/.env`
- Remove quotes: `ANTHROPIC_API_KEY=sk-ant-...` (no quotes)
- Restart terminal/server after editing `.env`

---

### Issue 2: Streaming is Slow/Choppy

**Symptoms:** Long delays between chunks, or all text arrives at once.

**Causes:**

1. Network latency to Anthropic API
2. Response buffering
3. AI model generating slowly

**Solutions:**

- **If all at once:** Check SSE headers are set correctly
- **If slow chunks:** Normal behavior - AI generation takes time
- **If very slow (>10s):** Check network connection, try different AI model

**Note:** Claude 3.5 Sonnet typically streams at ~20-50 tokens/second (smooth).

---

### Issue 3: Output Quality Poor

**Symptoms:** Wrong format, hallucinations, too verbose, wrong tense.

**Causes:**

1. Prompt not clear enough
2. AI temperature too high (too creative)
3. Journal content ambiguous

**Solutions:**

**If wrong format:**

```typescript
// Add examples to system prompt
export const STANDUP_SYSTEM_PROMPT = `...

Example output:
Yesterday:
- Fixed authentication bug (90min)
- Reviewed 3 PRs

Today:
- Deploy hotfix
- Team meeting at 2pm

Blockers:
- Waiting on design approval
`;
```

**If too creative/wrong:**

```typescript
// Lower temperature in .env
AI_TEMPERATURE = 0.3; // More focused, less creative
```

**If hallucinations:**

- Prompt emphasizes: "Only use information from the journal"
- Already handled in current prompt

---

### Issue 4: TypeScript Error - Can't Find Module

**Symptoms:** `Cannot find module '@anthropic-ai/sdk'`

**Cause:** TypeScript doesn't see newly installed package.

**Solutions:**

1. Restart TypeScript server (VSCode: Cmd+Shift+P → "Restart TS Server")
2. Verify installation: `ls node_modules/@anthropic-ai`
3. Rebuild: `pnpm build`

---

### Issue 5: Rate Limit Error

**Symptoms:** Error: `rate_limit_error` from Anthropic API.

**Cause:** Too many requests in short time (free tier limits).

**Solutions:**

- Wait 60 seconds and retry
- Check Anthropic dashboard for usage
- Upgrade Anthropic plan if needed
- Add request queuing (Phase 3+)

**Free tier limits:** 50 requests/minute (should be fine for testing)

---

## What We Learned

**Technical:**

- ✅ How to use Anthropic SDK streaming API
- ✅ Async generators (`async function*` and `yield`)
- ✅ Environment validation with Zod
- ✅ Prompt engineering for structured output
- ✅ Integrating AI with SSE protocol

**Architectural:**

- ✅ Provider abstraction pattern (swap AI providers easily)
- ✅ Prompt versioning strategy
- ✅ Error handling for external APIs
- ✅ Separating concerns (provider, prompts, controller)

**AI-Specific:**

- ✅ Claude responds well to explicit formatting instructions
- ✅ Including date context improves tense accuracy
- ✅ Temperature affects creativity vs consistency
- ✅ Streaming provides better UX than waiting

---

## Prompt Iteration Tips

**If output quality isn't great, iterate on the prompt:**

### Add Examples (Few-Shot Prompting)

```typescript
export const STANDUP_SYSTEM_PROMPT = `...

Example 1:
Input: "Fixed login bug. Reviewed PR #123."
Output:
Yesterday:
- Fixed login bug
- Reviewed PR #123

Today:
- Continue work on auth feature

Blockers:
- None
`;
```

### Be More Specific

```typescript
// Before: "Be concise"
// After: "Limit each bullet to 10 words or less"

// Before: "Extract key achievements"
// After: "Focus on: bugs fixed, features shipped, PRs reviewed, meetings attended"
```

### Adjust Tone

```typescript
// For different audiences
export const STANDUP_SYSTEM_PROMPT = `...

Tone: Professional and action-oriented. Use active voice. Avoid filler words.
`;
```

**Test with multiple journals** - Some prompts work well for certain content but not others.

---

## Cost Considerations

**Anthropic Pricing (as of 2025):**

- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens

**Estimated cost per standup:**

- Input: ~1,500 tokens (journal + system prompt)
- Output: ~200 tokens (standup notes)
- Cost: $0.004 input + $0.003 output = **~$0.007 per request**

**At 20 requests/month (free tier):**

- Monthly cost: $0.14 per user
- Very affordable for MVP

**Optimization tip:** Cache system prompt (Anthropic supports prompt caching) to reduce costs by ~50% (add in Phase 5 if needed).

---

## Next Steps

### Phase 3: Database + Usage Limits

Now that AI works, next tutorial will:

1. Add Prisma models (`ai_usage`, `ai_purchases`)
2. Create usage limiter (check/increment usage)
3. Enforce free tier limits (20/month)
4. Add premium purchase support

**Why next:** Need guardrails before exposing to users. Can't let unlimited AI generation (costs money!).

### Optional Enhancements (Skip for MVP)

- Prompt caching (reduce costs)
- Multiple AI provider support (fallback to OpenAI if Anthropic down)
- Prompt A/B testing
- Response quality scoring

**Don't do these yet** - focus on core functionality first.

---

## Testing with Different Journals

**Want to test with different content?** Change the hardcoded journal:

```typescript
// Try short journal
const testJournal = {
  date: '2025-01-07',
  content: 'Worked on bug fix. Attended standup meeting.',
};

// Try journal with no blocker
const testJournal = {
  date: '2025-01-07',
  content: 'Productive day. Shipped feature X. Started feature Y.',
};

// Try journal with lots of detail
const testJournal = {
  date: '2025-01-07',
  content: '... (long detailed journal) ...',
};
```

**Observe:** Does prompt handle edge cases well?

---

## References

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Anthropic SDK GitHub](https://github.com/anthropics/anthropic-sdk-typescript)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Claude Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)

---

## Success Criteria

**Phase 2 Complete when:**

✅ Server starts with AI env vars validated
✅ AI generates standup notes from hardcoded journal
✅ Output follows Yesterday/Today/Blockers format
✅ Streaming works smoothly (3-5 seconds total)
✅ Error handling works (invalid API key)
✅ Output quality is good (manually reviewed)
✅ No TypeScript errors

**You're ready for Phase 3 when all checkboxes above are complete!**

---

**Time to implement:** 2-3 hours (includes testing, prompt iteration, and quality review)

**Next tutorial:** `tutorial-phase3-database-limits.md` (coming after you complete Phase 2!)
