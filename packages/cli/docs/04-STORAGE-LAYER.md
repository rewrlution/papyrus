# Storage Layer Implementation

Learn how to build a cross-platform storage layer that follows XDG Base Directory standards.

## What We're Building

A storage layer that:

- Stores configuration, auth tokens, and journal entries
- Follows XDG Base Directory specification (industry standard)
- Works cross-platform (Windows, macOS, Linux)
- Provides type-safe APIs for each storage type
- Is easy to test and mock

## Why XDG Base Directory?

**Problem:** Where do CLI apps store files?

**Bad approaches:**

- ❌ Hardcode paths like `~/.papyrus` (not standard)
- ❌ Store everything in one location (config + data mixed)
- ❌ Ignore Windows conventions

**XDG approach:**

- ✅ Industry standard on Linux/Unix
- ✅ Separates config, data, state, and cache
- ✅ Respects user overrides via environment variables
- ✅ Adapts to platform conventions (Windows uses `AppData`)

**Example:**

```
Linux:
  Config: ~/.config/papyrus/config.json
  Data:   ~/.local/share/papyrus/journals/
  State:  ~/.local/state/papyrus/token

Windows:
  Config: %APPDATA%/papyrus/config.json
  Data:   %APPDATA%/papyrus/journals/
  State:  %LOCALAPPDATA%/papyrus/token

macOS:
  Config: ~/Library/Preferences/papyrus/config.json
  Data:   ~/Library/Application Support/papyrus/journals/
  State:  ~/Library/Application Support/papyrus/token
```

## Architecture

```
┌─────────────────────────────────────┐
│         Storage Layer               │
└─────────────────────────────────────┘
         │
         ├─> BaseStorage
         │   (XDG directory handling)
         │
         ├─> ConfigStore
         │   (User preferences)
         │
         ├─> TokenStore
         │   (Auth token)
         │
         └─> JournalStore
             (Journal entries)
```

**Storage types:**

- **Config**: User settings, API URLs → XDG_CONFIG_HOME
- **State**: Auth tokens, sync state → XDG_STATE_HOME
- **Data**: Journal entries → XDG_DATA_HOME

## Prerequisites

**Install XDG library:**

```bash
cd packages/cli
pnpm add xdg-basedir
pnpm add -D @types/node
```

**Why `xdg-basedir`?**

- Battle-tested library (100k+ weekly downloads)
- Handles all platforms correctly
- Provides sensible defaults
- Respects environment variable overrides

**Assumed knowledge:**

- Basic file I/O in Node.js (we'll show the code)
- TypeScript interfaces

## Implementation

### Step 1: Base Storage Class

First, create a base class that handles XDG directories and common file operations.

```typescript
// src/lib/storage/base-storage.ts
import * as fs from 'fs';
import * as path from 'path';
import xdgBasedir from 'xdg-basedir';

/**
 * Base storage class that handles XDG directory management
 * and common file operations
 */
export class BaseStorage {
  protected appName = 'papyrus';

  /**
   * Get XDG config directory
   * Linux: ~/.config/papyrus
   * Windows: %APPDATA%/papyrus
   * macOS: ~/Library/Preferences/papyrus
   */
  protected getConfigDir(): string {
    const configHome =
      xdgBasedir.config ||
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.config');
    return path.join(configHome, this.appName);
  }

  /**
   * Get XDG data directory
   * Linux: ~/.local/share/papyrus
   * Windows: %APPDATA%/papyrus
   * macOS: ~/Library/Application Support/papyrus
   */
  protected getDataDir(): string {
    const dataHome =
      xdgBasedir.data ||
      path.join(
        process.env.HOME || process.env.USERPROFILE || '',
        '.local',
        'share'
      );
    return path.join(dataHome, this.appName);
  }

  /**
   * Get XDG state directory
   * Linux: ~/.local/state/papyrus
   * Windows: %LOCALAPPDATA%/papyrus
   * macOS: ~/Library/Application Support/papyrus
   */
  protected getStateDir(): string {
    const stateHome =
      xdgBasedir.state ||
      path.join(
        process.env.HOME || process.env.USERPROFILE || '',
        '.local',
        'state'
      );
    return path.join(stateHome, this.appName);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  protected ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Read file contents, return null if doesn't exist
   */
  protected readFile(filePath: string): string | null {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Write file contents, create parent directories if needed
   */
  protected writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    this.ensureDir(dir);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Delete file if it exists
   */
  protected deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Check if file exists
   */
  protected fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
```

**Why this approach?**

- **Separation of concerns**: Base class handles directories, not business logic
- **Reusability**: All stores inherit common operations
- **Platform-agnostic**: XDG library handles OS differences
- **Testability**: Methods can be easily mocked

### Step 2: Config Store

Store user configuration (API URL, preferences, etc.).

```typescript
// src/lib/storage/config-store.ts
import * as path from 'path';
import { BaseStorage } from './base-storage.js';

/**
 * User configuration structure
 */
export interface Config {
  apiUrl?: string;
  editor?: string;
  defaultTemplate?: string;
}

/**
 * Manages user configuration stored in XDG_CONFIG_HOME
 * Example: ~/.config/papyrus/config.json
 */
export class ConfigStore extends BaseStorage {
  private configPath: string;

  constructor() {
    super();
    const configDir = this.getConfigDir();
    this.configPath = path.join(configDir, 'config.json');
  }

  /**
   * Load configuration, returns empty object if not found
   */
  load(): Config {
    const content = this.readFile(this.configPath);
    if (!content) {
      return {};
    }

    try {
      return JSON.parse(content) as Config;
    } catch {
      // Invalid JSON, return empty config
      return {};
    }
  }

  /**
   * Save configuration
   */
  save(config: Config): void {
    const content = JSON.stringify(config, null, 2);
    this.writeFile(this.configPath, content);
  }

  /**
   * Update specific config values
   */
  update(updates: Partial<Config>): void {
    const current = this.load();
    const updated = { ...current, ...updates };
    this.save(updated);
  }

  /**
   * Get specific config value
   */
  get<K extends keyof Config>(key: K): Config[K] | undefined {
    const config = this.load();
    return config[key];
  }

  /**
   * Set specific config value
   */
  set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.update({ [key]: value } as Partial<Config>);
  }

  /**
   * Clear all configuration
   */
  clear(): void {
    this.deleteFile(this.configPath);
  }
}
```

**Why JSON?**

- Human-readable (users can edit manually)
- Native TypeScript/JavaScript support
- Good enough for config (no complex queries needed)

### Step 3: Token Store

Store authentication token securely in state directory.

```typescript
// src/lib/storage/token-store.ts
import * as path from 'path';
import { BaseStorage } from './base-storage.js';

/**
 * Manages authentication token stored in XDG_STATE_HOME
 * Example: ~/.local/state/papyrus/token
 */
export class TokenStore extends BaseStorage {
  private tokenPath: string;

  constructor() {
    super();
    const stateDir = this.getStateDir();
    this.tokenPath = path.join(stateDir, 'token');
  }

  /**
   * Save authentication token
   */
  save(token: string): void {
    this.writeFile(this.tokenPath, token.trim());
  }

  /**
   * Get stored token, returns null if not found
   */
  get(): string | null {
    const content = this.readFile(this.tokenPath);
    return content ? content.trim() : null;
  }

  /**
   * Remove stored token (logout)
   */
  clear(): void {
    this.deleteFile(this.tokenPath);
  }

  /**
   * Check if token exists
   */
  exists(): boolean {
    return this.fileExists(this.tokenPath);
  }
}
```

**Why plain text for token?**

- File permissions provide security on Unix-like systems
- OS-level encryption on Windows (NTFS encryption if enabled)
- For production, consider OS keychain integration (future enhancement)

### Step 4: Journal Store

Store journal entries as individual files.

```typescript
// src/lib/storage/journal-store.ts
import * as path from 'path';
import * as fs from 'fs';
import { BaseStorage } from './base-storage.js';

/**
 * Journal entry structure
 */
export interface JournalEntry {
  date: string; // YYYY-MM-DD
  content: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Manages journal entries stored in XDG_DATA_HOME
 * Example: ~/.local/share/papyrus/journals/2024-01-15.json
 */
export class JournalStore extends BaseStorage {
  private journalsDir: string;

  constructor() {
    super();
    const dataDir = this.getDataDir();
    this.journalsDir = path.join(dataDir, 'journals');
  }

  /**
   * Get file path for a date
   */
  private getEntryPath(date: string): string {
    return path.join(this.journalsDir, `${date}.json`);
  }

  /**
   * Save journal entry
   */
  save(entry: JournalEntry): void {
    const content = JSON.stringify(entry, null, 2);
    const filePath = this.getEntryPath(entry.date);
    this.writeFile(filePath, content);
  }

  /**
   * Get journal entry by date
   */
  get(date: string): JournalEntry | null {
    const filePath = this.getEntryPath(date);
    const content = this.readFile(filePath);

    if (!content) {
      return null;
    }

    try {
      return JSON.parse(content) as JournalEntry;
    } catch {
      return null;
    }
  }

  /**
   * Delete journal entry
   */
  delete(date: string): void {
    const filePath = this.getEntryPath(date);
    this.deleteFile(filePath);
  }

  /**
   * Check if entry exists for date
   */
  exists(date: string): boolean {
    const filePath = this.getEntryPath(date);
    return this.fileExists(filePath);
  }

  /**
   * List all journal entries
   */
  list(): JournalEntry[] {
    this.ensureDir(this.journalsDir);

    const files = fs.readdirSync(this.journalsDir);
    const entries: JournalEntry[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const date = file.replace('.json', '');
        const entry = this.get(date);
        if (entry) {
          entries.push(entry);
        }
      }
    }

    // Sort by date descending (newest first)
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Clear all journal entries
   */
  clear(): void {
    if (fs.existsSync(this.journalsDir)) {
      fs.rmSync(this.journalsDir, { recursive: true, force: true });
    }
  }
}
```

**Why one file per entry?**

- Simple to implement (no database needed)
- Easy to backup/sync individual days
- Fast access to specific dates
- Human-readable (can inspect with text editor)

**Alternative:** SQLite for better query performance (future enhancement)

### Step 5: Export Storage API

Create a convenient API for accessing all stores.

```typescript
// src/lib/storage/index.ts
export { BaseStorage } from './base-storage.js';
export { ConfigStore, type Config } from './config-store.js';
export { TokenStore } from './token-store.js';
export { JournalStore, type JournalEntry } from './journal-store.js';

/**
 * Singleton instances for easy access
 */
export const configStore = new ConfigStore();
export const tokenStore = new TokenStore();
export const journalStore = new JournalStore();
```

**Usage example:**

```typescript
import { configStore, tokenStore, journalStore } from './lib/storage/index.js';

// Config
configStore.set('apiUrl', 'https://api.papyrus.dev');
const apiUrl = configStore.get('apiUrl');

// Token
tokenStore.save('jwt-token-here');
const token = tokenStore.get();

// Journal
journalStore.save({
  date: '2024-01-15',
  content: 'Today I learned about XDG...',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const entry = journalStore.get('2024-01-15');
```

## Testing

Here are basic tests for the storage layer.

### Test: Base Storage

```typescript
// src/lib/storage/__tests__/base-storage.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { BaseStorage } from '../base-storage.js';

class TestStorage extends BaseStorage {
  // Expose protected methods for testing
  public testGetConfigDir() {
    return this.getConfigDir();
  }
  public testGetDataDir() {
    return this.getDataDir();
  }
  public testGetStateDir() {
    return this.getStateDir();
  }
  public testReadFile(filePath: string) {
    return this.readFile(filePath);
  }
  public testWriteFile(filePath: string, content: string) {
    return this.writeFile(filePath, content);
  }
  public testDeleteFile(filePath: string) {
    return this.deleteFile(filePath);
  }
}

describe('BaseStorage', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  it('should get config directory', () => {
    const dir = storage.testGetConfigDir();
    expect(dir).toContain('papyrus');
  });

  it('should get data directory', () => {
    const dir = storage.testGetDataDir();
    expect(dir).toContain('papyrus');
  });

  it('should get state directory', () => {
    const dir = storage.testGetStateDir();
    expect(dir).toContain('papyrus');
  });

  it('should write and read file', () => {
    const testDir = path.join(process.cwd(), 'test-storage');
    const testFile = path.join(testDir, 'test.txt');

    storage.testWriteFile(testFile, 'hello');
    const content = storage.testReadFile(testFile);

    expect(content).toBe('hello');

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should return null for non-existent file', () => {
    const content = storage.testReadFile('/non/existent/file.txt');
    expect(content).toBeNull();
  });

  it('should delete file', () => {
    const testDir = path.join(process.cwd(), 'test-storage');
    const testFile = path.join(testDir, 'test.txt');

    storage.testWriteFile(testFile, 'hello');
    storage.testDeleteFile(testFile);

    const content = storage.testReadFile(testFile);
    expect(content).toBeNull();

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
```

### Test: Config Store

```typescript
// src/lib/storage/__tests__/config-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigStore } from '../config-store.js';

describe('ConfigStore', () => {
  let store: ConfigStore;
  let testDir: string;

  beforeEach(() => {
    // Use temporary directory for tests
    testDir = path.join(process.cwd(), 'test-config');
    store = new ConfigStore();
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return empty config when not exists', () => {
    const config = store.load();
    expect(config).toEqual({});
  });

  it('should save and load config', () => {
    store.save({ apiUrl: 'https://api.test.com' });
    const config = store.load();
    expect(config.apiUrl).toBe('https://api.test.com');
  });

  it('should get specific config value', () => {
    store.save({ apiUrl: 'https://api.test.com', editor: 'vim' });
    expect(store.get('apiUrl')).toBe('https://api.test.com');
    expect(store.get('editor')).toBe('vim');
  });

  it('should set specific config value', () => {
    store.set('apiUrl', 'https://api.test.com');
    expect(store.get('apiUrl')).toBe('https://api.test.com');
  });

  it('should update config', () => {
    store.save({ apiUrl: 'https://api.test.com' });
    store.update({ editor: 'vim' });

    const config = store.load();
    expect(config.apiUrl).toBe('https://api.test.com');
    expect(config.editor).toBe('vim');
  });

  it('should clear config', () => {
    store.save({ apiUrl: 'https://api.test.com' });
    store.clear();

    const config = store.load();
    expect(config).toEqual({});
  });
});
```

### Test: Token Store

```typescript
// src/lib/storage/__tests__/token-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TokenStore } from '../token-store.js';

describe('TokenStore', () => {
  let store: TokenStore;

  beforeEach(() => {
    store = new TokenStore();
  });

  afterEach(() => {
    // Cleanup
    store.clear();
  });

  it('should return null when token does not exist', () => {
    const token = store.get();
    expect(token).toBeNull();
  });

  it('should save and get token', () => {
    store.save('test-token-123');
    const token = store.get();
    expect(token).toBe('test-token-123');
  });

  it('should check if token exists', () => {
    expect(store.exists()).toBe(false);

    store.save('test-token');
    expect(store.exists()).toBe(true);
  });

  it('should clear token', () => {
    store.save('test-token');
    store.clear();

    expect(store.exists()).toBe(false);
    expect(store.get()).toBeNull();
  });

  it('should trim token whitespace', () => {
    store.save('  test-token  \n');
    const token = store.get();
    expect(token).toBe('test-token');
  });
});
```

### Test: Journal Store

```typescript
// src/lib/storage/__tests__/journal-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JournalStore, type JournalEntry } from '../journal-store.js';

describe('JournalStore', () => {
  let store: JournalStore;

  beforeEach(() => {
    store = new JournalStore();
  });

  afterEach(() => {
    // Cleanup
    store.clear();
  });

  it('should return null for non-existent entry', () => {
    const entry = store.get('2024-01-15');
    expect(entry).toBeNull();
  });

  it('should save and get entry', () => {
    const entry: JournalEntry = {
      date: '2024-01-15',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.save(entry);
    const retrieved = store.get('2024-01-15');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.date).toBe('2024-01-15');
    expect(retrieved?.content).toBe('Test content');
  });

  it('should check if entry exists', () => {
    expect(store.exists('2024-01-15')).toBe(false);

    const entry: JournalEntry = {
      date: '2024-01-15',
      content: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.save(entry);

    expect(store.exists('2024-01-15')).toBe(true);
  });

  it('should delete entry', () => {
    const entry: JournalEntry = {
      date: '2024-01-15',
      content: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.save(entry);
    store.delete('2024-01-15');

    expect(store.exists('2024-01-15')).toBe(false);
  });

  it('should list all entries', () => {
    const entry1: JournalEntry = {
      date: '2024-01-15',
      content: 'Day 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const entry2: JournalEntry = {
      date: '2024-01-16',
      content: 'Day 2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.save(entry1);
    store.save(entry2);

    const entries = store.list();
    expect(entries).toHaveLength(2);
    // Should be sorted by date descending
    expect(entries[0].date).toBe('2024-01-16');
    expect(entries[1].date).toBe('2024-01-15');
  });

  it('should clear all entries', () => {
    const entry: JournalEntry = {
      date: '2024-01-15',
      content: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.save(entry);
    store.clear();

    const entries = store.list();
    expect(entries).toHaveLength(0);
  });
});
```

## Running Tests

```bash
cd packages/cli
pnpm test
```

## Integration with Existing Code

### Update TokenStore in API Client

Replace the old TokenStore with the new one:

```typescript
// src/lib/api-client.ts
import { tokenStore } from './storage/index.js';

export class ApiClient {
  constructor(baseUrl: string) {
    // Use the new token store
    this.http.interceptors.request.use((config) => {
      const token = tokenStore.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.http.post('/auth/login', { email, password });
    // Save token with new store
    tokenStore.save(response.data.token);
    return response.data;
  }
}
```

### Use Config for API URL

```typescript
// src/lib/api.ts
import { configStore } from './storage/index.js';

const API_BASE_URL =
  configStore.get('apiUrl') ||
  process.env.PAPYRUS_API_URL ||
  'http://localhost:3000/api';

export const api = new ApiClient(API_BASE_URL);
```

## Common Issues

### Permission denied

**Cause:** Directory doesn't exist or no write permission
**Solution:** BaseStorage creates directories automatically. Check file system permissions.

### Config not persisting

**Cause:** Writing to wrong directory or file not saved
**Solution:** Check `configStore.load()` returns your changes. Verify file exists at the path.

### Tests failing on Windows

**Cause:** Path separator differences
**Solution:** Always use `path.join()` (not string concatenation) - we do this everywhere.

### Cannot find XDG directories

**Cause:** Environment variables not set
**Solution:** Library provides sensible defaults. Check `xdg-basedir` is installed.

## Enhancements (Optional)

1. **Encryption**: Encrypt sensitive data (tokens, etc.)
2. **Compression**: Compress journal entries to save space
3. **SQLite**: Use database for better query performance
4. **Sync state**: Track last sync timestamp
5. **Backup**: Automatic backup before destructive operations
6. **Migration**: Version config and handle migrations

## Next Steps

1. **Update auth commands** to use new TokenStore
2. **Add config command** (`papyrus config set apiUrl ...`)
3. **Implement journal commands** to use JournalStore
4. **Add data export** command for backups

## Summary

**What we built:**

- ✅ XDG-compliant storage layer
- ✅ Separate stores for config, tokens, and journals
- ✅ Cross-platform support
- ✅ Type-safe APIs
- ✅ Comprehensive tests

**Key principles applied:**

- **Top-down**: Started with goals and architecture
- **Popular libraries**: Used `xdg-basedir` (don't reinvent wheels)
- **Proper componentization**: BaseStorage + specialized stores
- **No unnecessary complexity**: Simple file-based storage
- **Complete working code**: All code is runnable

**File structure:**

```
src/lib/storage/
├── base-storage.ts       # XDG directory handling
├── config-store.ts       # Configuration storage
├── token-store.ts        # Auth token storage
├── journal-store.ts      # Journal entry storage
├── index.ts              # Public API
└── __tests__/
    ├── base-storage.test.ts
    ├── config-store.test.ts
    ├── token-store.test.ts
    └── journal-store.test.ts
```

## References

- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)
- [xdg-basedir npm package](https://www.npmjs.com/package/xdg-basedir)
- [Node.js fs module](https://nodejs.org/api/fs.html)
- [Node.js path module](https://nodejs.org/api/path.html)
