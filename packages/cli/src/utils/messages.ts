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
  console.log(`\n${icons.success} ${message}\n`);
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
  console.error(`\n${icons.error} ${message}`);
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
  console.log(`\n${icons.info} ${message}\n`);
}

/**
 * Display a warning message with compact spacing (non-fatal)
 * @param message The warning message to display
 */
export function warn(message: string): void {
  console.warn(`\n${icons.warning} ${message}\n`);
}

/**
 * Display a hint/tip message with compact spacing
 * @param message The hint message to display
 */
export function hint(message: string): void {
  console.log(`\n${icons.hint} ${message}\n`);
}

/**
 * Display statistics or metrics with compact spacing
 * @param message The stats message to display
 */
export function stats(message: string): void {
  console.log(`\n${icons.stats} ${message}\n`);
}

/**
 * Display a special/celebratory message (e.g., first-time creation)
 * @param message The message to display
 */
export function sparkles(message: string): void {
  console.log(`\n${icons.sparkles} ${message}\n`);
}
