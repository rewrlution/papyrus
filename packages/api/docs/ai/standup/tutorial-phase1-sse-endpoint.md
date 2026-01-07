# Tutorial: Phase 1 - SSE Endpoint (Mocked Response)

Build a Server-Sent Events streaming endpoint to validate infrastructure before adding AI complexity.

---

## What We're Building

**Goal:** Create a working SSE endpoint that streams mocked standup notes in real-time.

**Why start here:**

- Validate that SSE streaming works on Express/Render
- Test infrastructure independently before adding AI/database
- Understand SSE mechanics before introducing complexity

**Expected outcome:** A `/api/ai/standup` endpoint that streams events (`thinking` → `content` chunks → `done`) with proper authentication.

---

## Architecture

```
Client Request
    ↓
Express Middleware Chain
    ↓ (CORS, Logger, Auth)
Route: POST /api/ai/standup
    ↓
StandupController.generate()
    ↓ (Set SSE headers)
Stream mocked events:
  - thinking (500ms delay)
  - content chunks (500ms delays)
  - done (with metadata)
    ↓
Client receives real-time stream
```

**Why this architecture:**

- **Controller-based:** Matches existing API pattern (thin controller layer)
- **Mocked response:** Tests streaming without external dependencies
- **Existing auth:** Reuses `requireAuthentication()` middleware
- **SSE protocol:** Standard approach for server → client streaming

---

## Prerequisites

**Required:**

- API server running (`pnpm dev` from `packages/api`)
- Understanding of Express middleware
- Bearer token from existing auth (or create test user)

**Assumed knowledge:**

- Basic Express.js (routes, middleware, req/res)
- TypeScript (interfaces, async/await)
- REST APIs (but SSE is different - we'll explain!)

---

## Understanding SSE (Quick Primer)

**Server-Sent Events (SSE)** is a standard for server → client streaming over HTTP.

**Key differences from regular REST:**

| Regular REST                          | SSE                                                     |
| ------------------------------------- | ------------------------------------------------------- |
| Client requests, server responds once | Client requests, server sends multiple events           |
| `Content-Type: application/json`      | `Content-Type: text/event-stream`                       |
| Connection closes after response      | Connection stays open                                   |
| `res.json(data)`                      | `res.write('event: ...\ndata: ...\n\n')` multiple times |

**SSE Event Format:**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday:\n- Fixed bug"}

event: done
data: {"journal_date":"2025-01-07"}
```

**Why SSE for AI streaming:**

- Real-time feedback as AI generates text
- Better UX than waiting 5 seconds for full response
- Standard protocol (works with EventSource API)
- Simpler than WebSockets for one-way streaming

---

## Implementation

### Step 1: Create Route Structure

**Goal:** Set up basic routing infrastructure following project conventions.

#### Create Route File

```typescript
// src/routes/ai/standup.routes.ts
import { Router } from 'express';
import { StandupController } from '../../controllers/ai/standup.controller.js';
import { requireAuthentication } from '../../middleware/auth.js';

const router = Router();

/**
 * POST /api/ai/standup
 * Generate standup notes from journal entries
 *
 * Authentication: Required (Bearer token)
 * Response: Server-Sent Events stream
 */
router.post('/', requireAuthentication, StandupController.generate);

export { router as standupRoutes };
```

**Why this approach:**

- **Reuses existing auth** - No need to reimplement authentication
- **POST not GET** - SSE can use any HTTP method; POST allows request body
- **Single route** - Keep it simple, add more routes later if needed
- **Export pattern** - Matches existing routes (authRoutes, journalRoutes, etc.)

#### Create Route Index

```typescript
// src/routes/ai/index.ts
export { standupRoutes } from './standup.routes.js';
```

**Why:** Clean imports in main app file (`import { standupRoutes } from './routes/ai'`)

---

### Step 2: Create Controller with SSE Headers

**Goal:** Implement controller that sets proper SSE headers and streams events.

```typescript
// src/controllers/ai/standup.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { asyncHandler } from '../../middleware/handlers.js';

/**
 * Standup Controller
 * Handles AI standup generation requests
 */
export const StandupController = {
  /**
   * POST /api/ai/standup
   * Generate standup notes (mocked for Phase 1)
   */
  generate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // For debugging: log authenticated user
    console.log(`[Standup] Generating for user: ${req.user.userId}`);

    // Helper to write SSE events
    const writeEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Helper to delay execution
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Event 1: Thinking (shows progress immediately)
      writeEvent('thinking', { message: 'Analyzing journals...' });
      await sleep(500);

      // Event 2-4: Content chunks (simulate streaming AI response)
      writeEvent('content', {
        text: 'Yesterday:\n- Fixed authentication bug in user service',
      });
      await sleep(500);

      writeEvent('content', { text: '\n- Reviewed 3 PRs from team members' });
      await sleep(500);

      writeEvent('content', {
        text: '\n- Paired with Alice on database migration\n\n',
      });
      await sleep(300);

      writeEvent('content', { text: 'Today:\n- Deploy hotfix to production' });
      await sleep(400);

      writeEvent('content', { text: '\n- Attend team planning meeting' });
      await sleep(400);

      writeEvent('content', { text: '\n- Start work on new feature X\n\n' });
      await sleep(300);

      writeEvent('content', {
        text: 'Blockers:\n- Waiting on design approval for feature X',
      });
      await sleep(300);

      // Event 5: Done (with metadata)
      writeEvent('done', {
        journal_date: '2025-01-07',
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
      console.error('[Standup] Stream error:', error);
      writeEvent('error', {
        message: 'An error occurred while generating standup notes',
      });
      res.end();
    }
  }),
};
```

**Why this approach:**

1. **SSE Headers:**
   - `Content-Type: text/event-stream` - Tells client this is SSE
   - `Cache-Control: no-cache` - Prevent caching of stream
   - `Connection: keep-alive` - Keep connection open

2. **writeEvent helper:**
   - Encapsulates SSE format (`event: ...\ndata: ...\n\n`)
   - Reduces repetition
   - Ensures correct format

3. **sleep helper:**
   - Simulates AI generation delays
   - Makes streaming visible (not instant)
   - Tests that connection stays open

4. **Multiple content events:**
   - Mimics real AI streaming (text arrives in chunks)
   - Tests client can handle multiple events
   - Shows progressive rendering

5. **Error handling:**
   - Catches errors mid-stream
   - Sends error event (client can display)
   - Always closes stream

6. **asyncHandler:**
   - Reuses existing middleware (catches promise rejections)
   - Forwards errors to error handler

**Design decision:** Mocked content is realistic standup format (Yesterday/Today/Blockers) so when we swap in real AI, format stays consistent.

#### Create Controller Index

```typescript
// src/controllers/ai/index.ts
export { StandupController } from './standup.controller.js';
```

---

### Step 3: Mount Route in Main App

**Goal:** Wire up the new route to the Express app.

```typescript
// src/app.ts (or src/index.ts depending on your structure)
// Add this import at the top with other route imports
import { standupRoutes } from './routes/ai/index.js';

// Inside createApp() or where routes are mounted:
// Add this line after existing routes (authRoutes, journalRoutes, etc.)
app.use('/api/ai/standup', standupRoutes);
```

**Why `/api/ai/standup` path:**

- Groups all AI features under `/api/ai/*`
- Consistent with existing pattern (`/api/auth`, `/api/journals`)
- Easy to add more AI features later (`/api/ai/promote`, etc.)

**Complete route path:** `POST /api/ai/standup` (because router is at `/` but mounted at `/api/ai/standup`)

---

### Step 4: Verify Server Starts

**Goal:** Ensure no TypeScript errors and server runs.

```bash
# From packages/api directory
pnpm dev
```

**Expected output:**

```
[INFO] Server listening on port 3000
[INFO] Routes registered:
  POST /api/auth/signup
  POST /api/auth/signin
  GET  /api/journals
  POST /api/ai/standup  ← Should see this!
```

**If you see TypeScript errors:**

- Check all imports have `.js` extensions
- Verify `AuthenticatedRequest` type exists in `src/types/index.ts`
- Ensure `asyncHandler` is exported from `src/middleware/handlers.js`

---

## Testing

### Test 1: Authentication Required (401)

Verify endpoint requires auth token.

```bash
curl -N -X POST http://localhost:3000/api/ai/standup
```

**Expected response:**

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

**Status code:** 401

**Why this test:**

- Confirms auth middleware is applied
- Ensures endpoint is secure

---

### Test 2: Successful SSE Stream

Test with valid auth token.

**First, get an auth token:**

```bash
# If you don't have a token, login first
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Save the token from response
```

**Then test SSE endpoint:**

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -X POST http://localhost:3000/api/ai/standup
```

**Expected output (streaming in real-time):**

```
event: thinking
data: {"message":"Analyzing journals..."}

event: content
data: {"text":"Yesterday:\n- Fixed authentication bug in user service"}

event: content
data: {"text":"\n- Reviewed 3 PRs from team members"}

event: content
data: {"text":"\n- Paired with Alice on database migration\n\n"}

event: content
data: {"text":"Today:\n- Deploy hotfix to production"}

event: content
data: {"text":"\n- Attend team planning meeting"}

event: content
data: {"text":"\n- Start work on new feature X\n\n"}

event: content
data: {"text":"Blockers:\n- Waiting on design approval for feature X"}

event: done
data: {"journal_date":"2025-01-07","usage":{"used":3,"limit":20,"resets_at":"2025-02-01T00:00:00Z"}}
```

**Key observations:**

- Events arrive with ~300-500ms delays (not all at once)
- Connection stays open until final event
- Each event is properly formatted
- Response never "completes" until `res.end()`

---

### Test 3: Observe Streaming in Browser (Optional)

Create a simple HTML test page to visualize streaming.

```html
<!-- test-sse.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>SSE Test</title>
  </head>
  <body>
    <h1>Standup SSE Test</h1>
    <div id="output"></div>

    <script>
      const token = 'YOUR_TOKEN_HERE'; // Replace with real token

      const eventSource = new EventSource(
        `http://localhost:3000/api/ai/standup?token=${token}` // Note: EventSource doesn't support custom headers, so we'd need to pass token in URL or use fetch with ReadableStream instead
      );

      const output = document.getElementById('output');

      eventSource.addEventListener('thinking', (e) => {
        const data = JSON.parse(e.data);
        output.innerHTML += `<p><strong>Thinking:</strong> ${data.message}</p>`;
      });

      eventSource.addEventListener('content', (e) => {
        const data = JSON.parse(e.data);
        output.innerHTML += `<span>${data.text}</span>`;
      });

      eventSource.addEventListener('done', (e) => {
        const data = JSON.parse(e.data);
        output.innerHTML += `<hr><p><strong>Done!</strong> Journal: ${data.journal_date}</p>`;
        eventSource.close();
      });

      eventSource.addEventListener('error', (e) => {
        output.innerHTML += `<p style="color: red;">Error occurred</p>`;
        eventSource.close();
      });
    </script>
  </body>
</html>
```

**Note:** EventSource API doesn't support Authorization headers, so for testing in browser you'd need to either:

1. Use `fetch` with ReadableStream instead of EventSource
2. Pass token in URL query parameter (less secure, only for testing)

**Better browser test using fetch:**

```html
<!-- test-sse-fetch.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>SSE Test (Fetch)</title>
  </head>
  <body>
    <h1>Standup SSE Test</h1>
    <button id="start">Start Stream</button>
    <div id="output"></div>

    <script>
      document.getElementById('start').addEventListener('click', async () => {
        const token = prompt('Enter your auth token:');
        const output = document.getElementById('output');
        output.innerHTML = '';

        const response = await fetch('http://localhost:3000/api/ai/standup', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let event = {};
          for (const line of lines) {
            if (line.startsWith('event:')) {
              event.type = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              event.data = JSON.parse(line.slice(5).trim());
            } else if (line === '') {
              if (event.type) {
                // Display event
                if (event.type === 'thinking') {
                  output.innerHTML += `<p><strong>💭 ${event.data.message}</strong></p>`;
                } else if (event.type === 'content') {
                  output.innerHTML += `<span>${event.data.text.replace(/\n/g, '<br>')}</span>`;
                } else if (event.type === 'done') {
                  output.innerHTML += `<hr><p>✅ Done! Journal: ${event.data.journal_date}</p>`;
                }
                event = {};
              }
            }
          }
        }
      });
    </script>
  </body>
</html>
```

Open in browser, click "Start Stream", enter token, and watch it stream!

---

## Validation Checklist

After implementing, verify:

- [ ] **Server starts without errors**
  - No TypeScript compilation errors
  - Route appears in startup logs

- [ ] **Authentication works**
  - 401 without token
  - 200 with valid token

- [ ] **Streaming works correctly**
  - Events arrive one by one (not all at once)
  - Delays are visible (~500ms between events)
  - Connection stays open until final event

- [ ] **Event format is correct**
  - Each event has `event:` and `data:` lines
  - Empty line separates events
  - Data is valid JSON

- [ ] **All event types present**
  - `thinking` event appears first
  - Multiple `content` events
  - `done` event appears last with metadata

- [ ] **Error handling works**
  - If you force an error (add `throw new Error()`), error event is sent

---

## Project Structure After Phase 1

```
packages/api/src/
├── routes/
│   └── ai/
│       ├── index.ts           ← NEW
│       └── standup.routes.ts  ← NEW
│
├── controllers/
│   └── ai/
│       ├── index.ts           ← NEW
│       └── standup.controller.ts  ← NEW
│
└── app.ts (modified - added route mounting)
```

**Files changed:**

- `src/app.ts` or `src/index.ts` - Added route mounting

**Files created:**

- `src/routes/ai/index.ts`
- `src/routes/ai/standup.routes.ts`
- `src/controllers/ai/index.ts`
- `src/controllers/ai/standup.controller.ts`

---

## Common Issues

### Issue 1: Events Arrive All At Once

**Symptoms:** All events appear instantly, no progressive streaming.

**Cause:** Response buffering - some proxies/environments buffer SSE.

**Solution:**

1. Ensure `Cache-Control: no-cache` header is set
2. Check if running behind nginx/proxy with buffering enabled
3. On Render, SSE should work by default (no proxy buffering)

**Test locally first** - if it works locally but not on Render, it's a deployment config issue.

---

### Issue 2: Connection Closes Immediately

**Symptoms:** Only first event received, then connection closes.

**Cause:** Forgot to remove `res.json()` or similar response-ending methods.

**Solution:**

- Use only `res.write()` for events
- Call `res.end()` only after ALL events sent
- Don't use `return res.json()` in SSE handlers

---

### Issue 3: CORS Error in Browser

**Symptoms:** Browser console shows CORS error when testing HTML page.

**Cause:** CORS middleware not configured for SSE requests.

**Solution:**
Ensure CORS allows your origin (already configured in existing API).

```typescript
// Should already exist in app.ts
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  })
);
```

---

### Issue 4: TypeScript Error - "Cannot find module"

**Symptoms:** `Cannot find module '../../controllers/ai/standup.controller.js'`

**Cause:** Forgot `.js` extension in import (required for ES modules).

**Solution:** Always add `.js` to relative imports:

```typescript
// Correct
import { StandupController } from '../../controllers/ai/standup.controller.js';

// Wrong
import { StandupController } from '../../controllers/ai/standup.controller';
```

---

## What We Learned

**Technical:**

- ✅ How SSE differs from regular REST responses
- ✅ SSE event format (`event:` and `data:` lines)
- ✅ How to keep connection alive with `res.write()`
- ✅ Proper headers for SSE (`text/event-stream`, `no-cache`, `keep-alive`)
- ✅ How to test SSE with curl and browser

**Architectural:**

- ✅ Controller pattern for HTTP handlers
- ✅ Reusing existing middleware (auth)
- ✅ Consistent project structure
- ✅ Error handling in streaming contexts

**Why mocked response first:**

- ✅ Validates SSE infrastructure independently
- ✅ Tests connection stays open
- ✅ Verifies streaming behavior before AI complexity
- ✅ Provides realistic format for later integration

---

## Next Steps

### Phase 2: AI Provider Integration

Now that SSE works, next tutorial will:

1. Install Anthropic SDK
2. Create AI provider wrapper
3. Build prompt templates
4. Replace mocked content with real AI streaming

**Why wait:** SSE is now validated. If Phase 2 has issues, we know it's AI-related, not streaming-related.

### Optional Enhancements (Skip for MVP)

- Add request validation (Zod schema for request body)
- Support date parameters (will do in Phase 4)
- Add logging (Winston) for debugging
- Add request ID tracking

**Don't do these yet** - they add complexity without testing core functionality.

---

## Testing on Render (Optional)

If you want to test SSE works in production:

1. **Deploy to Render:**

   ```bash
   git add .
   git commit -m "feat: add SSE standup endpoint (Phase 1 mocked)"
   git push
   ```

2. **Test production endpoint:**

   ```bash
   curl -N -H "Authorization: Bearer PROD_TOKEN" \
     -X POST https://your-api.onrender.com/api/ai/standup
   ```

3. **Verify:**
   - Events stream progressively (not all at once)
   - Connection stays open
   - No timeout errors

**Expected:** Should work identically to local testing. Render supports SSE by default.

---

## References

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Express.js Response API](https://expressjs.com/en/4x/api.html#res)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

## Success Criteria

**Phase 1 Complete when:**

✅ Endpoint returns 401 without auth
✅ Endpoint streams events with valid auth
✅ Events arrive progressively (visible delays)
✅ Connection stays open until final event
✅ All event types present (thinking, content, done)
✅ Server starts without TypeScript errors
✅ curl test shows streaming behavior

**You're ready for Phase 2 when all checkboxes above are complete!**

---

**Time to implement:** 1-2 hours (includes testing and debugging)

**Next tutorial:** `tutorial-phase2-ai-integration.md` (coming after you complete Phase 1!)
