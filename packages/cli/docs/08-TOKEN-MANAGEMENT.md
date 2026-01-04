# Tutorial: Decoupled Token Management

**Learn how to implement reusable authentication checking across CLI commands**

## Why This Matters

When building CLI tools with authentication, it's tempting to add token validation directly in each command:

```typescript
// ❌ ANTI-PATTERN: Token checking embedded in command
export async function sync() {
  const token = tokenStore.get();
  if (!token) {
    console.error('Not authenticated. Please run `papyrus login` first.');
    process.exit(1);
  }
  if (isTokenExpired(token)) {
    tokenStore.clear();
    console.error(
      'Your session has expired. Please run `papyrus login` again.'
    );
    process.exit(1);
  }
  if (isTokenExpiringSoon(token, 24)) {
    console.warn('Warning: Your session will expire soon.');
  }

  // Finally... the actual sync logic
  await performSync();
}
```

**This creates several problems:**

1. **Code duplication** - Every authenticated command needs the same validation logic
2. **Tight coupling** - Commands are responsible for both auth AND business logic
3. **Inconsistent messages** - Easy to have different error messages across commands
4. **Hard to maintain** - Changes to auth logic require updating multiple files
5. **Difficult to test** - Auth logic mixed with business logic

**The solution:** Separate authentication into reusable utilities that any command can use. This follows the **separation of concerns** principle and makes the codebase maintainable.

## Prerequisites

Before starting this tutorial:

- Complete [01 - Storage Layer](./01-STORAGE-LAYER.md) (understand token storage)
- Complete [02 - API Client Setup](./02-API-CLIENT-SETUP.md) (understand API authentication)
- Basic understanding of JWT tokens
- Familiarity with the DRY (Don't Repeat Yourself) principle

## Architecture

The decoupled token management system has three clean layers:

```
┌──────────────────────────────────────────────────────────────┐
│                       Command Layer                          │
│  (src/commands/sync.ts, src/commands/journal/add.ts, etc.) │
│                                                              │
│  • Calls ensureAuthenticated() in first line               │
│  • Focuses entirely on business logic                       │
│  • No direct token handling code                            │
│  • Clean and readable                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
                   Single function call
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   Auth Middleware Layer                      │
│  (src/lib/auth/require-auth.ts)                             │
│                                                              │
│  • requireAuth() - Returns detailed auth status             │
│  • ensureAuthenticated() - Validates or exits               │
│  • Provides consistent error messages                        │
│  • Handles token clearing on expiration                      │
│  • Warns about tokens expiring soon                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
                   Uses pure utilities
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                    Token Utilities Layer                     │
│  (src/utils/token.ts)                                       │
│                                                              │
│  • Pure functions for JWT operations                         │
│  • isTokenExpired() - Check if token is expired             │
│  • isTokenExpiringSoon() - Check if expiring within N hours │
│  • getTimeUntilExpiration() - Human-readable time           │
│  • No side effects - easy to test                            │
└──────────────────────────────────────────────────────────────┘
```

**Why three layers?**

- **Layer 1 (Commands):** Focus on "what" the command does (sync, add, list)
- **Layer 2 (Auth Middleware):** Handle authentication concerns consistently
- **Layer 3 (Token Utilities):** Pure functions for token operations (testable)

This separation means:

- Commands stay clean and readable
- Auth logic defined once, used everywhere
- Token utilities are pure functions (no side effects)
- Easy to test each layer independently

## Implementation

### Step 1: Token Utilities (`src/utils/token.ts`)

These are **pure functions** for working with JWT tokens. They have no side effects and are easy to test.

**Why JWT decoding works:** Our access tokens are JWTs that contain an `exp` (expiration) claim. We can decode this client-side without needing a server call.

```typescript
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number; // Expiration time (seconds since epoch)
  iat?: number; // Issued at time (optional)
}

/**
 * Get the expiration date from a JWT token
 * @param token - JWT token string
 * @returns Expiration date or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000); // Convert seconds to milliseconds
  } catch (error) {
    return null; // Invalid token
  }
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @returns True if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true; // Treat invalid tokens as expired
  }
  return expiration.getTime() < Date.now();
}

/**
 * Check if a JWT token is expiring soon
 * @param token - JWT token string
 * @param thresholdHours - Hours before expiration to consider "expiring soon"
 * @returns True if token expires within the threshold
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdHours: number = 24
): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return false; // Invalid tokens are expired, not "expiring soon"
  }

  const now = Date.now();
  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  const timeUntilExpiration = expiration.getTime() - now;

  return timeUntilExpiration > 0 && timeUntilExpiration <= thresholdMs;
}

/**
 * Get time until token expiration in a human-readable format
 * @param token - JWT token string
 * @returns Human-readable time string or null if invalid/expired
 */
export function getTimeUntilExpiration(token: string): string | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }

  const now = Date.now();
  const timeUntilExpiration = expiration.getTime() - now;

  if (timeUntilExpiration <= 0) {
    return 'expired';
  }

  const hours = Math.floor(timeUntilExpiration / (1000 * 60 * 60));
  const minutes = Math.floor(
    (timeUntilExpiration % (1000 * 60 * 60)) / (1000 * 60)
  );

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}
```

**Key design decisions:**

- **Pure functions:** No side effects, just transformations
- **Null for invalid:** Invalid tokens return `null` (easy to check)
- **Expired vs expiring soon:** Clear distinction between already expired and about to expire
- **Human-readable time:** Users see "3 days" not "259200000 milliseconds"

### Step 2: Auth Middleware (`src/lib/auth/require-auth.ts`)

This layer provides reusable authentication checking. It uses the token utilities and adds:

- Token existence checking (via tokenStore)
- Automatic token clearing on expiration
- Consistent error messages
- Configurable warning thresholds

````typescript
import { tokenStore } from '../storage/index.js';
import {
  isTokenExpired,
  isTokenExpiringSoon,
  getTimeUntilExpiration,
} from '../../utils/token.js';

/**
 * Result of authentication check
 */
export interface AuthCheckResult {
  isAuthenticated: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  timeUntilExpiration: string | null;
  message?: string;
}

/**
 * Options for authentication check
 */
export interface RequireAuthOptions {
  /**
   * Hours before expiration to consider "expiring soon"
   * @default 24
   */
  expirationThresholdHours?: number;

  /**
   * Whether to show warnings for tokens expiring soon
   * @default true
   */
  warnOnExpiringSoon?: boolean;
}

/**
 * Check if user is authenticated and token is valid
 * Returns detailed auth status for flexible handling
 *
 * This is the core function that any command can use to check authentication.
 * It handles all the edge cases: missing token, expired token, invalid token,
 * and token expiring soon.
 *
 * @param options - Authentication check options
 * @returns Authentication check result with detailed status
 *
 * @example
 * ```typescript
 * // Basic usage in a command
 * const auth = requireAuth();
 * if (!auth.isAuthenticated) {
 *   console.error(`Error: ${auth.message}`);
 *   process.exit(1);
 * }
 * ```
 */
export function requireAuth(options: RequireAuthOptions = {}): AuthCheckResult {
  const { expirationThresholdHours = 24, warnOnExpiringSoon = true } = options;

  // Check if token exists in storage
  if (!tokenStore.exists()) {
    return {
      isAuthenticated: false,
      isExpired: false,
      isExpiringSoon: false,
      timeUntilExpiration: null,
      message: 'Not authenticated. Please run `papyrus login` first.',
    };
  }

  const token = tokenStore.get();
  if (!token) {
    return {
      isAuthenticated: false,
      isExpired: false,
      isExpiringSoon: false,
      timeUntilExpiration: null,
      message: 'Invalid token. Please run `papyrus login` again.',
    };
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    // Automatically clear expired token
    tokenStore.clear();
    return {
      isAuthenticated: false,
      isExpired: true,
      isExpiringSoon: false,
      timeUntilExpiration: null,
      message: 'Your session has expired. Please run `papyrus login` again.',
    };
  }

  // Check if token is expiring soon
  const expiringSoon = isTokenExpiringSoon(token, expirationThresholdHours);
  const timeUntilExpiration = getTimeUntilExpiration(token);

  return {
    isAuthenticated: true,
    isExpired: false,
    isExpiringSoon: expiringSoon,
    timeUntilExpiration,
    message:
      expiringSoon && warnOnExpiringSoon && timeUntilExpiration
        ? `Your session will expire in ${timeUntilExpiration}. Please run \`papyrus login\` to refresh.`
        : undefined,
  };
}

/**
 * Ensures user is authenticated, exits process if not
 *
 * This is a convenience function for commands that require authentication.
 * It checks authentication and exits with a clear error message if not authenticated.
 * If authenticated but token is expiring soon, it shows a warning but continues.
 *
 * Use this in commands that MUST have authentication to proceed.
 *
 * @param options - Authentication check options
 *
 * @example
 * ```typescript
 * // Simplest usage - one line in your command
 * export async function sync() {
 *   ensureAuthenticated(); // Will exit if not authenticated
 *
 *   // Safe to proceed - user is authenticated
 *   await performSync();
 * }
 * ```
 */
export function ensureAuthenticated(options: RequireAuthOptions = {}): void {
  const authResult = requireAuth(options);

  if (!authResult.isAuthenticated) {
    console.error(`Error: ${authResult.message}`);
    process.exit(1);
  }

  if (authResult.isExpired) {
    console.error(`Error: ${authResult.message}`);
    process.exit(1);
  }

  if (authResult.isExpiringSoon && authResult.message) {
    console.warn(`Warning: ${authResult.message}`);
  }
}
````

**Key design decisions:**

- **Two functions for different needs:**
  - `requireAuth()` - Returns status (flexible, for custom handling)
  - `ensureAuthenticated()` - Validates or exits (convenient, for most commands)
- **Automatic token clearing:** Expired tokens are removed automatically
- **Detailed return type:** Provides all information needed for custom handling
- **Consistent messages:** All commands show the same error messages
- **Configurable behavior:** Can disable warnings or change threshold

### Step 3: Export from Auth Module (`src/lib/auth/index.ts`)

Create a clean public API for the auth module:

```typescript
/**
 * Authentication utilities for CLI commands
 * @module lib/auth
 */

export {
  requireAuth,
  ensureAuthenticated,
  type AuthCheckResult,
  type RequireAuthOptions,
} from './require-auth.js';
```

**Why this matters:**

- Clean imports in commands: `import { ensureAuthenticated } from '../lib/auth/index.js'`
- Hides internal implementation details
- Easy to add more auth utilities later

### Step 4: Using in Commands

Now commands become clean and focused on their business logic.

**Simple case - Most commands:**

```typescript
// src/commands/sync.ts
import { ensureAuthenticated } from '../lib/auth/index.js';

export async function sync() {
  // One line handles all authentication checking
  ensureAuthenticated();

  // Safe to proceed - token is valid
  console.log('Syncing journals...');
  await performSync();
  console.log('✓ Sync complete');
}
```

**Before and after comparison:**

```typescript
// ❌ BEFORE: 20+ lines of auth logic in command
export async function sync() {
  const token = tokenStore.get();
  if (!token) {
    console.error('Not authenticated. Please run `papyrus login` first.');
    process.exit(1);
  }
  if (isTokenExpired(token)) {
    tokenStore.clear();
    console.error(
      'Your session has expired. Please run `papyrus login` again.'
    );
    process.exit(1);
  }
  if (isTokenExpiringSoon(token, 24)) {
    const expiration = getTokenExpiration(token);
    console.warn(
      `Warning: Your session will expire soon (${expiration?.toLocaleString()}).`
    );
  }

  // Finally... the actual business logic
  await performSync();
}

// ✅ AFTER: 1 line of auth, rest is business logic
export async function sync() {
  ensureAuthenticated();

  await performSync();
}
```

**Custom handling - For special cases:**

```typescript
// src/commands/status.ts
import { requireAuth } from '../lib/auth/index.js';

export async function status() {
  // Get auth status without exiting
  const auth = requireAuth({ warnOnExpiringSoon: false });

  if (auth.isAuthenticated) {
    console.log('✓ Authenticated');
    if (auth.timeUntilExpiration) {
      console.log(`  Token expires in: ${auth.timeUntilExpiration}`);
    }
  } else {
    console.log('✗ Not authenticated');
    console.log(`  ${auth.message}`);
  }

  // Show additional status info...
}
```

**Multiple authenticated commands:**

```typescript
// All these commands now have consistent auth checking
// src/commands/journal/sync.ts
export async function sync() {
  ensureAuthenticated();
  await performSync();
}

// src/commands/journal/push.ts
export async function push(date: string) {
  ensureAuthenticated();
  await pushJournal(date);
}

// src/commands/journal/pull.ts
export async function pull(date: string) {
  ensureAuthenticated();
  await pullJournal(date);
}
```

## User Experience

### Scenario 1: Token Expiring Within 24 Hours

```bash
$ papyrus sync
Warning: Your session will expire in 6 hours. Please run `papyrus login` to refresh.
Syncing journals...
✓ Synced 5 entries (3 uploaded, 2 downloaded)
```

**What happened:**

- Command checked token before starting
- Token is valid but expiring soon
- User is warned but operation proceeds
- User can refresh session when convenient

### Scenario 2: Token Already Expired

```bash
$ papyrus sync
Error: Your session has expired. Please run `papyrus login` again.
```

**What happened:**

- Command checked token before starting
- Token is expired
- Clear error message with exact action needed
- Expired token automatically removed from storage

### Scenario 3: Not Authenticated

```bash
$ papyrus sync
Error: Not authenticated. Please run `papyrus login` first.
```

**What happened:**

- No token exists in storage
- Clear message explaining the issue
- Exact command to run shown

### Scenario 4: Custom Status Command

```bash
$ papyrus status
✓ Authenticated
  Token expires in: 3 days

$ papyrus status  # After token expires
✗ Not authenticated
  Not authenticated. Please run `papyrus login` first.
```

**What happened:**

- Uses `requireAuth()` for flexible handling
- Shows detailed status without exiting
- Different behavior than commands that need auth

## Benefits of This Approach

### 1. DRY (Don't Repeat Yourself)

**Before:** 20+ lines of auth logic in every authenticated command
**After:** 1 line per command

```typescript
// This pattern repeated in every command
ensureAuthenticated();
```

### 2. Separation of Concerns

**Commands focus on business logic:**

```typescript
export async function sync() {
  ensureAuthenticated(); // Auth concern
  await performSync(); // Business logic
}
```

**Auth logic lives in dedicated module:**

- Token checking in `src/utils/token.ts`
- Auth flow in `src/lib/auth/require-auth.ts`

### 3. Consistent Error Messages

All commands show the same messages:

- ✅ "Not authenticated. Please run \`papyrus login\` first."
- ✅ "Your session has expired. Please run \`papyrus login\` again."
- ✅ "Your session will expire in X. Please run \`papyrus login\` to refresh."

**Not:**

- ❌ "Please login first"
- ❌ "Token expired"
- ❌ "Authentication required"
- ❌ Six different variations across six commands

### 4. Easy to Test

**Token utilities are pure functions:**

```typescript
describe('isTokenExpired', () => {
  it('should detect expired token', () => {
    const expiredToken = createExpiredToken();
    expect(isTokenExpired(expiredToken)).toBe(true);
  });
});
```

**Auth middleware is mockable:**

```typescript
vi.mock('../lib/auth', () => ({
  ensureAuthenticated: vi.fn(),
}));

it('should call sync after auth check', async () => {
  await sync();
  expect(ensureAuthenticated).toHaveBeenCalled();
  expect(performSync).toHaveBeenCalled();
});
```

### 5. Easy to Maintain

**Change auth behavior in one place:**

Want to change expiration warning from 24 hours to 48 hours?

```typescript
// Change in ONE place
export function ensureAuthenticated() {
  const authResult = requireAuth({ expirationThresholdHours: 48 });
  // ...
}
```

All commands automatically get the new behavior.

### 6. No Backend Changes Required

- JWT already contains `exp` claim
- Client-side validation using `jwt-decode`
- Works offline (no API call needed)
- No extra storage needed

## Testing

### Unit Tests for Token Utilities

```typescript
import { describe, it, expect } from 'vitest';
import {
  isTokenExpired,
  isTokenExpiringSoon,
  getTimeUntilExpiration,
} from './token';

describe('Token Utilities', () => {
  describe('isTokenExpired', () => {
    it('should detect expired token', () => {
      // Create a token that expired 1 hour ago
      const expiredToken = createTestToken(-3600);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should detect valid token', () => {
      // Create a token that expires in 7 days
      const validToken = createTestToken(7 * 24 * 3600);
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should treat invalid token as expired', () => {
      expect(isTokenExpired('invalid-jwt')).toBe(true);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should detect token expiring within threshold', () => {
      // Token expires in 12 hours
      const token = createTestToken(12 * 3600);
      expect(isTokenExpiringSoon(token, 24)).toBe(true);
    });

    it('should not detect token expiring after threshold', () => {
      // Token expires in 48 hours
      const token = createTestToken(48 * 3600);
      expect(isTokenExpiringSoon(token, 24)).toBe(false);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return human-readable time for days', () => {
      const token = createTestToken(3 * 24 * 3600); // 3 days
      expect(getTimeUntilExpiration(token)).toBe('3 days');
    });

    it('should return human-readable time for hours', () => {
      const token = createTestToken(6 * 3600); // 6 hours
      expect(getTimeUntilExpiration(token)).toBe('6 hours');
    });

    it('should return "expired" for expired token', () => {
      const token = createTestToken(-3600); // Expired 1 hour ago
      expect(getTimeUntilExpiration(token)).toBe('expired');
    });
  });
});

// Helper to create test tokens
function createTestToken(secondsFromNow: number): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + secondsFromNow,
    iat: Math.floor(Date.now() / 1000),
  };
  // In real tests, use a JWT library to create valid tokens
  return (
    btoa(JSON.stringify({ alg: 'HS256' })) +
    '.' +
    btoa(JSON.stringify(payload)) +
    '.signature'
  );
}
```

### Integration Tests for Auth Middleware

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth, ensureAuthenticated } from './require-auth';
import { tokenStore } from '../storage';

describe('Auth Middleware', () => {
  beforeEach(() => {
    // Clear token before each test
    tokenStore.clear();
  });

  describe('requireAuth', () => {
    it('should return not authenticated when no token', () => {
      const result = requireAuth();

      expect(result.isAuthenticated).toBe(false);
      expect(result.message).toContain('Not authenticated');
    });

    it('should return authenticated when valid token', () => {
      const validToken = createTestToken(7 * 24 * 3600);
      tokenStore.save(validToken);

      const result = requireAuth();

      expect(result.isAuthenticated).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('should clear expired token automatically', () => {
      const expiredToken = createTestToken(-3600);
      tokenStore.save(expiredToken);

      const result = requireAuth();

      expect(result.isAuthenticated).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(tokenStore.exists()).toBe(false); // Token was cleared
    });

    it('should detect token expiring soon', () => {
      const token = createTestToken(12 * 3600); // 12 hours
      tokenStore.save(token);

      const result = requireAuth({ expirationThresholdHours: 24 });

      expect(result.isAuthenticated).toBe(true);
      expect(result.isExpiringSoon).toBe(true);
      expect(result.message).toContain('will expire');
    });

    it('should not warn when warnOnExpiringSoon is false', () => {
      const token = createTestToken(12 * 3600); // 12 hours
      tokenStore.save(token);

      const result = requireAuth({
        expirationThresholdHours: 24,
        warnOnExpiringSoon: false,
      });

      expect(result.isAuthenticated).toBe(true);
      expect(result.isExpiringSoon).toBe(true);
      expect(result.message).toBeUndefined(); // No warning message
    });
  });

  describe('ensureAuthenticated', () => {
    it('should exit when not authenticated', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => ensureAuthenticated()).toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should not exit when authenticated', () => {
      const validToken = createTestToken(7 * 24 * 3600);
      tokenStore.save(validToken);

      const exitSpy = vi.spyOn(process, 'exit');

      ensureAuthenticated();

      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should warn but not exit when token expiring soon', () => {
      const token = createTestToken(12 * 3600); // 12 hours
      tokenStore.save(token);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit');

      ensureAuthenticated();

      expect(warnSpy).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
```

### Command Tests with Mocked Auth

```typescript
import { describe, it, expect, vi } from 'vitest';
import { sync } from './sync';
import * as auth from '../lib/auth';

// Mock the auth module
vi.mock('../lib/auth', () => ({
  ensureAuthenticated: vi.fn(),
}));

describe('sync command', () => {
  it('should check authentication before syncing', async () => {
    await sync();

    expect(auth.ensureAuthenticated).toHaveBeenCalled();
  });

  it('should not sync if authentication fails', async () => {
    vi.mocked(auth.ensureAuthenticated).mockImplementation(() => {
      throw new Error('Not authenticated');
    });

    await expect(sync()).rejects.toThrow('Not authenticated');
  });
});
```

## Required Dependencies

The JWT decoding library is already installed, but if you need to add it:

```bash
pnpm add jwt-decode
```

## Comparison with Coupled Approach

| Aspect                             | Coupled (Before)              | Decoupled (After)     |
| ---------------------------------- | ----------------------------- | --------------------- |
| **Lines of auth code per command** | 20+ lines                     | 1 line                |
| **Auth logic locations**           | Every command file            | One module            |
| **Error message consistency**      | Varies by command             | Always consistent     |
| **Testing**                        | Mock tokenStore in every test | Mock auth module once |
| **Maintenance**                    | Update multiple files         | Update one file       |
| **Adding new command**             | Copy/paste 20 lines           | Add 1 line            |
| **Changing threshold**             | Update every command          | Update one constant   |
| **Command readability**            | Auth logic dominates          | Business logic clear  |

## Common Patterns

### Pattern 1: Standard Authenticated Command

```typescript
export async function commandName() {
  ensureAuthenticated();

  // Your business logic here
}
```

**Use when:** Command requires authentication to proceed

### Pattern 2: Custom Auth Handling

```typescript
export async function commandName() {
  const auth = requireAuth({ warnOnExpiringSoon: false });

  if (!auth.isAuthenticated) {
    // Custom error handling
    return;
  }

  // Your business logic here
}
```

**Use when:** You need custom behavior based on auth status

### Pattern 3: Optional Authentication

```typescript
export async function commandName() {
  const auth = requireAuth();

  if (auth.isAuthenticated) {
    // Authenticated flow
    await syncWithServer();
  } else {
    // Anonymous flow
    console.log('Running in offline mode');
    await workLocally();
  }
}
```

**Use when:** Command works with or without authentication

### Pattern 4: Show Auth Status

```typescript
export async function status() {
  const auth = requireAuth({ warnOnExpiringSoon: false });

  console.log(`Authenticated: ${auth.isAuthenticated ? '✓' : '✗'}`);
  if (auth.timeUntilExpiration) {
    console.log(`Token expires in: ${auth.timeUntilExpiration}`);
  }
}
```

**Use when:** Showing authentication status to user

## Troubleshooting

### Issue: "jwt-decode" module not found

**Solution:**

```bash
pnpm add jwt-decode
```

### Issue: Token not being cleared on expiration

**Cause:** Using `requireAuth()` which doesn't automatically clear

**Solution:** `requireAuth()` with expired token still clears automatically. If not working, check:

```typescript
// In require-auth.ts
if (isTokenExpired(token)) {
  tokenStore.clear(); // ← This line should be there
  return { ... };
}
```

### Issue: Different error messages in different commands

**Cause:** Some commands not using `ensureAuthenticated()`

**Solution:** Search for direct `tokenStore.get()` usage and replace:

```bash
# Find commands using tokenStore directly
grep -r "tokenStore.get()" src/commands/
```

Replace with:

```typescript
ensureAuthenticated();
```

### Issue: Tests failing with "process.exit called"

**Cause:** `ensureAuthenticated()` calls `process.exit(1)` when not authenticated

**Solution:** Mock process.exit in tests:

```typescript
const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

expect(() => ensureAuthenticated()).toThrow('process.exit called');
```

## Next Steps

### Using This Pattern

1. **Add to existing commands:**

   ```typescript
   // At the top of authenticated commands
   import { ensureAuthenticated } from '../lib/auth/index.js';

   export async function yourCommand() {
     ensureAuthenticated(); // Add this line
     // ... rest of command
   }
   ```

2. **Create new authenticated commands:**

   ```typescript
   import { ensureAuthenticated } from '../lib/auth/index.js';

   export async function newCommand() {
     ensureAuthenticated();
     // Your logic here
   }
   ```

3. **Add to sync command (from Tutorial 07):**

   ```typescript
   // src/commands/sync.ts
   import { ensureAuthenticated } from '../lib/auth/index.js';

   export async function sync() {
     ensureAuthenticated(); // Add this

     const result = await performSync(apiClient, {
       onProgress: (msg) => console.log(msg),
     });

     // Display results...
   }
   ```

### Optional Enhancements

1. **Add 401 interceptor to ApiClient:**

   ```typescript
   // src/lib/api/api-client.ts
   this.http.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 401) {
         tokenStore.clear();
         throw new Error('Session expired. Please run `papyrus login` again.');
       }
       return Promise.reject(error);
     }
   );
   ```

2. **Create a status command:**

   ```typescript
   // src/commands/status.ts
   import { requireAuth } from '../lib/auth/index.js';

   export function status() {
     const auth = requireAuth({ warnOnExpiringSoon: false });

     if (auth.isAuthenticated) {
       console.log('✓ Authenticated');
       console.log(`  Expires in: ${auth.timeUntilExpiration}`);
     } else {
       console.log('✗ Not authenticated');
       console.log(`  ${auth.message}`);
     }
   }
   ```

3. **Add tests for auth utilities:**
   - Test token expiration detection
   - Test human-readable time formatting
   - Test auth middleware behavior
   - Test command auth integration

### Further Reading

- [JWT.io](https://jwt.io/) - Understanding JWT tokens
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) - Design principle
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) - Code reusability

**Related Tutorials:**

- [01 - Storage Layer](./01-STORAGE-LAYER.md) - Token storage
- [02 - API Client Setup](./02-API-CLIENT-SETUP.md) - API authentication
- [07 - Sync Implementation](./07-SYNC-IMPLEMENTATION.md) - Using ensureAuthenticated() in practice

---

**Next Tutorial:** [09 - Advanced Patterns](./09-ADVANCED-PATTERNS.md) _(coming soon)_
