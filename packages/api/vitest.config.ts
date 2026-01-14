import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      ENCRYPTION_KEY:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      RESEND_API_KEY: 'test-resend-key',
      RESEND_FROM: 'test@example.com',
      SMTP_HOST: 'localhost',
      SMTP_USER: 'test',
      SMTP_PASSWORD: 'test',
      SMTP_FROM: 'test@example.com',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
    },
  },
});
