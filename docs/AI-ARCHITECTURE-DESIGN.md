# AI Architecture Design for Papyrus

> ⚠️ **Note:** This is an early design document. The monetization model described here (generation limits) has been superseded by a time-based unlimited access model. See [AI-MONETIZATION.md](./AI-MONETIZATION.md) for the current implementation.

> Discussion document for deciding how to implement AI features in Papyrus

## The Core Question

**Where should AI processing happen: Server-side (API) or Client-side (CLI)?**

---

## Approach 1: Server-Side AI (API-Based)

### Architecture

```
┌─────────────┐
│     CLI     │
│             │
│  - Collects │───────┐
│    journals │       │
│  - Sends to │       │
│    API      │       │
└─────────────┘       │
                      │ HTTPS
                      ▼
                ┌─────────────┐
                │     API     │
                │             │
                │  - Prompts  │────────┐
                │  - Logic    │        │
                │  - LLM Keys │        │
                └─────────────┘        │
                                       │
                                       ▼
                                 ┌──────────┐
                                 │ AI Model │
                                 │ (OpenAI, │
                                 │ Anthropic)│
                                 └──────────┘
```

### How It Works

1. User runs: `papyrus ai standup`
2. CLI collects relevant journals from local storage
3. CLI sends journals to API endpoint: `POST /ai/generate/standup`
4. API constructs prompt using server-side templates
5. API calls LLM (OpenAI, Anthropic, etc.)
6. API returns generated content to CLI
7. CLI displays result to user

### Pros ✅

#### Business & Monetization

- **Easy to monetize**: Can offer AI features as premium tier
- **Usage tracking**: Know exactly who uses what, how much
- **Rate limiting**: Control costs by limiting requests per user/tier
- **Upsell path**: Free tier = basic AI, paid tier = advanced features

#### Technical & UX

- **Prompt engineering stays private**: Competitive advantage, IP protection
- **Easier to improve**: Update prompts without CLI updates
- **Consistent quality**: All users get same prompt quality
- **Model flexibility**: Switch AI providers without user impact
- **Better security**: API keys never exposed to clients
- **Simpler CLI**: No need to bundle prompt templates

#### User Experience

- **Just works**: Users don't need their own API keys
- **No setup**: Sign in and use AI features immediately
- **Consistent**: Same experience for all users
- **Managed costs**: Users don't worry about AI API bills

### Cons ❌

#### Dependencies & Costs

- **Requires internet**: Can't use AI on local-only journals (offline mode)
- **API costs**: You pay for all AI usage (could be expensive)
- **Scaling costs**: More users = more AI costs
- **Latency**: Network round-trip adds delay

#### User Control & Flexibility

- **Vendor lock-in**: Users depend on your API service
- **Less control**: Users can't tweak prompts for their needs
- **No BYOM**: Can't bring their own model/API key
- **Privacy concerns**: Users must send journals to your server

#### Business Risk

- **Need to maintain**: API service requires upkeep, monitoring
- **SLA pressure**: Users expect reliability
- **Storage concerns**: May need to cache/store journals server-side

---

## Approach 2: Client-Side AI (BYOM - Bring Your Own Model)

### Architecture

```
┌─────────────────────────────────┐
│             CLI                 │
│                                 │
│  - Collects journals            │
│  - Loads prompt templates       │
│  - Constructs prompts           │
│  - Calls LLM directly           │
│  - Uses user's API key          │
└─────────────────────────────────┘
              │
              │ User's API Key
              ▼
        ┌──────────┐
        │ AI Model │
        │ (OpenAI, │
        │ Anthropic,│
        │ Local LLM)│
        └──────────┘
```

### How It Works

1. User configures: `papyrus config set ai.provider openai`
2. User sets API key: `papyrus config set ai.apiKey sk-...`
3. User runs: `papyrus ai standup`
4. CLI loads prompt template from disk/package
5. CLI constructs prompt with journals
6. CLI calls LLM directly using user's API key
7. CLI displays result to user

### Pros ✅

#### User Control & Privacy

- **Full privacy**: Journals never leave user's machine (except to their chosen LLM)
- **BYOM**: Users can use any model (OpenAI, Anthropic, Local, etc.)
- **Cost control**: Users pay for their own usage, know exact costs
- **Customizable**: Power users can edit prompt templates locally
- **Offline-capable**: Can work with local LLMs (Ollama, LMStudio)

#### Technical Flexibility

- **No API maintenance**: You don't run AI infrastructure
- **No scaling costs**: Users pay their own AI bills
- **No rate limiting needed**: Users manage their own quotas
- **Model choice**: Support multiple providers easily

#### Coolness Factor

- **Hacker-friendly**: Appeals to developer audience
- **Open ecosystem**: Can integrate with any LLM
- **Tinkerable**: Users can experiment with prompts
- **Future-proof**: Works with new models as they emerge

### Cons ❌

#### User Experience & Friction

- **Setup required**: Users must get API keys, configure settings
- **Complex**: More config options = more confusion
- **Variable quality**: Users with bad prompts get bad results
- **Cost surprise**: Users might rack up unexpected AI bills
- **Fragmented experience**: Different users, different results

#### Business & Monetization

- **Harder to monetize**: Can't easily charge for AI features
- **Less control**: Can't track AI usage or feature adoption
- **No upsell**: AI features available to everyone equally
- **Support burden**: More complexity = more support requests

#### Technical Challenges

- **Larger CLI**: Need to bundle prompt templates, AI SDK
- **Prompt exposure**: Users see/modify your prompts (no IP protection)
- **Harder to improve**: Updating prompts requires CLI updates
- **Testing complexity**: Need to test against multiple providers
- **API compatibility**: Different LLMs have different APIs

---

## Approach 3: Hybrid (Best of Both?)

### Architecture

```
┌─────────────────────────────────┐
│             CLI                 │
│                                 │
│  User can choose:               │
│  1. Use Papyrus API (easy)      │───────┐
│  2. Use own API key (control)   │───┐   │
└─────────────────────────────────┘   │   │
                                      │   │
                            User API  │   │ Papyrus API
                                      ▼   ▼
                                  ┌────────────┐
                                  │ AI Models  │
                                  └────────────┘
```

### How It Works

**Default (API Mode):**

1. User runs: `papyrus ai standup`
2. CLI sends request to Papyrus API (server-side)
3. API handles prompt + LLM call
4. Result returned to CLI

**Advanced (BYOM Mode):**

1. User configures: `papyrus config set ai.mode local`
2. User sets API key: `papyrus config set ai.apiKey sk-...`
3. CLI uses local prompt templates + direct LLM calls

### Pros ✅

- **Best of both**: Easy for beginners, flexible for power users
- **Monetization path**: Free tier uses BYOM, paid tier uses managed API
- **User choice**: Privacy-conscious users can self-host
- **Gradual adoption**: Start with BYOM, add managed API later

### Cons ❌

- **Most complex**: Need to maintain both paths
- **Testing burden**: 2x the testing surface
- **Docs complexity**: More user confusion about modes
- **Split development**: Resources divided between two approaches

---

## Decision Framework

### Key Questions to Answer

1. **Who is your primary audience?**
   - **Casual users**: Prefer managed API (easy setup)
   - **Power users**: Prefer BYOM (control + privacy)
   - **Enterprise**: Might prefer self-hosted/BYOM

2. **What's your monetization strategy?**
   - **Freemium SaaS**: Need managed API
   - **Open-source + premium**: BYOM works
   - **Usage-based pricing**: Need API to track usage

3. **How much do you want to maintain?**
   - **Low maintenance**: BYOM (no server costs)
   - **High control**: Managed API (but more ops)

4. **How important is prompt quality?**
   - **Critical (e.g., resume writing)**: Keep prompts server-side
   - **Flexible (e.g., summaries)**: Client-side is OK

5. **How price-sensitive are users?**
   - **Very**: BYOM lets them control costs
   - **Not much**: Managed API is worth convenience

---

## Recommendation Matrix

| If You Value...                    | Choose...   |
| ---------------------------------- | ----------- |
| Monetization + Control             | Managed API |
| User Privacy + Flexibility         | BYOM        |
| Easy UX + Consistent Quality       | Managed API |
| Low Maintenance + Open Ecosystem   | BYOM        |
| Both Easy UX + Power User Features | Hybrid      |

---

## Implementation Considerations

### Managed API (Server-Side) Implementation

**API Package Changes:**

- Add new endpoints: `/ai/generate/:feature`
- Integrate OpenAI/Anthropic SDK
- Store API keys in environment variables
- Add rate limiting middleware
- Add usage tracking for billing

**CLI Package Changes:**

- Add `papyrus ai <command>` subcommands
- Send journals + metadata to API
- Handle API errors gracefully
- Show progress during generation

**Prompt Management:**

- Store prompts in API codebase
- Version prompts for A/B testing
- Track prompt performance

**Example API Endpoint:**

```typescript
// packages/api/src/routes/ai.ts
app.post("/ai/generate/standup", async (c) => {
  const { journals, date } = await c.req.json();

  const prompt = buildStandupPrompt(journals, date);
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return c.json({ content: response.choices[0].message.content });
});
```

---

### BYOM (Client-Side) Implementation

**CLI Package Changes:**

- Add prompt templates to CLI (`src/prompts/`)
- Add OpenAI/Anthropic SDK to CLI dependencies
- Add config for API keys: `papyrus config set ai.apiKey`
- Add provider selection: `papyrus config set ai.provider openai`
- Build prompt from template + journals locally
- Call LLM directly from CLI

**Prompt Management:**

- Ship prompt templates with CLI package
- Allow users to override templates locally (~/.config/papyrus/prompts/)
- Version templates with CLI releases

**Example CLI Command:**

```typescript
// packages/cli/src/commands/ai/standup.ts
import OpenAI from "openai";
import { loadPromptTemplate } from "../../prompts";

export async function generateStandup(date: string) {
  const journals = await loadJournals(date);
  const template = loadPromptTemplate("standup");
  const prompt = fillTemplate(template, { journals, date });

  const openai = new OpenAI({ apiKey: config.ai.apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  console.log(response.choices[0].message.content);
}
```

---

### Hybrid Implementation

**Phase 1: Start with BYOM**

1. Implement client-side AI (easiest to start)
2. Ship prompt templates with CLI
3. Let users bring their own API keys
4. Gather feedback on which features users love

**Phase 2: Add Managed API**

1. Build API endpoints for popular features
2. Migrate prompts to server-side
3. Add authentication + rate limiting
4. Offer as premium tier

**Configuration:**

```bash
# Default mode: managed API (for signed-in users)
papyrus ai standup  # Uses Papyrus API

# Switch to BYOM mode
papyrus config set ai.mode local
papyrus config set ai.provider openai
papyrus config set ai.apiKey sk-...

# Now uses local prompts + user's API key
papyrus ai standup
```

---

## Cost Analysis

### Managed API Costs (Per User/Month)

**Assumptions:**

- Average user generates 20 AI outputs/month
- Average prompt size: 2K tokens input + 500 tokens output
- Using GPT-4o: $2.50 per 1M input tokens, $10 per 1M output tokens

**Calculation:**

- Input cost: 20 requests × 2K tokens × $2.50/1M = $0.10
- Output cost: 20 requests × 500 tokens × $10/1M = $0.10
- **Total per user: ~$0.20/month**

**Business Model:**

- Free tier: 5 AI requests/month
- Pro tier: $5/month (unlimited AI)
- Margin: $4.80/month per pro user

### BYOM Costs (User Pays)

- User pays directly to OpenAI/Anthropic
- Same calculation: ~$0.20/month for average use
- Papyrus has $0 AI costs

---

## Security & Privacy Considerations

### Managed API Concerns

1. **Journal privacy**: Users must trust you with journal content
2. **Data retention**: How long do you store journals? (if at all)
3. **Compliance**: GDPR, CCPA if storing EU/CA user data
4. **Encryption**: HTTPS + encryption at rest
5. **Logging**: Don't log sensitive journal content

**Mitigation:**

- Clear privacy policy
- Minimal data retention (generate on-the-fly, don't store)
- End-to-end encryption option
- Allow users to delete all data

### BYOM Concerns

1. **API key security**: Users must protect their own keys
2. **Key exposure**: Keys in config files could leak
3. **Third-party trust**: Users must trust LLM provider (OpenAI, etc.)

**Mitigation:**

- Docs on API key security best practices
- Store keys in secure system keychain (not plain text)
- Warn users about LLM provider's data usage policies

---

## User Research Questions

Before deciding, consider surveying potential users:

1. **Would you use AI features in a journaling tool?**
   - Yes / No / Maybe

2. **Would you prefer:**
   - A) Easy setup, but send journals to Papyrus servers
   - B) More setup, but keep journals private with your own AI key
   - C) Don't care, just make it work

3. **Are you comfortable paying for AI features?**
   - Yes, $5/month for unlimited AI
   - Yes, but only pay-per-use
   - No, I'll bring my own API key

4. **How important is journal privacy to you?**
   - Very important (1-5): \_\_\_

5. **Which AI features would you use most?**
   - Standup notes
   - Resume builder
   - Career advice
   - (etc.)

---

## DECISION: Managed API Only (No BYOM)

**FINAL DECISION (from discussion):**

We will build **Managed API only**. No BYOM (at least not initially).

### Why This Decision Makes Sense

✅ **Free tier is generous enough**

- 10 standup notes/month
- 1 free trial of each premium feature
- Users get plenty of value without needing their own API key

✅ **Simpler to build**

- One path to develop, test, and maintain
- No need to bundle prompts with CLI
- No need to support multiple AI providers

✅ **Natural monetization enforcement**

- API checks user's purchase status
- Easy to track usage (standups used: 3/10)
- Easy to enforce limits (no valid purchase = no generation)

✅ **We already have auth**

- Users already login to Papyrus
- API already knows who the user is
- Just extend existing auth to check purchases

✅ **Better user experience**

- No API key setup friction
- Just login and use
- Consistent quality for all users

✅ **Lower support burden**

- No "my API key doesn't work" issues
- No "which AI provider should I use?" questions
- One path = easier to help users

### Trade-Offs We're Accepting

❌ **Less privacy** - Journals sent to Papyrus API

- Mitigation: Clear privacy policy, don't log journal content, generate on-the-fly

❌ **Requires internet** - Can't work offline

- Acceptable: AI features need LLM anyway, offline journaling still works

❌ **We pay AI costs** - ~$0.20/user/month for typical use

- Acceptable: Pricing covers this ($9-$29 per purchase vs $0.20 cost)

❌ **More operational overhead** - Server to maintain

- Acceptable: We already run API for sync, just extend it

### How It Works (Architecture Flow)

```
┌─────────────────┐
│   CLI (User)    │
│                 │
│  papyrus login  │───┐
│  papyrus standup│   │
│  papyrus promote│   │
└─────────────────┘   │
                      │ HTTPS + Auth Token
                      ▼
              ┌──────────────────┐
              │   Papyrus API    │
              │                  │
              │ 1. Authenticate  │
              │ 2. Check usage   │
              │ 3. Validate      │
              │    purchase      │
              │ 4. Generate AI   │
              └──────────────────┘
                      │
                      │ Your API Key
                      ▼
              ┌──────────────────┐
              │   OpenAI API     │
              │  (or Anthropic)  │
              └──────────────────┘
```

**Request Flow:**

1. User runs: `papyrus standup`
2. CLI sends to API: `POST /ai/standup` with auth token + journals
3. API validates:
   - Extract user ID from auth token
   - Query database: How many standups used this month?
   - If under 10: proceed. If over 10: return "Upgrade to Standup Pro"
4. API generates:
   - Construct prompt from server-side template
   - Call OpenAI/Anthropic with your API key
   - Increment usage counter in database
5. Return result to CLI
6. CLI displays to user

**Purchase Validation:**

```sql
-- Check if user has active purchase
SELECT * FROM purchases
WHERE user_id = ?
  AND product = 'promotion-builder'
  AND status = 'active'
  AND expires_at > NOW()
  AND generations_used < generations_limit
```

If found: Generate and increment `generations_used`
If not found: Return "Purchase Promotion Builder for $29"

---

## Provider-Agnostic Infrastructure

**DECISION (from discussion):**

Build provider-agnostic infrastructure so we can switch between OpenAI, Anthropic, or other providers easily.

### Architecture Pattern: Abstract Interface

```typescript
// packages/api/src/ai/providers/base.ts
interface AIProvider {
  generate(prompt: string, options: GenerateOptions): Promise<string>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  stream(
    messages: ChatMessage[],
    options?: StreamOptions,
  ): AsyncIterable<AIEvent>;
}

interface GenerateOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type AIEvent =
  | { type: "thinking"; message: string }
  | { type: "question"; question: string; options?: string[] }
  | { type: "content"; text: string }
  | { type: "draft"; section: string; content: string }
  | { type: "done"; session_id: string }
  | { type: "error"; error: string };
```

### Provider Implementations

```typescript
// packages/api/src/ai/providers/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options.model || "claude-3-sonnet-20240229",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.max_tokens || 4096,
    });
    return response.content[0].text;
  }

  async *stream(messages: ChatMessage[], options?: StreamOptions) {
    const stream = await this.client.messages.create({
      model: options?.model || "claude-3-sonnet-20240229",
      messages,
      stream: true,
      max_tokens: options?.max_tokens || 4096,
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta") {
        yield { type: "content", text: chunk.delta.text };
      }
    }

    yield { type: "done", session_id: options?.session_id };
  }
}

// packages/api/src/ai/providers/openai.ts
import OpenAI from "openai";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model || "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.max_tokens || 4096,
    });
    return response.choices[0].message.content;
  }

  async *stream(messages: ChatMessage[], options?: StreamOptions) {
    const stream = await this.client.chat.completions.create({
      model: options?.model || "gpt-4o",
      messages,
      stream: true,
      max_tokens: options?.max_tokens || 4096,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { type: "content", text: content };
      }
    }

    yield { type: "done", session_id: options?.session_id };
  }
}
```

### Factory Pattern

```typescript
// packages/api/src/ai/providers/factory.ts
export function createProvider(name: string, apiKey: string): AIProvider {
  switch (name) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}

// Usage
const provider = createProvider("anthropic", env.ANTHROPIC_API_KEY);
const result = await provider.generate("Hello world");
```

### Provider-Specific Prompts (Optional)

```
packages/api/src/ai/prompts/
├── standup/
│   ├── anthropic.txt   (Claude-optimized prompt)
│   ├── openai.txt      (GPT-optimized prompt)
│   └── base.txt        (Generic fallback)
├── promotion/
│   ├── anthropic.txt
│   └── base.txt
└── resume/
    └── base.txt
```

**Prompt Loading:**

```typescript
function loadPrompt(feature: string, provider: string): string {
  const specificPath = `prompts/${feature}/${provider}.txt`;
  const basePath = `prompts/${feature}/base.txt`;

  return fs.existsSync(specificPath)
    ? fs.readFileSync(specificPath, "utf-8")
    : fs.readFileSync(basePath, "utf-8");
}
```

---

## Interactive Chat for High-Stakes Features

**DECISION (from discussion):**

Use **interactive chat sessions** for high-stakes career documents (promotion, resume, interview) where accuracy matters.

### Why Chat vs One-Shot?

**Problem with one-shot:**

- AI hallucinates or misinterprets journal entries
- Missing critical details (numbers, impact metrics)
- User can't correct facts without full regeneration
- Wastes tokens regenerating entire document

**Benefits of chat:**

- ✅ AI asks for missing information upfront
- ✅ User corrects facts before generation
- ✅ Iterative refinement (not full regeneration)
- ✅ Higher quality output
- ✅ User feels in control

### Feature UX Patterns

| Feature               | Pattern          | Rationale                                            |
| --------------------- | ---------------- | ---------------------------------------------------- |
| **Standup Notes**     | One-shot         | Low stakes, facts are recent, no interaction needed  |
| **Weekly Summary**    | One-shot         | Low stakes, straightforward aggregation              |
| **Promotion Doc**     | Interactive Chat | High stakes, needs fact verification, complex output |
| **Resume Bullets**    | Interactive Chat | High stakes, needs metrics/impact clarification      |
| **Interview Stories** | Interactive Chat | High stakes, needs context and accuracy              |

### Example Flow: Promotion Document

```bash
$ papyrus promote --from 2024-01-01

Analyzing your journals from Jan-Dec 2024...
Found 234 journal entries covering 12 months.

Key achievements detected:
1. Led microservices migration (23 mentions)
2. Mentored 2 junior engineers (Alice, Bob)
3. Reduced API latency by 40%
4. Owned incident response during Black Friday

Before I generate your promotion document, I need to clarify a few details:

Q: How large was your team during the microservices migration?
> 5 engineers

Q: What was the business impact of the 40% latency reduction?
> Improved user retention by 15%, saved $50K/year in infrastructure costs

Q: How many incidents did you handle during Black Friday?
> 3 major incidents, all resolved within 2 hours, zero downtime

Q: Any other major achievements I should include?
> Led design review process for Q3-Q4, reviewed 50+ design docs

Excellent! Generating your promotion document...

[Streams output in sections]

═══════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════
[Content streams here in real-time...]

═══════════════════════════════════
KEY ACHIEVEMENTS
═══════════════════════════════════
[Content streams here...]

[Draft complete]

What would you like to do?
1. Edit a specific section
2. Add more details to a section
3. Regenerate with different tone
4. Save and exit

> 1

Which section?
1. Executive Summary
2. Key Achievements
3. Technical Contributions
4. Leadership & Mentorship
5. Business Impact

> 2

[Shows Key Achievements section]

What changes would you like? (describe in natural language)
> Add more detail about the cost savings from latency reduction

[Regenerates just that section with more detail]
```

---

## Server-Sent Events (SSE) for Streaming

**DECISION (from discussion):**

Use **Server-Sent Events (SSE)** for real-time streaming of AI responses.

### Why SSE over WebSocket?

| Aspect                 | SSE                       | WebSocket                    |
| ---------------------- | ------------------------- | ---------------------------- |
| **Complexity**         | Low (just HTTP)           | Medium (protocol upgrade)    |
| **Direction**          | Server→Client (enough!)   | Bidirectional (overkill)     |
| **HTTP-based**         | Yes                       | No                           |
| **Cloudflare Support** | Yes                       | Yes (Durable Objects needed) |
| **Node.js Support**    | Yes (eventsource package) | Yes                          |
| **Rust Support**       | Yes (eventsource-stream)  | Yes                          |
| **Auto-reconnect**     | Built-in                  | Manual                       |
| **Firewall-friendly**  | Yes                       | Sometimes blocked            |

**SSE is perfect because:**

- ✅ User messages are discrete (POST with JSON)
- ✅ AI responses stream one-way (SSE)
- ✅ Simpler to implement and debug
- ✅ Works everywhere (Node.js CLI now, Rust CLI later)
- ✅ Cloudflare Workers native support via Hono

---

### API Implementation (Hono + SSE)

```typescript
// packages/api/src/routes/ai/promote.ts
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

const app = new Hono();

app.post("/ai/promote/start", async (c) => {
  const userId = c.get("userId"); // From auth middleware
  const { from, to } = await c.req.json();

  // Create session
  const session = await createSession(userId, "promotion", { from, to });

  // Load journals
  const journals = await loadJournals(userId, from, to);

  return c.json({
    session_id: session.id,
    journals_count: journals.length,
  });
});

app.post("/ai/promote/chat/:sessionId", async (c) => {
  const { sessionId } = c.req.param();
  const { message } = await c.req.json();

  // Validate session ownership
  const session = await getSession(sessionId);
  if (session.user_id !== c.get("userId")) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Stream response using SSE
  return streamSSE(c, async (stream) => {
    try {
      // Get AI provider
      const provider = createProvider("anthropic", c.env.ANTHROPIC_API_KEY);

      // Build conversation history
      const messages = await buildMessages(session, message);

      // Stream AI response
      for await (const event of provider.stream(messages)) {
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        });
      }

      // Save conversation
      await saveMessage(sessionId, "user", message);
      await saveMessage(sessionId, "assistant", fullResponse);
    } catch (error) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({ error: error.message }),
      });
    }
  });
});
```

---

### CLI Implementation (Node.js + EventSource)

```typescript
// packages/cli/src/commands/promote.ts
import { EventSource } from "eventsource";
import inquirer from "inquirer";

export async function promote(options: { from: string; to?: string }) {
  // Start session
  const session = await api.post("/ai/promote/start", {
    from: options.from,
    to: options.to || new Date().toISOString().split("T")[0],
  });

  console.log(`Analyzing ${session.journals_count} journal entries...\n`);

  // Interactive Q&A loop
  let draft = "";
  while (true) {
    const { message } = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Your response:",
      },
    ]);

    // Stream AI response
    const response = await streamChat(session.session_id, message);

    if (response.has_draft) {
      draft = response.draft;
      break;
    }
  }

  // Show draft and refinement loop
  console.log("\n" + draft + "\n");

  // Refinement menu
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "Edit a section",
        "Add more details",
        "Regenerate with different tone",
        "Save and exit",
      ],
    },
  ]);

  // Handle action...
}

async function streamChat(sessionId: string, message: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`${API_URL}/ai/promote/chat/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ message }),
    });

    let fullResponse = "";
    let currentSection = "";

    es.addEventListener("thinking", (e) => {
      const data = JSON.parse(e.data);
      console.log(`\n💭 ${data.message}\n`);
    });

    es.addEventListener("question", (e) => {
      const data = JSON.parse(e.data);
      console.log(`\n❓ ${data.question}`);
      if (data.options) {
        data.options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
      }
    });

    es.addEventListener("content", (e) => {
      const data = JSON.parse(e.data);
      process.stdout.write(data.text);
      fullResponse += data.text;
    });

    es.addEventListener("draft", (e) => {
      const data = JSON.parse(e.data);
      if (data.section !== currentSection) {
        currentSection = data.section;
        console.log(`\n\n${"═".repeat(60)}`);
        console.log(data.section.toUpperCase());
        console.log("═".repeat(60));
      }
      console.log(data.content);
    });

    es.addEventListener("done", (e) => {
      es.close();
      resolve({ draft: fullResponse, has_draft: true });
    });

    es.addEventListener("error", (e) => {
      es.close();
      reject(new Error("Stream error"));
    });
  });
}
```

---

### Event Schema

```typescript
// Shared event types (packages/shared/src/ai-events.ts)
export type AIEvent =
  | { type: "thinking"; message: string }
  | { type: "question"; question: string; options?: string[] }
  | { type: "content"; text: string }
  | { type: "draft"; section: string; content: string }
  | { type: "done"; session_id: string }
  | { type: "error"; error: string };

// Example event flow for promotion doc:
[
  { type: "thinking", message: "Analyzing 234 journal entries..." },
  { type: "question", question: "How large was your team?", options: null },
  // [User responds via new POST]
  { type: "thinking", message: "Generating promotion document..." },
  { type: "draft", section: "executive_summary", content: "Led team of 5..." },
  { type: "draft", section: "achievements", content: "- Migrated..." },
  { type: "done", session_id: "abc123" },
];
```

---

## Implementation Plan (Revised)

### Week 1-2: API Foundation + Provider Infrastructure

- Add AI provider abstraction layer (`AIProvider` interface)
- Implement Anthropic provider
- Add SSE streaming support in Hono
- Add database schema for sessions, messages, usage tracking
- Add purchase validation logic

### Week 3-4: First Feature - Standup (One-Shot)

- Build standup prompt template
- Implement `POST /ai/standup` endpoint (non-streaming)
- Add usage limiting (10/month for free tier)
- Update CLI to call API endpoint
- Test end-to-end

### Week 5-6: Interactive Chat Infrastructure

- Implement session management (create, load, save)
- Build chat conversation builder
- Test SSE streaming with simple prompts
- Update CLI with EventSource streaming

### Week 7-8: Promotion Document (Chat-Based)

- Design multi-turn conversation flow
- Build promotion prompt templates
- Implement `POST /ai/promote/start` and `/ai/promote/chat/:id`
- Add interactive Q&A in CLI
- Test draft generation and refinement

### Week 9-10: Purchase Flow + Additional Features

- Add purchase validation system
- Mock payment (or integrate Stripe)
- Test purchase → usage → expiry flow
- Build resume and interview features (reuse chat infrastructure)

**Timeline:** 8-10 weeks to MVP with full interactive chat and monetization

---

## Open Questions to Resolve

1. **Which AI provider to support first?**
   - OpenAI (most popular, expensive)
   - Anthropic (Claude, good for long context)
   - Both?
   - Support for local models (Ollama)?

2. **How to handle prompt versioning?**
   - Ship prompts with CLI versions
   - Allow users to update prompts separately
   - Fetch latest prompts from GitHub?

3. **How much context to send to LLM?**
   - Single journal entry: ~500 tokens
   - Week of journals: ~3K tokens
   - Month: ~12K tokens
   - Need to balance cost vs quality

4. **Should we support streaming responses?**
   - Better UX (show progress)
   - More complex implementation
   - Worth it for long generations (resume, promotion doc)

5. **How to handle errors gracefully?**
   - API key invalid
   - Rate limit exceeded
   - Model not available
   - Network issues

6. **Should we cache AI responses?**
   - Save money on repeated requests
   - Privacy implications
   - Freshness concerns

---

## Next Steps

1. **Make a decision**: BYOM, Managed API, or Hybrid?
2. **Pick 3 features** to implement first (see AI-FEATURES-BRAINSTORM.md)
3. **Design prompt templates** for those features
4. **Prototype in CLI** with hard-coded prompts
5. **Test with real journals** to validate quality
6. **Iterate on prompts** based on results
7. **Ship MVP** and gather feedback

---

**Decision Needed:** Which approach do you want to pursue?
