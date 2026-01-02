# API Client Setup

Learn how to set up an API client in the CLI package and use shared utilities from the monorepo.

## Overview

We're building an HTTP client that:

- Communicates with the Papyrus API server
- Handles authentication tokens
- Provides type-safe methods for API endpoints
- Uses shared types from the monorepo's shared package

## Architecture

```
┌─────────────────┐
│  CLI Commands   │ (add, login, etc.)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Client    │ (HTTP methods)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Token Store    │ (localStorage wrapper)
└─────────────────┘
```

**Flow:**

1. Command calls ApiClient method (e.g., `client.login()`)
2. ApiClient gets token from TokenStore if needed
3. ApiClient makes HTTP request
4. ApiClient returns typed response
5. Command handles response

## Prerequisites

Install required packages:

```bash
cd packages/cli
pnpm add axios
pnpm add -D @types/node
```

## Implementation

### Step 1: Create Token Store

First, create a simple token storage wrapper. This abstracts localStorage so we can easily test and change storage mechanisms later.

```typescript
// src/lib/token-store.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Manages authentication token storage
 * Stores tokens in ~/.papyrus/token
 */
export class TokenStore {
  private tokenPath: string;

  constructor() {
    const homeDir = os.homedir();
    const papyrusDir = path.join(homeDir, '.papyrus');

    // Create directory if it doesn't exist
    if (!fs.existsSync(papyrusDir)) {
      fs.mkdirSync(papyrusDir, { recursive: true });
    }

    this.tokenPath = path.join(papyrusDir, 'token');
  }

  /**
   * Save authentication token
   */
  save(token: string): void {
    fs.writeFileSync(this.tokenPath, token, 'utf-8');
  }

  /**
   * Get stored token, returns null if not found
   */
  get(): string | null {
    try {
      if (fs.existsSync(this.tokenPath)) {
        return fs.readFileSync(this.tokenPath, 'utf-8').trim();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove stored token
   */
  clear(): void {
    if (fs.existsSync(this.tokenPath)) {
      fs.unlinkSync(this.tokenPath);
    }
  }

  /**
   * Check if token exists
   */
  exists(): boolean {
    return fs.existsSync(this.tokenPath);
  }
}
```

**Why this approach?**

- Simple file-based storage (works on all platforms)
- Stores in user's home directory (standard convention)
- Easy to test (can mock fs operations)
- Single responsibility (only handles token storage)

### Step 2: Define API Types

Create types for API requests and responses. We'll use the shared package for common types.

```typescript
// src/lib/api-types.ts

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Response types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Journal entry types (will sync with shared package later)
export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

**Note:** Later, we'll import these from `@rewrlution/papyrus-shared` once they're defined there. For now, we define them locally.

### Step 3: Create API Client

Now create the main API client class:

```typescript
// src/lib/api-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { TokenStore } from './token-store.js';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiError,
  JournalEntry,
} from './api-types.js';

/**
 * API Client for Papyrus server
 * Handles authentication and HTTP requests
 */
export class ApiClient {
  private http: AxiosInstance;
  private tokenStore: TokenStore;

  constructor(baseUrl: string, tokenStore?: TokenStore) {
    this.tokenStore = tokenStore || new TokenStore();

    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests automatically
    this.http.interceptors.request.use((config) => {
      const token = this.tokenStore.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.http.post<AuthResponse>('/auth/login', {
        email,
        password,
      } as LoginRequest);

      // Save token for future requests
      this.tokenStore.save(response.data.token);

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    try {
      const response = await this.http.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
      } as RegisterRequest);

      // Save token for future requests
      this.tokenStore.save(response.data.token);

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout (clear token)
   */
  logout(): void {
    this.tokenStore.clear();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenStore.exists();
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      const response = await this.http.get<AuthResponse['user']>('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new journal entry
   */
  async createEntry(date: string, content: string): Promise<JournalEntry> {
    try {
      const response = await this.http.post<JournalEntry>('/journal/entries', {
        date,
        content,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get journal entry by date
   */
  async getEntry(date: string): Promise<JournalEntry | null> {
    try {
      const response = await this.http.get<JournalEntry>(
        `/journal/entries/${date}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Update journal entry
   */
  async updateEntry(date: string, content: string): Promise<JournalEntry> {
    try {
      const response = await this.http.put<JournalEntry>(
        `/journal/entries/${date}`,
        { content }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List all journal entries
   */
  async listEntries(): Promise<JournalEntry[]> {
    try {
      const response = await this.http.get<JournalEntry[]>('/journal/entries');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Convert axios errors to our error format
   */
  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        message: axiosError.response?.data?.message || axiosError.message,
        status: axiosError.response?.status,
        code: axiosError.code,
      };
    }

    return {
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Key features:**

- Automatic token injection via axios interceptor
- Type-safe methods for each endpoint
- Centralized error handling
- Token persistence via TokenStore
- Injectable TokenStore for testing

### Step 4: Create API Client Singleton

Create a singleton instance for easy access throughout the app:

```typescript
// src/lib/api.ts
import { ApiClient } from './api-client.js';

// TODO: Get from environment variable or config
const API_BASE_URL = process.env.PAPYRUS_API_URL || 'http://localhost:3000/api';

/**
 * Shared API client instance
 * Use this throughout the application
 */
export const api = new ApiClient(API_BASE_URL);

// Re-export types for convenience
export * from './api-types.js';
export { ApiClient } from './api-client.js';
export { TokenStore } from './token-store.js';
```

### Step 5: Use in Commands

Now update your commands to use the API client:

```typescript
// src/commands/auth/login.ts
import { api } from '../../lib/api.js';

export async function login(email: string, password: string): Promise<void> {
  try {
    console.log('🔐 Logging in...');

    const response = await api.login(email, password);

    console.log(`✅ Welcome back, ${response.user.name}!`);
  } catch (error: any) {
    console.error(`❌ Login failed: ${error.message}`);
    process.exit(1);
  }
}
```

```typescript
// src/commands/journal/add.ts
import { api } from '../../lib/api.js';
import { AddOptions } from '../types.js';

export async function addEntry(options: AddOptions): Promise<void> {
  try {
    if (!api.isAuthenticated()) {
      console.error('❌ Please login first: papyrus login');
      process.exit(1);
    }

    const date = options.date || new Date().toISOString().split('T')[0];

    console.log(`📝 Creating journal entry for ${date}...`);

    // TODO: Get content from editor
    const content = 'Sample journal entry';

    const entry = await api.createEntry(date, content);

    console.log('✅ Entry created successfully!');
    console.log(`ID: ${entry.id}`);
  } catch (error: any) {
    console.error(`❌ Failed to create entry: ${error.message}`);
    process.exit(1);
  }
}
```

## Using Shared Package

When types are defined in the shared package, import them:

```typescript
// In shared package: packages/shared/src/types/journal.ts
export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// In CLI: src/lib/api-client.ts
import { JournalEntry } from '@rewrlution/papyrus-shared';

// Use the shared type
async createEntry(date: string, content: string): Promise<JournalEntry> {
  // ...
}
```

**Benefits:**

- Single source of truth for types
- Shared validation logic
- Consistent data structures across packages
- Better IDE autocomplete

## Testing

Test the API client with mocked HTTP calls:

```typescript
// src/lib/__tests__/api-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ApiClient } from '../api-client.js';
import { TokenStore } from '../token-store.js';

vi.mock('axios');

describe('ApiClient', () => {
  let client: ApiClient;
  let mockTokenStore: TokenStore;

  beforeEach(() => {
    mockTokenStore = {
      save: vi.fn(),
      get: vi.fn(),
      clear: vi.fn(),
      exists: vi.fn(),
    } as any;

    client = new ApiClient('http://api.test', mockTokenStore);
  });

  it('should login and save token', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: '1', email: 'test@test.com', name: 'Test' },
      },
    };

    vi.mocked(axios.create).mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await client.login('test@test.com', 'password');

    expect(result).toEqual(mockResponse.data);
    expect(mockTokenStore.save).toHaveBeenCalledWith('test-token');
  });
});
```

## Configuration

For production, use environment variables:

```bash
# .env
PAPYRUS_API_URL=https://api.papyrus.dev
```

```typescript
// src/lib/api.ts
import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.PAPYRUS_API_URL || 'http://localhost:3000/api';
```

## Common Issues

### "Unauthorized" errors

- Check that token is being saved: `ls ~/.papyrus/`
- Verify token is valid: check expiration
- Ensure token is included in requests: check axios interceptor

### CORS errors in development

- API server must allow CLI origin
- Or use proxy in development
- Check API server CORS configuration

### Module resolution errors

- Ensure `.js` extensions in imports (ES modules)
- Check `tsconfig.json` has correct module settings
- Verify file paths are correct

## Next Steps

1. **Add request retry logic** - Handle network failures gracefully
2. **Add request/response logging** - Debug API issues easily
3. **Add token refresh** - Automatic token renewal
4. **Add request caching** - Reduce API calls
5. **Add offline support** - Queue requests when offline

## References

- [Axios Documentation](https://axios-http.com/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
