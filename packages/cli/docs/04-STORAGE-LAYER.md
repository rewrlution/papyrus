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
- ❌ Ignore platform conventions

**XDG approach:**

- ✅ Industry standard on Linux/Unix
- ✅ Separates config, data, state, and cache
- ✅ Respects platform conventions
- ✅ Cross-platform (Windows, macOS, Linux)

**Example:**

```
Linux:
  Config: ~/.config/papyrus/config.json
  Token:  ~/.config/papyrus/token
  Data:   ~/.local/share/papyrus/journals/

Windows:
  Config: %APPDATA%\papyrus\Config\config.json
  Token:  %APPDATA%\papyrus\Config\token
  Data:   %LOCALAPPDATA%\papyrus\Data\journals\

macOS:
  Config: ~/Library/Preferences/papyrus/config.json
  Token:  ~/Library/Preferences/papyrus/token
  Data:   ~/Library/Application Support/papyrus/journals/
```

## Architecture

```
┌─────────────────────────────────────┐
│         Storage Layer               │
└─────────────────────────────────────┘
         │
         ├─> BaseStorage
         │   (Cross-platform paths)
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

- **Config**: User settings, API URLs, auth tokens → config directory
- **Data**: Journal entries, persistent content → data directory

## Prerequisites

**Install env-paths library:**

```bash
cd packages/cli
pnpm add env-paths
pnpm add -D @types/node
```

**Why `env-paths`?**

- **Cross-platform**: Works on Windows, macOS, and Linux correctly
- **Battle-tested**: Popular library (1M+ weekly downloads)
- **Follows standards**: XDG on Linux, proper conventions on Windows/macOS
- **Simple API**: Clean, straightforward interface
- **No platform checks needed**: Handles everything automatically

**Assumed knowledge:**

- Basic file I/O in Node.js (we'll show the code)
- TypeScript interfaces

## How env-paths Works

Before implementing, let's understand what `env-paths` does internally:

```typescript
import envPaths from 'env-paths';

const paths = envPaths('papyrus');

// Returns platform-specific paths:
paths.data; // User data directory
paths.config; // User config directory
paths.cache; // Cache directory
paths.log; // Log directory
paths.temp; // Temporary directory
```

**Platform behavior:**

**Linux:**

```typescript
{
  data: '~/.local/share/papyrus',
  config: '~/.config/papyrus',
  cache: '~/.cache/papyrus',
  log: '~/.local/state/papyrus',
  temp: '/tmp/papyrus'
}
```

**macOS:**

```typescript
{
  data: '~/Library/Application Support/papyrus',
  config: '~/Library/Preferences/papyrus',
  cache: '~/Library/Caches/papyrus',
  log: '~/Library/Logs/papyrus',
  temp: '/var/folders/.../papyrus'
}
```

**Windows:**

```typescript
{
  data: '%LOCALAPPDATA%\\papyrus\\Data',
  config: '%APPDATA%\\papyrus\\Config',
  cache: '%LOCALAPPDATA%\\papyrus\\Cache',
  log: '%LOCALAPPDATA%\\papyrus\\Log',
  temp: '%LOCALAPPDATA%\\Temp\\papyrus'
}
```

**Key points:**

- ✅ Returns **always strings** (never undefined)
- ✅ Respects platform conventions automatically
- ✅ No environment variable checks needed (library handles it)
- ✅ Handles edge cases (missing directories, permissions, etc.)

**Common mistake:**

```typescript
// ❌ DON'T DO THIS (unnecessary platform checks):
import os from 'os';
const config =
  os.platform() === 'win32'
    ? path.join(process.env.APPDATA, 'papyrus')
    : path.join(os.homedir(), '.config', 'papyrus');

// ✅ DO THIS (trust the library):
import envPaths from 'env-paths';
const paths = envPaths('papyrus');
const config = paths.config; // Works on all platforms!
```

**Why trust the library?**

- Maintained by the Node.js community (Sindre Sorhus - prolific open source contributor)
- Used by major tools (Yeoman, AVA, etc.)
- Handles edge cases we might forget
- Following the principle: **Use popular libraries, don't reinvent the wheel**

## Implementation

### Step 1: Base Storage Class

First, create a base class that handles cross-platform directories and common file operations.

```typescript
// src/lib/storage/base-storage.ts
import * as fs from 'fs';
import * as path from 'path';
import envPaths from 'env-paths';

/**
 * Base storage class that handles cross-platform directory management
 * and common file operations
 */
export class BaseStorage {
  private paths = envPaths('papyrus');

  /**
   * Get config directory
   * Linux: ~/.config/papyrus
   * Windows: %APPDATA%\papyrus\Config
   * macOS: ~/Library/Preferences/papyrus
   */
  protected getConfigDir(): string {
    return this.paths.config;
  }

  /**
   * Get data directory
   * Linux: ~/.local/share/papyrus
   * Windows: %LOCALAPPDATA%\papyrus\Data
   * macOS: ~/Library/Application Support/papyrus
   */
  protected getDataDir(): string {
    return this.paths.data;
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

**Using env-paths correctly:**

- We call `envPaths('papyrus')` once and store the result
- The library returns all platform-specific paths automatically
- No manual platform detection or path construction needed!
- On Linux: Uses XDG directories (`~/.config`, `~/.local/share`)
- On Windows: Uses `%APPDATA%` and `%LOCALAPPDATA%`
- On macOS: Uses `~/Library/Application Support`, etc.

**Design decisions:**

- **Separation of concerns**: Base class handles directories, not business logic
- **Reusability**: All stores inherit common operations (readFile, writeFile, etc.)
- **Trust the library**: `env-paths` already provides platform detection
- **Testability**: Methods can be easily mocked

**Why `paths` is `private` not `protected`:**

- `paths` is only used internally by `getConfigDir()`, `getDataDir()`, etc.
- Subclasses (ConfigStore, TokenStore) never need to access raw paths object
- `private` = clearer intent: "this is an implementation detail"
- Rule: Use `private` unless subclasses actually need access

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
 * Manages user configuration stored in the config directory
 * Example: ~/.config/papyrus/config.json (Linux)
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

Store authentication token in config directory.

```typescript
// src/lib/storage/token-store.ts
import * as path from 'path';
import { BaseStorage } from './base-storage.js';

/**
 * Manages authentication token stored in the config directory
 * Example: ~/.config/papyrus/token (Linux)
 */
export class TokenStore extends BaseStorage {
  private tokenPath: string;

  constructor() {
    super();
    const configDir = this.getConfigDir();
    this.tokenPath = path.join(configDir, 'token');
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

**Why config directory for tokens?**

- **Industry standard**: GitHub CLI, npm, Docker, kubectl all store auth in config
- **User expectations**: Developers expect credentials in config directories
- **Backup/sync friendly**: Config directories are typically backed up together
- **Simpler mental model**: All application settings in one place

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
 * Manages journal entries stored in the data directory
 * Example: ~/.local/share/papyrus/journals/2024-01-15.json (Linux)
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
  content: 'Today I learned about env-paths...',
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
    store = new ConfigStore();
  });

  afterEach(() => {
    // Cleanup
    store.clear();
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

### env-paths not found

**Cause:** Package not installed
**Solution:** Run `pnpm add env-paths` in packages/cli directory.

## Design Decisions

### Why Config Directory for Tokens?

According to the XDG Base Directory Specification, auth tokens should technically go in `XDG_STATE_HOME` (runtime state data). However, `env-paths` doesn't provide a separate state directory.

**We chose config directory because:**

1. **Industry standard**: Most popular CLI tools store auth in config
   - GitHub CLI: `~/.config/gh/hosts.yml`
   - npm: `~/.npmrc`
   - Docker: `~/.docker/config.json`
   - kubectl: `~/.kube/config`

2. **User expectations**: Developers expect credentials alongside other settings

3. **Practical benefits**: Easier to backup, sync, and manage all settings together

4. **XDG fallback**: When there's no state directory, config is the recommended fallback

**Alternative considered:**

- Data directory (`~/.local/share`): More technically accurate (tokens are data, not user-editable config), but goes against industry conventions

## Why env-paths vs xdg-basedir?

**xdg-basedir limitations:**

- ❌ **Linux-only**: Documentation explicitly states it's for Linux only
- ❌ Poor Windows support: Uses generic paths, doesn't follow Windows conventions
- ❌ Limited macOS support: Doesn't respect macOS-specific directories properly

**env-paths advantages:**

- ✅ **True cross-platform**: First-class support for Windows, macOS, Linux
- ✅ **Platform conventions**: Respects each OS's preferred locations
- ✅ **Widely adopted**: Used by major tools (Yeoman, AVA, etc.)
- ✅ **Actively maintained**: Regular updates and community support

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

- ✅ Cross-platform storage layer (Windows, macOS, Linux)
- ✅ Separate stores for config, tokens, and journals
- ✅ Follows XDG standards where applicable
- ✅ Type-safe APIs
- ✅ Comprehensive tests
- ✅ Industry-standard token storage (config directory, like GitHub CLI, npm, Docker)

**Key principles applied:**

- **Top-down**: Started with goals and architecture
- **Popular libraries**: Used `env-paths` (don't reinvent wheels)
- **Proper componentization**: BaseStorage + specialized stores
- **No unnecessary complexity**: Simple file-based storage
- **Complete working code**: All code is runnable
- **Industry conventions**: Followed best practices from popular CLI tools

**File structure:**

```
src/lib/storage/
├── base-storage.ts       # Cross-platform path handling
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
- [env-paths npm package](https://www.npmjs.com/package/env-paths)
- [Node.js fs module](https://nodejs.org/api/fs.html)
- [Node.js path module](https://nodejs.org/api/path.html)
