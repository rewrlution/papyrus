import { ConfigStore } from './config-store.js';
import { JournalStore } from './journal-storage.js';
import { SyncMetaStore } from './sync-meta-store.js';
import { TokenStore } from './token-store.js';

export { ConfigStore, type Config } from './config-store.js';
/**
 * Singletons for easy access
 */
export const configStore = new ConfigStore();
export const tokenStore = new TokenStore();
export const syncMetaStore = new SyncMetaStore();
export const journalStore = new JournalStore();
