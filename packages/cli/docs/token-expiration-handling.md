# Token Expiration Handling in CLI Tools

## Current State

Papyrus CLI currently stores an access token (valid for 7 days) in the config file. There is no automatic handling for expired or invalid tokens.

## Common Approaches

### 1. Lazy Detection (Most Common)

Detect expired tokens when API calls fail with 401/403 responses.

```typescript
// In api.ts interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid/expired
      // Clear stored token, show helpful message
    }
    return Promise.reject(error);
  }
);
```

**Pros:**

- Simple implementation
- No need to track expiration dates
- No additional backend changes required

**Cons:**

- User discovers token expired at time of failure
- Not ideal UX - interrupts workflow
- Requires user to manually re-run login

---

### 2. Proactive Validation (Better UX)

Check if token will expire soon before making requests.

```typescript
// Requires storing token expiration time alongside token
interface Config {
  authToken?: string;
  tokenExpiresAt?: string; // ISO timestamp
}

// Before API calls, check:
function isTokenExpiringSoon(): boolean {
  const expiresAt = config.get('tokenExpiresAt');
  if (!expiresAt) return false;

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  return expiryTime - now < oneHour;
}

// Before operations:
if (isTokenExpiringSoon()) {
  console.log('Your session is expiring soon. Re-authenticating...');
  // Prompt for login or auto-refresh
}
```

**Pros:**

- Prevents mid-operation failures
- Better user experience
- User is warned proactively

**Cons:**

- Requires backend to provide expiration timestamp in auth response
- Slightly more complex implementation
- Need to modify login flow to store expiration

---

### 3. Refresh Token Flow (Best for Long-Running CLIs)

Store both access and refresh tokens, automatically renew when needed.

```typescript
interface Config {
  authToken?: string; // Short-lived (7 days)
  refreshToken?: string; // Long-lived (30+ days)
}

// On 401 error, automatically try to refresh
async function handleUnauthorized() {
  const refreshToken = config.get('refreshToken');
  if (!refreshToken) {
    // No refresh token, need to login
    throw new Error('Session expired. Please run "papyrus login"');
  }

  try {
    const response = await axios.post('/auth/refresh', { refreshToken });
    const { authToken, refreshToken: newRefreshToken } = response.data;

    // Update stored tokens
    config.set('authToken', authToken);
    config.set('refreshToken', newRefreshToken);

    // Retry original request with new token
    return true;
  } catch (error) {
    // Refresh failed, need to login
    config.delete('authToken');
    config.delete('refreshToken');
    throw new Error('Session expired. Please run "papyrus login"');
  }
}
```

**Pros:**

- Seamless user experience
- No re-login needed for weeks/months
- Handles expiration transparently

**Cons:**

- Requires backend support for refresh token endpoint
- More complex implementation
- Need to handle refresh token expiration
- Additional security considerations (rotating refresh tokens)

---

## Chosen Implementation Approach for Papyrus CLI

### JWT-Based Proactive Validation (No Backend Changes)

The access token is already a JWT containing expiration information (`exp` claim). We can decode the token client-side to extract the expiry date and proactively warn users.

**Implementation:**

```typescript
// src/lib/token.ts (new utility)
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number; // Expiration time (seconds since epoch)
  iat: number; // Issued at time
  // ... other claims
}

/**
 * Decodes JWT token and returns expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return new Date(decoded.exp * 1000); // Convert seconds to milliseconds
  } catch (error) {
    return null; // Invalid token
  }
}

/**
 * Checks if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true; // Treat invalid token as expired

  return Date.now() >= expiration.getTime();
}

/**
 * Checks if token will expire within the given threshold
 * @param thresholdHours - Hours before expiration to consider "expiring soon"
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdHours: number = 24
): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;

  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  const timeUntilExpiry = expiration.getTime() - Date.now();

  return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs;
}
```

**Usage in Commands:**

```typescript
// src/commands/sync.ts (or any command requiring auth)
import {
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpiration,
} from '../lib/token.js';
import { config } from '../services/config.js';

export function registerSyncCommand(program: Command) {
  program
    .command('sync')
    .description('Sync local journals with remote server')
    .action(async () => {
      const token = config.get('authToken');

      if (!token) {
        console.error('Not authenticated. Please run "papyrus login" first.');
        process.exit(1);
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        config.delete('authToken'); // Clear expired token
        console.error(
          'Your session has expired. Please run "papyrus login" again.'
        );
        process.exit(1);
      }

      // Check if token is expiring soon
      if (isTokenExpiringSoon(token, 24)) {
        const expiration = getTokenExpiration(token);
        console.warn(
          `⚠️  Your session will expire soon (${expiration?.toLocaleString()}).`
        );
        console.warn(
          '   Consider running "papyrus login" to refresh your session.\n'
        );
      }

      // Proceed with sync operation
      // ...
    });
}
```

**Error Handling in API Client:**

```typescript
// src/services/api.ts
import { isTokenExpired } from '../lib/token.js';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = config.get('authToken');

      // Clear the token
      config.delete('authToken');

      // Provide appropriate message
      if (token && isTokenExpired(token)) {
        console.error(
          'Your session has expired. Please run "papyrus login" again.'
        );
      } else {
        console.error(
          'Authentication failed. Please run "papyrus login" again.'
        );
      }

      process.exit(1);
    }
    return Promise.reject(error);
  }
);
```

**Required Dependencies:**

```bash
npm install jwt-decode
npm install --save-dev @types/jwt-decode
```

**Benefits of This Approach:**

- ✅ No backend changes required (JWT already contains expiration)
- ✅ Proactive user notification (warns before expiration)
- ✅ Clear messaging for expired tokens
- ✅ Simple implementation (just JWT decoding)
- ✅ No extra storage needed (info is in the token itself)
- ✅ Works offline (no API call needed to check expiration)

**User Experience:**

1. **Token expiring within 24 hours:**

   ```
   ⚠️  Your session will expire soon (12/26/2025, 10:30:00 AM).
      Consider running "papyrus login" to refresh your session.

   Syncing journals...
   ```

2. **Token already expired:**

   ```
   Your session has expired. Please run "papyrus login" again.
   ```

3. **Token invalid/malformed:**
   ```
   Authentication failed. Please run "papyrus login" again.
   ```

**Files to Create/Modify:**

- ✏️ `src/lib/token.ts` - New utility module for JWT handling
- ✏️ `src/services/api.ts` - Add 401 error interceptor
- ✏️ `src/commands/sync.ts` - Add token validation before sync
- ✏️ `src/commands/journal.ts` - Add token validation for API operations (if applicable)
- ✏️ `package.json` - Add `jwt-decode` dependency

---

## Recommendations for Papyrus CLI (General Reference)

### Short-term: Option A - Lazy Detection + Clear Messaging

**Implementation:**

1. Add response interceptor to API client to catch 401 errors
2. Clear stored token from config
3. Display clear message: `"Your session has expired. Please run 'papyrus login' again."`
4. Exit gracefully with appropriate exit code

**Why this first:**

- Minimal code changes
- No backend changes required
- Addresses the immediate problem
- Standard pattern used by many CLIs (Heroku CLI, Railway CLI)

---

### Medium-term: Option B - Proactive Validation (Recommended)

**Implementation:**

1. Backend: Modify `/auth/signin` response to include `expiresAt` timestamp
2. CLI: Store `expiresAt` alongside `authToken` in config.json
3. Before sync/API operations, check if token expires within 1 hour
4. If expiring soon, show: `"Your session is expiring soon. Re-authenticating..."`
5. Auto-prompt for login or show clear message

**Why this is recommended:**

- Significantly better UX than lazy detection
- Relatively small change on both backend and CLI
- Prevents workflow interruptions
- Still simple to implement and maintain

**Changes needed:**

```typescript
// Backend response (Node.js example)
{
  "token": "eyJhbGc...",
  "expiresAt": "2025-12-26T10:30:00Z"  // Add this
}

// CLI config.json
{
  "authToken": "eyJhbGc...",
  "tokenExpiresAt": "2025-12-26T10:30:00Z"  // Store this
}
```

---

### Long-term: Option C - Refresh Token Flow

Only implement if:

- Users complain about re-authenticating weekly
- You expect users to go weeks/months between CLI usage
- You have bandwidth for the backend + CLI changes
- Security requirements allow longer-lived sessions

**Backend changes needed:**

- New `/auth/refresh` endpoint
- Refresh token generation and storage
- Refresh token rotation (security best practice)
- Refresh token expiration handling

**CLI changes needed:**

- Store both access and refresh tokens
- Implement automatic refresh on 401
- Retry failed requests after refresh
- Handle refresh token expiration

---

## Examples from Popular CLIs

### GitHub CLI (`gh`)

- Uses OAuth with refresh tokens
- Seamlessly renews tokens in the background
- User rarely needs to re-authenticate

### Heroku CLI

- Detects 401 responses
- Prompts: `"Error: Invalid credentials. Run 'heroku login' to login again"`
- Simple lazy detection approach

### AWS CLI

- Supports multiple credential types (some with expiration)
- Shows clear error messages when credentials expire
- Supports credential refresh for some providers

### Vercel CLI

- Stores token in config
- Detects 401 errors
- Prompts user to re-authenticate with clear instructions

---

## Implementation Priority

1. **Now:** Implement Option A (lazy detection with clear error messages)
   - Fixes current problem where expired tokens cause confusing errors
   - Takes < 1 hour to implement

2. **Next:** Consider Option B (proactive validation) if you control the backend
   - Discuss with backend team about adding `expiresAt` to auth response
   - Improves UX significantly
   - Takes < 4 hours to implement (backend + CLI)

3. **Future:** Option C only if user feedback indicates weekly re-auth is problematic
   - Requires careful design for security
   - Takes 1-2 days to implement properly

---

## Security Considerations

### Token Storage

- Current approach (storing in config.json with 0o600 permissions) is acceptable
- Tokens are already protected by file system permissions
- Alternative: OS keychain (overkill for CLI tools typically)

### Token Refresh

If implementing refresh tokens:

- Always rotate refresh tokens (issue new one on each refresh)
- Set reasonable expiration on refresh tokens (30-90 days)
- Implement rate limiting on refresh endpoint
- Consider device/session tracking for security audit

### Token Validation

- Current approach relies on server-side validation (good)
- No need for JWT parsing/validation on client side
- Server 401 response is the source of truth

---

## Related Files

- `src/services/api.ts` - API client where interceptor should be added
- `src/services/config.ts` - Config service for storing token metadata
- `src/commands/auth.ts` - Login command where `expiresAt` would be stored
- Backend `/auth/signin` endpoint - Where expiration info should be returned
