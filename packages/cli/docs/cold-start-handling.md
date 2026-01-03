# Cold Start Detection and Handling

## Quick Start

**TL;DR:** Replace existing spinners in `LoginPrompt.tsx` and `SyncProgress.tsx` with `ColdStartAwareSpinner` component. See [Integration Pattern](#integration-pattern) for step-by-step instructions.

---

## Problem

The backend is deployed on Render's free tier, which uses serverless instances that spin down after inactivity. Cold starts can take 30-50 seconds, making the CLI appear frozen without proper user feedback.

## Recommended Solution: Drop-in Spinner Replacement

Replace existing spinners with `ColdStartAwareSpinner` in components that make API calls.

### The Component

The `ColdStartAwareSpinner` component (already created at `src/components/ColdStart.tsx`) provides progressive feedback:

```typescript
// src/components/ColdStart.tsx
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import React, { useState, useEffect } from 'react';

interface ColdStartAwareSpinnerProps {
  message: string;
}

export const ColdStartAwareSpinner: React.FC<ColdStartAwareSpinnerProps> = ({ message }) => {
  const [elapsed, setElapsed] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (elapsed >= 5 && elapsed < 15) {
      setCurrentMessage('Waking up the server (this may take a moment)...');
    } else if (elapsed >= 15) {
      setCurrentMessage('Server is starting up (free tier cold start)...');
    }
  }, [elapsed]);

  return (
    <Text>
      <Text color="green">
        <Spinner type="dots" />
      </Text>
      {' '}
      {currentMessage}
      {elapsed >= 5 && <Text color="gray"> ({elapsed}s)</Text>}
    </Text>
  );
};
```

---

## Integration Pattern

### 1. Login Command - Replace Spinner in LoginPrompt Component

**File:** `src/components/LoginPrompt.tsx`

**Before:**

```typescript
import Spinner from "ink-spinner";

// Inside component (line 146-153)
{isAuthenticating && (
  <Box marginTop={1}>
    <Text color="cyan">
      <Spinner type="dots" />
      Authenticating...
    </Text>
  </Box>
)}
```

**After:**

```typescript
import { ColdStartAwareSpinner } from "./ColdStart.js";

// Inside component
{isAuthenticating && (
  <Box marginTop={1}>
    <ColdStartAwareSpinner message="Authenticating..." />
  </Box>
)}
```

**Changes needed:**

1. Import `ColdStartAwareSpinner` from `./ColdStart.js`
2. Replace the `<Text color="cyan"><Spinner />...</Text>` with `<ColdStartAwareSpinner />`
3. The component automatically handles color and progressive messaging

---

### 2. Sync Command - Replace Spinner in SyncProgress Component

**File:** `src/components/SyncProgress.tsx`

**Before:**

```typescript
import Spinner from "ink-spinner";

// Inside component (line 29-36)
if (status === "syncing") {
  return (
    <Box>
      <Text color="cyan">
        <Spinner type="hearts" /> Syncing journals...
      </Text>
    </Box>
  );
}
```

**After:**

```typescript
import { ColdStartAwareSpinner } from "./ColdStart.js";

// Inside component
if (status === "syncing") {
  return (
    <Box>
      <ColdStartAwareSpinner message="Syncing journals..." />
    </Box>
  );
}
```

**Changes needed:**

1. Import `ColdStartAwareSpinner` from `./ColdStart.js`
2. Replace the `<Text color="cyan"><Spinner />...</Text>` with `<ColdStartAwareSpinner />`
3. Remove the `<Box>` wrapper if desired (spinner handles its own layout)

---

### 3. Pattern for Future Commands

For any new command that makes API calls, use this pattern:

**Option A: In Component (Recommended for complex flows)**

```typescript
// src/components/YourNewComponent.tsx
import { ColdStartAwareSpinner } from "./ColdStart.js";

export const YourNewComponent = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const doWork = async () => {
      setIsLoading(true);
      try {
        await apiClient.someApiCall();
        // handle success
      } catch (error) {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    doWork();
  }, []);

  if (isLoading) {
    return <ColdStartAwareSpinner message="Loading data..." />;
  }

  return (
    // your component JSX
  );
};
```

**Option B: Inline in Command (For simple commands)**

```typescript
// src/commands/somecommand.ts
import { render } from 'ink';
import React from 'react';
import { ColdStartAwareSpinner } from '../components/ColdStart.js';

program.command('somecommand').action(async () => {
  const { unmount } = render(
    React.createElement(ColdStartAwareSpinner, {
      message: 'Processing...',
    })
  );

  try {
    await apiClient.someApiCall();
    unmount();
    console.log('✓ Success!');
  } catch (error) {
    unmount();
    console.error('✗ Failed:', error.message);
  }
});
```

---

## Alternative: Request Timeout Wrapper

Add timing information to API requests:

```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: config.get('apiUrl'),
      timeout: 60000, // 60 seconds for cold starts
    });

    // Request interceptor - track start time
    this.instance.interceptors.request.use((config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    });

    // Response interceptor - calculate duration
    this.instance.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;

        // Log if it was likely a cold start
        if (duration > 10000) {
          console.log(
            `\n(Server cold start detected: ${(duration / 1000).toFixed(1)}s)`
          );
        }

        return response;
      },
      (error) => {
        // Handle 401 errors...
        return Promise.reject(error);
      }
    );
  }

  // ... rest of the class
}
```

---

## Option: Pre-warm Command

Add a command to wake up the server before performing operations:

```typescript
// src/commands/server.ts
import { Command } from 'commander';
import { apiClient } from '../services/api.js';

export function registerServerCommands(program: Command) {
  const server = program
    .command('server')
    .description('Server management commands');

  server
    .command('wake')
    .description('Wake up the server (useful before sync on free tier)')
    .action(async () => {
      console.log('Waking up server...');
      const startTime = Date.now();

      try {
        // Lightweight health check endpoint
        await apiClient.get('/health');
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✓ Server ready (${duration}s)`);
      } catch (error) {
        console.error('Failed to wake server:', error.message);
        process.exit(1);
      }
    });
}
```

**Usage:**

```bash
# Pre-warm before sync
papyrus server wake && papyrus sync

# Or create an alias
alias pp-sync="papyrus server wake && papyrus sync"
```

---

## Option: Smart Sync with Auto-Wake

Automatically check server status before sync:

```typescript
// src/commands/sync.ts
export function registerSyncCommand(program: Command) {
  program
    .command('sync')
    .option('--no-wake', 'Skip server wake-up check')
    .action(async (options) => {
      // Token validation code...

      if (options.wake !== false) {
        // Ping server first
        console.log('Checking server status...');
        const startTime = Date.now();

        try {
          await apiClient.get('/health');
          const duration = Date.now() - startTime;

          if (duration > 5000) {
            console.log('(Server was starting up, ready now)\n');
          }
        } catch (error) {
          console.error('Unable to reach server');
          process.exit(1);
        }
      }

      // Proceed with sync...
      const { waitUntilExit } = render(<SyncProgress />);
      await waitUntilExit();
    });
}
```

---

## Recommended Approach

**Use the progressive timeout spinner** for the best user experience:

1. ✅ Immediate feedback (shows spinner right away)
2. ✅ Progressive messaging (adapts to cold start)
3. ✅ Shows elapsed time after 5 seconds
4. ✅ No extra API calls needed
5. ✅ Works with all existing commands

**Optional additions:**

- Add `papyrus server wake` command for advanced users
- Log cold start duration after requests complete
- Consider caching "last successful request time" to predict cold starts

---

## User Experience Examples

### Fast response (< 5s)

```
◠ Authenticating...
✓ Successfully logged in
```

### Cold start (5-15s)

```
◠ Waking up the server (this may take a moment)... (7s)
```

### Long cold start (15s+)

```
◠ Server is starting up (free tier cold start)... (23s)
✓ Successfully logged in
```

### With pre-warm command

```
$ papyrus server wake
Waking up server...
✓ Server ready (18.3s)

$ papyrus sync
◠ Syncing journals...
```

---

## Files to Create/Modify

### Required Changes (Drop-in Spinner Replacement)

- ✅ `src/components/ColdStart.tsx` - Component already created
- ✏️ `src/components/LoginPrompt.tsx` - Replace existing spinner (line 146-153)
- ✏️ `src/components/SyncProgress.tsx` - Replace existing spinner (line 29-36)

### Optional Enhancements

- ✏️ `src/services/api.ts` - Add request timing tracking (see Alternative approach)
- ✏️ `src/commands/server.ts` - Add `papyrus server wake` command (see Optional section)

### Summary of Changes

**Step 1: Update LoginPrompt.tsx**

```diff
- import Spinner from "ink-spinner";
+ import { ColdStartAwareSpinner } from "./ColdStart.js";

  {isAuthenticating && (
    <Box marginTop={1}>
-     <Text color="cyan">
-       <Spinner type="dots" />
-       Authenticating...
-     </Text>
+     <ColdStartAwareSpinner message="Authenticating..." />
    </Box>
  )}
```

**Step 2: Update SyncProgress.tsx**

```diff
- import Spinner from "ink-spinner";
+ import { ColdStartAwareSpinner } from "./ColdStart.js";

  if (status === "syncing") {
    return (
      <Box>
-       <Text color="cyan">
-         <Spinner type="hearts" /> Syncing journals...
-       </Text>
+       <ColdStartAwareSpinner message="Syncing journals..." />
      </Box>
    );
  }
```

These two simple changes will provide cold start feedback for all API operations in both login and sync commands.

---

## Expected Behavior After Integration

### Login Flow

**Fast server response (< 5 seconds):**

```
Login to Papyrus

Email: user@example.com
Password: ********

◠ Authenticating...
✓ Logged in successfully!
```

**Server cold start (5-15 seconds):**

```
Login to Papyrus

Email: user@example.com
Password: ********

◠ Waking up the server (this may take a moment)... (7s)
✓ Logged in successfully!
```

**Long cold start (15+ seconds):**

```
Login to Papyrus

Email: user@example.com
Password: ********

◠ Server is starting up (free tier cold start)... (23s)
✓ Logged in successfully!
```

### Sync Flow

**Fast sync:**

```
◠ Syncing journals...
✓ Sync complete: 2 uploaded, 1 downloaded
```

**Cold start during sync:**

```
◠ Waking up the server (this may take a moment)... (8s)
✓ Sync complete: 2 uploaded, 1 downloaded
```

The progressive messaging automatically activates when requests take longer than expected, providing transparent feedback to users without any configuration needed.

---

## Implementation Notes

### Progressive Spinner Component

The `ColdStartAwareSpinner` component automatically:

1. Shows the initial message immediately
2. Updates message after 5 seconds if request is still pending
3. Shows a longer message after 15 seconds
4. Displays elapsed time in gray after 5 seconds

This provides clear feedback without requiring any backend changes.

### Request Timing Interceptor

The axios interceptor approach:

- Tracks request start time using request metadata
- Calculates duration when response arrives
- Logs informational message if cold start detected
- Can be used alongside progressive spinner

### Server Wake Command

The `papyrus server wake` command:

- Allows advanced users to pre-warm the server
- Useful for scripting (wake before multiple commands)
- Can be aliased for convenience
- Requires backend `/health` endpoint

### Auto-Wake Option

The smart sync approach:

- Proactively checks server status
- Allows users to opt-out with `--no-wake`
- Shows informational message if cold start detected
- Prevents timeout errors during actual sync

---

## Related Files

- `src/lib/cold-start.tsx` - Cold-start-aware spinner component
- `src/services/api.ts` - API client with timing interceptor
- `src/commands/server.ts` - Server management commands
- `src/commands/auth.ts` - Login command
- `src/commands/sync.ts` - Sync command
