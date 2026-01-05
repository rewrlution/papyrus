/**
 * Consistent messaging utilities for non-interactive console output.
 *
 * Use these functions for simple, transactional commands (logout, edit, etc.)
 * For interactive/rich UI, use Ink components (StatusMessage, SyncProgress, etc.)
 */

const icons = {
  success: '✅',
  error: '❌',
  info: '📖',
  warning: '⚠️',
  hint: '💡',
  stats: '📊',
  sparkles: '✨',
} as const;

/**
 * Display a success message with compact spacing
 * @param message The success message to display
 */
export function success(message: string): void {
  console.log(`${icons.success} ${message}`);
}

/**
 * Display an error message with optional hint, then exit
 * @param message The error message to display
 * @param hint Optional hint message to help the user
 * @param exitCode Exit code (default: 1)
 */
export function error(
  message: string,
  hint?: string,
  exitCode: number = 1
): never {
  console.error(`${icons.error} ${message}`);
  if (hint) {
    console.error(`${icons.hint} ${hint}`);
  }
  console.error('');
  process.exit(exitCode);
}

/**
 * Display an informational message with compact spacing
 * @param message The info message to display
 */
export function info(message: string): void {
  console.log(`${icons.info} ${message}`);
}

/**
 * Display a warning message with compact spacing (non-fatal)
 * @param message The warning message to display
 */
export function warn(message: string): void {
  console.warn(`${icons.warning} ${message}`);
}

/**
 * Display a hint/tip message with compact spacing
 * @param message The hint message to display
 */
export function hint(message: string): void {
  console.log(`${icons.hint} ${message}`);
}

/**
 * Display statistics or metrics with compact spacing
 * @param message The stats message to display
 */
export function stats(message: string): void {
  console.log(`${icons.stats} ${message}`);
}

/**
 * Display a special/celebratory message (e.g., first-time creation)
 * @param message The message to display
 */
export function sparkles(message: string): void {
  console.log(`${icons.sparkles} ${message}`);
}
