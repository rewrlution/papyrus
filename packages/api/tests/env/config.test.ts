import { describe, it, expect } from 'vitest';

import { envSchema } from '../../src/env/config';

describe('Environment Configuration', () => {
  const validEnv = {
    NODE_ENV: 'development' as const,
    PORT: '3000',
    APP_URL: 'http://localhost:5173',
    CORS_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://localhost:5432/papyrus',
    JWT_SECRET: 'a'.repeat(32),
    ENCRYPTION_KEY: 'a'.repeat(64),
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM: 'test@example.com',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_USER: 'user@example.com',
    SMTP_PASSWORD: 'password',
    SMTP_FROM: 'noreply@example.com',
  };

  describe('Valid configurations', () => {
    it('should accept valid environment variables', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(3000);
        expect(result.data.SMTP_PORT).toBe(587);
      }
    });

    it('should use default values when optional fields are missing', () => {
      const minimal = {
        DATABASE_URL: 'postgresql://localhost:5432/papyrus',
        JWT_SECRET: 'a'.repeat(32),
        ENCRYPTION_KEY: 'a'.repeat(64),
        RESEND_API_KEY: 're_test_key',
        RESEND_FROM: 'test@example.com',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user@example.com',
        SMTP_PASSWORD: 'password',
        SMTP_FROM: 'noreply@example.com',
      };

      const result = envSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe(3000);
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:3000',
          'http://localhost:5173',
        ]);
        expect(result.data.SMTP_PORT).toBe(587);
      }
    });

    it('should accept production NODE_ENV', () => {
      const env = {
        ...validEnv,
        NODE_ENV: 'production' as const,
        CORS_ORIGIN: 'https://myapp.com',
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('production');
      }
    });
  });

  describe('Invalid configurations', () => {
    it('should reject missing DATABASE_URL', () => {
      const env = { ...validEnv };
      delete (env as Partial<typeof validEnv>).DATABASE_URL;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject JWT_SECRET shorter than 32 characters', () => {
      const env = { ...validEnv, JWT_SECRET: 'short' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject ENCRYPTION_KEY with wrong length', () => {
      const env = { ...validEnv, ENCRYPTION_KEY: 'a'.repeat(32) };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject ENCRYPTION_KEY with invalid hex characters', () => {
      const env = { ...validEnv, ENCRYPTION_KEY: 'z'.repeat(64) };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email for RESEND_FROM', () => {
      const env = { ...validEnv, RESEND_FROM: 'not-an-email' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email for SMTP_FROM', () => {
      const env = { ...validEnv, SMTP_FROM: 'not-an-email' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject invalid NODE_ENV value', () => {
      const env = { ...validEnv, NODE_ENV: 'staging' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe('Type transformations', () => {
    it('should transform PORT string to number', () => {
      const env = { ...validEnv, PORT: '8080' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
        expect(typeof result.data.PORT).toBe('number');
      }
    });

    it('should transform SMTP_PORT string to number', () => {
      const env = { ...validEnv, SMTP_PORT: '465' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.SMTP_PORT).toBe(465);
        expect(typeof result.data.SMTP_PORT).toBe('number');
      }
    });
  });

  describe('CORS_ORIGIN validation', () => {
    it('should transform single CORS_ORIGIN to array', () => {
      const env = { ...validEnv, CORS_ORIGIN: 'https://myapp.com' };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual(['https://myapp.com']);
      }
    });

    it('should transform multiple CORS_ORIGIN to array', () => {
      const env = {
        ...validEnv,
        CORS_ORIGIN:
          'https://app.com,https://www.app.com,https://admin.app.com',
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          'https://app.com',
          'https://www.app.com',
          'https://admin.app.com',
        ]);
      }
    });

    it('should trim whitespace in comma-separated origins', () => {
      const env = {
        ...validEnv,
        CORS_ORIGIN:
          'https://app.com , https://www.app.com , https://admin.app.com',
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          'https://app.com',
          'https://www.app.com',
          'https://admin.app.com',
        ]);
      }
    });

    it('should allow wildcard in development', () => {
      const env = {
        ...validEnv,
        NODE_ENV: 'development' as const,
        CORS_ORIGIN: '*',
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual(['*']);
      }
    });

    it('should reject wildcard in production', () => {
      const env = {
        ...validEnv,
        NODE_ENV: 'production' as const,
        CORS_ORIGIN: '*',
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'cannot contain "*" in production'
        );
      }
    });

    it('should reject wildcard mixed with other origins in production', () => {
      const env = {
        ...validEnv,
        NODE_ENV: 'production' as const,
        CORS_ORIGIN: 'https://myapp.com,*',
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should use default origins when not provided', () => {
      const minimal = {
        DATABASE_URL: 'postgresql://localhost:5432/papyrus',
        JWT_SECRET: 'a'.repeat(32),
        ENCRYPTION_KEY: 'a'.repeat(64),
        RESEND_API_KEY: 're_test_key',
        RESEND_FROM: 'test@example.com',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user@example.com',
        SMTP_PASSWORD: 'password',
        SMTP_FROM: 'noreply@example.com',
      };

      const result = envSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:3000',
          'http://localhost:5173',
        ]);
      }
    });
  });
});
