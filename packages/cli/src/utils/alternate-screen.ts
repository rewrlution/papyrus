/**
 * Alternate Screen Buffer Management
 *
 * Provides clean full-screen terminal UI experience using alternate screen buffer.
 * When you enter alternate screen, the terminal saves current state and gives you
 * a clean canvas. When you exit, it restores everything as if your app was never there.
 *
 * This is the standard approach used by vim, less, htop, and all professional TUI tools.
 *
 * ## Usage
 *
 * ```typescript
 * import { withAlternateScreen } from './alternate-screen.js';
 * import { render } from 'ink';
 *
 * await withAlternateScreen(async () => {
 *   const { waitUntilExit } = render(<YourComponent />);
 *   await waitUntilExit();
 * });
 * ```
 *
 * ## Known Limitations
 *
 * VS Code's integrated terminal may not properly restore screen state for complex
 * Ink components. This is a VS Code limitation, not a bug in our code. The same
 * code works perfectly in Windows Terminal, Git Bash, PowerShell, and other terminals.
 *
 * @see https://github.com/sindresorhus/ansi-escapes
 */

import ansiEscapes from 'ansi-escapes';

/**
 * Enter the alternate screen buffer.
 * Saves current terminal state and switches to a clean screen.
 */
export function enterAlternateScreen(): void {
  process.stdout.write(ansiEscapes.enterAlternativeScreen);
}

/**
 * Exit the alternate screen buffer.
 * Restores the original terminal state.
 */
export function exitAlternateScreen(): void {
  process.stdout.write(ansiEscapes.exitAlternativeScreen);
}

/**
 * Execute a function within the alternate screen buffer.
 * Ensures the screen is properly restored even if an error occurs.
 *
 * @param fn - Async function to execute in alternate screen
 */
export async function withAlternateScreen(
  fn: () => Promise<void>
): Promise<void> {
  enterAlternateScreen();
  try {
    await fn();
  } finally {
    exitAlternateScreen();
  }
}
