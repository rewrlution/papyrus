import path from 'path';

import { BaseStorage } from './base-storage.js';

/**
 * User configuration structure
 */
export interface Config {
  apiUrl?: string;
  editor?: string;
}

/**
 * Manages user configuration stored in XDG_CONFIG_HOME
 * Example: ~/.config/papyrus/config.json
 */
export class ConfigStore extends BaseStorage {
  private configPath: string;

  constructor(configDir?: string) {
    super();
    const dir = configDir ?? this.getConfigDir();
    this.configPath = path.join(dir, 'config.json');
  }

  /**
   * Load configuration, returns empty object if not found
   */
  load(): Config {
    const content = this.readFile(this.configPath);
    if (!content) return {};

    try {
      return JSON.parse(content) as Config;
    } catch {
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
