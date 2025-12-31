import { env } from '../env/config.js';

import { NodemailerProvider } from './nodemailer-provider.js';
import { ResendProvider } from './resend-provider.js';
import type { EmailProvider } from './types.js';

export type EmailProviderType = 'resend' | 'smtp';

/**
 * Creates an email provider instance based on the specified type.
 *
 * @param type - The type of email provider to create
 * @returns Configured email provider instance
 */
export function createEmailProvider(type: EmailProviderType): EmailProvider {
  switch (type) {
    case 'resend':
      return new ResendProvider({
        apiKey: env.RESEND_API_KEY,
        from: env.RESEND_FROM,
      });

    case 'smtp':
      const smtpConfig = {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      };
      return new NodemailerProvider({
        transport: smtpConfig,
        from: env.SMTP_FROM,
      });
  }
}

export * from './services.js';
