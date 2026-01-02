import fs from 'fs';
import path from 'path';

import envPaths from 'env-paths';

/**
 * Base storage class that follows the XDG-base directory standard
 * and handles cross-platform directory management
 * and common file operations
 */
export class BaseStorage {
  /**
   * the env-paths will add `runtime` to the path name.
   * we must set { suffix: "" }, otherwise, in Windows,
   * the folder will become:
   * /c/users/{username}/appdata/local/papyrus-nodejs/data
   * instead of
   * /c/users/{username}/appdata/local/papyrus/data
   */
  private paths = envPaths('papyrus', { suffix: '' });

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
      /**
       * The mode 0o700 grants the owner of the file or directory full read, write, and execute permissions,
       * while denying all access to everyone else.
       * - 1st digit (7): Owner (User, with `rwx` permissions)
       * - 2nd digit (0): Group
       * - 3rd digit (0): Others (anyone not the owner or in the group)
       *
       * For directories, `x` permission is required to `cd` into a dir or access files inside
       */
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
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
