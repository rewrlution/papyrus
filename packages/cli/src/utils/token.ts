import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number; // expiration time (seconds since epoch)
  iat: number; // issued at time
}

/**
 * Decodes JWT token and returns expiration date
 * @param token - jwt token
 * @returns expiration date in milliseconds
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return new Date(decoded.exp * 1000); // convert seconds to milliseconds
  } catch {
    return null; // invalid token
  }
}

export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true; // treat invalid token as expired
  return Date.now() >= expiration.getTime();
}

/**
 * Check if token will expire within the given threshold
 * @param token - access token
 * @param thresholdHours - hours before expiration to consider "expiring soon"
 * @returns
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdHours: number = 24
): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;

  const thresholdMs = thresholdHours * 60 * 60 * 1000; // milliseconds
  const timeUntilExpiry = expiration.getTime() - Date.now();

  return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs;
}

/**
 * Get time until token expiration in a human-readable format
 * @param token - JWT token string
 * @returns Human-readable time string or null if invalid/expired
 */
export function getTimeUntilExpiration(token: string): string | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }

  const now = Date.now();
  const timeUntilExpiration = expiration.getTime() - now;

  if (timeUntilExpiration <= 0) {
    return 'expired';
  }

  const hours = Math.floor(timeUntilExpiration / (1000 * 60 * 60));
  const minutes = Math.floor(
    (timeUntilExpiration % (1000 * 60 * 60)) / (1000 * 60)
  );

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}
