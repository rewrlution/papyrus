import {
  isTokenExpired,
  isTokenExpiringSoon,
  getTimeUntilExpiration,
} from '../../utils/token.js';
import { tokenStore } from '../storage/index.js';

export interface AuthCheckResult {
  isAuthenticated: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  timeUntilExpiration: string | null;
  message?: string;
}

/**
 * Options for authentication check
 */
export interface RequireAuthOptions {
  /**
   * Hours before expiration to consider "expiring soon"
   * @default 24
   */
  expirationThresholdHours?: number;

  /**
   * Whether to show warnings for tokens expiring soon
   * @default true
   */
  warnOnExpiringSoon?: boolean;
}

/**
 * Check if user is authenticated and token is valid
 * Returns detailed auth status for flexible handling
 *
 * This is the core function that any command can use to check authentication.
 * It handles all the edge cases: missing token, expired token, invalid token,
 * and token expiring soon.
 *
 * @param options - Authentication check options
 * @returns Authentication check result with detailed status
 *
 * @example
 * ```typescript
 * // Basic usage in a command
 * const auth = requireAuth();
 * if (!auth.isAuthenticated) {
 *   console.error(`Error: ${auth.message}`);
 *   process.exit(1);
 * }
 * ```
 */
export function requireAuth(options: RequireAuthOptions = {}): AuthCheckResult {
  const { expirationThresholdHours = 23, warnOnExpiringSoon = true } = options;

  // Check if token exists in storage
  if (!tokenStore.exists()) {
    return {
      isAuthenticated: false,
      isExpired: false,
      isExpiringSoon: false,
      timeUntilExpiration: null,
      message: 'Not authenticated. Pleas run `papyrus login` first.',
    };
  }

  const token = tokenStore.get();
  if (!token) {
    return {
      isAuthenticated: false,
      isExpired: false,
      isExpiringSoon: false,
      timeUntilExpiration: null,
      message: 'Invalid token. Please run `papyrus login` again.',
    };
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    // Automatically clear expired token
    tokenStore.clear();
    return {
      isAuthenticated: false,
      isExpired: true,
      isExpiringSoon: false,
      timeUntilExpiration: null,
      message: 'Your session has expired. Please run `papyrus login` again.',
    };
  }

  // Check if token is expiring soon
  const expiringSoon = isTokenExpiringSoon(token, expirationThresholdHours);
  const timeUntilExpiration = getTimeUntilExpiration(token);

  return {
    isAuthenticated: true,
    isExpired: false,
    isExpiringSoon: expiringSoon,
    timeUntilExpiration,
    message:
      expiringSoon && warnOnExpiringSoon && timeUntilExpiration
        ? `Your session will expire in ${timeUntilExpiration}. Please run \`papyrus login\` to refresh.`
        : undefined,
  };
}

/**
 * Ensures user is authenticated, exits process if not
 *
 * This is a convenience function for commands that require authentication.
 * It checks authentication and exits with a clear error message if not authenticated.
 * If authenticated but token is expiring soon, it shows a warning but continues.
 *
 * Use this in commands that MUST have authentication to proceed.
 *
 * @param options - Authentication check options
 *
 * @example
 * ```typescript
 * // Simplest usage - one line in your command
 * export async function sync() {
 *   ensureAuthenticated(); // Will exit if not authenticated
 *
 *   // Safe to proceed - user is authenticated
 *   await performSync();
 * }
 * ```
 */
export function ensureAuthenticated(options: RequireAuthOptions = {}): void {
  const authResult = requireAuth(options);

  if (!authResult.isAuthenticated) {
    console.error(`Error: ${authResult.message}`);
    process.exit(1);
  }

  if (authResult.isExpired) {
    console.error(`Error: ${authResult.message}`);
    process.exit(1);
  }

  if (authResult.isExpiringSoon && authResult.message) {
    console.warn(`Warning: ${authResult.message}`);
  }
}
