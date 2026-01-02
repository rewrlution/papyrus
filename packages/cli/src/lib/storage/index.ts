import { ConfigStore } from './config-store.js';
import { TokenStore } from './token-store.js';

export { BaseStorage } from './base-storage.js';
export { ConfigStore, type Config } from './config-store.js';
export { TokenStore } from './token-store.js';

/**
 * Singleton es for easy access
 */
export const configStore = new ConfigStore();
export const tokenStore = new TokenStore();
