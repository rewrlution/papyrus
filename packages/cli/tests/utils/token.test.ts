import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTokenExpiration,
  isTokenExpired,
  isTokenExpiringSoon,
} from '../../src/utils/token';

describe('token utilities', () => {
  beforeEach(() => {
    // Reset Date.now() mock before each test
    vi.restoreAllMocks();
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      // Token with exp: 1735689600 (Jan 1, 2025 00:00:00 GMT)
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';
      const expiration = getTokenExpiration(validToken);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration?.getTime()).toBe(1735689600000);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      const expiration = getTokenExpiration(invalidToken);

      expect(expiration).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed.data';
      const expiration = getTokenExpiration(malformedToken);

      expect(expiration).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Mock current time to Dec 31, 2024
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2024-12-31T00:00:00Z').getTime()
      );

      // Token expires Jan 1, 2025
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      // Mock current time to Jan 2, 2025
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2025-01-02T00:00:00Z').getTime()
      );

      // Token expired Jan 1, 2025
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid-token';
      expect(isTokenExpired(invalidToken)).toBe(true);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return true when token expires within threshold', () => {
      // Mock current time to Dec 31, 2024 12:00:00 (12 hours before expiration)
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2024-12-31T12:00:00Z').getTime()
      );

      // Token expires Jan 1, 2025 00:00:00
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';

      expect(isTokenExpiringSoon(token, 24)).toBe(true);
    });

    it('should return false when token expires beyond threshold', () => {
      // Mock current time to Dec 29, 2024 (48 hours before expiration)
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2024-12-29T00:00:00Z').getTime()
      );

      // Token expires Jan 1, 2025
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';

      expect(isTokenExpiringSoon(token, 24)).toBe(false);
    });

    it('should return false when token is already expired', () => {
      // Mock current time to Jan 2, 2025 (after expiration)
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2025-01-02T00:00:00Z').getTime()
      );

      // Token expired Jan 1, 2025
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';

      expect(isTokenExpiringSoon(token, 24)).toBe(false);
    });

    it('should return false for invalid token', () => {
      const invalidToken = 'invalid-token';
      expect(isTokenExpiringSoon(invalidToken, 24)).toBe(false);
    });

    it('should use custom threshold', () => {
      // Mock current time to Dec 30, 2024 18:00:00 (30 hours before expiration)
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2024-12-30T18:00:00Z').getTime()
      );

      // Token expires Jan 1, 2025 00:00:00
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4NjAwMH0.dummy';

      // Should be false with 24h threshold
      expect(isTokenExpiringSoon(token, 24)).toBe(false);

      // Should be true with 48h threshold
      expect(isTokenExpiringSoon(token, 48)).toBe(true);
    });
  });
});
