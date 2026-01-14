# Tutorial: Adding the Standup Command with Streaming

Brief description: Add a `papyrus standup` command that generates AI standup notes from journal entries with real-time streaming output.

## What We're Building

**Goal:** Create a CLI command that calls the AI standup endpoint and displays the generated notes with a streaming effect as the AI writes them.

**User experience:**
```bash
$ papyrus standup
✨ Generating standup notes...

Yesterday:
- Implemented user authentication system
- Fixed critical bug in journal sync
- Reviewed PRs for the dashboard redesign

Today:
- Continue work on AI standup feature
- Write tests for new endpoints

Blockers:
- Waiting for API rate limit increase

✓ Done! Used 3/10 free requests this month.
```

**What problem does this solve?**
- Automatically summarizes recent work from journal entries
- Saves time writing daily standup updates
- Provides real-time feedback as AI generates content

**Expected outcome:**
- New command: `papyrus standup [options]`
- Streaming text output (character-by-character or chunk-by-chunk)
- Support for different date modes (latest, specific date, date range)
- Auth-protected with usage tracking

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│  papyrus standup                                    │
│  (Command Handler)                                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─→ ensureAuthenticated()
                 │   (Auth Middleware)
                 │
                 ├─→ ApiClient.generateStandup()
                 │   (HTTP with SSE support)
                 │
                 ▼
       ┌─────────────────────┐
       │ StandupStream       │
       │ (Ink Component)     │
       │                     │
       │ - Thinking spinner  │
       │ - Streaming text    │
       │ - Usage stats       │
       │ - Error handling    │
       └─────────────────────┘
```

### Data Flow

```
1. User runs: papyrus standup --from 2025-01-01
2. Command handler validates options
3. ensureAuthenticated() checks token
4. ApiClient.generateStandup() opens SSE connection
5. StandupStream component renders:
   - Shows "Analyzing journals..." with spinner
   - Streams content as it arrives (character-by-character)
   - Shows usage stats when complete
6. Connection closes, component exits
```

### Why this architecture:

- **Separate API method**: Keeps HTTP logic isolated (testable)
- **Ink component**: Provides rich terminal UI with state management
- **SSE streaming**: Native browser/Node.js EventSource pattern
- **React hooks**: Manage streaming state (useState, useEffect)
- **Auth middleware**: Consistent with existing commands

### Technology choices:

| Need | Solution | Why |
|------|----------|-----|
| **SSE parsing** | Native `fetch` + manual parsing | Built-in, no extra deps |
| **Terminal UI** | Ink (existing) | Already used in CLI |
| **HTTP client** | Extend ApiClient | Consistent with codebase |
| **State management** | React hooks | Natural fit for streaming |

---

## Prerequisites

**Required:**

- Completed API standup endpoint (Phase 4)
- Node.js 20+
- Existing CLI setup with Ink

**Assumed knowledge:**

- "Basic TypeScript" (we'll use interfaces, async/await)
- "Familiar with React hooks" (useState, useEffect)
- "Server-Sent Events" (we'll explain briefly)

**Packages to verify:**

```bash
cd packages/cli
# Check package.json - should have:
# - ink@6.x
# - react@19.x
# - axios@1.x
# - chalk@5.x
```

---

## Implementation

### Step 1: Add Server-Sent Events Support to ApiClient

**Goal:** Extend ApiClient with a method that handles SSE streaming from the standup endpoint.

**Why SSE?** The API uses Server-Sent Events for streaming AI responses. Unlike regular HTTP requests, SSE keeps the connection open and sends data incrementally.

**File:** `src/lib/api/api-client.ts`

**Add the new method:**

```typescript
// Add to existing ApiClient class (after existing methods)

/**
 * Generate standup notes with streaming
 *
 * @param options - Generation options (date, from, to)
 * @param onEvent - Callback for each SSE event
 * @returns Promise that resolves when stream completes
 */
async generateStandup(
  options: {
    date?: string;     // YYYY-MM-DD
    from?: string;     // YYYY-MM-DD
    to?: string;       // YYYY-MM-DD
  },
  onEvent: (event: StandupEvent) => void
): Promise<void> {
  const token = tokenStore.get();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${this.http.defaults.baseURL}/api/ai/standup`;

  // Use fetch for SSE support (axios doesn't support streaming responses well)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let currentEvent = '';
      let currentData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7);
        } else if (line.startsWith('data: ')) {
          currentData = line.slice(6);
        } else if (line === '' && currentEvent && currentData) {
          // Complete message
          try {
            const data = JSON.parse(currentData);
            onEvent({ type: currentEvent, data });
          } catch (err) {
            console.error('Failed to parse SSE data:', currentData);
          }
          currentEvent = '';
          currentData = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

**Add type definition** (add to top of file or in `src/commands/types.ts`):

```typescript
/**
 * SSE event from standup endpoint
 */
export interface StandupEvent {
  type: 'thinking' | 'content' | 'done' | 'error';
  data: any;
}
```

**Why this implementation:**

1. **Uses fetch instead of axios**: Axios buffers responses, making streaming difficult. Fetch provides low-level stream access.
2. **Manual SSE parsing**: We parse `event:` and `data:` lines according to SSE spec. This gives us full control.
3. **Buffer management**: Handles partial messages by keeping incomplete lines in a buffer.
4. **Callback pattern**: `onEvent` callback makes it easy to update UI in real-time.

**Alternative (not recommended):** Use `eventsource-parser` library. However, adding a dependency for simple SSE parsing is overkill.

---

### Step 2: Create the StandupStream Component

**Goal:** Build an Ink component that displays streaming standup notes with a nice terminal UI.

**File:** `src/components/StandupStream.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import { apiClient } from '../lib/api/api-client.js';
import type { StandupEvent } from '../lib/api/api-client.js';

export interface StandupStreamProps {
  date?: string;
  from?: string;
  to?: string;
  onComplete: () => void;
}

export function StandupStream({
  date,
  from,
  to,
  onComplete,
}: StandupStreamProps) {
  const [status, setStatus] = useState<'thinking' | 'streaming' | 'done' | 'error'>('thinking');
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [content, setContent] = useState('');
  const [journalDate, setJournalDate] = useState('');
  const [usage, setUsage] = useState<{
    tier: string;
    used?: number | null;
    limit?: number | null;
    resets_at?: string | null;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const streamStandup = async () => {
      try {
        await apiClient.generateStandup(
          { date, from, to },
          (event: StandupEvent) => {
            if (!isMounted) return;

            switch (event.type) {
              case 'thinking':
                setThinkingMessage(event.data.message);
                setStatus('thinking');
                break;

              case 'content':
                setStatus('streaming');
                // Append new text chunk
                setContent((prev) => prev + event.data.text);
                break;

              case 'done':
                setStatus('done');
                setJournalDate(event.data.journal_date);
                setUsage(event.data.usage);
                setTimeout(() => {
                  if (isMounted) onComplete();
                }, 100);
                break;

              case 'error':
                setStatus('error');
                setErrorMessage(event.data.message);
                setTimeout(() => {
                  if (isMounted) onComplete();
                }, 2000);
                break;
            }
          }
        );
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 2000);
      }
    };

    streamStandup();

    return () => {
      isMounted = false;
    };
  }, [date, from, to, onComplete]);

  // Render based on status
  if (status === 'thinking') {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {thinkingMessage || 'Generating standup notes...'}</Text>
        </Box>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ Error: {errorMessage}</Text>
      </Box>
    );
  }

  if (status === 'streaming' || status === 'done') {
    return (
      <Box flexDirection="column">
        {/* Show content as it streams */}
        <Text>{content}</Text>

        {/* Show completion status */}
        {status === 'done' && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="green">✓ Done!</Text>
            {usage && (
              <Box marginTop={1}>
                <Text dimColor>
                  Journal: {journalDate} • {usage.tier === 'free' ? 'Free tier' : 'Premium'}{' '}
                  {usage.used !== null && usage.limit !== null && (
                    <>({usage.used}/{usage.limit} requests this month)</>
                  )}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return null;
}
```

**Why this structure:**

- **State management**: React hooks track streaming progress
- **useEffect**: Starts streaming when component mounts
- **Cleanup**: `isMounted` flag prevents state updates after unmount
- **Progressive rendering**: Shows spinner → content → completion
- **Error handling**: Displays errors and auto-exits after 2 seconds

**Key patterns:**

1. **Thinking state**: Shows spinner with message during AI processing
2. **Streaming state**: Appends text chunks as they arrive
3. **Done state**: Shows final content + usage stats
4. **Error state**: Displays error message

---

### Step 3: Create the Command Handler

**Goal:** Wire up the command to parse options and render the Ink component.

**File:** `src/commands/journal/standup.ts`

```typescript
import React from 'react';
import { render } from 'ink';
import { ensureAuthenticated } from '../../lib/auth/require-auth.js';
import { StandupStream } from '../../components/StandupStream.js';
import { msg } from '../../utils/messages.js';

export interface StandupOptions {
  date?: string;   // YYYY-MM-DD
  from?: string;   // YYYY-MM-DD
  to?: string;     // YYYY-MM-DD
}

/**
 * Generate AI standup notes from journal entries
 *
 * @param options - Command options (date, from, to)
 */
export async function generateStandup(options: StandupOptions): Promise<void> {
  // Ensure user is authenticated
  ensureAuthenticated();

  // Validate options
  if (options.date && (options.from || options.to)) {
    msg.error('Cannot use --date with --from or --to');
    process.exit(1);
  }

  if (options.to && !options.from) {
    msg.error('Cannot use --to without --from');
    process.exit(1);
  }

  // Render streaming component
  const { waitUntilExit } = render(
    React.createElement(StandupStream, {
      date: options.date,
      from: options.from,
      to: options.to,
      onComplete: () => {
        // Component will call this when done
      },
    })
  );

  await waitUntilExit();
}
```

**Why this design:**

- **Auth check first**: Fails fast if not logged in
- **Validation**: Ensures options are valid before starting
- **Ink rendering**: Delegates UI to React component
- **Clean exit**: `waitUntilExit()` keeps process alive until done

---

### Step 4: Register the Command

**Goal:** Add the new command to Commander.js registration.

**File:** `src/commands/journal/index.ts`

**Add to registerJournalCommands function:**

```typescript
import { generateStandup } from './standup.js';

export function registerJournalCommands(program: Command) {
  // ... existing commands (app, sync, add, amend, show)

  // NEW: Standup command
  program
    .command('standup')
    .description('Generate AI standup notes from journal entries')
    .option('-d, --date <date>', 'Use journal from specific date (YYYY-MM-DD)')
    .option('-f, --from <date>', 'Use journals from this date onwards (YYYY-MM-DD)')
    .option('-t, --to <date>', 'Use journals up to this date (YYYY-MM-DD, requires --from)')
    .action(async (options) => {
      await generateStandup(options);
    });
}
```

**Why this registration:**

- **Follows existing pattern**: Consistent with `add`, `sync`, etc.
- **Clear options**: Three modes match API capabilities
- **Async action**: Handles async/await naturally

---

### Step 5: Export Types

**Goal:** Make TypeScript happy by exporting the new types.

**File:** `src/commands/types.ts`

**Add:**

```typescript
// ... existing types

/**
 * Options for standup command
 */
export interface StandupOptions {
  date?: string;
  from?: string;
  to?: string;
}
```

---

## Testing

### Manual Testing

**Test Mode 1: Latest journal (no options)**

```bash
$ papyrus standup
✨ Analyzing journals...
[streaming text appears character by character]
✓ Done! Used 1/10 free requests this month.
```

**Test Mode 2: Specific date**

```bash
$ papyrus standup --date 2025-01-06
✨ Analyzing journals...
[content for that specific date]
✓ Done!
```

**Test Mode 3: From date to today**

```bash
$ papyrus standup --from 2025-01-01
✨ Analyzing journals...
[aggregated content from Jan 1 to today]
✓ Done!
```

**Test Mode 4: Explicit range**

```bash
$ papyrus standup --from 2025-01-01 --to 2025-01-07
✨ Analyzing journals...
[aggregated content for that week]
✓ Done!
```

**Test Error: No journals**

```bash
$ papyrus standup
✗ Error: No journals found. Use `papyrus sync` to sync your local journals to the server.
```

**Test Error: Not authenticated**

```bash
$ papyrus standup
✗ Error: Not authenticated. Run 'papyrus login' to sign in.
```

**Test Error: Invalid options**

```bash
$ papyrus standup --date 2025-01-06 --from 2025-01-01
✗ Error: Cannot use --date with --from or --to
```

### Integration Testing

**File:** `tests/commands/standup.test.ts` (optional, but recommended)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../../src/lib/api/api-client.js';
import { generateStandup } from '../../src/commands/journal/standup.js';

describe('generateStandup', () => {
  it('should call API with correct options', async () => {
    const mockGenerateStandup = vi
      .spyOn(apiClient, 'generateStandup')
      .mockResolvedValue(undefined);

    // Mock render to avoid actually rendering
    vi.mock('ink', () => ({
      render: vi.fn(() => ({ waitUntilExit: vi.fn() })),
    }));

    await generateStandup({ date: '2025-01-07' });

    expect(mockGenerateStandup).toHaveBeenCalledWith(
      { date: '2025-01-07' },
      expect.any(Function)
    );
  });
});
```

---

## Common Issues

### Issue: "Not authenticated" error

**Problem:** User hasn't logged in yet.

**Solution:**
```bash
papyrus login
# Then try again:
papyrus standup
```

**Why it happens:** The `ensureAuthenticated()` middleware checks for a valid JWT token in local storage.

---

### Issue: Text appears all at once instead of streaming

**Problem:** Terminal or environment is buffering output.

**Solution:** This is actually expected behavior with Ink. The component updates state, and React re-renders. The "streaming" effect is smooth because Ink's reconciliation is fast, but it's not truly character-by-character.

**Advanced enhancement (optional):** For true character-by-character animation, add a delay between chunks:

```typescript
// In StandupStream component, modify the content case:
case 'content':
  setStatus('streaming');
  // Add delay for smoother animation
  const text = event.data.text;
  for (let i = 0; i < text.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 10)); // 10ms per char
    setContent((prev) => prev + text[i]);
  }
  break;
```

**Trade-off:** This adds latency. Not recommended for production, but fun for demo purposes.

---

### Issue: SSE connection hangs or times out

**Problem:** API server is slow or connection is interrupted.

**Solution:** Add timeout to fetch request:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

const response = await fetch(url, {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify(options),
  signal: controller.signal, // Add abort signal
});

clearTimeout(timeoutId);
```

**Why it happens:** Network issues, cold start, or API rate limiting.

---

### Issue: "Cannot find module" error for StandupStream

**Problem:** TypeScript import path is wrong or file wasn't exported.

**Solution:**
1. Ensure `.js` extension in imports: `'../../components/StandupStream.js'`
2. Check that StandupStream is exported: `export function StandupStream(...)`
3. Rebuild shared package: `cd packages/shared && pnpm build`

---

## Enhancements (Optional)

### 1. Add --latest flag (explicit)

```typescript
program
  .command('standup')
  .option('-l, --latest', 'Use most recent journal (default)')
  // ... other options
```

### 2. Add --week flag (convenience)

```typescript
program
  .command('standup')
  .option('-w, --week', 'Use journals from this week (Mon-Sun)')
  .action(async (options) => {
    if (options.week) {
      // Calculate Monday of current week
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      options.from = monday.toISOString().split('T')[0];
      delete options.week;
    }
    await generateStandup(options);
  });
```

### 3. Add copy-to-clipboard feature

**Install dependency:**
```bash
pnpm add clipboardy
```

**Update component:**
```typescript
import clipboardy from 'clipboardy';

// After done:
if (status === 'done') {
  await clipboardy.write(content);
  msg.success('Copied to clipboard!');
}
```

### 4. Add Markdown formatting

Use `ink-markdown` to render Markdown with proper formatting:

```bash
pnpm add ink-markdown
```

```typescript
import Markdown from 'ink-markdown';

<Markdown>{content}</Markdown>
```

### 5. Save to file

Add `--output` option to save to a file:

```typescript
.option('-o, --output <file>', 'Save output to file')

// In command handler:
if (options.output) {
  fs.writeFileSync(options.output, content);
  msg.success(`Saved to ${options.output}`);
}
```

---

## Next Steps

Now that you have the standup command working, consider:

1. **Add help examples** - Show usage examples in `--help`
2. **Add shell completion** - Generate completions for bash/zsh/fish
3. **Add caching** - Cache recent standups to avoid redundant API calls
4. **Add templates** - Let users customize standup format
5. **Add more AI commands** - Weekly summaries, goal tracking, etc.

---

## References

- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [React Hooks](https://react.dev/reference/react)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## Summary

**What we built:**

✅ `papyrus standup` command with 4 modes
✅ Real-time streaming output (via Ink + React)
✅ SSE support in ApiClient (using native fetch)
✅ Auth-protected with usage tracking
✅ Error handling and validation
✅ Follows existing CLI patterns

**Key takeaways:**

1. **Use fetch for SSE**: Axios doesn't support streaming well
2. **Ink for rich UI**: React hooks make state management natural
3. **Follow patterns**: Consistent with existing commands
4. **Progressive disclosure**: Thinking → Streaming → Done
5. **Auth middleware**: One-line auth checking

**Estimated time to implement:** 2-3 hours for a first working version.

**Next tutorial:** Adding weekly summary command with analytics
