import path from 'path';

import { BaseStorage } from './base-storage.js';

/**
 * Manages authentication token stored in the config directory
 * Example: ~/.config/papyrus/token (Linux)
 */
export class TokenStore extends BaseStorage {
  private tokenPath: string;

  constructor(configDir?: string) {
    super();
    const dir = configDir ?? this.getConfigDir();
    this.tokenPath = path.join(dir, 'token');
  }

  /**
   * Save authentication token
   */
  save(token: string): void {
    this.writeFile(this.tokenPath, token);
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
