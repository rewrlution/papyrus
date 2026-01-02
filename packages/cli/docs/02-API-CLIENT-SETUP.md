# API Client Setup

Learn how to set up an API client in the CLI package using shared types from the monorepo.

## Overview

We're building an HTTP client that:

- Communicates with the Papyrus API server
- Uses authentication tokens from the storage layer
- Provides type-safe methods for API endpoints
- Leverages shared types and schemas from `@rewrlution/papyrus-shared`

## Architecture

```
┌─────────────────┐
│  CLI Commands   │ (add, login, etc.)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Client    │ (HTTP methods, error handling)
└────────┬────────┘
         │
         ├──> TokenStore (from storage layer)
         └──> Shared Types (from @shared package)
```

**Flow:**

1. Command calls ApiClient method (e.g., `client.login()`)
2. ApiClient gets token from TokenStore (storage layer)
3. ApiClient makes HTTP request with proper types
4. ApiClient returns typed response from shared package
5. Command handles response

## Prerequisites

**Install required packages:**

```bash
cd packages/cli
pnpm add axios
pnpm add -D @types/node
```

**Ensure you have completed:**

- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - We'll use TokenStore from here

## Understanding Shared Types

The `@rewrlution/papyrus-shared` package provides:

**Auth types:**

- `SigninInput` - Login request body
- `SignupInput` - Registration request body
- `SigninResponse` - Login response with token
- `SignupResponse` - Registration response
- `SigninData` - User data with JWT token
- `UserData` - User information

**Journal types:**

- `CreateJournalInput` - Create entry request
- `UpdateJournalInput` - Update entry request
- `JournalData` - Full journal entry with content
- `JournalMetaData` - Journal metadata without content
- `JournalResponse` - Single entry response
- `JournalListResponse` - Paginated list response

**All types are inferred from Zod schemas**, ensuring runtime validation and type safety.

## Implementation

### Step 1: Create API Client

Create the main API client class that uses shared types:

```typescript
// src/lib/api-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { tokenStore } from './storage/index.js';
import type {
  SigninInput,
  SignupInput,
  SigninResponse,
  SignupResponse,
  SigninData,
  CreateJournalInput,
  UpdateJournalInput,
  JournalResponse,
  JournalListResponse,
  JournalData,
} from '@rewrlution/papyrus-shared';

/**
 * API Client for Papyrus server
 * Uses shared types and storage layer for tokens
 *
 * Error handling strategy:
 * - Validation errors: Caught by Zod client-side (before API call)
 * - API errors: Descriptive messages from ApiErrorResponse
 * - Network errors: Wrapped with descriptive message
 */
export class ApiClient {
  private http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests automatically from storage layer
    this.http.interceptors.request.use((config) => {
      const token = tokenStore.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Login with email and password
   * Uses SigninInput and SigninResponse from shared package
   */
  async login(credentials: SigninInput): Promise<SigninData> {
    try {
      const response = await this.http.post<SigninResponse>(
        '/auth/signin',
        credentials
      );

      // Save token to storage layer
      if (response.data.data.token) {
        tokenStore.save(response.data.data.token);
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register new user
   * Uses SignupInput and SignupResponse from shared package
   */
  async register(credentials: SignupInput): Promise<SignupResponse['data']> {
    try {
      const response = await this.http.post<SignupResponse>(
        '/auth/signup',
        credentials
      );

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout (clear token from storage)
   */
  logout(): void {
    tokenStore.clear();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStore.exists();
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<SigninData> {
    try {
      const response = await this.http.get<SigninResponse>('/auth/me');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new journal entry
   * Uses CreateJournalInput from shared package
   */
  async createEntry(input: CreateJournalInput): Promise<JournalData> {
    try {
      const response = await this.http.post<JournalResponse>('/journal', input);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get journal entry by date
   */
  async getEntry(date: string): Promise<JournalData | null> {
    try {
      const response = await this.http.get<JournalResponse>(`/journal/${date}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Update journal entry
   * Uses UpdateJournalInput from shared package
   */
  async updateEntry(
    date: string,
    input: UpdateJournalInput
  ): Promise<JournalData> {
    try {
      const response = await this.http.put<JournalResponse>(
        `/journal/${date}`,
        input
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List journal entries
   * Returns paginated response with metadata
   */
  async listEntries(page = 1, limit = 50): Promise<JournalData[]> {
    try {
      const response = await this.http.get<JournalListResponse>('/journal', {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete journal entry
   */
  async deleteEntry(date: string): Promise<void> {
    try {
      await this.http.delete(`/journal/${date}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Convert axios errors to standard Error
   * API errors already have descriptive messages
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      // API returned an error response with message
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Network error (connection refused, timeout, DNS failure)
      throw new Error(`Network error: ${error.message}`);
    }

    // Unknown error
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
}
```

**Key features:**

- **Uses shared types**: All request/response types from `@rewrlution/papyrus-shared`
- **Automatic token injection**: Via axios interceptor, reading from storage layer
- **Type-safe methods**: Each endpoint has proper input/output types
- **Simple error handling**: Throws standard Error with descriptive messages
- **Storage layer integration**: Uses `tokenStore` from storage layer

**Error handling strategy:**

1. **Validation errors**: Caught by Zod client-side (before API call)
2. **API errors**: Already have descriptive messages - just throw them
3. **Network errors**: Wrapped with "Network error:" prefix for clarity

**Why use shared types?**

1. **Single source of truth**: Types AND validation schemas defined once
2. **Client-side validation**: Use Zod schemas to validate before API calls
3. **Consistency**: API, CLI, and future web app use same types
4. **Maintainability**: Update types in one place

### Step 2: Create API Client Singleton

Create a singleton instance for easy access throughout the app:

```typescript
// src/lib/api.ts
import { ApiClient } from './api-client.js';
import { configStore } from './storage/index.js';

// Get API URL from config, environment, or default
const API_BASE_URL =
  configStore.get('apiUrl') ||
  process.env.PAPYRUS_API_URL ||
  'http://localhost:3000/api';

/**
 * Shared API client instance
 * Use this throughout the application
 */
export const api = new ApiClient(API_BASE_URL);

// Re-export for convenience
export { ApiClient } from './api-client.js';
```

**Why singleton?**

- Single axios instance (connection pooling)
- Shared token state
- Easy to mock in tests
- Consistent configuration

### Step 3: Use in Commands with Client-Side Validation

Now update your commands to use the API client with **Zod validation before API calls**:

```typescript
// src/commands/auth/login.ts
import { api } from '../../lib/api.js';
import { SigninSchema } from '@rewrlution/papyrus-shared';

export async function login(email: string, password: string): Promise<void> {
  // 1. Validate inputs with Zod BEFORE making API call
  const result = SigninSchema.safeParse({ email, password });

  if (!result.success) {
    console.error('❌ Validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  // 2. Make API call - validation already passed
  try {
    console.log('🔐 Logging in...');

    const userData = await api.login(result.data);

    console.log(`✅ Welcome back, ${userData.email}!`);
    console.log(`User ID: ${userData.id}`);
  } catch (error: any) {
    // API errors already have descriptive messages
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
```

```typescript
// src/commands/auth/register.ts
import { api } from '../../lib/api.js';
import { SignupSchema } from '@rewrlution/papyrus-shared';

export async function register(
  email: string,
  password: string,
  confirmPassword: string
): Promise<void> {
  // 1. Validate inputs with Zod BEFORE making API call
  const result = SignupSchema.safeParse({ email, password, confirmPassword });

  if (!result.success) {
    console.error('❌ Validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  // 2. Make API call - validation already passed
  try {
    console.log('📝 Registering new account...');

    const userData = await api.register(result.data);

    console.log('✅ Registration successful!');
    console.log(`Please check ${userData.email} to verify your account.`);
  } catch (error: any) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
```

```typescript
// src/commands/journal/add.ts
import { api } from '../../lib/api.js';
import { CreateJournalSchema } from '@rewrlution/papyrus-shared';
import { AddOptions } from '../types.js';

export async function addEntry(options: AddOptions): Promise<void> {
  if (!api.isAuthenticated()) {
    console.error('❌ Please login first: papyrus login');
    process.exit(1);
  }

  const date = options.date || new Date().toISOString().split('T')[0];

  // TODO: Get content from editor
  const content = 'Sample journal entry';

  // 1. Validate inputs with Zod BEFORE making API call
  const result = CreateJournalSchema.safeParse({ date, content });

  if (!result.success) {
    console.error('❌ Validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  // 2. Make API call - validation already passed
  try {
    console.log(`📝 Creating journal entry for ${date}...`);

    const entry = await api.createEntry(result.data);

    console.log('✅ Entry created successfully!');
    console.log(`Date: ${entry.date}`);
    console.log(`Hash: ${entry.hash}`);
  } catch (error: any) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
```

**Why validate client-side?**

1. **Fast feedback**: Instant validation, no network round-trip
2. **Reduced server load**: Invalid requests never reach API
3. **Better UX**: Immediate error messages
4. **Single source of truth**: Same Zod schemas used by API
5. **Type safety**: `result.data` is properly typed after validation

## Benefits of This Approach

### 1. Client-Side + Server-Side Validation

```typescript
// Shared package defines the contract
export const SigninSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SigninInput = z.infer<typeof SigninSchema>;

// CLI validates BEFORE sending (client-side)
const result = SigninSchema.safeParse({ email, password });
if (!result.success) {
  // Show validation errors immediately - no API call needed
}

// API validates when receiving (server-side)
app.post('/auth/signin', validate(SigninSchema), async (req, res) => {
  // Double protection: CLI and API both validate
});
```

**Benefits:**

- **Fast feedback**: Users see errors instantly (no network delay)
- **Reduced load**: Invalid requests never reach server
- **Defense in depth**: Server still validates (protects against non-CLI clients)

### 2. Consistent Error Messages

All validation errors come from the same Zod schemas:

```
❌ Validation failed:
  • email: Invalid email address
  • password: Must be at least 8 characters long
```

Same messages whether caught by CLI or API!

### 3. Simple Error Handling

```typescript
// No complex error types - just standard Error
catch (error: any) {
  console.error(`❌ ${error.message}`);
}
```

API errors already have descriptive messages like:

- "Invalid email or password"
- "User not found"
- "Token expired"

### 4. Easy Refactoring

When API changes:

1. Update Zod schema in shared package
2. TypeScript shows where CLI needs updates
3. Validation automatically updates everywhere
4. Fix errors, done!

## Testing

Test the API client with mocked HTTP calls:

```typescript
// src/lib/__tests__/api-client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ApiClient } from '../api-client.js';
import { tokenStore } from '../storage/index.js';
import type { SigninResponse } from '@rewrlution/papyrus-shared';

vi.mock('axios');

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://api.test');
    tokenStore.clear();
  });

  afterEach(() => {
    tokenStore.clear();
  });

  it('should login and save token', async () => {
    const mockResponse: SigninResponse = {
      success: true,
      data: {
        id: '123',
        email: 'test@test.com',
        verifified: true,
        token: 'test-token-123',
      },
      message: 'Login successful',
    };

    vi.mocked(axios.create).mockReturnValue({
      post: vi.fn().mockResolvedValue({ data: mockResponse }),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as any);

    const result = await client.login({
      email: 'test@test.com',
      password: 'password',
    });

    expect(result.token).toBe('test-token-123');
    expect(tokenStore.get()).toBe('test-token-123');
  });

  it('should throw descriptive error on API error', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Invalid email or password',
        },
      },
      isAxiosError: true,
    };

    vi.mocked(axios.create).mockReturnValue({
      post: vi.fn().mockRejectedValue(mockError),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as any);

    await expect(
      client.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('should throw network error on connection failure', async () => {
    const mockError = {
      message: 'connect ECONNREFUSED',
      isAxiosError: true,
    };

    vi.mocked(axios.create).mockReturnValue({
      post: vi.fn().mockRejectedValue(mockError),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as any);

    await expect(
      client.login({ email: 'test@test.com', password: 'password' })
    ).rejects.toThrow('Network error:');
  });

  it('should check authentication status', () => {
    expect(client.isAuthenticated()).toBe(false);

    tokenStore.save('test-token');
    expect(client.isAuthenticated()).toBe(true);
  });

  it('should clear token on logout', () => {
    tokenStore.save('test-token');
    expect(client.isAuthenticated()).toBe(true);

    client.logout();
    expect(client.isAuthenticated()).toBe(false);
  });
});
```

### Testing Commands with Zod Validation

```typescript
// src/commands/__tests__/login.test.ts
import { describe, it, expect, vi } from 'vitest';
import { login } from '../auth/login.js';
import { SigninSchema } from '@rewrlution/papyrus-shared';

describe('login command', () => {
  it('should fail validation for invalid email', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Invalid email should fail Zod validation
    await expect(login('invalid-email', 'password')).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith('❌ Validation failed:');
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should validate password requirements', () => {
    const result = SigninSchema.safeParse({
      email: 'test@test.com',
      password: '', // Empty password
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('required');
    }
  });
});
```

## Configuration

Use the config store from the storage layer:

```typescript
// Set API URL via config
import { configStore } from './storage/index.js';

configStore.set('apiUrl', 'https://api.papyrus.dev');

// Or via environment variable
// .env
PAPYRUS_API_URL=https://api.papyrus.dev
```

The API client reads from config → env → default (in that order).

## Common Issues

### "Cannot find module '@rewrlution/papyrus-shared'"

**Cause:** Shared package not built or not linked
**Solution:**

```bash
# From monorepo root
pnpm install
pnpm build --filter=@rewrlution/papyrus-shared
```

### "Token not being sent with requests"

**Cause:** Token not saved or interceptor not working
**Solution:**

- Check `tokenStore.get()` returns token
- Verify axios interceptor is registered
- Check Authorization header in network tab

### Type mismatches between API and CLI

**Cause:** Shared package out of date
**Solution:**

```bash
# Rebuild shared package
pnpm build --filter=@rewrlution/papyrus-shared

# Restart TypeScript server in IDE
```

### "Unauthorized" errors

**Cause:** Token expired or invalid
**Solution:**

- Login again to get fresh token
- Check token expiration on server
- Implement token refresh (future enhancement)

## Next Steps

1. **Add request retry logic** - Handle network failures gracefully
2. **Add request/response logging** - Debug API issues easily
3. **Add token refresh** - Automatic token renewal
4. **Add request caching** - Reduce redundant API calls
5. **Add offline queue** - Queue requests when offline
6. **Add progress indicators** - Show upload/download progress

## Summary

**What we built:**

- ✅ Type-safe API client using shared types
- ✅ Client-side validation with Zod (before API calls)
- ✅ Automatic token management via storage layer
- ✅ Simple error handling (just Error with descriptive messages)
- ✅ Singleton pattern for easy access
- ✅ Full test coverage

**Key principles:**

- **Use shared types AND schemas**: Single source of truth for types and validation
- **Validate early**: Client-side validation catches errors before network calls
- **Keep it simple**: API errors already have good messages - just display them
- **Separation of concerns**: Storage layer handles tokens, API client handles HTTP
- **Type safety**: Compile-time checks for all API calls
- **Testability**: Easy to mock and test

**Error handling strategy:**

1. **Validation errors**: Caught by Zod client-side → Display immediately
2. **API errors**: Already descriptive → Just display `error.message`
3. **Network errors**: Wrapped with "Network error:" → Display with context

**Architecture:**

```
CLI Package
  ├── Commands (validate with Zod → use api singleton)
  ├── API Client (uses shared types + tokenStore)
  ├── Storage Layer (handles tokens)
  └── Shared Package (types + Zod schemas)
```

## References

- [Axios Documentation](https://axios-http.com/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - Token storage implementation
