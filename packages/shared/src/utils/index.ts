export * from './hash.js';
export * from './date.js';

export function formatMessage(message: string): string {
  return `[MyApp] ${message}`;
}
