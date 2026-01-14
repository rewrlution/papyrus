import { z } from 'zod';

export const envSchema = z
  .object({
    // Server Configuration
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().default('3000').transform(Number),

    // Frontend URL (for email links, redirects, etc.)
    APP_URL: z
      .url('APP_URL must be a valid URL')
      .default('http://localhost:5173')
      .transform((url) => url.replace(/\/$/, '')),

    // CORS Origins (comma-separated list of allowed origins)
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000,http://localhost:5173'),

    // Database connection
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Security: JWT secret
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters long'),

    // Security: Encryption key
    ENCRYPTION_KEY: z
      .string()
      .length(64, 'ENCRYPTION_KEY must be 64 hex characters')
      .regex(/^[a-f0-9]+$/i, 'ENCRYPTION_KEY must be valid hex'),

    // Email: Resend API (for transactional emails)
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    RESEND_FROM: z.email('RESEND_FROM must be a valid email'),

    // Email: SMTP Configuration (alternative email provider)
    SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
    SMTP_PORT: z.string().default('587').transform(Number),
    SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
    SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
    SMTP_FROM: z.email('SMTP_FROM must be a valid email'),

    // AI Provider
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
    AI_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
    AI_MAX_TOKEN: z.coerce.number().default(1024),
    AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.7),

    // AI Feature free-tier limits
    AI_STANDUP_FREE_LIMIT: z.coerce.number().int().positive().default(10),
    AI_PROMOTION_FREE_LIMIT: z.coerce.number().int().positive().default(1),
  })
  .refine(
    (data) => {
      // Disallow wildcard in production
      if (data.NODE_ENV === 'production' && data.CORS_ORIGIN.includes('*')) {
        return false;
      }
      return true;
    },
    {
      message:
        'CORS_ORIGIN cannot contain "*" in production. Specify exact origins.',
      path: ['CORS_ORIGIN'],
    }
  )
  .transform((data) => ({
    ...data,
    CORS_ORIGIN: data.CORS_ORIGIN.split(',').map((s) => s.trim()),
  }));

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach((issue) => {
      console.error(` ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
