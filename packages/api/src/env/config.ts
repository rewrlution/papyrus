import { z } from 'zod';

export const envSchema = z
  .object({
    // Server
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().default('3000').transform(Number),
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000,http://localhost:5173'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Security: JWT secret and encryption key
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters long'),
    ENCRYPTION_KEY: z
      .string()
      .length(64, 'ENCRYPTION_KEY must be 64 hex characters')
      .regex(/^[a-f0-9]+$/i, 'ENCRYPTION_KEY must be valid hex'),

    // Email: Resend API and SMTP
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    RESEND_FROM: z.email('RESEND_FROM must be a valid email'),
    SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
    SMTP_PORT: z.string().default('587').transform(Number),
    SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
    SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
    SMTP_FROM: z.email('SMTP_FROM must be a valid email'),
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

// Skip validation in tests to allow importing schema without valid env vars
export const env =
  process.env.NODE_ENV === 'test' ? ({} as Env) : validateEnv();

export type Env = z.infer<typeof envSchema>;
